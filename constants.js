// Define texture configurations
const TEXTURES = [
    //{ type: 'grass', src: 'dev_grass.png' },
    { type: 'mud', src: 'dev_mud.png' },
    //{ type: 'water', src: 'dev_water.png' },
    //{ type: 'deepwater', src: 'dev_water_deep.png' },
    { type: 'scrap', src: 'scrap.png' },
    { type: 'circuit', src: 'circuit.png' },
    { type: 'car', src: 'car2.png' },
    { type: 'road', src: 'dev_road.png' },
    { type: 'tree', src: 'tree_hill.png' },
    //{ type: 'rock', src: 'rock.png' },
    { type: 'snow', src: 'dev_snow.png' },
    { type: 'artifact_heart', src: 'artifact_heart.png' },
    { type: 'artifact_fuel', src: 'artifact_fuel.png' },
    //{ type: 'barrel', src: 'barrel.png' }
];

// Define terrain colors for non-textured tiles
const TERRAIN_COLORS = {
    water: '#4444ff',
    deepwater: '#000066',

    grass: '#7aa983',
    highgrass: '#60a07e',
    hill: '#3c997f',

    road: '#666666',
    mud: '#654321',
    rock: '#333333',
    tree: '#006400',
    snow: '#ffffff',
    garage: '#ccccff',
    collected: '#444444',  // Grey color for collected items
    block: '#000000'  // Add black color for blocking tiles
};

// Define map colors for terrain types
const MAP_COLORS = {
    '#0000ff': 'water',     // Blue
    '#000080': 'deepwater', // Dark Blue

    '#7aa983': 'grass',     // Green
    '#60a07e': 'highgrass',
    '#3c997f': 'hill',

    '#808080': 'road',      // Gray
    '#8b4513': 'mud',       // Brown
    '#404040': 'rock',      // Dark Gray
    '#006400': 'tree',      // Dark Green
    '#ffffff': 'snow',      // White
    '#ff0000': 'scrap',     // Red
    '#cc3333': 'artifact_heart', // Heart artifact
    '#33cccc': 'artifact_fuel',  // Fuel artifact
    '#ffff00': 'circuit',   // Yellow
    '#ffa500': 'barrel',    // Orange
    '#ff00ff': 'fire',      // Magenta for fire
    '#ccccff': 'garage',    // Light blue for garage
    '#000000': 'block'  // Add mapping for black color to block type
};
