/**
 * Pixel Fighter renderer — draws a chunky pixel boxer on a <canvas>.
 * Poses: idle, punch, hit, block, win, ko. Fighters face right; flip with CSS.
 */
const FIGHTER_PALETTES = {
    red:  { hair: '#3a1f10', band: '#ff3b5c', skin: '#f2c28b', shirt: '#1b1f4a', glove: '#e8344e', pants: '#c3203f', shoe: '#1f5fbf' },
    pink: { hair: '#ff4fb0', band: '#ffd1ec', skin: '#f0c08a', shirt: '#e0158f', glove: '#ff5ab8', pants: '#ff3da6', shoe: '#5a1240' },
    blue: { hair: '#101830', band: '#34d1ff', skin: '#c98d5a', shirt: '#1f6fff', glove: '#2bb3ff', pants: '#0f3d99', shoe: '#ffffff' },
    gold: { hair: '#f2d14b', band: '#ff8a00', skin: '#f5cfa0', shirt: '#2a9d5c', glove: '#ffb000', pants: '#1d6b40', shoe: '#3a2a18' },
};

const PF_UNIT = 5;   // screen pixels per art pixel
const PF_W = 44;     // art width
const PF_H = 40;     // art height

function fighterParts(pose, p, frame) {
    const bob = pose === 'idle' || pose === 'block' ? frame % 2 : 0;
    const jump = pose === 'win' ? (frame % 2) * -2 : 0;
    const dx = pose === 'punch' ? 2 : pose === 'hit' ? -3 : 0;
    const headDx = pose === 'hit' ? -1 : 0;
    const y = jump;
    const b = bob + y;

    const body = [
        // legs + shoes
        [15 + dx, 29 + y, 4, 6, p.skin], [20 + dx, 29 + y, 4, 6, p.skin],
        [14 + dx, 34 + y, 6, 2, p.shoe], [20 + dx, 34 + y, 6, 2, p.shoe],
        // shorts, torso, neck
        [14 + dx, 24 + y, 11, 5, p.pants],
        [15 + dx, 15 + b, 9, 10, p.shirt],
        [18 + dx, 13 + b, 3, 2, p.skin],
        // head, hair, headband
        [15 + dx + headDx, 5 + b, 9, 9, p.skin],
        [15 + dx + headDx, 4 + b, 9, 3, p.hair],
        [15 + dx + headDx, 7 + b, 9, 1, p.band],
    ];

    const arms = {
        idle: [
            [24 + dx, 17 + b, 4, 3, p.skin],
            [22 + dx, 14 + b, 5, 5, p.glove],
            [26 + dx, 11 + b, 5, 5, p.glove],
        ],
        block: [
            [24 + dx, 17 + b, 3, 3, p.skin],
            [24 + dx, 13 + b, 5, 5, p.glove],
            [24 + dx, 7 + b, 5, 5, p.glove],
        ],
        punch: [
            [24 + dx, 16, 10, 3, p.skin],
            [33 + dx, 14, 6, 6, p.glove],
            [22 + dx, 13, 5, 5, p.glove],
        ],
        hit: [
            [12 + dx, 17, 3, 5, p.skin],
            [11 + dx, 21, 5, 5, p.glove],
            [23 + dx, 19, 5, 5, p.glove],
        ],
        win: [
            [11 + dx, 8 + y, 3, 9, p.skin], [25 + dx, 8 + y, 3, 9, p.skin],
            [9 + dx, 2 + y, 5, 5, p.glove], [25 + dx, 2 + y, 5, 5, p.glove],
        ],
    };
    arms.ko = arms.hit;

    const hx = 15 + dx + headDx;
    let face;
    if (pose === 'ko' || pose === 'hit') {
        // X eyes
        face = [[20 + hx - 15, 9 + b, 1, 1, '#000'], [22 + hx - 15, 9 + b, 1, 1, '#000'],
                [21 + hx - 15, 10 + b, 1, 1, '#000'],
                [20 + hx - 15, 11 + b, 1, 1, '#000'], [22 + hx - 15, 11 + b, 1, 1, '#000'],
                [19 + hx - 15, 12 + b, 3, 1, '#a0303a']];
    } else if (pose === 'win') {
        face = [[21 + hx - 15, 9 + b, 1, 2, '#000'], [20 + hx - 15, 11 + b, 3, 2, '#7a1020']];
    } else {
        face = [[21 + hx - 15, 9 + b, 1, 2, '#000'], [21 + hx - 15, 12 + b, 2, 1, '#a0303a']];
    }

    return { solid: body.concat(arms[pose] || arms.idle), detail: face };
}

function drawFighter(canvas, paletteName, pose, frame) {
    const ctx = canvas.getContext('2d');
    const p = FIGHTER_PALETTES[paletteName] || FIGHTER_PALETTES.red;
    const u = PF_UNIT;
    const oy = 4; // headroom for the win pose
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // floor shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(11 * u, (36 + oy) * u - u, 18 * u, 2 * u);

    const { solid, detail } = fighterParts(pose, p, frame);
    // outline pass, then fill pass → silhouette outline
    ctx.fillStyle = '#000';
    solid.forEach(([x, y, w, h]) => ctx.fillRect((x - 1) * u, (y - 1 + oy) * u, (w + 2) * u, (h + 2) * u));
    solid.concat(detail).forEach(([x, y, w, h, c]) => {
        ctx.fillStyle = c;
        ctx.fillRect(x * u, (y + oy) * u, w * u, h * u);
    });
    // glove shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    solid.filter(s => s[4] === p.glove).forEach(([x, y]) => ctx.fillRect((x + 1) * u, (y + 1 + oy) * u, u, u));
}

/** Create a canvas fighter that animates itself. Returns a controller. */
function createFighter(paletteName, { scale = 1 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = PF_W * PF_UNIT;
    canvas.height = (PF_H + 4) * PF_UNIT;
    canvas.className = 'pixel-fighter';
    if (scale !== 1) canvas.style.width = (canvas.width * scale) + 'px';
    const state = { pose: 'idle', frame: 0, palette: paletteName };
    const tick = () => { state.frame++; drawFighter(canvas, state.palette, state.pose, state.frame); };
    drawFighter(canvas, paletteName, 'idle', 0);
    const timer = setInterval(tick, 380);
    return {
        canvas,
        setPose(pose) { state.pose = pose; drawFighter(canvas, state.palette, pose, state.frame); },
        get pose() { return state.pose; },
        stop() { clearInterval(timer); },
    };
}
