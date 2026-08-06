// Adds the striped scarf + yellow rain boots to atlas-diggingFall.gif,
// matching the walking fall theme. Leaves are left untouched.
const sharp = require("sharp");
const { GIFEncoder, quantize, applyPalette } = require("gifenc");
const fs = require("fs");

const SRC = process.env.SRC || "gifs/atlas-diggingFall.gif";
const OUT = process.env.OUT || "gifs/atlas-diggingFall.gif";

// Boot palette
const BOOT_BASE = [242, 193, 36];
const BOOT_HI = [255, 236, 148];
const BOOT_SHADOW = [196, 138, 16];
const BOOT_SOLE = [104, 68, 8];
// Scarf palette
const SCARF_BASE = [184, 74, 44];
const SCARF_STRIPE = [235, 133, 45];
const SCARF_SH = [132, 50, 30];

// Visible leg columns (dog is static across frames).
const LEG_BANDS = [
  [38, 57],
  [76, 95],
  [105, 124],
];

async function loadFrame(page) {
  const { data, info } = await sharp(SRC, { page })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), W: info.width, H: info.height };
}

function accessors(fr) {
  const { data, W, H } = fr;
  const idx = (x, y) => (y * W + x) * 4;
  const opaque = (x, y) =>
    x >= 0 && y >= 0 && x < W && y < H && data[idx(x, y) + 3] > 60;
  const set = (x, y, c) => {
    const i = idx(x, y);
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
    data[i + 3] = 255;
  };
  const isBlue = (x, y) => {
    if (!opaque(x, y)) return false;
    const i = idx(x, y);
    return (
      data[i + 2] > 100 && data[i + 2] > data[i] + 25 && data[i + 2] > data[i + 1] + 15
    );
  };
  return { idx, opaque, set, isBlue };
}

function addBoots(fr) {
  const { H } = fr;
  const { opaque, set } = accessors(fr);
  const inBand = (band, x, y) => x >= band[0] && x <= band[1] && opaque(x, y);
  for (const band of LEG_BANDS) {
    // bottom of this leg
    let bottomY = -1;
    for (let y = H - 1; y >= 120; y--) {
      let any = false;
      for (let x = band[0]; x <= band[1]; x++) if (opaque(x, y)) any = true;
      if (any) {
        bottomY = y;
        break;
      }
    }
    if (bottomY < 0) continue;
    const topY = bottomY - 10;
    // top boot row per column (cuff)
    const colTop = {};
    for (let x = band[0]; x <= band[1]; x++) {
      for (let y = topY; y <= bottomY; y++) {
        if (inBand(band, x, y)) {
          colTop[x] = y;
          break;
        }
      }
    }
    for (let y = topY; y <= bottomY; y++) {
      for (let x = band[0]; x <= band[1]; x++) {
        if (!inBand(band, x, y)) continue;
        let lx = x;
        while (inBand(band, lx - 1, y)) lx--;
        let rx = x;
        while (inBand(band, rx + 1, y)) rx++;
        const top = colTop[x];
        let c = BOOT_BASE;
        if (y === bottomY) c = BOOT_SOLE;
        else if (top !== undefined && y <= top + 1) c = BOOT_HI;
        else if (top !== undefined && y === top + 2) c = BOOT_SHADOW;
        else if (x === lx || x === lx + 1) c = BOOT_HI;
        else if (x === rx) c = BOOT_SHADOW;
        set(x, y, c);
      }
    }
    // Rounded toe bulge pointing forward (right).
    const toeWidths = [4, 5, 5, 5, 4, 2];
    const rightmostInRow = (y) => {
      for (let x = band[1] + 1; x >= band[0] - 1; x--) if (inBand(band, x, y)) return x;
      return -1;
    };
    const anchor = rightmostInRow(bottomY);
    if (anchor >= 0) {
      for (let r = 0; r < toeWidths.length; r++) {
        const y = bottomY - r;
        const w = toeWidths[r];
        for (let k = 1; k <= w; k++) {
          const tx = anchor + k;
          if (opaque(tx, y)) continue;
          let c = BOOT_BASE;
          if (r === 0) c = BOOT_SOLE;
          else if (k === w) c = BOOT_SHADOW;
          set(tx, y, c);
        }
      }
    }
  }
}

function addScarf(fr) {
  const { opaque, set, isBlue, idx } = accessors(fr);
  const stripe = (x, y) => (((x + y) % 14) < 7 ? SCARF_STRIPE : SCARF_BASE);
  // Recolor bandana -> striped scarf.
  let minx = 999,
    maxx = -1,
    maxy = -1;
  for (let y = 0; y < fr.H; y++) {
    for (let x = 0; x < fr.W; x++) {
      if (!isBlue(x, y)) continue;
      let c = stripe(x, y);
      if (!isBlue(x, y + 1)) c = SCARF_SH;
      set(x, y, c);
      minx = Math.min(minx, x);
      maxx = Math.max(maxx, x);
      maxy = Math.max(maxy, y);
    }
  }
  // Cleanup stray bluish edge pixels in the bandana region.
  const data = fr.data;
  for (let y = 84; y <= 128; y++) {
    for (let x = 105; x <= 145; x++) {
      const i = idx(x, y);
      if (data[i + 3] <= 60) continue;
      if (data[i + 2] >= data[i] && data[i + 2] >= data[i + 1] && data[i + 2] > 90)
        set(x, y, stripe(x, y));
    }
  }
  // Drape the scarf along his back: follow the top (spine) contour from the
  // neck up toward the hips so the scarf reads as a long, prominent drape.
  const topAt = (x) => {
    for (let y = 0; y < fr.H; y++) if (opaque(x, y)) return y;
    return -1;
  };
  const BACK_X0 = 60,
    BACK_X1 = 136,
    THICK = 7;
  for (let x = BACK_X0; x <= BACK_X1; x++) {
    const top = topAt(x);
    if (top < 38) continue; // skip the raised tail/hip; drape only the mid-back
    for (let y = top + 2; y < top + 2 + THICK; y++) {
      if (!opaque(x, y)) continue;
      let c = stripe(x, y);
      if (y === top + 2) c = SCARF_SH; // subtle shaded top fold
      set(x, y, c);
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
    addScarf(fr);
    addBoots(fr);
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
  }
  gif.finish();
  fs.writeFileSync(OUT, Buffer.from(gif.bytes()));
  console.log("wrote " + OUT);
})();
