// Define texture configurations
const TEXTURES = [
    //{ type: 'grass', src: 'grass.png' },
    //{ type: 'grass_1', src: 'assets/tiles/grass_1.png' },
    //{ type: 'grass_2', src: 'assets/tiles/grass_2.png' },
    // { type: 'mud', src: 'dev_mud.png' },
    //{ type: 'water', src: 'dev_water.png' },
    //{ type: 'deepwater', src: 'dev_water_deep.png' },
    { type: 'scrap', src: 'scrap.png' },
    { type: 'circuit', src: 'circuit.png' },
    { type: 'car_sedan', src: 'assets/vehicles/car2.png' },
    { type: 'car_rusty_sedan', src: 'assets/vehicles/car-pink.png' },
    { type: 'car_police', src: 'assets/vehicles/car-police.png' },
    // { type: 'road', src: 'assets/tiles/road.png' },
    //{ type: 'tree_1', src: 'assets/tiles/tree_1.png' },
    //{ type: 'tree_2', src: 'assets/tiles/tree_2.png' },
    //{ type: 'rock', src: 'rock.png' },
    //{ type: 'snow', src: 'dev_snow.png' },
    { type: 'engine_block', src: 'assets/icons/engine.png' },
    { type: 'tire', src: 'assets/icons/tire.png' },
    { type: 'exhaust', src: 'assets/icons/exhaust.png' },
    { type: 'radiator', src: 'assets/icons/radiator.png' },
    { type: 'battery', src: 'assets/icons/battery.png' }
    //{ type: 'barrel', src: 'barrel.png' }
];

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

    grass: '#4f5d42',
    highgrass: '#314e3f',
    hill: '#1d3230',

    road: '#9a9f87',
    mud: '#b6834c',
    rock: '#151015',
    snow: '#ede6cb',

    garage: '#ccccff',
    collected: '#444444',
    block: '#000000',
    water_tower: '#7a8ba3',
    container: '#b8522a',
    parking_lot: '#3d3d3d'
};