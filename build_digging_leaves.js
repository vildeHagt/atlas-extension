// Rebuilds the leaf layer: reads gifs/atlasDigging.gif (green 0/1 bits) and
// replaces the bits with pointy maple leaves. Writes to OUT (default temp).
const sharp = require("sharp");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");
const fs = require("fs");

const SRC = "gifs/atlasDigging.gif";
const OUT = process.env.OUT || "tmp_leaves.gif";

const LEAF_COLORS = [
  [[198, 74, 38], [150, 44, 22], [230, 120, 70]],
  [[224, 132, 34], [176, 92, 16], [246, 176, 84]],
  [[214, 170, 44], [170, 128, 20], [242, 208, 96]],
  [[168, 96, 40], [128, 66, 24], [206, 140, 78]],
];
const STEM = [110, 70, 30];

// 13x15 pointy maple-leaf sprite: 0=empty,1=body,2=vein,3=highlight,4=stem
const LEAF = [
  [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 1, 2, 1, 0, 0, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 0],
  [1, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],
];

async function loadFrame(page) {
  const { data, info } = await sharp(SRC, { page })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), W: info.width, H: info.height };
}

function isGreen(d, i) {
  const r = d[i],
    g = d[i + 1],
    b = d[i + 2],
    a = d[i + 3];
  return a > 60 && g > 90 && g > r + 30 && g > b + 30;
}

function greenClusters(fr) {
  const { data, W, H } = fr;
  const seen = new Uint8Array(W * H);
  const clusters = [];
  const idx = (x, y) => (y * W + x) * 4;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (seen[y * W + x] || !isGreen(data, idx(x, y))) continue;
      const stack = [[x, y]];
      seen[y * W + x] = 1;
      let sx = 0,
        sy = 0,
        n = 0;
      const pixels = [];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        sx += cx;
        sy += cy;
        n++;
        pixels.push([cx, cy]);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = cx + dx,
              ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (seen[ny * W + nx]) continue;
            if (isGreen(data, idx(nx, ny))) {
              seen[ny * W + nx] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }
      clusters.push({ cx: sx / n, cy: sy / n, n, pixels });
    }
  }
  return clusters.filter((c) => c.n >= 6);
}

function eraseGreen(fr, clusters) {
  const { data, W } = fr;
  for (const c of clusters) {
    for (const [x, y] of c.pixels) data[(y * W + x) * 4 + 3] = 0;
  }
}

function stampLeaf(fr, cx, cy, colorSet) {
  const { data, W, H } = fr;
  const [base, vein, hi] = colorSet;
  const lw = LEAF[0].length,
    lh = LEAF.length;
  const ox = Math.round(cx - lw / 2),
    oy = Math.round(cy - lh / 2);
  for (let j = 0; j < lh; j++) {
    for (let k = 0; k < lw; k++) {
      const v = LEAF[j][k];
      if (!v) continue;
      const x = ox + k,
        y = oy + j;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      let c = base;
      if (v === 2) c = vein;
      else if (v === 3) c = hi;
      else if (v === 4) c = STEM;
      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
}

(async () => {
  const meta = await sharp(SRC, { animated: true }).metadata();
  const pages = meta.pages;
  const delays = meta.delay || new Array(pages).fill(200);
  const gif = GIFEncoder();
  for (let p = 0; p < pages; p++) {
    const fr = await loadFrame(p);
    const clusters = greenClusters(fr);
    eraseGreen(fr, clusters);
    clusters.forEach((c, i) =>
      stampLeaf(fr, c.cx, c.cy, LEAF_COLORS[i % LEAF_COLORS.length])
    );
    const palette = quantize(fr.data, 256, {
      format: "rgba4444",
      oneBitAlpha: true,
    });
    const indexed = applyPalette(fr.data, palette, "rgba4444");
    gif.writeFrame(indexed, fr.W, fr.H, {
      palette,
      transparent: true,
      delay: delays[p] || 200,
      dispose: 2,
    });
    console.log(`frame${p}: ${clusters.length} leaves`);
  }
  gif.finish();
  fs.writeFileSync(OUT, Buffer.from(gif.bytes()));
  console.log("wrote " + OUT);
})();
