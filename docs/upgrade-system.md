# Upgrade System

The game has a modular upgrade system for swappable car parts (engines, tires, etc.). Each upgrade type follows the same pattern and lives in its own file.

## How It Works

Each upgrade system has:

- **Type definitions**: an array of items with stats, rarity, and drop weight
- **Rarity-based drops**: items are selected using weighted random rolls (Common 30, Common 25, Uncommon 20, Rare 13, Very Rare 8, Legendary 4)
- **Swap UI**: an overlay comparing current vs found item, with color-coded rarity labels and stat arrows (green up / red down)
- **Persistence**: declined items stay on the map (2-second cooldown prevents re-trigger). Accepted swaps remove the item permanently
- **Save/load**: stores the equipped item ID in localStorage

### Rarity Distribution

| Rarity    | Weight | Approx % | Color  |
|-----------|--------|----------|--------|
| Common    | 30+25  | ~55%     | Gray   |
| Uncommon  | 20     | ~20%     | Green  |
| Rare      | 13     | ~13%     | Blue   |
| Very Rare | 8      | ~8%      | Purple |
| Legendary | 4      | ~4%      | Gold   |

Rarity colors are defined in `constants.js` as `RARITY_COLORS`.

### Files per upgrade type

| Upgrade | Logic file  | Entity type    | Spawns at    | Texture      |
|---------|-------------|----------------|--------------|--------------|
| Engine  | `engine.js` | `engine_block` | Scrapyard    | `engine.png` |
| Tires   | `tires.js`  | `tire`         | Gas Station  | `tire.png`   |

### Integration points in `index.html`

- `<script>` tag (after `world.js`, before `particles.js`)
- Sidebar stat element (`<span id="...Text">`)
- Controls section: multiply acceleration by the system's stat
- Terrain modifier: apply grip/resistance if applicable
- Entity collection loop: call `system.canInteract()` then `system.showSwapUI(item, entity)`
- Save/load/restart: call `getSaveData()`, `loadSaveData()`, `reset()`
- `window.onload`: call `system.init()`

## How to Add a New Upgrade Type

### 1. Create the logic file (e.g. `radiator.js`)

Copy `engine.js` and change:

- `ENGINE_TYPES` → your type array with appropriate stats (e.g. `heatResist`, `coolRate`)
- `engineSystem` → `radiatorSystem`
- Hash seed in `getXxxForTile()` — use a unique seed (e.g. `1300`) so drops differ per tile
- Overlay element IDs (`radiatorSwapOverlay`, `radiatorSwapContent`)
- Overlay border color to distinguish from other overlays
- Sidebar element ID (`radiatorText`)
- Stat labels in `showSwapUI()` (e.g. "Cooling" instead of "Power")
- `lowerBetter` flag per stat in the arrow comparison
- Notification messages
- Save/load key names (`radiatorId` instead of `engineId`)

### 2. Add texture to `constants.js`

```js
{ type: 'radiator', src: 'radiator.png' },
```

### 3. Add entity spawn to `world.js`

Add to a structure template's `entities` array:

```js
{ rx: 2, ry: 1, type: 'radiator' },
```

### 4. Wire into `index.html`

- Script tag: `<script src="radiator.js"></script>`
- Sidebar: `<div class="stat">Radiator: <span id="radiatorText">Standard Radiator</span></div>`
- Entity fallback color: `radiator: '#cc6644',`
- Controls: multiply relevant physics by `radiatorSystem.current.somestat`
- Pending check: add `|| radiatorSystem.pendingSwap` to the swap-pending condition
- Collection: add `else if (point.type === 'radiator') { ... }` block
- Save: add `radiator: radiatorSystem.getSaveData()` to save object
- Load: add `if (saveData.radiator) radiatorSystem.loadSaveData(saveData.radiator);`
- Restart: add `radiatorSystem.reset();`
- Init: add `radiatorSystem.init();` in `window.onload`

## Future Refactoring Idea

All upgrade files share ~95% identical code. The differences are only:

- Type array (names, stats, weights)
- Stat labels and comparison direction (`lowerBetter`)
- UI colors (overlay border, title)
- Hash seed for drop selection
- DOM element IDs

This could be refactored into a single `upgrades.js` with a factory function:

```js
function createUpgradeSystem(config) {
    // config = {
    //   name: 'Engine',
    //   types: ENGINE_TYPES,
    //   stats: [
    //     { key: 'power', label: 'Power', lowerBetter: false },
    //     { key: 'fuelRate', label: 'Fuel use', lowerBetter: true },
    //   ],
    //   uiColor: '#4488aa',
    //   hashSeed: 1100,
    //   sidebarId: 'engineText',
    //   saveKey: 'engineId',
    //   defaultIndex: 1,
    // }
    return { init, canInteract, getForTile, showSwapUI, ... };
}

const engineSystem = createUpgradeSystem({ ... });
const tireSystem = createUpgradeSystem({ ... });
const radiatorSystem = createUpgradeSystem({ ... });
```

This would reduce ~176 lines per upgrade type to ~10 lines of config each, with the shared logic written once (~180 lines). Adding new upgrades would then be just a config object + entity/texture/sidebar wiring.
