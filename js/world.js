const TILE_SIZE = 80;
const CHUNK_SIZE = 32;
const ROAD_HALF_WIDTH = 2;
/** Average tile gap along the road between structure anchor points (larger = farther apart). */
const STRUCTURE_SPACING = 20;
/** Random offset along Y per segment, as multiple of STRUCTURE_SPACING (4 → ±2× spacing). */
const STRUCTURE_JITTER_IN_SPACING = 4;
const CHUNK_LOAD_RADIUS = 3;
const CHUNK_UNLOAD_RADIUS = 5;

let worldSeed = 42;
const worldChunks = new Map();

// Skip spawning pickups / scattering trees on these tiles (structure art); not used for driving collision
const BLOCKABLE_SPAWN_TERRAIN = new Set(['container', 'concrete', 'water_tower']);

/** Ultra-rare red “portal” tiles near (not on) the highway; deterministic per seed. */
const PORTAL_TILE_HASH_THRESHOLD = 0.000055;
const PORTAL_MIN_ROAD_DIST = ROAD_HALF_WIDTH + 2;
const PORTAL_MAX_ROAD_DIST = ROAD_HALF_WIDTH + 9;
const PORTAL_EXCLUDE_TERRAIN = new Set([
    'garage', 'concrete', 'parking_lot', 'water_tower', 'container', 'collected',
]);

// ===== Noise =====

function fract(n) { return n - Math.floor(n); }

function hash1(n, s) {
    return fract(Math.sin(n * 127.1 + (worldSeed + (s || 0)) * 43.7) * 43758.5453);
}

function hash2(x, y, s) {
    return fract(Math.sin(x * 127.1 + y * 311.7 + (worldSeed + (s || 0)) * 113.5) * 43758.5453);
}

function noise1D(x, s) {
    const i = Math.floor(x);
    const f = x - i;
    const t = f * f * (3 - 2 * f);
    return hash1(i, s) * (1 - t) + hash1(i + 1, s) * t;
}

function noise2D(x, y, s) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const tx = fx * fx * (3 - 2 * fx);
    const ty = fy * fy * (3 - 2 * fy);
    const n00 = hash2(ix, iy, s);
    const n10 = hash2(ix + 1, iy, s);
    const n01 = hash2(ix, iy + 1, s);
    const n11 = hash2(ix + 1, iy + 1, s);
    return (n00 * (1 - tx) + n10 * tx) * (1 - ty) + (n01 * (1 - tx) + n11 * tx) * ty;
}

// ===== Road =====

function getRoadCenterX(tileY) {
    const fade = Math.min(1, Math.abs(tileY) / 100);
    const n1 = (noise1D(tileY * 0.001, 100) - 0.5) * 50;
    const n2 = (noise1D(tileY * 0.005, 200) - 0.5) * 15;
    return (n1 + n2) * fade;
}

function getRoadDistance(tileX, tileY) {
    return Math.abs(tileX - getRoadCenterX(tileY));
}

// ===== Terrain =====

function getProceduralTerrainType(tileX, tileY) {
    const roadDist = getRoadDistance(tileX, tileY);
    if (roadDist < ROAD_HALF_WIDTH) return 'road';
    if (roadDist < ROAD_HALF_WIDTH + 1) return 'mud';

    const elevation = noise2D(tileX * 0.015, tileY * 0.015, 300);
    const moisture = noise2D(tileX * 0.01, tileY * 0.01, 400);
    /** Higher coefficient = shorter biome runs along the road (less “days” in one tone). */
    const biome = noise1D(tileY * 0.001, 500);
    /** Fine-scale variation so arid bands still get grass pockets and oases. */
    const patch = noise2D(tileX * 0.035, tileY * 0.035, 550);

    if (biome < 0.24) {
        if (elevation > 0.74) return 'mesa';
        if (elevation > 0.36) return 'badlands';
        if (moisture > 0.84) return 'deepwater';
        if (moisture > 0.68) return 'water';
        if (moisture > 0.5 || patch > 0.58) return 'highgrass';
        if (moisture > 0.38 || patch > 0.42) return 'grass';
        return 'wasteland';
    }
    if (biome < 0.58) {
        if (elevation > 0.86) return 'mesa';
        if (elevation > 0.66) return 'hill';
        if (moisture > 0.84) return 'deepwater';
        if (moisture > 0.73) return 'water';
        if (moisture > 0.46) return 'highgrass';
        return 'grass';
    }
    if (elevation > 0.8) return 'mesa';
    if (moisture > 0.9) return 'deepwater';
    if (moisture > 0.83) return 'water';
    if (elevation > 0.58) return 'hill';
    if (moisture < 0.2) return 'sands';
    if (moisture > 0.34 || patch > 0.38) return 'grass';
    return moisture > 0.26 ? 'mud' : 'sands';
}

