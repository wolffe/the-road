<?php
// PHP handles file upload if needed, but all processing is done client-side via Canvas API
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PALETTIZER</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323:wght@400&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:       #0a0c0a;
    --surface:  #111511;
    --border:   #1e2e1e;
    --green:    #39ff4e;
    --green-dim:#1a7a24;
    --amber:    #ffb800;
    --red:      #ff3b3b;
    --text:     #c8e8c8;
    --text-dim: #4a6a4a;
    --glow:     0 0 8px #39ff4e88, 0 0 24px #39ff4e22;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Share Tech Mono', monospace;
    font-size: 14px;
    min-height: 100vh;
    overflow-x: hidden;
  }



  .header {
    border-bottom: 1px solid var(--border);
    padding: 18px 32px;
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .header h1 {
    font-family: 'VT323', monospace;
    font-size: 42px;
    color: var(--green);
    text-shadow: var(--glow);
    letter-spacing: 4px;
  }

  .header .subtitle {
    color: var(--text-dim);
    font-size: 12px;
    letter-spacing: 2px;
  }

  .header .version {
    margin-left: auto;
    color: var(--green-dim);
    font-size: 11px;
  }

  .workspace {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 0;
    height: calc(100vh - 73px);
  }

  /* ── SIDEBAR ── */
  .sidebar {
    border-right: 1px solid var(--border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-track { background: var(--bg); }
  .sidebar::-webkit-scrollbar-thumb { background: var(--green-dim); }

  .panel {
    border-bottom: 1px solid var(--border);
    padding: 16px 20px;
  }

  .panel-title {
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--green-dim);
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-title::before {
    content: '▶';
    color: var(--green);
    font-size: 9px;
  }

  /* Upload zone */
  .upload-zone {
    border: 1px dashed var(--green-dim);
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    background: #0c110c;
  }

  .upload-zone:hover, .upload-zone.dragover {
    border-color: var(--green);
    background: #0f1a0f;
    box-shadow: inset 0 0 16px #39ff4e11;
  }

  .upload-zone input[type=file] {
    position: absolute; inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%; height: 100%;
  }

  .upload-icon {
    font-size: 28px;
    color: var(--green-dim);
    display: block;
    margin-bottom: 8px;
  }

  .upload-zone p { color: var(--text-dim); font-size: 12px; }
  .upload-zone .filename {
    margin-top: 8px;
    color: var(--green);
    font-size: 11px;
    word-break: break-all;
  }

  /* Preset palettes */
  .presets {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .preset-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    cursor: pointer;
    color: var(--text);
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    transition: all 0.1s;
    text-align: left;
  }

  .preset-btn:hover { border-color: var(--green-dim); background: #0f1a0f; }
  .preset-btn.active { border-color: var(--green); color: var(--green); box-shadow: var(--glow); }

  .preset-swatches {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
    flex: 1;
  }

  .swatch-mini {
    width: 10px; height: 10px;
    border-radius: 1px;
    flex-shrink: 0;
  }

  .preset-name { min-width: 80px; }

  /* Palette editor */
  .palette-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .color-slot {
    position: relative;
    width: 36px; height: 36px;
  }

  .color-slot input[type=color] {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    border: 1px solid var(--border);
    padding: 2px;
    background: none;
    cursor: pointer;
    border-radius: 2px;
  }

  .color-slot input[type=color]:hover { border-color: var(--green); }

  .color-slot .remove-color {
    position: absolute;
    top: -5px; right: -5px;
    width: 14px; height: 14px;
    background: var(--red);
    border: none;
    color: #fff;
    font-size: 9px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    line-height: 1;
    z-index: 10;
  }

  .color-slot:hover .remove-color { display: flex; }

  .add-color-btn {
    width: 36px; height: 36px;
    border: 1px dashed var(--green-dim);
    background: none;
    color: var(--green-dim);
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s;
    border-radius: 2px;
  }

  .add-color-btn:hover { border-color: var(--green); color: var(--green); }

  /* Options */
  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .option-label { color: var(--text-dim); }

  select, input[type=range] {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    padding: 4px 8px;
    outline: none;
    cursor: pointer;
  }

  select:focus, select:hover { border-color: var(--green-dim); }

  input[type=range] {
    -webkit-appearance: none;
    width: 100px; height: 4px;
    padding: 0;
    background: var(--border);
    border: none;
  }

  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    background: var(--green);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 6px var(--green);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-dim);
    cursor: pointer;
    user-select: none;
  }

  .toggle {
    width: 28px; height: 14px;
    background: var(--border);
    border-radius: 7px;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle.on { background: var(--green-dim); }

  .toggle::after {
    content: '';
    position: absolute;
    width: 10px; height: 10px;
    background: var(--text-dim);
    border-radius: 50%;
    top: 2px; left: 2px;
    transition: all 0.2s;
  }

  .toggle.on::after {
    left: 16px;
    background: var(--green);
    box-shadow: 0 0 4px var(--green);
  }

  /* Process button */
  .process-btn {
    width: 100%;
    padding: 14px;
    background: none;
    border: 1px solid var(--green);
    color: var(--green);
    font-family: 'VT323', monospace;
    font-size: 26px;
    letter-spacing: 4px;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    position: relative;
    overflow: hidden;
  }

  .process-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--green);
    transform: translateX(-100%);
    transition: transform 0.2s;
    z-index: -1;
  }

  .process-btn:hover { color: var(--bg); }
  .process-btn:hover::before { transform: translateX(0); }
  .process-btn:disabled {
    border-color: var(--text-dim);
    color: var(--text-dim);
    cursor: not-allowed;
  }
  .process-btn:disabled::before { display: none; }

  /* Download */
  .download-btn {
    width: 100%;
    padding: 10px;
    background: none;
    border: 1px solid var(--amber);
    color: var(--amber);
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.15s;
    display: none;
  }

  .download-btn:hover { background: var(--amber); color: var(--bg); }

  /* ── MAIN CANVAS AREA ── */
  .main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .canvas-toolbar {
    border-bottom: 1px solid var(--border);
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 11px;
    color: var(--text-dim);
    flex-shrink: 0;
  }

  .view-toggle {
    display: flex;
    gap: 4px;
  }

  .view-btn {
    padding: 4px 12px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 1px;
    transition: all 0.1s;
  }

  .view-btn.active {
    border-color: var(--green);
    color: var(--green);
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .zoom-btn {
    padding: 4px 9px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.1s;
    line-height: 1;
  }

  .zoom-btn:hover { border-color: var(--green-dim); color: var(--text); }
  .zoom-btn.active { border-color: var(--green); color: var(--green); }

  .zoom-level {
    min-width: 42px;
    text-align: center;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--green);
    padding: 0 4px;
  }

  .info-bar { margin-left: auto; }

  .canvas-area {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 20px 20px;
    position: relative;
  }

  .canvas-area::-webkit-scrollbar { width: 6px; height: 6px; }
  .canvas-area::-webkit-scrollbar-track { background: var(--bg); }
  .canvas-area::-webkit-scrollbar-thumb { background: var(--green-dim); }

  canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
    box-shadow: 0 0 40px #000, 0 0 2px var(--green-dim);
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--text-dim);
  }

  .placeholder-icon {
    font-size: 64px;
    color: var(--border);
    font-family: 'VT323', monospace;
  }

  .placeholder p { font-size: 12px; letter-spacing: 2px; }

  /* Split view */
  .split-view {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 1px;
    background: var(--border);
  }

  .split-pane {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--bg);
    position: relative;
  }

  .split-pane-label {
    position: absolute;
    top: 10px; left: 10px;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--text-dim);
    background: #0a0c0a99;
    padding: 2px 8px;
  }

  .split-pane canvas, .split-pane img {
    max-width: 100%; max-height: 100%;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
  }

  #originalImg {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    max-width: 100%;
    max-height: 100%;
    display: block;
    box-shadow: 0 0 40px #000, 0 0 2px var(--green-dim);
  }

  /* Progress */
  .progress-overlay {
    display: none;
    position: absolute;
    inset: 0;
    background: #0a0c0acc;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    z-index: 100;
  }

  .progress-overlay.visible { display: flex; }

  .progress-text {
    font-family: 'VT323', monospace;
    font-size: 24px;
    color: var(--green);
    text-shadow: var(--glow);
  }

  .progress-bar-wrap {
    width: 280px;
    height: 6px;
    background: var(--border);
    border: 1px solid var(--green-dim);
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    transition: width 0.05s linear;
    width: 0%;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .zoom-btn {
    padding: 3px 9px;
    background: none;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    line-height: 1;
    transition: all 0.1s;
    user-select: none;
  }

  .zoom-btn:hover { border-color: var(--green-dim); color: var(--text); }
  .zoom-btn.active { border-color: var(--green); color: var(--green); }

  .zoom-level {
    min-width: 52px;
    text-align: center;
    padding: 3px 6px;
    border: 1px solid var(--border);
    color: var(--amber);
    font-size: 12px;
    letter-spacing: 1px;
    cursor: default;
  }


  .status-bar {
    border-top: 1px solid var(--border);
    padding: 6px 20px;
    font-size: 11px;
    color: var(--text-dim);
    display: flex;
    gap: 24px;
    flex-shrink: 0;
  }

  .status-bar span { letter-spacing: 1px; }
  .status-bar .ok { color: var(--green); }
  .status-bar .warn { color: var(--amber); }
</style>
</head>
<body>

<header class="header">
  <h1>PALETTIZER</h1>
  <span class="subtitle">// COLOUR QUANTIZATION TOOL</span>
  <span class="version">v1.0 &nbsp;|&nbsp; HTML+JS+PHP</span>
</header>

<div class="workspace">

  <!-- ── SIDEBAR ── -->
  <aside class="sidebar">

    <!-- Upload -->
    <div class="panel">
      <div class="panel-title">INPUT IMAGE</div>
      <div class="upload-zone" id="uploadZone">
        <input type="file" id="fileInput" accept="image/*">
        <span class="upload-icon">⊞</span>
        <p>CLICK OR DROP IMAGE</p>
        <p>PNG · GIF · JPG · BMP · WEBP</p>
        <div class="filename" id="fileName"></div>
      </div>
    </div>

    <!-- Preset palettes -->
    <div class="panel">
      <div class="panel-title">PRESET PALETTES</div>
      <div class="presets" id="presetList"></div>
    </div>

    <!-- Palette editor -->
    <div class="panel">
      <div class="panel-title">ACTIVE PALETTE</div>
      <div class="palette-grid" id="paletteGrid"></div>
    </div>

    <!-- Options -->
    <div class="panel">
      <div class="panel-title">OPTIONS</div>

      <div class="option-row">
        <span class="option-label">COLOUR SPACE</span>
        <select id="colourSpace">
          <option value="rgb" selected>RGB</option>
          <option value="lab">CIELAB (perceptual)</option>
        </select>
      </div>

      <div class="option-row">
        <span class="option-label">DITHER</span>
        <select id="ditherMode">
          <option value="none">NONE</option>
          <option value="floyd">FLOYD-STEINBERG</option>
          <option value="bayer2">BAYER 2×2</option>
          <option value="bayer4">BAYER 4×4</option>
          <option value="bayer8">BAYER 8×8</option>
        </select>
      </div>

      <div class="option-row" id="ditherStrengthRow" style="display:none">
        <span class="option-label">DITHER STRENGTH</span>
        <input type="range" id="ditherStrength" min="0" max="100" value="80">
      </div>

    </div>

    <!-- Actions -->
    <div class="panel">
      <button class="process-btn" id="processBtn" disabled>▶ APPLY PALETTE</button>
    </div>

    <div class="panel">
      <button class="download-btn" id="downloadBtn">↓ DOWNLOAD RESULT</button>
    </div>

  </aside>

  <!-- ── CANVAS AREA ── -->
  <main class="main">
    <div class="canvas-toolbar">
      <div class="view-toggle">
        <button class="view-btn active" onclick="setView('result')" id="vBtn-result">RESULT</button>
        <button class="view-btn" onclick="setView('original')" id="vBtn-original">ORIGINAL</button>
        <button class="view-btn" onclick="setView('split')" id="vBtn-split">SPLIT</button>
      </div>
      <div class="zoom-controls">
        <button class="zoom-btn" onclick="zoomStep(-1)" title="Zoom out">−</button>
        <span class="zoom-level" id="zoomLabel">FIT</span>
        <button class="zoom-btn" onclick="zoomStep(+1)" title="Zoom in">+</button>
        <button class="zoom-btn active" onclick="setZoom('fit')" id="zoomFitBtn" title="Fit to window">FIT</button>
        <button class="zoom-btn" onclick="setZoom(1)" id="zoom1Btn" title="Actual pixels">1×</button>
      </div>
      <span class="info-bar" id="infoBar"></span>
    </div>

    <div class="canvas-area" id="canvasArea">
      <div class="placeholder" id="placeholder">
        <div class="placeholder-icon">▒▒<br>▒▒</div>
        <p>NO IMAGE LOADED</p>
        <p style="font-size:11px">UPLOAD AN IMAGE TO BEGIN</p>
      </div>

      <!-- Views -->
      <canvas id="resultCanvas" style="display:none"></canvas>
      <img id="originalImg" style="display:none">
      <div class="split-view" id="splitView" style="display:none">
        <div class="split-pane">
          <span class="split-pane-label">ORIGINAL</span>
          <canvas id="splitOrigCanvas"></canvas>
        </div>
        <div class="split-pane">
          <span class="split-pane-label">PALETTIZED</span>
          <canvas id="splitResultCanvas"></canvas>
        </div>
      </div>

      <div class="progress-overlay" id="progressOverlay">
        <div class="progress-text" id="progressText">PROCESSING...</div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" id="progressFill"></div></div>
      </div>
    </div>

    <div class="status-bar">
      <span id="statusImg">IMAGE: —</span>
      <span id="statusPalette">PALETTE: —</span>
      <span id="statusColours">COLOURS: —</span>
      <span id="statusMsg" class="ok"></span>
    </div>
  </main>
</div>

<script>
// ════════════════════════════════════════════
//  PALETTES
// ════════════════════════════════════════════
const PRESETS = {
  "CGA MODE 1": ["#000000","#55ffff","#ff55ff","#ffffff"],
  "CGA MODE 2": ["#000000","#55ff55","#ff5555","#ffffff"],
  "EGA 16": [
    "#000000","#0000aa","#00aa00","#00aaaa",
    "#aa0000","#aa00aa","#aa5500","#aaaaaa",
    "#555555","#5555ff","#55ff55","#55ffff",
    "#ff5555","#ff55ff","#ffff55","#ffffff"
  ],
  "GAME BOY": ["#0f380f","#306230","#8bac0f","#9bbc0f"],
  "NES (56)": [
    "#7c7c7c","#0000fc","#0000bc","#4428bc","#940084","#a80020","#a81000","#881400",
    "#503000","#007800","#006800","#005800","#004058","#000000","#000000","#000000",
    "#bcbcbc","#0078f8","#0058f8","#6844fc","#d800cc","#e40058","#f83800","#e45c10",
    "#ac7c00","#00b800","#00a800","#00a844","#008888","#000000","#000000","#000000",
    "#f8f8f8","#3cbcfc","#6888fc","#9878f8","#f878f8","#f85898","#f87858","#fca044",
    "#f8b800","#b8f818","#58d854","#58f898","#00e8d8","#787878","#000000","#000000",
    "#fcfcfc","#a4e4fc","#b8b8f8","#d8b8f8","#f8b8f8","#f8a4c0","#f0d0b0","#fce0a8",
    "#f8d878","#d8f878","#b8f8b8","#b8f8d8","#00fcfc","#f8d8f8","#000000","#000000"
  ],
  "PICO-8": [
    "#000000","#1d2b53","#7e2553","#008751",
    "#ab5236","#5f574f","#c2c3c7","#fff1e8",
    "#ff004d","#ffa300","#ffec27","#00e436",
    "#29adff","#83769c","#ff77a8","#ffccaa"
  ],
  "COMMODORE 64": [
    "#000000","#ffffff","#88393a","#79c2c4",
    "#8a3f96","#55a049","#40318d","#bfce72",
    "#8b5429","#574200","#b86962","#505050",
    "#787878","#94d081","#7869c4","#9f9f9f"
  ],
  "MONO GREEN": ["#000000","#1a3a1a","#2d6e2d","#39ff4e"],
  "MONO AMBER": ["#000000","#3a2000","#a05000","#ffb800"],
  "2-BIT GREY":  ["#000000","#555555","#aaaaaa","#ffffff"],
  "GRUVBOX": [
    "#282828","#cc241d","#98971a","#d79921",
    "#458588","#b16286","#689d6a","#a89984",
    "#928374","#fb4934","#b8bb26","#fabd2f",
    "#83a598","#d3869b","#8ec07c","#ebdbb2"
  ],
  "CUSTOM": []
};

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let state = {
  srcImage: null,
  srcPixels: null,
  srcW: 0, srcH: 0,
  resultPixels: null,
  activePalette: [...PRESETS["EGA 16"]],
  activePreset: "EGA 16",
  view: 'result',
  zoom: 'fit'   // 'fit' | integer multiplier
};

// ════════════════════════════════════════════
//  UI INIT
// ════════════════════════════════════════════
function init() {
  buildPresets();
  selectPreset("EGA 16");
  setupUpload();
  document.getElementById('processBtn').addEventListener('click', processImage);
  document.getElementById('downloadBtn').addEventListener('click', downloadResult);
  document.getElementById('ditherMode').addEventListener('change', e => {
    document.getElementById('ditherStrengthRow').style.display =
      e.target.value === 'none' ? 'none' : 'flex';
    scheduleAutoProcess();
  });
  document.getElementById('colourSpace').addEventListener('change', scheduleAutoProcess);
  document.getElementById('ditherStrength').addEventListener('change', scheduleAutoProcess);

  // Mousewheel zoom on canvas area
  document.getElementById('canvasArea').addEventListener('wheel', e => {
    if (!state.srcImage) return;
    e.preventDefault();
    zoomStep(e.deltaY < 0 ? +1 : -1);
  }, { passive: false });
}

function buildPresets() {
  const list = document.getElementById('presetList');
  list.innerHTML = '';
  for (const [name, colors] of Object.entries(PRESETS)) {
    if (name === 'CUSTOM') continue;
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.preset = name;
    btn.innerHTML = `
      <span class="preset-name">${name}</span>
      <span class="preset-swatches">${colors.map(c =>
        `<span class="swatch-mini" style="background:${c}"></span>`).join('')}</span>
      <span style="color:var(--text-dim);font-size:11px">${colors.length}</span>
    `;
    btn.addEventListener('click', () => selectPreset(name));
    list.appendChild(btn);
  }
}

function selectPreset(name) {
  state.activePreset = name;
  if (PRESETS[name] && PRESETS[name].length > 0)
    state.activePalette = [...PRESETS[name]];
  document.querySelectorAll('.preset-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.preset === name));
  renderPaletteEditor();
  updateStatus();
  scheduleAutoProcess();
}

function renderPaletteEditor() {
  const grid = document.getElementById('paletteGrid');
  grid.innerHTML = '';
  state.activePalette.forEach((color, i) => {
    const slot = document.createElement('div');
    slot.className = 'color-slot';
    slot.innerHTML = `
      <input type="color" value="${color}" title="${color}">
      <button class="remove-color" title="Remove">×</button>
    `;
    slot.querySelector('input').addEventListener('input', e => {
      state.activePalette[i] = e.target.value;
      updateStatus();
      scheduleAutoProcess();
    });
    slot.querySelector('.remove-color').addEventListener('click', () => {
      state.activePalette.splice(i, 1);
      selectPreset('CUSTOM');
    });
    grid.appendChild(slot);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'add-color-btn';
  addBtn.textContent = '+';
  addBtn.title = 'Add colour';
  addBtn.addEventListener('click', () => {
    state.activePalette.push('#ffffff');
    selectPreset('CUSTOM');
  });
  grid.appendChild(addBtn);
}

function toggleOption(key) {
  state[key] = !state[key];
  const el = document.getElementById('toggle-' + key);
  if (el) el.classList.toggle('on', state[key]);
}

function setView(v) {
  state.view = v;
  document.querySelectorAll('.view-btn').forEach(b =>
    b.classList.toggle('active', b.id === 'vBtn-' + v));
  const rc = document.getElementById('resultCanvas');
  const oi = document.getElementById('originalImg');
  const sv = document.getElementById('splitView');
  rc.style.display = 'none';
  oi.style.display = 'none';
  sv.style.display = 'none';

  if (!state.srcImage) return;
  if (v === 'result') {
    rc.style.display = 'block';
  } else if (v === 'original') {
    oi.style.display = 'block';
  } else if (v === 'split') {
    sv.style.display = 'flex';
  }
}

// ════════════════════════════════════════════
//  FILE UPLOAD
// ════════════════════════════════════════════
function setupUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  input.addEventListener('change', e => {
    if (e.target.files[0]) loadFile(e.target.files[0]);
  });

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });
}

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      state.srcImage = img;
      state.srcW = img.naturalWidth;
      state.srcH = img.naturalHeight;

      // Extract source pixels
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const ctx = offscreen.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      state.srcPixels = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      state.resultPixels = null;

      // Set original img src
      const oi = document.getElementById('originalImg');
      oi.src = e.target.result;

      document.getElementById('fileName').textContent = file.name;
      document.getElementById('placeholder').style.display = 'none';
      document.getElementById('processBtn').disabled = false;
      document.getElementById('downloadBtn').style.display = 'none';
      document.getElementById('infoBar').textContent =
        `${img.naturalWidth} × ${img.naturalHeight}px`;

      setView('original');
      applyZoom();
      updateStatus();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════
//  COLOUR MATH
// ════════════════════════════════════════════

// sRGB → linear
function srgbToLinear(v) {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// linear RGB → XYZ (D65)
function rgbToXyz(r, g, b) {
  r = srgbToLinear(r); g = srgbToLinear(g); b = srgbToLinear(b);
  return [
    r*0.4124564 + g*0.3575761 + b*0.1804375,
    r*0.2126729 + g*0.7151522 + b*0.0721750,
    r*0.0193339 + g*0.1191920 + b*0.9503041
  ];
}

function xyzToLab([x, y, z]) {
  const ref = [0.95047, 1.0, 1.08883];
  function f(t) { return t > 0.008856 ? Math.cbrt(t) : 7.787*t + 16/116; }
  const fx = f(x/ref[0]), fy = f(y/ref[1]), fz = f(z/ref[2]);
  return [116*fy - 16, 500*(fx-fy), 200*(fy-fz)];
}

function rgbToLab(r, g, b) { return xyzToLab(rgbToXyz(r, g, b)); }

function hexToRgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

function buildPaletteCache(palette, space) {
  return palette.map(hex => {
    const [r,g,b] = hexToRgb(hex);
    const metric = space === 'lab' ? rgbToLab(r,g,b) : [r,g,b];
    return { r, g, b, metric };
  });
}

function nearestColor(r, g, b, cache, space) {
  const query = space === 'lab' ? rgbToLab(r,g,b) : [r,g,b];
  let best = null, bestDist = Infinity;
  for (const c of cache) {
    const dr = query[0]-c.metric[0], dg = query[1]-c.metric[1], db = query[2]-c.metric[2];
    const d = dr*dr + dg*dg + db*db;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// Bayer matrices
const BAYER = {
  bayer2: [[0,2],[3,1]],
  bayer4: [
    [ 0, 8, 2,10],[ 12, 4,14, 6],
    [ 3,11, 1, 9],[15, 7,13, 5]
  ],
  bayer8: [
    [ 0,32, 8,40, 2,34,10,42],[48,16,56,24,50,18,58,26],
    [12,44, 4,36,14,46, 6,38],[60,28,52,20,62,30,54,22],
    [ 3,35,11,43, 1,33, 9,41],[51,19,59,27,49,17,57,25],
    [15,47, 7,39,13,45, 5,37],[63,31,55,23,61,29,53,21]
  ]
};

// ════════════════════════════════════════════
//  CORE PROCESSING  (async + progress)
// ════════════════════════════════════════════
let _processing = false;

async function processImage() {
  if (!state.srcPixels || state.activePalette.length === 0) return;
  if (_processing) return;
  _processing = true;

  const space = document.getElementById('colourSpace').value;
  const dither = document.getElementById('ditherMode').value;
  const strength = document.getElementById('ditherStrength').value / 100;

  showProgress(true);
  setProgress(0, 'BUILDING COLOUR CACHE...');

  // yield to browser
  await sleep(30);

  const cache = buildPaletteCache(state.activePalette, space);
  const src = state.srcPixels;
  const W = src.width, H = src.height;

  // Work on a copy of the data
  const data = new Float32Array(src.data); // float for dither error accumulation
  const out = new Uint8ClampedArray(W * H * 4);

  setProgress(2, 'MAPPING COLOURS...');

  const CHUNK = 4000; // rows per async chunk
  let row = 0;

  while (row < H) {
    const endRow = Math.min(row + CHUNK, H);

    if (dither === 'floyd') {
      // Floyd-Steinberg (must go row by row, can't fully chunk independently)
      for (let y = row; y < endRow; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const or = Math.max(0, Math.min(255, data[idx]));
          const og = Math.max(0, Math.min(255, data[idx+1]));
          const ob = Math.max(0, Math.min(255, data[idx+2]));
          const oa = src.data[idx+3];

          const nc = nearestColor(or, og, ob, cache, space);
          out[idx] = nc.r; out[idx+1] = nc.g; out[idx+2] = nc.b; out[idx+3] = oa;

          // Distribute error
          const s = strength;
          const er = (or - nc.r) * s, eg = (og - nc.g) * s, eb = (ob - nc.b) * s;

          if (x+1 < W) {
            data[idx+4] += er * 7/16;
            data[idx+5] += eg * 7/16;
            data[idx+6] += eb * 7/16;
          }
          if (y+1 < H) {
            if (x-1 >= 0) {
              const n = ((y+1)*W + (x-1))*4;
              data[n] += er * 3/16; data[n+1] += eg * 3/16; data[n+2] += eb * 3/16;
            }
            const n2 = ((y+1)*W + x)*4;
            data[n2] += er * 5/16; data[n2+1] += eg * 5/16; data[n2+2] += eb * 5/16;
            if (x+1 < W) {
              const n3 = ((y+1)*W + (x+1))*4;
              data[n3] += er * 1/16; data[n3+1] += eg * 1/16; data[n3+2] += eb * 1/16;
            }
          }
        }
      }
    } else if (dither.startsWith('bayer')) {
      const matrix = BAYER[dither];
      const mSize = matrix.length;
      const mMax = mSize * mSize;
      for (let y = row; y < endRow; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const threshold = ((matrix[y % mSize][x % mSize] / mMax) - 0.5) * strength * 255;
          const r = Math.max(0, Math.min(255, src.data[idx]   + threshold));
          const g = Math.max(0, Math.min(255, src.data[idx+1] + threshold));
          const b = Math.max(0, Math.min(255, src.data[idx+2] + threshold));
          const nc = nearestColor(r, g, b, cache, space);
          out[idx] = nc.r; out[idx+1] = nc.g; out[idx+2] = nc.b; out[idx+3] = src.data[idx+3];
        }
      }
    } else {
      // No dither
      for (let y = row; y < endRow; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const nc = nearestColor(src.data[idx], src.data[idx+1], src.data[idx+2], cache, space);
          out[idx] = nc.r; out[idx+1] = nc.g; out[idx+2] = nc.b; out[idx+3] = src.data[idx+3];
        }
      }
    }

    row = endRow;
    const pct = Math.round((row / H) * 95) + 2;
    setProgress(pct, `PROCESSING ROW ${row}/${H}...`);
    await sleep(0);
  }

  setProgress(98, 'RENDERING...');
  await sleep(10);

  state.resultPixels = new ImageData(out, W, H);
  renderResultCanvas();
  renderSplitCanvases();
  applyZoom();

  showProgress(false);
  setView('result');

  document.getElementById('downloadBtn').style.display = 'block';
  const unique = countUniqueColours(out);
  document.getElementById('statusMsg').textContent = `✓ DONE — ${unique} UNIQUE COLOURS IN OUTPUT`;
  document.getElementById('statusColours').textContent = `COLOURS: ${unique}`;

  _processing = false;
}

function countUniqueColours(data) {
  const s = new Set();
  for (let i = 0; i < data.length; i += 4)
    if (data[i+3] > 0) s.add((data[i] << 16) | (data[i+1] << 8) | data[i+2]);
  return s.size;
}

function renderResultCanvas() {
  const c = document.getElementById('resultCanvas');
  c.width = state.resultPixels.width;
  c.height = state.resultPixels.height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(state.resultPixels, 0, 0);
}

function renderSplitCanvases() {
  // original side
  const so = document.getElementById('splitOrigCanvas');
  so.width = state.srcW; so.height = state.srcH;
  const soCtx = so.getContext('2d');
  soCtx.imageSmoothingEnabled = false;
  soCtx.drawImage(state.srcImage, 0, 0);
  // result side
  if (state.resultPixels) {
    const sr = document.getElementById('splitResultCanvas');
    sr.width = state.resultPixels.width; sr.height = state.resultPixels.height;
    const srCtx = sr.getContext('2d');
    srCtx.imageSmoothingEnabled = false;
    srCtx.putImageData(state.resultPixels, 0, 0);
  }
}

// ════════════════════════════════════════════
//  DOWNLOAD
// ════════════════════════════════════════════
function downloadResult() {
  const c = document.getElementById('resultCanvas');
  const a = document.createElement('a');
  a.download = 'palettized.png';
  a.href = c.toDataURL('image/png');
  a.click();
}

// ════════════════════════════════════════════
//  PROGRESS / STATUS
// ════════════════════════════════════════════
function showProgress(v) {
  document.getElementById('progressOverlay').classList.toggle('visible', v);
}
function setProgress(pct, msg) {
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = msg;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateStatus() {
  if (state.srcImage)
    document.getElementById('statusImg').textContent =
      `IMAGE: ${state.srcW}×${state.srcH}px`;
  document.getElementById('statusPalette').textContent =
    `PALETTE: ${state.activePreset}`;
  document.getElementById('statusColours').textContent =
    `COLOURS: ${state.activePalette.length}`;
}

// ════════════════════════════════════════════
//  ZOOM
// ════════════════════════════════════════════
const ZOOM_STEPS = [1, 2, 4, 6, 8, 12, 16, 24, 32];

function setZoom(z) {
  state.zoom = z;
  applyZoom();
}

function zoomStep(dir) {
  if (state.zoom === 'fit') {
    // Find the nearest natural step from current fit scale
    const fitScale = getFitScale();
    const nearest = ZOOM_STEPS.reduce((a, b) =>
      Math.abs(b - fitScale) < Math.abs(a - fitScale) ? b : a);
    const idx = ZOOM_STEPS.indexOf(nearest);
    const next = dir > 0 ? Math.min(idx + 1, ZOOM_STEPS.length - 1) : Math.max(idx - 1, 0);
    state.zoom = ZOOM_STEPS[next];
  } else {
    const idx = ZOOM_STEPS.indexOf(state.zoom);
    if (idx === -1) {
      // snap to nearest
      state.zoom = ZOOM_STEPS[dir > 0 ? ZOOM_STEPS.length - 1 : 0];
    } else {
      const next = dir > 0 ? Math.min(idx + 1, ZOOM_STEPS.length - 1) : Math.max(idx - 1, 0);
      state.zoom = ZOOM_STEPS[next];
    }
  }
  applyZoom();
}

function getFitScale() {
  if (!state.srcW || !state.srcH) return 1;
  const area = document.getElementById('canvasArea');
  const aw = area.clientWidth - 32, ah = area.clientHeight - 32;
  return Math.min(aw / state.srcW, ah / state.srcH);
}

function applyZoom() {
  const isFit = state.zoom === 'fit';
  const label = document.getElementById('zoomLabel');
  label.textContent = isFit ? 'FIT' : state.zoom + '×';

  document.getElementById('zoomFitBtn').classList.toggle('active', isFit);
  document.getElementById('zoom1Btn').classList.toggle('active', state.zoom === 1);

  const targets = [
    document.getElementById('resultCanvas'),
    document.getElementById('originalImg'),
    document.getElementById('splitOrigCanvas'),
    document.getElementById('splitResultCanvas')
  ];

  const area = document.getElementById('canvasArea');

  if (isFit) {
    targets.forEach(el => {
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '100%';
      el.style.maxHeight = '100%';
    });
    area.style.alignItems     = 'center';
    area.style.justifyContent = 'center';
    area.style.padding        = '16px';
    document.querySelectorAll('.split-pane').forEach(p => {
      p.style.overflow        = 'hidden';
      p.style.alignItems      = 'center';
      p.style.justifyContent  = 'center';
    });
  } else {
    const z = state.zoom;
    const W = state.srcW * z, H = state.srcH * z;
    targets.forEach(el => {
      el.style.maxWidth  = 'none';
      el.style.maxHeight = 'none';
      el.style.width     = W + 'px';
      el.style.height    = H + 'px';
    });
    const tooBigW = W > area.clientWidth  - 32;
    const tooBigH = H > area.clientHeight - 32;
    area.style.alignItems     = tooBigH ? 'flex-start' : 'center';
    area.style.justifyContent = tooBigW ? 'flex-start' : 'center';
    area.style.padding        = '16px';
    document.querySelectorAll('.split-pane').forEach(p => {
      p.style.overflow       = 'auto';
      p.style.alignItems     = tooBigH ? 'flex-start' : 'center';
      p.style.justifyContent = tooBigW ? 'flex-start' : 'center';
    });
  }
}

// ════════════════════════════════════════════
//  AUTO-PROCESS (debounced)
// ════════════════════════════════════════════
let _autoTimer = null;
function scheduleAutoProcess() {
  if (!state.srcImage) return;
  clearTimeout(_autoTimer);
  _autoTimer = setTimeout(async () => {
    if (_processing) {
      // Another run is active — re-queue once it's done
      scheduleAutoProcess();
      return;
    }
    await processImage();
  }, 80);
}

// ════════════════════════════════════════════
init();
</script>
</body>
</html>
