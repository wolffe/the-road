# Roadmap

## Target feel

The game aims to match the **atmosphere, aesthetics, and gameplay** of:

- **Drive Beyond Horizons** — endless road, sparse structures, scavenging, survival
- **The Long Road** — road-trip mood, desolate landscapes, resource management
- **Hard Truck Apocalypse** — heavy vehicles, post-apocalyptic tone, trading/scavenging

Use these as reference for tone, pacing, and feature priorities.

---

## Upgrade Items

These follow the existing engine/tire pattern (rarity drops, swap UI, save/load).

- [x] **Exhaust** — affects speed/acceleration (power multiplier). Icons in `assets/icons/`.
- [x] **Radiator** — affects durability (reduces damage from water, deepwater, collisions). Icons in `assets/icons/`.
- [x] **Battery** — affects battery drain (efficiency = longer interval between drain ticks). Icons in `assets/icons/`.

- [x] **Cars** — swappable vehicles found at structures. Each car has a unique sprite, slightly different dimensions, different default engine/tires, and different headlight/taillight positions. Capacity, HP, and trunk are the same across all cars. Follows the rarity/swap UI pattern.

## Visual Effects

- [x] **Damage smoke** — when HP is 20 or less, thick dark smoke billows from the car (larger and darker than exhaust particles)
- [ ] **Clouds** — sky layer with drifting clouds (tried, reverted)
- [ ] **Fog** — distance fog or ground fog for atmosphere and depth
- [ ] **Pixel art rendering** — vehicles and items drawn without smoothing (crisp pixels, no anti-aliasing when scaling)

## World & structures

- [x] **More structures** — Water Tower, Container Yard, Derelict Parking Lot added to `STRUCTURE_TEMPLATES` (coloured blocks; textures can be added later)

## Terrain texture variety (less repetition)

Ways to make tileable grass/snow/mud feel less repetitive:

- [ ] **1. Multiple variants per tile** — 2–3 tileable textures per terrain type; pick which variant to draw per tile via hash(tileX, tileY).
- [ ] **4. Two layers at different scales** — Draw the same (or a second) tileable texture twice at different scale and offset, blend. Combined pattern repeats over a much larger area.
- [ ] **5. Rare overlays / decals** — After drawing the tile, sometimes add a subtle overlay (noise or small decals: pebbles, stains, patches) only where a hash says yes.

## Weather

- [ ] **Rain** — visual rain effect, terrain changes (slippery roads, reduced visibility)

## Audio

- [ ] **Background music** — ambient/driving music, possibly varying by biome or time of day
- [ ] **Synthesized sound effects** — use Tone.js to generate sounds procedurally (handbrake screech, horn, engine rev) instead of relying on audio files

---

## How structures are stored

Structures are defined in **`js/world.js`** in the **`STRUCTURE_TEMPLATES`** array. They are **not** stored in JSON or image files; each entry is a JavaScript object.

### One structure = one template object

Each template has:

| Field      | Purpose |
|-----------|---------|
| `name`    | Label (e.g. `'Gas Station'`) — for debugging or future UI. |
| `weight`  | Relative chance to be picked when a structure is placed. All weights are summed; this one’s share is `weight / totalWeight`. |
| `width`   | Width in tiles (number of columns). |
| `height`  | Height in tiles (number of rows). |
| `tiles`   | 2D array of terrain type strings. `tiles[row][col]` = terrain at that cell. Row 0 = top. Valid values: any key in `TERRAIN_COLORS` (e.g. `'road'`, `'garage'`, `'block'`, `'mud'`). |
| `entities`| Array of pickups/objects. Each has `rx`, `ry` (position inside the structure, 0-based), and `type` (e.g. `'scrap'`, `'barrel'`, `'vehicle'`, `'engine_block'`, `'tire'`, `'abandoned_car'`). |

### Placement (no extra storage)

Structures are **not** saved to a separate structure list. Placement is **deterministic and computed on demand**:

1. **When** a chunk is generated, `generateChunk()` in `js/world.js` runs.
2. **Where** structures can appear: every **`STRUCTURE_SPACING`** tiles along the road (e.g. 50). For each “segment” in range of the chunk, `getStructurePlacement(segmentIndex)` is called.
3. **Which** structure: a deterministic 1D noise value (from the world seed) picks a template by weight. Same seed ⇒ same structure at the same segment.
4. **Side of road**: left or right alternates by segment (`segmentIndex % 2`).
5. The template’s **`tiles`** are “stamped” over the procedural terrain in that chunk. An **access road** (a few rows of `'road'`) is drawn from the main road to the structure.
6. **Entities** from the template are pushed into the chunk’s entity list at world coordinates derived from `startX`, `startY`, and each entity’s `rx`/`ry`.

So: **storage = the `STRUCTURE_TEMPLATES` array only.** Runtime “storage” is just the chunk’s terrain array and entity list; when a chunk is unloaded, that data is discarded and can be regenerated from the seed and template definitions.

### Adding a new structure

1. Add a new object to **`STRUCTURE_TEMPLATES`** in `js/world.js` with `name`, `weight`, `width`, `height`, `tiles`, and `entities`.
2. Ensure `TERRAIN_COLORS` (in `js/constants.js`) has entries for any terrain types you use in `tiles` (e.g. `garage`, `block`).
3. If you add a new entity `type`, wire it in `index.html` (collection logic, `ENTITY_FALLBACK_COLORS`, and any special behaviour).
4. Adjust **`STRUCTURE_SPACING`** in `js/world.js` if you want structures more or less frequent globally.

### Trees and rocks (procedural scatter)

In **`generateChunk()`** in `js/world.js`, after structures are stamped:

- **Trees** are placed only on **`grass`** and **`highgrass`** tiles (green fields). Each such tile has a small deterministic chance (hash > 0.95) to get a tree.
- **Rocks** are placed only on **`hill`** and **`rock`** tiles. Same idea, different hash threshold (0.97).

So trees do **not** spawn on hills or other terrain; hills get rocks. To add trees elsewhere (e.g. mud, snow), add a condition in that scatter loop for the desired terrain type.
