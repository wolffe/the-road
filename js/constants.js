// Define texture configurations
const TEXTURES = [
    //{ type: 'grass', src: 'grass.png' },
    //{ type: 'grass_1', src: 'assets/tiles/grass_1.png' },
    //{ type: 'grass_2', src: 'assets/tiles/grass_2.png' },
    // { type: 'mud', src: 'dev_mud.png' },
    //{ type: 'water', src: 'dev_water.png' },
    //{ type: 'deepwater', src: 'dev_water_deep.png' },
    { type: 'scrap', src: 'assets/icons/scrap.png' },
    { type: 'circuit', src: 'assets/icons/circuits.png' },
    // { type: 'road', src: 'assets/tiles/road.png' },
    //{ type: 'tree_1', src: 'assets/tiles/tree_1.png' },
    //{ type: 'tree_2', src: 'assets/tiles/tree_2.png' },
    //{ type: 'rock', src: 'rock.png' },
    //{ type: 'snow', src: 'dev_snow.png' },
    { type: 'engine_block', src: 'assets/icons/engine.png' },
    { type: 'tire', src: 'assets/icons/tire.png' },
    { type: 'exhaust', src: 'assets/icons/exhaust.png' },
    { type: 'radiator', src: 'assets/icons/radiator.png' },
    { type: 'battery', src: 'assets/icons/battery.png' },
    //{ type: 'container', src: 'assets/tiles/container.png' },
    { type: 'barrel', src: 'assets/icons/fuel.png' }
];

/** World map: draw `assets/icons/*` pickups smaller than a tile; collision still uses full `ent.size`. */
const ENTITY_ICON_ON_MAP_SCALE = 0.5;
const ENTITY_ICON_MAP_TYPES = new Set([
    'scrap', 'circuit', 'barrel', 'engine_block', 'tire', 'exhaust', 'radiator', 'battery'
]);

const RARITY_COLORS = {
    'Common': '#aaa',
    'Uncommon': '#4f4',
    'Rare': '#48f',
    'Very Rare': '#a4f',
    'Legendary': '#fa4',
};

// Colours when an entity texture is not loaded yet (see drawEntities() in index.html)
const ENTITY_FALLBACK_COLORS = {
    tree_1: '#704d2b',
    tree_2: '#1d3230',

    rock: '#9a9f87',

    scrap: '#cc4444',
    barrel: '#dd8833',
    circuit: '#dddd33',
    engine_block: '#7799bb',
    tire: '#665544',
    vehicle: '#44aa88',
    exhaust: '#6a5544',
    radiator: '#4488aa',
    battery: '#88aa44',
};

// Define terrain colors for non-textured tiles
const TERRAIN_COLORS = {
    water: '#3a708e',
    deepwater: '#2b454f',

    grass: '#5a6348',
    highgrass: '#3d4a36',
    hill: '#2a3530',
    mesa: '#6b5c4a',
    wasteland: '#8a7a62',
    badlands: '#7d6e58',
    sands: '#c4b090',

    road: '#8a8578',
    mud: '#8f6e4a',

    garage: '#9aa6b8',
    collected: '#444444',
    concrete: '#6a6d64',
    water_tower: '#7a8b9a',
    container: '#8b4a28',
    parking_lot: '#454545'
};

const TERRAIN_DISPLAY_NAMES = {
    water: 'Water',
    deepwater: 'Deep water',
    grass: 'Grass',
    highgrass: 'High grass',
    hill: 'Hill',
    mesa: 'Mesa',
    wasteland: 'Wasteland',
    badlands: 'Badlands',
    sands: 'Sands',
    mud: 'Mud',
    road: 'Road',
    garage: 'Garage',
    concrete: 'Concrete',
    water_tower: 'Water tower',
    container: 'Container',
    parking_lot: 'Parking',
    collected: 'Collected',
};


/** Wrap a value in markup so it uses `--font-numeric` (Ubuntu Mono). */
function fontNumericHtml(value) {
    return '<span class="font-numeric">' + String(value) + '</span>';
}

/** Swap confirmation modals (engine, tires, cars, exhaust, radiator, battery) */
const SWAP_MODAL_ACTIONS_HTML =
    '<div class="swap-modal-actions">' +
    '<button type="button" class="swap-modal-btn swap-modal-btn-swap">Swap</button>' +
    '<button type="button" class="swap-modal-btn swap-modal-btn-keep">Keep current</button>' +
    '</div>' +
    '<p class="swap-modal-keyboard-hint">Keyboard: E to swap · Esc to keep</p>';

function bindSwapModalOverlayClicks(overlayEl, api) {
    if (!overlayEl || overlayEl.dataset.swapModalBound) return;
    overlayEl.dataset.swapModalBound = '1';
    overlayEl.addEventListener('click', (e) => {
        if (!api.pendingSwap) return;
        const el = e.target instanceof Element ? e.target : e.target.parentElement;
        const btn = el && el.closest('.swap-modal-btn-swap, .swap-modal-btn-keep');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (btn.classList.contains('swap-modal-btn-swap')) api.acceptSwap();
        else api.declineSwap();
    });
}