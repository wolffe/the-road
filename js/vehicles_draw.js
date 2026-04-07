/**
 * Procedural top-down vehicle art (canvas paths). Scales with each car's width/length from js/cars.js.
 * Coordinate system: origin at vehicle center; front is -Y, rear is +Y (matches main drawCar).
 */
(function () {
    'use strict';

    function parseColor(hex) {
        if (!hex || typeof hex !== 'string') return { r: 110, g: 110, b: 110 };
        let h = hex.replace('#', '');
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        return {
            r: parseInt(h.slice(0, 2), 16) || 110,
            g: parseInt(h.slice(2, 4), 16) || 110,
            b: parseInt(h.slice(4, 6), 16) || 110,
        };
    }

    function rgb(c, a) {
        if (a !== undefined) return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
        return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    }

    function shade(c, factor) {
        return {
            r: Math.min(255, Math.round(c.r * factor)),
            g: Math.min(255, Math.round(c.g * factor)),
            b: Math.min(255, Math.round(c.b * factor)),
        };
    }

    function lw(ctx, w, l) {
        return Math.max(1, Math.min(w, l) * 0.045);
    }

    function strokeOutline(ctx, w, l) {
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l);
        ctx.stroke();
    }

    function wheel(ctx, cx, cy, rw, rh) {
        ctx.fillStyle = '#101010';
        ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
        ctx.fillStyle = '#282828';
        ctx.fillRect(cx - rw * 0.35, cy - rh * 0.35, rw * 0.7, rh * 0.4);
    }

    function drawRust(ctx, w, l) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(130, 70, 40, 0.45)';
        ctx.fillRect(-w * 0.35, -l * 0.2, w * 0.22, l * 0.14);
        ctx.fillRect(w * 0.08, l * 0.05, w * 0.25, l * 0.1);
        ctx.fillStyle = 'rgba(90, 50, 30, 0.35)';
        ctx.fillRect(-w * 0.15, l * 0.18, w * 0.18, l * 0.08);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(-w * 0.42, -l * 0.35, w * 0.12, l * 0.06);
        ctx.restore();
    }

    function resolveId(id) {
        if (typeof LEGACY_CAR_ID_MAP !== 'undefined' && LEGACY_CAR_ID_MAP[id]) {
            return LEGACY_CAR_ID_MAP[id];
        }
        return id;
    }

    function bumpers(ctx, wm, l, gray) {
        ctx.fillStyle = gray;
        ctx.fillRect(-wm * 0.48, -l * 0.5, wm * 0.96, Math.max(2, l * 0.055));
        ctx.fillRect(-wm * 0.48, l * 0.5 - Math.max(2, l * 0.055), wm * 0.96, Math.max(2, l * 0.055));
    }

    /**
     * Lada 2101-class top-down: boxy hull, flat “chrome” grille bar, round lamps,
     * tall rear deck (boot), squared cabin — reads more like the real car than a smooth jellybean.
     */
    function drawLada(ctx, w, l, base, opts) {
        const wm = w * 0.98;
        const dark = shade(base, 0.68);
        const roof = shade(base, 0.58);
        const chrome = rgb(parseColor('#c8c8d0'));
        const grille = '#1a1e24';
        const lamp = 'rgba(255, 248, 220, 0.95)';
        const rw = Math.max(2.5, w * 0.15);
        const rh = Math.max(3, l * 0.1);
        wheel(ctx, -wm * 0.44, -l * 0.28, rw, rh);
        wheel(ctx, wm * 0.44, -l * 0.28, rw, rh);
        wheel(ctx, -wm * 0.44, l * 0.34, rw, rh);
        wheel(ctx, wm * 0.44, l * 0.34, rw, rh);

        // Main body: boxy with subtle corner chamfers (Zhiguli slab sides)
        ctx.beginPath();
        ctx.moveTo(-wm * 0.45, l * 0.48);
        ctx.lineTo(wm * 0.45, l * 0.48);
        ctx.lineTo(wm * 0.48, l * 0.38);
        ctx.lineTo(wm * 0.48, l * 0.12);
        ctx.lineTo(wm * 0.46, -l * 0.08);
        ctx.lineTo(wm * 0.4, -l * 0.38);
        ctx.lineTo(wm * 0.22, -l * 0.49);
        ctx.lineTo(-wm * 0.22, -l * 0.49);
        ctx.lineTo(-wm * 0.4, -l * 0.38);
        ctx.lineTo(-wm * 0.46, -l * 0.08);
        ctx.lineTo(-wm * 0.48, l * 0.12);
        ctx.lineTo(-wm * 0.48, l * 0.38);
        ctx.closePath();
        ctx.fillStyle = rgb(base);
        ctx.fill();
        strokeOutline(ctx, w, l);

        // Tall boot / rear deck (darker panel)
        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-wm * 0.4, l * 0.14, wm * 0.8, l * 0.3);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l) * 0.65;
        ctx.strokeRect(-wm * 0.4, l * 0.14, wm * 0.8, l * 0.3);

        // Cabin / roof block (set forward — classic short-hood Lada proportion)
        ctx.fillStyle = rgb(roof);
        ctx.fillRect(-wm * 0.37, -l * 0.32, wm * 0.74, l * 0.38);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l);
        ctx.strokeRect(-wm * 0.37, -l * 0.32, wm * 0.74, l * 0.38);

        // Windscreen + side glass (single readable band)
        ctx.fillStyle = 'rgba(28,34,44,0.92)';
        ctx.fillRect(-wm * 0.33, -l * 0.28, wm * 0.66, l * 0.12);
        ctx.fillRect(-wm * 0.32, -l * 0.12, wm * 0.2, l * 0.14);
        ctx.fillRect(wm * 0.12, -l * 0.12, wm * 0.2, l * 0.14);
        // Rear window on boot
        ctx.fillRect(-wm * 0.28, l * 0.2, wm * 0.56, l * 0.1);

        // Front grille bar (signature horizontal chrome)
        ctx.fillStyle = chrome;
        ctx.fillRect(-wm * 0.32, -l * 0.46, wm * 0.64, Math.max(1.5, l * 0.045));
        ctx.fillStyle = grille;
        ctx.fillRect(-wm * 0.26, -l * 0.44, wm * 0.52, Math.max(1, l * 0.028));

        // Round twin headlights
        const lr = Math.max(1.8, w * 0.07);
        ctx.fillStyle = lamp;
        ctx.beginPath();
        ctx.arc(-wm * 0.28, -l * 0.42, lr, 0, Math.PI * 2);
        ctx.arc(wm * 0.28, -l * 0.42, lr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l) * 0.55;
        ctx.stroke();

        // Bumpers (steel, slightly proud)
        bumpers(ctx, wm, l, chrome);

        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Wider sedan — Volga */
    function drawGaz24(ctx, w, l, base, opts) {
        const wm = w * 1.02;
        const dark = shade(base, 0.78);
        const chrome = rgb(parseColor('#b8b8c0'));
        const rw = Math.max(2.5, w * 0.16);
        const rh = Math.max(3, l * 0.1);
        wheel(ctx, -wm * 0.43, -l * 0.3, rw, rh);
        wheel(ctx, wm * 0.43, -l * 0.3, rw, rh);
        wheel(ctx, -wm * 0.43, l * 0.33, rw, rh);
        wheel(ctx, wm * 0.43, l * 0.33, rw, rh);

        ctx.beginPath();
        ctx.moveTo(-wm * 0.48, l * 0.47);
        ctx.lineTo(wm * 0.48, l * 0.47);
        ctx.lineTo(wm * 0.52, l * 0.08);
        ctx.lineTo(wm * 0.45, -l * 0.24);
        ctx.lineTo(wm * 0.2, -l * 0.44);
        ctx.lineTo(-wm * 0.2, -l * 0.44);
        ctx.lineTo(-wm * 0.45, -l * 0.24);
        ctx.lineTo(-wm * 0.52, l * 0.08);
        ctx.closePath();
        ctx.fillStyle = rgb(base);
        ctx.fill();
        strokeOutline(ctx, w, l);

        ctx.beginPath();
        ctx.moveTo(-wm * 0.4, -l * 0.04);
        ctx.lineTo(wm * 0.4, -l * 0.04);
        ctx.lineTo(wm * 0.38, l * 0.24);
        ctx.lineTo(-wm * 0.38, l * 0.24);
        ctx.closePath();
        ctx.fillStyle = rgb(dark);
        ctx.fill();
        strokeOutline(ctx, w, l);

        ctx.fillStyle = 'rgba(28,32,40,0.92)';
        ctx.fillRect(-wm * 0.36, -l * 0.26, wm * 0.72, l * 0.15);
        ctx.fillRect(-wm * 0.32, l * 0.04, wm * 0.64, l * 0.1);
        bumpers(ctx, wm, l, chrome);
        ctx.fillStyle = chrome;
        ctx.fillRect(-wm * 0.35, -l * 0.48, wm * 0.7, Math.max(1, l * 0.025));

        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Boxy SUV */
    function drawUaz(ctx, w, l, base, opts) {
        const dark = shade(base, 0.68);
        const gray = rgb(parseColor('#6a6a72'));
        const rw = Math.max(2.5, w * 0.16);
        const rh = Math.max(3, l * 0.11);
        wheel(ctx, -w * 0.44, -l * 0.28, rw, rh);
        wheel(ctx, w * 0.44, -l * 0.28, rw, rh);
        wheel(ctx, -w * 0.44, l * 0.3, rw, rh);
        wheel(ctx, w * 0.44, l * 0.3, rw, rh);

        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.48, -l * 0.38, w * 0.96, l * 0.82);
        strokeOutline(ctx, w, l);

        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.42, -l * 0.42, w * 0.84, l * 0.38);
        strokeOutline(ctx, w, l);

        ctx.fillStyle = 'rgba(30,36,44,0.92)';
        ctx.fillRect(-w * 0.38, -l * 0.38, w * 0.76, l * 0.16);
        ctx.fillRect(-w * 0.36, l * 0.02, w * 0.72, l * 0.14);

        ctx.beginPath();
        ctx.arc(w * 0.35, l * 0.38, Math.max(2, w * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l);
        ctx.stroke();

        bumpers(ctx, w, l, gray);
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Pickup: cab + open bed */
    function drawHilux(ctx, w, l, base, opts) {
        const dark = shade(base, 0.75);
        const bed = shade(base, 0.5);
        const rw = Math.max(2.5, w * 0.15);
        const rh = Math.max(3, l * 0.1);
        const split = -l * 0.02;
        wheel(ctx, -w * 0.42, -l * 0.32, rw, rh);
        wheel(ctx, w * 0.42, -l * 0.32, rw, rh);
        wheel(ctx, -w * 0.42, l * 0.34, rw, rh);
        wheel(ctx, w * 0.42, l * 0.34, rw, rh);

        ctx.beginPath();
        ctx.moveTo(-w * 0.44, split);
        ctx.lineTo(w * 0.44, split);
        ctx.lineTo(w * 0.46, -l * 0.38);
        ctx.lineTo(w * 0.22, -l * 0.48);
        ctx.lineTo(-w * 0.22, -l * 0.48);
        ctx.lineTo(-w * 0.46, -l * 0.38);
        ctx.closePath();
        ctx.fillStyle = rgb(base);
        ctx.fill();
        strokeOutline(ctx, w, l);

        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.36, -l * 0.32, w * 0.72, l * 0.2);
        ctx.fillStyle = 'rgba(28,34,42,0.9)';
        ctx.fillRect(-w * 0.32, -l * 0.28, w * 0.64, l * 0.12);

        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.48, split, w * 0.96, l * 0.48);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l);
        ctx.strokeRect(-w * 0.48, split, w * 0.96, l * 0.48);

        ctx.fillStyle = rgb(bed);
        ctx.fillRect(-w * 0.4, split + l * 0.06, w * 0.8, l * 0.32);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l) * 0.7;
        ctx.beginPath();
        ctx.moveTo(-w * 0.46, split + 2);
        ctx.lineTo(w * 0.46, split + 2);
        ctx.stroke();

        bumpers(ctx, w, l, rgb(parseColor('#888')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Tall van — loaf shape: deeper hood, shorter cargo read, still within ±l/2 for lights/bumpers */
    function drawVan(ctx, w, l, base, opts) {
        const halfL = l * 0.5;
        const dark = shade(base, 0.72);
        const rw = Math.max(2.5, w * 0.14);
        const rh = Math.max(3, l * 0.09);
        wheel(ctx, -w * 0.45, -l * 0.3, rw, rh);
        wheel(ctx, w * 0.45, -l * 0.3, rw, rh);
        wheel(ctx, -w * 0.45, l * 0.3, rw, rh);
        wheel(ctx, w * 0.45, l * 0.3, rw, rh);

        const hoodDepth = l * 0.15;
        const hoodBaseY = -halfL + hoodDepth;
        ctx.beginPath();
        ctx.moveTo(-w * 0.38, hoodBaseY);
        ctx.lineTo(w * 0.38, hoodBaseY);
        ctx.lineTo(w * 0.44, -halfL);
        ctx.lineTo(-w * 0.44, -halfL);
        ctx.closePath();
        ctx.fillStyle = rgb(shade(base, 0.85));
        ctx.fill();
        strokeOutline(ctx, w, l);

        const bodyH = halfL - hoodBaseY;
        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.49, hoodBaseY, w * 0.98, bodyH);
        strokeOutline(ctx, w, l);

        const rearBand = l * 0.08;
        const darkTop = hoodBaseY + l * 0.03;
        const darkH = Math.max(l * 0.2, halfL - rearBand - darkTop);
        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.44, darkTop, w * 0.88, darkH);
        strokeOutline(ctx, w, l);

        ctx.fillStyle = 'rgba(32,38,48,0.9)';
        ctx.fillRect(-w * 0.4, hoodBaseY + l * 0.02, w * 0.3, l * 0.11);
        ctx.fillRect(w * 0.1, hoodBaseY + l * 0.02, w * 0.3, l * 0.11);
        const midWinY = hoodBaseY + darkH * 0.45;
        ctx.fillRect(-w * 0.4, midWinY, w * 0.8, l * 0.09);
        ctx.fillRect(-w * 0.32, halfL - l * 0.11, w * 0.64, l * 0.06);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(w * 0.18, hoodBaseY + l * 0.02, Math.max(2, w * 0.06), l * 0.16);

        bumpers(ctx, w, l, rgb(parseColor('#777')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Medium military truck */
    function drawGaz66(ctx, w, l, base, opts) {
        const dark = shade(base, 0.68);
        const bed = shade(base, 0.55);
        const cabEnd = -l * 0.08;
        const rw = Math.max(3, w * 0.14);
        const rh = Math.max(3.5, l * 0.09);
        wheel(ctx, -w * 0.46, -l * 0.32, rw, rh);
        wheel(ctx, w * 0.46, -l * 0.32, rw, rh);
        wheel(ctx, -w * 0.46, l * 0.34, rw, rh);
        wheel(ctx, w * 0.46, l * 0.34, rw, rh);

        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.42, -l * 0.45, w * 0.84, cabEnd + l * 0.45);
        strokeOutline(ctx, w, l);
        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.36, -l * 0.4, w * 0.72, l * 0.22);
        ctx.fillStyle = 'rgba(30,36,44,0.9)';
        ctx.fillRect(-w * 0.32, -l * 0.36, w * 0.64, l * 0.12);

        ctx.fillStyle = rgb(bed);
        ctx.fillRect(-w * 0.46, cabEnd, w * 0.92, l * 0.52);
        strokeOutline(ctx, w, l);
        ctx.fillStyle = 'rgba(20,24,28,0.5)';
        ctx.fillRect(-w * 0.38, cabEnd + l * 0.08, w * 0.76, l * 0.36);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = lw(ctx, w, l) * 0.65;
        for (let i = 0; i < 3; i++) {
            const yy = cabEnd + l * (0.12 + i * 0.14);
            ctx.beginPath();
            ctx.moveTo(-w * 0.44, yy);
            ctx.lineTo(w * 0.44, yy);
            ctx.stroke();
        }

        bumpers(ctx, w, l, rgb(parseColor('#555')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Heavy truck + long bed */
    function drawUral(ctx, w, l, base, opts) {
        const dark = shade(base, 0.66);
        const bed = shade(base, 0.52);
        const cabEnd = -l * 0.22;
        const rw = Math.max(3.5, w * 0.11);
        const rh = Math.max(4, l * 0.065);
        const ax = w * 0.44;
        wheel(ctx, -ax, -l * 0.38, rw, rh);
        wheel(ctx, ax, -l * 0.38, rw, rh);
        wheel(ctx, -ax, -l * 0.05, rw, rh);
        wheel(ctx, ax, -l * 0.05, rw, rh);
        wheel(ctx, -ax, l * 0.28, rw * 1.15, rh);
        wheel(ctx, ax, l * 0.28, rw * 1.15, rh);
        wheel(ctx, -ax, l * 0.42, rw * 1.15, rh);
        wheel(ctx, ax, l * 0.42, rw * 1.15, rh);

        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.44, -l * 0.48, w * 0.88, cabEnd + l * 0.48);
        strokeOutline(ctx, w, l);
        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.38, -l * 0.44, w * 0.76, l * 0.2);
        ctx.fillStyle = 'rgba(28,34,42,0.9)';
        ctx.fillRect(-w * 0.34, -l * 0.4, w * 0.68, l * 0.1);

        ctx.fillStyle = rgb(bed);
        ctx.fillRect(-w * 0.48, cabEnd, w * 0.96, l * 0.72);
        strokeOutline(ctx, w, l);
        ctx.fillStyle = 'rgba(18,22,26,0.45)';
        ctx.fillRect(-w * 0.4, cabEnd + l * 0.06, w * 0.8, l * 0.56);

        ctx.fillStyle = rgb(shade(base, 0.8));
        ctx.beginPath();
        ctx.arc(-w * 0.52, -l * 0.15, w * 0.08, 0, Math.PI * 2);
        ctx.fill();
        strokeOutline(ctx, w, l);

        bumpers(ctx, w, l, rgb(parseColor('#444')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /**
     * Renault VAB–class 8×8 IFV from above: flat wide glacis (not a single-nose “beetle”),
     * driver periscope strip, shallow wedge front, box hull, offset one-man turret.
     */
    function drawVab(ctx, w, l, base, opts) {
        const dark = shade(base, 0.58);
        const glacis = shade(base, 0.72);
        const rw = Math.max(3, w * 0.13);
        const rh = Math.max(3.5, l * 0.085);
        wheel(ctx, -w * 0.46, -l * 0.28, rw, rh);
        wheel(ctx, w * 0.46, -l * 0.28, rw, rh);
        wheel(ctx, -w * 0.46, l * 0.32, rw, rh);
        wheel(ctx, w * 0.46, l * 0.32, rw, rh);

        const fy = -l * 0.48;
        const fBevel = -l * 0.38;
        const shoulder = -l * 0.22;

        ctx.beginPath();
        ctx.moveTo(-w * 0.42, l * 0.46);
        ctx.lineTo(w * 0.42, l * 0.46);
        ctx.lineTo(w * 0.46, l * 0.12);
        ctx.lineTo(w * 0.46, shoulder);
        ctx.lineTo(w * 0.4, fBevel);
        ctx.lineTo(w * 0.34, fy);
        ctx.lineTo(-w * 0.34, fy);
        ctx.lineTo(-w * 0.4, fBevel);
        ctx.lineTo(-w * 0.46, shoulder);
        ctx.lineTo(-w * 0.46, l * 0.12);
        ctx.closePath();
        ctx.fillStyle = rgb(base);
        ctx.fill();
        strokeOutline(ctx, w, l);

        ctx.fillStyle = rgb(glacis);
        ctx.beginPath();
        ctx.moveTo(-w * 0.32, fy + l * 0.04);
        ctx.lineTo(w * 0.32, fy + l * 0.04);
        ctx.lineTo(w * 0.38, fBevel + l * 0.02);
        ctx.lineTo(-w * 0.38, fBevel + l * 0.02);
        ctx.closePath();
        ctx.fill();
        strokeOutline(ctx, w, l);

        ctx.fillStyle = 'rgba(22,26,32,0.92)';
        const visY = fy + l * 0.06;
        const visH = Math.max(2, l * 0.05);
        ctx.fillRect(-w * 0.28, visY, w * 0.14, visH);
        ctx.fillRect(-w * 0.06, visY, w * 0.12, visH);
        ctx.fillRect(w * 0.14, visY, w * 0.14, visH);

        ctx.fillStyle = 'rgba(255,220,120,0.35)';
        ctx.fillRect(-w * 0.26, visY + visH * 0.2, w * 0.08, visH * 0.5);
        ctx.fillRect(w * 0.18, visY + visH * 0.2, w * 0.08, visH * 0.5);

        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.4, -l * 0.06, w * 0.8, l * 0.36);
        strokeOutline(ctx, w, l);
        ctx.fillStyle = 'rgba(40,48,56,0.95)';
        ctx.fillRect(-w * 0.3, -l * 0.18, w * 0.6, l * 0.08);
        ctx.fillRect(-w * 0.26, l * 0.04, w * 0.52, l * 0.07);

        const tx = w * 0.14;
        const ty = -l * 0.08;
        ctx.fillStyle = rgb(shade(base, 0.5));
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(2.5, w * 0.11), 0, Math.PI * 2);
        ctx.fill();
        strokeOutline(ctx, w, l);
        ctx.fillStyle = '#1a2218';
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(1.5, w * 0.05), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rgb(shade(base, 0.45));
        ctx.fillRect(-w * 0.48, l * 0.08, w * 0.07, l * 0.22);
        ctx.fillRect(w * 0.41, l * 0.08, w * 0.07, l * 0.22);

        bumpers(ctx, w, l, rgb(parseColor('#3a3a3a')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    /** Long bus */
    function drawBus(ctx, w, l, base, opts) {
        const dark = shade(base, 0.7);
        const rw = Math.max(2.5, w * 0.12);
        const rh = Math.max(3, l * 0.055);
        const y1 = -l * 0.38;
        const y2 = 0;
        const y3 = l * 0.38;
        wheel(ctx, -w * 0.46, y1, rw, rh);
        wheel(ctx, w * 0.46, y1, rw, rh);
        wheel(ctx, -w * 0.46, y2, rw, rh);
        wheel(ctx, w * 0.46, y2, rw, rh);
        wheel(ctx, -w * 0.46, y3, rw, rh);
        wheel(ctx, w * 0.46, y3, rw, rh);

        ctx.fillStyle = rgb(base);
        ctx.fillRect(-w * 0.49, -l * 0.49, w * 0.98, l * 0.98);
        strokeOutline(ctx, w, l);

        ctx.fillStyle = rgb(dark);
        ctx.fillRect(-w * 0.44, -l * 0.42, w * 0.88, l * 0.84);
        strokeOutline(ctx, w, l);

        ctx.fillStyle = 'rgba(24,30,38,0.92)';
        const winW = w * 0.16;
        const gap = w * 0.04;
        const startX = -w * 0.42;
        for (let row = 0; row < 3; row++) {
            const wy = -l * 0.35 + row * l * 0.22;
            for (let c = 0; c < 4; c++) {
                ctx.fillRect(startX + c * (winW + gap), wy, winW, l * 0.12);
            }
        }

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-w * 0.4, -l * 0.48, w * 0.8, l * 0.08);
        ctx.fillStyle = '#333';
        ctx.fillRect(-w * 0.15, -l * 0.46, w * 0.3, l * 0.05);

        bumpers(ctx, w, l, rgb(parseColor('#666')));
        if (opts.abandoned) drawRust(ctx, w, l);
    }

    const DRAWERS = {
        lada_vaz: drawLada,
        gaz_24: drawGaz24,
        uaz_469: drawUaz,
        toyota_hilux_1973: drawHilux,
        van_soviet: drawVan,
        gaz_66: drawGaz66,
        ural: drawUral,
        renault_vab_1976: drawVab,
        liaz_bus: drawBus,
    };

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {{ id: string, width: number, length: number, color?: string, abandoned?: boolean }} opts
     */
    window.drawProceduralVehicle = function (ctx, opts) {
        const id = resolveId(opts.id || 'lada_vaz');
        const w = opts.width;
        const l = opts.length;
        const base = parseColor(opts.color || '#888');
        const abandoned = !!opts.abandoned;
        const fn = DRAWERS[id] || drawLada;
        fn(ctx, w, l, base, { abandoned: abandoned });
    };
})();