// ===== Structures =====

const STRUCTURE_TEMPLATES = [
    {
        name: 'Service Station',
        weight: 0.11,
        width: 5, height: 4,
        tiles: [
            ['garage', 'garage', 'garage', 'road', 'road'],
            ['garage', 'garage', 'garage', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 3, ry: 2, type: 'barrel' },
            { rx: 4, ry: 2, type: 'barrel' },
            { rx: 0, ry: 2, type: 'scrap' },
            { rx: 4, ry: 0, type: 'tire' },
            { rx: 1, ry: 0, type: 'radiator' },
            { rx: 2, ry: 3, type: 'vehicle' },
        ]
    },
    {
        name: 'Roadside Cafe',
        weight: 0.1,
        width: 5, height: 4,
        tiles: [
            ['concrete', 'concrete', 'concrete', 'road', 'road'],
            ['concrete', 'concrete', 'concrete', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 3, ry: 2, type: 'scrap' },
            { rx: 4, ry: 2, type: 'circuit' },
            { rx: 3, ry: 0, type: 'circuit' },
            { rx: 4, ry: 0, type: 'vehicle' },
            { rx: 4, ry: 1, type: 'battery' },
        ]
    },
    {
        name: 'Scrapyard',
        weight: 0.13,
        width: 6, height: 5,
        tiles: [
            ['mud', 'mud', 'mud', 'mud', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 0, type: 'scrap' },
            { rx: 2, ry: 0, type: 'scrap' },
            { rx: 1, ry: 1, type: 'scrap' },
            { rx: 3, ry: 1, type: 'scrap' },
            { rx: 1, ry: 2, type: 'abandoned_car' },
            { rx: 3, ry: 2, type: 'engine_block' },
            { rx: 4, ry: 0, type: 'exhaust' },
        ]
    },
    {
        name: 'Water Tower',
        weight: 0.09,
        width: 4, height: 5,
        tiles: [
            ['road', 'water_tower', 'water_tower', 'road'],
            ['road', 'water_tower', 'water_tower', 'road'],
            ['road', 'water_tower', 'water_tower', 'road'],
            ['road', 'water_tower', 'water_tower', 'road'],
            ['road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 1, type: 'barrel' },
            { rx: 3, ry: 2, type: 'scrap' },
        ]
    },
    {
        name: 'Container Yard',
        weight: 0.1,
        width: 6, height: 5,
        tiles: [
            ['container', 'container', 'road', 'road', 'container', 'container'],
            ['container', 'container', 'road', 'road', 'container', 'container'],
            ['road', 'road', 'road', 'road', 'road', 'road'],
            ['container', 'road', 'road', 'road', 'road', 'container'],
            ['container', 'container', 'road', 'road', 'container', 'container'],
        ],
        entities: [
            { rx: 2, ry: 0, type: 'scrap' },
            { rx: 3, ry: 0, type: 'scrap' },
            { rx: 2, ry: 1, type: 'circuit' },
            { rx: 2, ry: 4, type: 'barrel' },
        ]
    },
    {
        name: 'Derelict Parking Lot',
        weight: 0.08,
        width: 6, height: 4,
        tiles: [
            ['concrete', 'parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'road'],
            ['parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'road'],
            ['parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 1, ry: 0, type: 'scrap' },
            { rx: 3, ry: 1, type: 'abandoned_car' },
            { rx: 4, ry: 2, type: 'circuit' },
            { rx: 2, ry: 1, type: 'vehicle' },
        ]
    },
    {
        name: 'Car Scrapyard',
        weight: 0.045,
        width: 8, height: 5,
        tiles: [
            ['mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 0, type: 'abandoned_car' },
            { rx: 1, ry: 0, type: 'abandoned_car' },
            { rx: 2, ry: 0, type: 'abandoned_car' },
            { rx: 0, ry: 1, type: 'abandoned_car' },
            { rx: 2, ry: 1, type: 'abandoned_car' },
            { rx: 1, ry: 2, type: 'abandoned_car' },
            { rx: 3, ry: 2, type: 'engine_block' },
            { rx: 0, ry: 3, type: 'tire' },
            { rx: 2, ry: 3, type: 'exhaust' },
        ]
    },
    {
        name: 'Small Village',
        weight: 0.16,
        width: 8, height: 5,
        tiles: [
            ['garage', 'mud', 'garage', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'concrete', 'concrete', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'concrete', 'concrete', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 0, type: 'barrel' },
            { rx: 2, ry: 0, type: 'scrap' },
            { rx: 0, ry: 2, type: 'scrap' },
            { rx: 3, ry: 2, type: 'barrel' },
            { rx: 6, ry: 2, type: 'circuit' },
            { rx: 1, ry: 3, type: 'battery' },
        ]
    },
    {
        name: 'Workshop',
        weight: 0.14,
        width: 5, height: 4,
        tiles: [
            ['garage', 'garage', 'garage', 'road', 'road'],
            ['garage', 'garage', 'garage', 'road', 'road'],
            ['mud', 'mud', 'mud', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 2, type: 'scrap' },
            { rx: 2, ry: 2, type: 'engine_block' },
            { rx: 3, ry: 0, type: 'tire' },
            { rx: 4, ry: 2, type: 'barrel' },
        ]
    },
    {
        name: 'Abandoned Gas Station',
        weight: 0.11,
        width: 5, height: 4,
        tiles: [
            ['concrete', 'concrete', 'concrete', 'road', 'road'],
            ['concrete', 'concrete', 'concrete', 'road', 'road'],
            ['mud', 'mud', 'mud', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 2, type: 'barrel' },
            { rx: 2, ry: 2, type: 'scrap' },
            { rx: 4, ry: 2, type: 'barrel' },
            { rx: 3, ry: 0, type: 'circuit' },
            { rx: 2, ry: 3, type: 'vehicle' },
        ]
    },
    {
        name: 'Trading Post',
        weight: 0.15,
        width: 6, height: 4,
        tiles: [
            ['mud', 'mud', 'mud', 'road', 'road', 'road'],
            ['mud', 'garage', 'mud', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 0, ry: 0, type: 'scrap' },
            { rx: 2, ry: 0, type: 'circuit' },
            { rx: 0, ry: 1, type: 'battery' },
            { rx: 2, ry: 2, type: 'barrel' },
            { rx: 0, ry: 2, type: 'scrap' },
            { rx: 4, ry: 1, type: 'circuit' },
        ]
    },
    {
        name: 'City Ruins',
        weight: 0.16,
        width: 8, height: 6,
        tiles: [
            ['container', 'container', 'parking_lot', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['container', 'container', 'parking_lot', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['parking_lot', 'parking_lot', 'parking_lot', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['parking_lot', 'mud', 'mud', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 2, ry: 0, type: 'scrap' },
            { rx: 3, ry: 2, type: 'scrap' },
            { rx: 1, ry: 3, type: 'abandoned_car' },
            { rx: 3, ry: 3, type: 'circuit' },
            { rx: 0, ry: 4, type: 'barrel' },
            { rx: 6, ry: 4, type: 'scrap' },
        ]
    },
    {
        name: 'Loading Dock',
        weight: 0.13,
        width: 8, height: 5,
        tiles: [
            ['container', 'container', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['container', 'container', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['container', 'container', 'concrete', 'concrete', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'parking_lot', 'parking_lot', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 3, ry: 0, type: 'scrap' },
            { rx: 2, ry: 0, type: 'circuit' },
            { rx: 0, ry: 3, type: 'barrel' },
            { rx: 2, ry: 3, type: 'scrap' },
            { rx: 3, ry: 3, type: 'scrap' },
            { rx: 6, ry: 4, type: 'vehicle' },
        ]
    },
    {
        name: 'Railway Station',
        weight: 0.12,
        width: 9, height: 4,
        tiles: [
            ['concrete', 'concrete', 'concrete', 'concrete', 'concrete', 'road', 'road', 'road', 'road'],
            ['concrete', 'concrete', 'concrete', 'concrete', 'concrete', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'mud', 'mud', 'mud', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 5, ry: 0, type: 'scrap' },
            { rx: 7, ry: 0, type: 'barrel' },
            { rx: 2, ry: 2, type: 'scrap' },
            { rx: 0, ry: 2, type: 'circuit' },
            { rx: 7, ry: 2, type: 'battery' },
        ]
    },
    {
        name: 'Abandoned Factory',
        weight: 0.15,
        width: 9, height: 6,
        tiles: [
            ['concrete', 'concrete', 'concrete', 'container', 'container', 'road', 'road', 'road', 'road'],
            ['concrete', 'concrete', 'concrete', 'container', 'container', 'road', 'road', 'road', 'road'],
            ['container', 'concrete', 'concrete', 'concrete', 'mud', 'road', 'road', 'road', 'road'],
            ['container', 'concrete', 'concrete', 'concrete', 'mud', 'road', 'road', 'road', 'road'],
            ['mud', 'mud', 'concrete', 'concrete', 'concrete', 'road', 'road', 'road', 'road'],
            ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
        ],
        entities: [
            { rx: 6, ry: 2, type: 'circuit' },
            { rx: 0, ry: 4, type: 'engine_block' },
            { rx: 1, ry: 4, type: 'radiator' },
            { rx: 7, ry: 4, type: 'scrap' },
            { rx: 4, ry: 2, type: 'exhaust' },
            { rx: 5, ry: 0, type: 'scrap' },
            { rx: 4, ry: 5, type: 'vehicle' },
        ]
    },
];

(function validateStructureTemplateEntities() {
    for (const tmpl of STRUCTURE_TEMPLATES) {
        for (const ent of tmpl.entities) {
            const t = tmpl.tiles[ent.ry][ent.rx];
            if (BLOCKABLE_SPAWN_TERRAIN.has(t)) {
                console.warn(
                    `[world] Template "${tmpl.name}": entity "${ent.type}" at template (${ent.rx},${ent.ry}) is on solid terrain "${t}"` +
                    ' — pick a road/parking_lot/mud/garage cell instead.'
                );
            }
        }
    }
})();

function getStructurePlacement(segmentIndex) {
    const n = noise1D(segmentIndex * 17.3, 600);
    const tileY = segmentIndex * STRUCTURE_SPACING +
        Math.floor((n - 0.5) * STRUCTURE_SPACING * STRUCTURE_JITTER_IN_SPACING);

    const totalWeight = STRUCTURE_TEMPLATES.reduce((s, t) => s + t.weight, 0);
    const typeN = noise1D(segmentIndex * 31.7, 700);
    let accum = 0;
    let template = STRUCTURE_TEMPLATES[0];
    for (const t of STRUCTURE_TEMPLATES) {
        accum += t.weight / totalWeight;
        if (typeN < accum) { template = t; break; }
    }

    const roadX = Math.round(getRoadCenterX(tileY));
    const side = segmentIndex % 2 === 0 ? 1 : -1;

    let startX;
    if (side > 0) {
        startX = roadX + ROAD_HALF_WIDTH + 2;
    } else {
        startX = roadX - ROAD_HALF_WIDTH - template.width - 1;
    }

    return { template, startX, startY: tileY - Math.floor(template.height / 2), side, roadX, tileY };
}

// ===== Chunks =====

function chunkKey(cx, cy) { return `${cx},${cy}`; }

function generateChunk(cx, cy, collectedSet) {
    const terrain = new Array(CHUNK_SIZE * CHUNK_SIZE);
    const entities = [];
    const startTX = cx * CHUNK_SIZE;
    const startTY = cy * CHUNK_SIZE;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            terrain[ly * CHUNK_SIZE + lx] = getProceduralTerrainType(startTX + lx, startTY + ly);
        }
    }

    // Overlay structures
    const minSeg = Math.floor((startTY - 20) / STRUCTURE_SPACING) - 1;
    const maxSeg = Math.floor((startTY + CHUNK_SIZE + 20) / STRUCTURE_SPACING) + 1;

    for (let seg = minSeg; seg <= maxSeg; seg++) {
        const p = getStructurePlacement(seg);
        const tmpl = p.template;
        const endX = p.startX + tmpl.width;
        const endY = p.startY + tmpl.height;

        if (endX <= startTX || p.startX >= startTX + CHUNK_SIZE) continue;
        if (endY <= startTY || p.startY >= startTY + CHUNK_SIZE) continue;

        // Stamp structure tiles
        for (let sy = 0; sy < tmpl.height; sy++) {
            for (let sx = 0; sx < tmpl.width; sx++) {
                const tx = p.startX + (p.side > 0 ? sx : tmpl.width - 1 - sx);
                const ty = p.startY + sy;
                const lx = tx - startTX;
                const ly = ty - startTY;
                if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
                    terrain[ly * CHUNK_SIZE + lx] = tmpl.tiles[sy][sx];
                }
            }
        }

        // Access road connecting structure to main road
        const accessY = p.tileY;
        const accessLY = accessY - startTY;
        if (accessLY >= 0 && accessLY < CHUNK_SIZE) {
            const roadEdge = p.roadX + (p.side > 0 ? ROAD_HALF_WIDTH : -ROAD_HALF_WIDTH);
            const structEdge = p.side > 0 ? p.startX : p.startX + tmpl.width - 1;
            const minX = Math.min(roadEdge, structEdge);
            const maxX = Math.max(roadEdge, structEdge);
            for (let ax = minX; ax <= maxX; ax++) {
                const lx = ax - startTX;
                if (lx >= 0 && lx < CHUNK_SIZE) {
                    terrain[accessLY * CHUNK_SIZE + lx] = 'road';
                    if (accessLY > 0) terrain[(accessLY - 1) * CHUNK_SIZE + lx] = 'road';
                    if (accessLY + 1 < CHUNK_SIZE) terrain[(accessLY + 1) * CHUNK_SIZE + lx] = 'road';
                }
            }
        }

        // Spawn structure entities (skip tiles that are solid / impassable, e.g. container walls)
        for (const ent of tmpl.entities) {
            const ex = p.startX + (p.side > 0 ? ent.rx : tmpl.width - 1 - ent.rx);
            const ey = p.startY + ent.ry;
            const lx = ex - startTX;
            const ly = ey - startTY;
            if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) continue;
            const key = `${ex},${ey}`;
            if (collectedSet && collectedSet.has(key)) continue;
            const cellTerrain = terrain[ly * CHUNK_SIZE + lx];
            if (BLOCKABLE_SPAWN_TERRAIN.has(cellTerrain)) {
                continue;
            }
            entities.push({
                type: ent.type, x: ex * TILE_SIZE, y: ey * TILE_SIZE,
                tileX: ex, tileY: ey, size: TILE_SIZE, active: true
            });
        }
    }

    const occupiedByStructure = new Set(entities.map((e) => `${e.tileX},${e.tileY}`));

    // Scatter trees and rocks (never on tiles already used by structure pickups)
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const tx = startTX + lx;
            const ty = startTY + ly;
            const tt = terrain[ly * CHUNK_SIZE + lx];
            const key = `${tx},${ty}`;
            if (collectedSet && collectedSet.has(key)) continue;
            if (occupiedByStructure.has(key)) continue;
            if (BLOCKABLE_SPAWN_TERRAIN.has(tt)) continue;

            if ((tt === 'grass' || tt === 'highgrass') && hash2(tx * 0.7, ty * 0.7, 800) > 0.95) {
                const treeType = (tx + ty) % 2 === 0 ? 'tree_1' : 'tree_2';
                entities.push({
                    type: treeType, x: tx * TILE_SIZE, y: ty * TILE_SIZE,
                    tileX: tx, tileY: ty, size: TILE_SIZE, active: true
                });
                occupiedByStructure.add(key);
            } else if ((tt === 'hill' || tt === 'mesa') && hash2(tx * 0.7, ty * 0.7, 900) > 0.97) {
                entities.push({
                    type: 'rock', x: tx * TILE_SIZE, y: ty * TILE_SIZE,
                    tileX: tx, tileY: ty, size: TILE_SIZE, active: true
                });
                occupiedByStructure.add(key);
            }
        }
    }

    // Rare jam portal tiles: just off the road, never on road/mud/water or structure solids
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const tx = startTX + lx;
            const ty = startTY + ly;
            const rd = getRoadDistance(tx, ty);
            if (rd < PORTAL_MIN_ROAD_DIST || rd > PORTAL_MAX_ROAD_DIST) continue;
            const tt = terrain[ly * CHUNK_SIZE + lx];
            if (tt === 'road' || tt === 'mud' || tt === 'water' || tt === 'deepwater') continue;
            if (BLOCKABLE_SPAWN_TERRAIN.has(tt) || PORTAL_EXCLUDE_TERRAIN.has(tt)) continue;
            if (hash2(tx, ty, 7777) >= PORTAL_TILE_HASH_THRESHOLD) continue;
            terrain[ly * CHUNK_SIZE + lx] = 'portal';
        }
    }

    return { terrain, entities };
}

function getWorldTerrainType(tileX, tileY) {
    const cx = Math.floor(tileX / CHUNK_SIZE);
    const cy = Math.floor(tileY / CHUNK_SIZE);
    const chunk = worldChunks.get(chunkKey(cx, cy));
    if (!chunk) return 'grass';
    const lx = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.terrain[ly * CHUNK_SIZE + lx];
}

function initWorld(seed) {
    worldSeed = seed || Math.floor(Math.random() * 100000);
    worldChunks.clear();
}

function updateWorldChunks(playerWorldX, playerWorldY, collectedSet) {
    const playerTX = Math.round(playerWorldX / TILE_SIZE);
    const playerTY = Math.round(playerWorldY / TILE_SIZE);
    const playerCX = Math.floor(playerTX / CHUNK_SIZE);
    const playerCY = Math.floor(playerTY / CHUNK_SIZE);

    const newChunks = [];
    const removedChunks = [];

    for (let dy = -CHUNK_LOAD_RADIUS; dy <= CHUNK_LOAD_RADIUS; dy++) {
        for (let dx = -CHUNK_LOAD_RADIUS; dx <= CHUNK_LOAD_RADIUS; dx++) {
            const cx = playerCX + dx;
            const cy = playerCY + dy;
            const key = chunkKey(cx, cy);
            if (!worldChunks.has(key)) {
                const chunk = generateChunk(cx, cy, collectedSet);
                worldChunks.set(key, chunk);
                newChunks.push({ cx, cy, entities: chunk.entities });
            }
        }
    }

    for (const [key, chunk] of worldChunks) {
        const parts = key.split(',');
        const cx = parseInt(parts[0]);
        const cy = parseInt(parts[1]);
        if (Math.abs(cx - playerCX) > CHUNK_UNLOAD_RADIUS ||
            Math.abs(cy - playerCY) > CHUNK_UNLOAD_RADIUS) {
            removedChunks.push({ cx, cy, entities: chunk.entities });
            worldChunks.delete(key);
        }
    }

    return { newChunks, removedChunks };
}
