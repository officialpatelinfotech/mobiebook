const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const DEFAULT_PAGE_WIDTH = 1024;
const DEFAULT_PAGE_HEIGHT = 768;
const DEFAULT_QR_TARGET_SIZE = 420; // px
const QUIET_ZONE_MODULES = 4; // standard QR quiet-zone

// Album QR (album-qr.png) physical sizing
// Page: 12x18 inches, QR: 2x2 inches
// Note: PNG is pixel-based; we choose a DPI so inches can be converted to pixels.
const ALBUM_QR_DPI = 300;
const ALBUM_QR_PAGE_WIDTH_IN = 12;
const ALBUM_QR_PAGE_HEIGHT_IN = 18;
const ALBUM_QR_SIZE_IN = 2;

function inchesToPx(inches, dpi) {
  const n = Number(inches);
  const d = Number(dpi);
  if (!(n > 0) || !(d > 0)) return 0;
  return Math.max(1, Math.round(n * d));
}

function scalePngNearest(srcPng, dstWidth, dstHeight) {
  const { PNG } = require('pngjs');
  const dst = new PNG({ width: dstWidth, height: dstHeight, colorType: 6 });
  const sw = srcPng.width;
  const sh = srcPng.height;
  for (let y = 0; y < dstHeight; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dstHeight));
    for (let x = 0; x < dstWidth; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dstWidth));
      const sp = (sw * sy + sx) << 2;
      const dp = (dstWidth * y + x) << 2;
      dst.data[dp] = srcPng.data[sp];
      dst.data[dp + 1] = srcPng.data[sp + 1];
      dst.data[dp + 2] = srcPng.data[sp + 2];
      dst.data[dp + 3] = srcPng.data[sp + 3];
    }
  }
  return dst;
}

function writePngToFile(png, outPath) {
  return new Promise((resolve, reject) => {
    // Prefer a single-buffer atomic write to avoid leaving a partially-written/corrupt PNG
    // (Windows Photos will report the file as unsupported/corrupted).
    try {
      const { PNG } = require('pngjs');
      const tmpPath = `${outPath}.tmp`;
      const buffer = PNG.sync.write(png);
      fs.writeFileSync(tmpPath, buffer);
      fs.renameSync(tmpPath, outPath);
      resolve();
      return;
    } catch {
      // Fall back to streaming if sync write isn't possible for some reason.
    }

    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    try {
      png.pack().on('error', reject).pipe(stream);
    } catch (e) {
      reject(e);
    }
  });
}

function sampleDominantBackgroundColor(png) {
  try {
    const w = Number(png?.width) || 0;
    const h = Number(png?.height) || 0;
    const data = png?.data;
    if (!(w > 0 && h > 0) || !data) return null;

    const cornerSize = Math.max(8, Math.min(24, Math.floor(Math.min(w, h) * 0.04)));

    const corners = [
      { x0: 0, y0: 0 },
      { x0: Math.max(0, w - cornerSize), y0: 0 },
      { x0: 0, y0: Math.max(0, h - cornerSize) },
      { x0: Math.max(0, w - cornerSize), y0: Math.max(0, h - cornerSize) }
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (const c of corners) {
      for (let y = c.y0; y < c.y0 + cornerSize; y++) {
        for (let x = c.x0; x < c.x0 + cornerSize; x++) {
          const p = (w * y + x) << 2;
          const a = data[p + 3];
          if (a === 0) continue;
          rSum += data[p];
          gSum += data[p + 1];
          bSum += data[p + 2];
          count += 1;
        }
      }
    }

    if (!count) return null;
    return {
      r: Math.round(rSum / count),
      g: Math.round(gSum / count),
      b: Math.round(bSum / count)
    };
  } catch {
    return null;
  }
}

function chromaKeyBackgroundToTransparentInPlace(png, keyColor) {
  // Removes the dominant background color (typically near-white or near-black) and keeps lines/art.
  // This produces a transparent template look for *any* selected background.
  const data = png?.data;
  const w = Number(png?.width) || 0;
  const h = Number(png?.height) || 0;
  if (!(w > 0 && h > 0) || !data || !keyColor) return;

  const kr = Number(keyColor.r) || 0;
  const kg = Number(keyColor.g) || 0;
  const kb = Number(keyColor.b) || 0;

  // Threshold is intentionally a bit generous to remove slightly-off whites/blacks.
  const threshold = 42; // max channel delta

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dr = Math.abs(r - kr);
    const dg = Math.abs(g - kg);
    const db = Math.abs(b - kb);
    const maxd = Math.max(dr, dg, db);

    if (maxd <= threshold) {
      // Background pixel -> transparent
      data[i + 3] = 0;
    } else {
      // Keep template ink/graphics
      data[i + 3] = 255;
    }
  }
}

async function generateCenteredTransparentQrPage({ url, outPath }) {
  // Creates a transparent "page" PNG and draws QR modules as crisp black pixels.
  const { PNG } = require('pngjs');

  const pageWidth = Number(arguments[0]?.pageWidth) > 0 ? Number(arguments[0].pageWidth) : DEFAULT_PAGE_WIDTH;
  const pageHeight = Number(arguments[0]?.pageHeight) > 0 ? Number(arguments[0].pageHeight) : DEFAULT_PAGE_HEIGHT;
  const qrTargetSize = Number(arguments[0]?.qrTargetSize) > 0 ? Number(arguments[0].qrTargetSize) : DEFAULT_QR_TARGET_SIZE;

  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const modules = qr.modules.data;

  const paddedCount = moduleCount + (QUIET_ZONE_MODULES * 2);
  const pixelsPerModule = Math.max(1, Math.floor(qrTargetSize / paddedCount));
  const qrPixelSize = pixelsPerModule * paddedCount;

  const offsetX = Math.floor((pageWidth - qrPixelSize) / 2);
  const offsetY = Math.floor((pageHeight - qrPixelSize) / 2);

  const png = new PNG({ width: pageWidth, height: pageHeight, colorType: 6 });
  // png.data starts as 0-filled => fully transparent background

  for (let r = 0; r < paddedCount; r++) {
    for (let c = 0; c < paddedCount; c++) {
      const srcR = r - QUIET_ZONE_MODULES;
      const srcC = c - QUIET_ZONE_MODULES;
      const isDark =
        srcR >= 0 && srcR < moduleCount &&
        srcC >= 0 && srcC < moduleCount &&
        modules[srcR * moduleCount + srcC];

      if (!isDark) continue;

      const startX = offsetX + (c * pixelsPerModule);
      const startY = offsetY + (r * pixelsPerModule);

      for (let dy = 0; dy < pixelsPerModule; dy++) {
        for (let dx = 0; dx < pixelsPerModule; dx++) {
          const x = startX + dx;
          const y = startY + dy;
          if (x < 0 || y < 0 || x >= pageWidth || y >= pageHeight) continue;
          const p = (pageWidth * y + x) << 2;
          png.data[p] = 0;
          png.data[p + 1] = 0;
          png.data[p + 2] = 0;
          png.data[p + 3] = 255;
        }
      }
    }
  }

  await writePngToFile(png, outPath);
}

function tryDecodeDataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  try {
    return Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
}

function tryReadBackgroundFromPath(backgroundPath) {
  if (!backgroundPath || typeof backgroundPath !== 'string') return null;
  const cleaned = String(backgroundPath).trim();
  if (!cleaned) return null;
  try {
    if (!fs.existsSync(cleaned)) return null;
    return fs.readFileSync(cleaned);
  } catch {
    return null;
  }
}

function readBackgroundInput({ backgroundPath, backgroundDataUrl }) {
  const fromPath = tryReadBackgroundFromPath(backgroundPath);
  if (fromPath) return { buffer: fromPath, source: 'path' };

  const fromDataUrl = tryDecodeDataUrlToBuffer(backgroundDataUrl);
  if (fromDataUrl) return { buffer: fromDataUrl, source: 'dataUrl' };

  return { buffer: null, source: 'none' };
}

async function generateQrPageWithBackground({ url, outPath, backgroundPath, backgroundDataUrl, pageWidth, pageHeight, qrTargetSize, folderOrientation }) {
  const { PNG } = require('pngjs');

  const resolvedPageWidth = Number(pageWidth) > 0 ? Number(pageWidth) : DEFAULT_PAGE_WIDTH;
  const resolvedPageHeight = Number(pageHeight) > 0 ? Number(pageHeight) : DEFAULT_PAGE_HEIGHT;
  const resolvedQrTargetSize = Number(qrTargetSize) > 0 ? Number(qrTargetSize) : DEFAULT_QR_TARGET_SIZE;

  const bg = readBackgroundInput({ backgroundPath, backgroundDataUrl });
  if (!bg.buffer) {
    // Fallback: transparent page
    await generateCenteredTransparentQrPage({ url, outPath, pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight, qrTargetSize: resolvedQrTargetSize });
    return { used: 'none', pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight };
  }

  // Use Jimp (v1.x) to decode common image formats (png/jpg/etc)
  const { Jimp, JimpMime } = require('jimp');

  function appendBgErrorLog(message, extra) {
    try {
      const folder = path.dirname(outPath);
      const logFile = path.join(folder, 'log.txt');
      const extraText = extra ? ` | ${extra}` : '';
      fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] QR bg decode warning | ${message}${extraText}`);
    } catch {
      // ignore
    }
  }

  function looksLikePng(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 8) return false;
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  function scalePngNearest(srcPng, dstWidth, dstHeight) {
    const dst = new PNG({ width: dstWidth, height: dstHeight, colorType: 6 });
    const sw = srcPng.width;
    const sh = srcPng.height;
    for (let y = 0; y < dstHeight; y++) {
      const sy = Math.min(sh - 1, Math.floor((y * sh) / dstHeight));
      for (let x = 0; x < dstWidth; x++) {
        const sx = Math.min(sw - 1, Math.floor((x * sw) / dstWidth));
        const sp = (sw * sy + sx) << 2;
        const dp = (dstWidth * y + x) << 2;
        dst.data[dp] = srcPng.data[sp];
        dst.data[dp + 1] = srcPng.data[sp + 1];
        dst.data[dp + 2] = srcPng.data[sp + 2];
        dst.data[dp + 3] = srcPng.data[sp + 3];
      }
    }
    return dst;
  }

  function rotateJimp90CwNoCrop(image) {
    const srcW = Number(image?.width) || Number(image?.bitmap?.width) || 0;
    const srcH = Number(image?.height) || Number(image?.bitmap?.height) || 0;
    if (!(srcW > 0 && srcH > 0)) return image;

    // Rotate by 90 degrees clockwise WITHOUT cropping by swapping dimensions.
    const rotated = new Jimp({ width: srcH, height: srcW, background: 0 });
    const src = image.bitmap.data;
    const dst = rotated.bitmap.data;
    const dstW = rotated.bitmap.width;

    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < srcW; x++) {
        const srcIdx = ((srcW * y) + x) << 2;
        const newX = (srcH - 1) - y;
        const newY = x;
        const dstIdx = ((dstW * newY) + newX) << 2;
        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
        dst[dstIdx + 3] = src[srcIdx + 3];
      }
    }

    return rotated;
  }

  let bgImage;
  try {
    bgImage = await Jimp.read(bg.buffer);
  } catch (err) {
    console.error('Jimp.read failed:', err);

    // Fallback 1: try decoding PNG directly (some PNG variants can fail in Jimp but succeed in pngjs)
    if (looksLikePng(bg.buffer)) {
      try {
        const base = PNG.sync.read(bg.buffer);
        const page = scalePngNearest(base, resolvedPageWidth, resolvedPageHeight);

        // Make template background transparent (remove dominant corner color).
        const key = sampleDominantBackgroundColor(page);
        chromaKeyBackgroundToTransparentInPlace(page, key);

        // Draw QR on top (black modules, keep background elsewhere)
        const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
        const moduleCount = qr.modules.size;
        const modules = qr.modules.data;
        const paddedCount = moduleCount + (QUIET_ZONE_MODULES * 2);
        const pixelsPerModule = Math.max(1, Math.floor(resolvedQrTargetSize / paddedCount));
        const qrPixelSize = pixelsPerModule * paddedCount;
        const offsetX = Math.floor((resolvedPageWidth - qrPixelSize) / 2);
        const offsetY = Math.floor((resolvedPageHeight - qrPixelSize) / 2);

        for (let r = 0; r < paddedCount; r++) {
          for (let c = 0; c < paddedCount; c++) {
            const srcR = r - QUIET_ZONE_MODULES;
            const srcC = c - QUIET_ZONE_MODULES;
            const isDark =
              srcR >= 0 && srcR < moduleCount &&
              srcC >= 0 && srcC < moduleCount &&
              modules[srcR * moduleCount + srcC];
            if (!isDark) continue;

            const startX = offsetX + (c * pixelsPerModule);
            const startY = offsetY + (r * pixelsPerModule);

            for (let dy = 0; dy < pixelsPerModule; dy++) {
              for (let dx = 0; dx < pixelsPerModule; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (x < 0 || y < 0 || x >= resolvedPageWidth || y >= resolvedPageHeight) continue;
                const p = (resolvedPageWidth * y + x) << 2;
                page.data[p] = 0;
                page.data[p + 1] = 0;
                page.data[p + 2] = 0;
                page.data[p + 3] = 255;
              }
            }
          }
        }

        await writePngToFile(page, outPath);
        appendBgErrorLog('Jimp.read failed; used pngjs PNG fallback', (err && err.message) ? err.message : String(err));
        return { used: bg.source === 'path' ? 'path(pngjs)' : 'dataUrl(pngjs)', pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight, qrPixelSize, offsetX, offsetY };
      } catch (fallbackErr) {
        appendBgErrorLog('pngjs PNG fallback failed', (fallbackErr && fallbackErr.message) ? fallbackErr.message : String(fallbackErr));
      }
    }

    appendBgErrorLog('Background decode failed; generating transparent page', (err && err.message) ? err.message : String(err));
    // If background can't be decoded, fallback to transparent
    await generateCenteredTransparentQrPage({ url, outPath, pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight, qrTargetSize: resolvedQrTargetSize });
    return { used: 'none', pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight };
  }

  // Rotate background only when folder orientation mismatches background orientation.
  // This is intentionally based on the folder's image orientation (portrait vs landscape),
  // not the effective page dimensions (Spread mode can halve width).
  // Important: do NOT crop during rotation (we swap dimensions).
  try {
    const bgW = Number(bgImage?.width) || Number(bgImage?.bitmap?.width) || 0;
    const bgH = Number(bgImage?.height) || Number(bgImage?.bitmap?.height) || 0;
    const folderOri = String(folderOrientation ?? '').trim().toLowerCase();
    const folderIsLandscape = folderOri === 'landscape' ? true : (folderOri === 'portrait' ? false : null);
    const bgIsLandscape = bgW >= bgH;
    const shouldRotate =
      bgW > 0 && bgH > 0 &&
      bgW !== bgH &&
      // only rotate when we know the folder orientation
      (folderIsLandscape != null) &&
      (folderIsLandscape !== bgIsLandscape);

    if (shouldRotate) {
      bgImage = rotateJimp90CwNoCrop(bgImage);
    }
  } catch (err) {
    console.error('Rotation check failed:', err);
    // rotation is best-effort
  }

  // Resize to fill the page (stretch if needed, do not crop)
  // Jimp v1.x expects { w, h }. Keep a fallback for older builds.
  try {
    try {
      bgImage.resize({ w: resolvedPageWidth, h: resolvedPageHeight });
    } catch {
      bgImage.resize({ width: resolvedPageWidth, height: resolvedPageHeight });
    }
  } catch (err) {
    console.error('First resize failed:', err);
  }

  // In some Jimp builds, resize() might have rounding issues (uncommon, but safe to keep check).
  // Force exact dimensions so we never leave any unfilled (transparent) edges.
  try {
    const bw = Number(bgImage?.width) || Number(bgImage?.bitmap?.width) || 0;
    const bh = Number(bgImage?.height) || Number(bgImage?.bitmap?.height) || 0;
    if (bw !== resolvedPageWidth || bh !== resolvedPageHeight) {
      try {
        bgImage.resize({ w: resolvedPageWidth, h: resolvedPageHeight });
      } catch {
        bgImage.resize({ width: resolvedPageWidth, height: resolvedPageHeight });
      }
    }
  } catch (err) {
    console.error('Second resize failed:', err);
    // best-effort
  }

  // Get a PNG buffer from the resized background, then load into pngjs for direct pixel drawing
  const bgPngBuffer = await bgImage.getBuffer(JimpMime.png);
  const base = PNG.sync.read(bgPngBuffer);
  const page = new PNG({ width: resolvedPageWidth, height: resolvedPageHeight, colorType: 6 });

  // Copy background pixels
  base.data.copy(page.data, 0, 0, page.data.length);

  // Make template background transparent (remove dominant corner color).
  const key = sampleDominantBackgroundColor(page);
  chromaKeyBackgroundToTransparentInPlace(page, key);

  // Draw QR on top (black modules, keep background elsewhere)
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const modules = qr.modules.data;

  const paddedCount = moduleCount + (QUIET_ZONE_MODULES * 2);
  const pixelsPerModule = Math.max(1, Math.floor(resolvedQrTargetSize / paddedCount));
  const qrPixelSize = pixelsPerModule * paddedCount;

  const offsetX = Math.floor((resolvedPageWidth - qrPixelSize) / 2);
  const offsetY = Math.floor((resolvedPageHeight - qrPixelSize) / 2);

  for (let r = 0; r < paddedCount; r++) {
    for (let c = 0; c < paddedCount; c++) {
      const srcR = r - QUIET_ZONE_MODULES;
      const srcC = c - QUIET_ZONE_MODULES;
      const isDark =
        srcR >= 0 && srcR < moduleCount &&
        srcC >= 0 && srcC < moduleCount &&
        modules[srcR * moduleCount + srcC];

      if (!isDark) continue;

      const startX = offsetX + (c * pixelsPerModule);
      const startY = offsetY + (r * pixelsPerModule);

      for (let dy = 0; dy < pixelsPerModule; dy++) {
        for (let dx = 0; dx < pixelsPerModule; dx++) {
          const x = startX + dx;
          const y = startY + dy;
          if (x < 0 || y < 0 || x >= resolvedPageWidth || y >= resolvedPageHeight) continue;
          const p = (resolvedPageWidth * y + x) << 2;
          page.data[p] = 0;
          page.data[p + 1] = 0;
          page.data[p + 2] = 0;
          page.data[p + 3] = 255;
        }
      }
    }
  }

  await writePngToFile(page, outPath);
  // Also return QR layout info so caller can position barcode.
  return { used: bg.source, pageWidth: resolvedPageWidth, pageHeight: resolvedPageHeight, qrPixelSize, offsetX, offsetY };
}

function listLikelyAlbumImages(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath);
    return (entries || [])
      .filter((name) => typeof name === 'string')
      .filter((name) => {
        const lower = name.toLowerCase();
        if (lower === 'album-qr.png') return false;
        if (lower === 'qr-code.png') return false;
        if (lower.endsWith('.db')) return false;
        return /\.(jpe?g|png|webp|bmp|gif|tiff?)$/i.test(lower);
      })
      .map((name) => path.join(folderPath, name));
  } catch {
    return [];
  }
}

function detectLayoutFromFolderImages(folderPath) {
  // If all images are portrait => portrait page with same size as images.
  // If all are landscape => landscape page with same size as images.
  // Mixed/unknown => fallback to defaults.
  const imagePaths = listLikelyAlbumImages(folderPath);
  if (!imagePaths.length) {
    return { pageWidth: DEFAULT_PAGE_WIDTH, pageHeight: DEFAULT_PAGE_HEIGHT, qrTargetSize: DEFAULT_QR_TARGET_SIZE, reason: 'no-images' };
  }

  let firstWidth = null;
  let firstHeight = null;
  let seenPortrait = false;
  let seenLandscape = false;
  let mixedSizes = false;

  let sizeOf;
  try {
    sizeOf = require('image-size');
  } catch {
    // If the dependency isn't available, do not break QR generation.
    return { pageWidth: DEFAULT_PAGE_WIDTH, pageHeight: DEFAULT_PAGE_HEIGHT, qrTargetSize: DEFAULT_QR_TARGET_SIZE, reason: 'image-size-missing' };
  }

  for (const p of imagePaths) {
    let dim;
    try {
      dim = sizeOf(p);
    } catch {
      continue;
    }
    let w = Number(dim?.width);
    let h = Number(dim?.height);
    if (!(w > 0 && h > 0)) continue;

    // Respect EXIF orientation when available.
    // image-size may return dim.orientation (1..8). Values 5..8 represent 90° rotations.
    // In those cases, the displayed width/height are effectively swapped.
    try {
      const exifOrientation = Number(dim?.orientation);
      if (exifOrientation >= 5 && exifOrientation <= 8) {
        const tmp = w;
        w = h;
        h = tmp;
      }
    } catch {
      // ignore
    }

    if (firstWidth == null) {
      firstWidth = w;
      firstHeight = h;
    } else if (w !== firstWidth || h !== firstHeight) {
      mixedSizes = true;
    }

    // Determine orientation. Treat perfectly square images as neutral so they don't force a "mixed" result.
    if (h > w) seenPortrait = true;
    else if (w > h) seenLandscape = true;
    if (seenPortrait && seenLandscape) {
      return { pageWidth: DEFAULT_PAGE_WIDTH, pageHeight: DEFAULT_PAGE_HEIGHT, qrTargetSize: DEFAULT_QR_TARGET_SIZE, reason: 'mixed-orientation' };
    }
  }

  if (!(firstWidth > 0 && firstHeight > 0)) {
    return { pageWidth: DEFAULT_PAGE_WIDTH, pageHeight: DEFAULT_PAGE_HEIGHT, qrTargetSize: DEFAULT_QR_TARGET_SIZE, reason: 'no-dimensions' };
  }

  // If sizes vary, still honor the "same size" intent by using the first image size
  // (this keeps output consistent with the album even if some files differ).
  const pageWidth = firstWidth;
  const pageHeight = firstHeight;

  // Scale QR relative to page size so it remains readable.
  // Keep it conservative to leave room for optional barcode.
  const minSide = Math.min(pageWidth, pageHeight);
  const qrTargetSize = Math.max(220, Math.min(Math.floor(minSide * 0.45), Math.floor(minSide - 40)));

  const orientation = seenPortrait ? 'portrait' : (seenLandscape ? 'landscape' : 'unknown');
  return { pageWidth, pageHeight, qrTargetSize, orientation, mixedSizes, reason: mixedSizes ? 'uniform-orientation-mixed-size' : 'uniform' };
}

async function tryRenderBarcodeBuffer(text, targetWidth, targetHeight, includeText) {
  try {
    const t = String(text ?? '').trim();
    if (!t) return null;

    const bwipjs = require('bwip-js');
    const { PNG } = require('pngjs');

    const fillSolid = (png, r, g, b, a) => {
      for (let i = 0; i < png.data.length; i += 4) {
        png.data[i] = r;
        png.data[i + 1] = g;
        png.data[i + 2] = b;
        png.data[i + 3] = a;
      }
    };

    const blitOverwrite = (dst, src, startX, startY) => {
      const dstW = dst.width;
      const dstH = dst.height;
      const srcW = src.width;
      const srcH = src.height;
      for (let y = 0; y < srcH; y++) {
        const dy = startY + y;
        if (dy < 0 || dy >= dstH) continue;
        for (let x = 0; x < srcW; x++) {
          const dx = startX + x;
          if (dx < 0 || dx >= dstW) continue;
          const sp = (srcW * y + x) << 2;
          const dp = (dstW * dy + dx) << 2;
          dst.data[dp] = src.data[sp];
          dst.data[dp + 1] = src.data[sp + 1];
          dst.data[dp + 2] = src.data[sp + 2];
          dst.data[dp + 3] = src.data[sp + 3];
        }
      }
    };

    const targetW = Number(targetWidth) > 0 ? Number(targetWidth) : 0;
    const targetH = Number(targetHeight) > 0 ? Number(targetHeight) : 0;

    // Generate a Code128 barcode (then scale to the requested size using pngjs).
    // Important: avoid non-integer scaling (it makes some bars look uneven).
    // We render at a scale that fits, then only integer-scale and center inside the white box.
    // Prefer larger scales so short barcode texts still render wide enough.
    const scaleCandidates = [12, 10, 8, 6, 4, 3, 2, 1];
    let best = null;

    for (const scale of scaleCandidates) {
      const rawPng = await bwipjs.toBuffer({
        bcid: 'code128',
        text: t,
        scale,
        height: 8,
        // Always suppress human-readable text under the barcode.
        // Requirement: do not print the raw barcode text like "MB-...".
        includetext: false,
        textxalign: 'center',
        textsize: 10,
        paddingwidth: 2,
        paddingheight: 2,
        backgroundcolor: 'FFFFFF',
        barcolor: '000000',
        textcolor: '000000'
      });

      const parsed = PNG.sync.read(rawPng);

      if (targetW > 0 && targetH > 0) {
        if (parsed.width <= targetW && parsed.height <= targetH) {
          best = parsed;
          break;
        }
        // Keep the smallest if nothing fits.
        best = parsed;
      } else {
        // No target box requested.
        best = parsed;
        break;
      }
    }

    if (!best) return null;

    // If no target specified, return as-is.
    if (!(targetW > 0 && targetH > 0)) {
      return PNG.sync.write(best);
    }

    // Integer scale up proportionally (never non-integer) to keep bars crisp.
    const scaleUp = Math.max(1, Math.min(Math.floor(targetW / best.width), Math.floor(targetH / best.height)));
    const scaled = scaleUp === 1 ? best : scalePngNearest(best, best.width * scaleUp, best.height * scaleUp);

    // Center inside fixed-size transparent canvas, then chroma-key out white.
    const canvas = new PNG({ width: targetW, height: targetH, colorType: 6 });
    const startX = Math.floor((targetW - scaled.width) / 2);
    const startY = Math.floor((targetH - scaled.height) / 2);
    blitOverwrite(canvas, scaled, startX, startY);

    // Remove white background from the barcode image so it stays transparent.
    for (let i = 0; i < canvas.data.length; i += 4) {
      const a = canvas.data[i + 3];
      if (a === 0) continue;
      const r = canvas.data[i];
      const g = canvas.data[i + 1];
      const b = canvas.data[i + 2];
      if (r >= 250 && g >= 250 && b >= 250) {
        canvas.data[i + 3] = 0;
      } else {
        canvas.data[i + 3] = 255;
      }
    }

    return PNG.sync.write(canvas);
  } catch {
    return null;
  }
}

function renderSimpleTextLabelPng(text, width, height) {
  const { PNG } = require('pngjs');
  const w = Math.max(1, Number(width) | 0);
  const h = Math.max(1, Number(height) | 0);
  const png = new PNG({ width: w, height: h, colorType: 6 });
  // Transparent background; only draw text pixels.
  // (Matches the "template" look where the page background is transparent.)
  // png.data starts as 0-filled => fully transparent.

  const font = {
    // 5x7 glyphs, '1' means filled pixel
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    'G': ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
    'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    'J': ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
    'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    'W': ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
    'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
    ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100']
  };

  const raw = String(text ?? '').trim();
  if (!raw) return png;

  const upper = raw.toUpperCase();
  const glyphW = 5;
  const glyphH = 7;
  const padX = Math.max(4, Math.floor(w * 0.03));
  const padY = Math.max(4, Math.floor(h * 0.10));

  const maxScaleY = Math.max(1, Math.floor((h - padY * 2) / glyphH));
  let scale = maxScaleY;

  function textPixelWidth(scaleValue, textValue) {
    // 1px spacing between glyphs
    return textValue.length * (glyphW * scaleValue) + Math.max(0, (textValue.length - 1) * scaleValue);
  }

  let toDraw = upper;
  while (scale > 1 && (textPixelWidth(scale, toDraw) > (w - padX * 2))) {
    scale -= 1;
  }

  // If still too wide, truncate and add '...'
  if (textPixelWidth(scale, toDraw) > (w - padX * 2)) {
    const ell = '...';
    const available = w - padX * 2;
    let base = toDraw;
    while (base.length > 0 && textPixelWidth(scale, base + ell) > available) {
      base = base.slice(0, -1);
    }
    toDraw = (base.length ? (base + ell) : ell);
  }

  const textW = textPixelWidth(scale, toDraw);
  const startX = Math.max(0, Math.floor((w - textW) / 2));
  const startY = Math.max(0, Math.floor((h - (glyphH * scale)) / 2));

  const setPixel = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = (w * y + x) << 2;
    png.data[p] = 0;
    png.data[p + 1] = 0;
    png.data[p + 2] = 0;
    png.data[p + 3] = 255;
  };

  let cursorX = startX;
  for (let i = 0; i < toDraw.length; i++) {
    const ch = toDraw[i];
    const g = font[ch] || font['?'];
    for (let gy = 0; gy < glyphH; gy++) {
      const row = g[gy];
      for (let gx = 0; gx < glyphW; gx++) {
        if (row[gx] !== '1') continue;
        const px0 = cursorX + gx * scale;
        const py0 = startY + gy * scale;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            setPixel(px0 + sx, py0 + sy);
          }
        }
      }
    }
    cursorX += (glyphW * scale) + scale;
  }

  return png;
}

function tryReadOrderFormText(folderPath) {
  try {
    const candidate = path.join(folderPath, 'sample order form.txt');
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }

    // Case-insensitive fallback (Windows is typically case-insensitive, but keep safe)
    const entries = fs.readdirSync(folderPath);
    const match = (entries || []).find((n) => String(n || '').trim().toLowerCase() === 'sample order form.txt');
    if (match) {
      return fs.readFileSync(path.join(folderPath, match), 'utf8');
    }
  } catch {
    // ignore
  }
  return null;
}

function parseOrderFormDetails(text) {
  const raw = String(text ?? '');
  if (!raw.trim()) return { coupleName: '', studioName: '' };

  const lines = raw.split(/\r?\n/).map((l) => String(l ?? '').trim()).filter(Boolean);
  const findValue = (re) => {
    for (const l of lines) {
      const m = l.match(re);
      if (m && m[1]) return String(m[1]).trim();
    }
    return '';
  };

  const coupleName =
    findValue(/couple\s*name\s*[:\-]\s*(.+)$/i) ||
    findValue(/client\s*name\s*[:\-]\s*(.+)$/i) ||
    '';

  const studioName =
    findValue(/studio\s*name\s*[:\-]\s*(.+)$/i) ||
    findValue(/studio\s*[:\-]\s*(.+)$/i) ||
    '';

  // If couple name isn't explicitly present, try constructing from Bride/Groom.
  if (!coupleName) {
    const bride = findValue(/bride\s*name\s*[:\-]\s*(.+)$/i);
    const groom = findValue(/groom\s*name\s*[:\-]\s*(.+)$/i);
    const constructed = [bride, groom].filter(Boolean).join(' & ');
    return { coupleName: constructed, studioName };
  }

  return { coupleName, studioName };
}

async function tryRenderTextLabelBuffer(text, targetWidth, targetHeight) {
  try {
    const t = String(text ?? '').trim();
    if (!t) return null;
    const { PNG } = require('pngjs');
    const w = Number(targetWidth) > 0 ? Number(targetWidth) : 320;
    const h = Number(targetHeight) > 0 ? Number(targetHeight) : 80;
    const label = renderSimpleTextLabelPng(t, w, h);
    return PNG.sync.write(label);
  } catch {
    return null;
  }
}

async function tryRenderFolderNameLabelBuffer(text, targetWidth, targetHeight) {
  try {
    const t = String(text ?? '').trim();
    if (!t) return null;

    const { PNG } = require('pngjs');
    const w = Number(targetWidth) > 0 ? Number(targetWidth) : 320;
    const h = Number(targetHeight) > 0 ? Number(targetHeight) : 80;
    const label = renderSimpleTextLabelPng(t, w, h);
    return PNG.sync.write(label);
  } catch {
    return null;
  }
}

function blitOverlayPng(page, overlay, startX, startY) {
  const pageWidth = page.width;
  const pageHeight = page.height;
  const ow = overlay.width;
  const oh = overlay.height;

  for (let y = 0; y < oh; y++) {
    const py = startY + y;
    if (py < 0 || py >= pageHeight) continue;
    for (let x = 0; x < ow; x++) {
      const px = startX + x;
      if (px < 0 || px >= pageWidth) continue;

      const op = (ow * y + x) << 2;
      const oa = overlay.data[op + 3];
      if (oa === 0) continue;

      const pp = (pageWidth * py + px) << 2;
      // Simple overwrite (barcode should be opaque)
      page.data[pp] = overlay.data[op];
      page.data[pp + 1] = overlay.data[op + 1];
      page.data[pp + 2] = overlay.data[op + 2];
      page.data[pp + 3] = 255;
    }
  }
}

async function generateAlbumQr({ FolderPath, uniq_id, qrBgDataUrl, qrBgPath, generateBarcode, barcodeText, printFolderNameBelowBarcode, pageType }) {
  if (!FolderPath) throw new Error('FolderPath is required');

  const resolvedUniqId = uniq_id;
  const resolvedUniqIdText = String(resolvedUniqId ?? '').trim();
  const invalidId =
    resolvedUniqId == null ||
    resolvedUniqIdText.length === 0 ||
    resolvedUniqIdText.toLowerCase() === 'null' ||
    resolvedUniqIdText.toLowerCase() === 'undefined';

  if (invalidId) {
    const logFile = path.join(FolderPath, 'log.txt');
    try {
      fs.appendFileSync(
        logFile,
        `\n[${new Date().toISOString()}] QR generation failed | error: uniq_id is required | received: '${resolvedUniqIdText}' | payloadKeys: ${Object.keys(arguments[0] || {}).join(',')}`
      );
    } catch (_) {
      // ignore
    }
    throw new Error('uniq_id is required');
  }

  const logFile = path.join(FolderPath, 'log.txt');
  const outPath = path.join(FolderPath, 'album-qr.png');
  const qrOnlyOutPath = path.join(FolderPath, 'qr-code.png');
  const url = `http://localhost:4200/#/?q=${resolvedUniqIdText}`;

  // Read couple/studio from order form (best-effort)
  const orderFormText = tryReadOrderFormText(FolderPath);
  const orderDetails = parseOrderFormDetails(orderFormText);

  const layout = detectLayoutFromFolderImages(FolderPath);

  // Force album-qr.png / qr-code.png physical size based on folder orientation:
  // - Portrait folders => 12x18 inches
  // - Landscape folders => 18x12 inches
  // (Use DPI to derive pixel dimensions.)
  const requestedOrientation = String(layout?.orientation ?? '').trim().toLowerCase();
  const isLandscapeFolder = requestedOrientation === 'landscape';
  const pageWidthIn = isLandscapeFolder ? ALBUM_QR_PAGE_HEIGHT_IN : ALBUM_QR_PAGE_WIDTH_IN;
  const pageHeightIn = isLandscapeFolder ? ALBUM_QR_PAGE_WIDTH_IN : ALBUM_QR_PAGE_HEIGHT_IN;

  const effectivePageWidth = inchesToPx(pageWidthIn, ALBUM_QR_DPI);
  const effectivePageHeight = inchesToPx(pageHeightIn, ALBUM_QR_DPI);
  const effectiveQrTargetSize = inchesToPx(ALBUM_QR_SIZE_IN, ALBUM_QR_DPI);

  const pageTypeText = String(pageType ?? '').trim().toLowerCase();
  const layoutOrientation = String(layout?.orientation ?? '').trim().toLowerCase();
  // Background rotation should follow the folder images only (uniform portrait/landscape).
  // Do NOT infer orientation from pageType; that can rotate incorrectly for mixed/unknown folders.
  const folderOrientationForBg =
    (layoutOrientation === 'portrait' || layoutOrientation === 'landscape')
      ? layoutOrientation
      : '';

  // Note: We still use layout only for orientation hints and diagnostics.

  const bgPathText = typeof qrBgPath === 'string' ? qrBgPath.trim() : '';
  const hasBgPath = !!bgPathText;
  const hasBgDataUrl = typeof qrBgDataUrl === 'string' && qrBgDataUrl.trim().length > 0;
  const bgInfo = hasBgPath ? `path:${bgPathText}` : (hasBgDataUrl ? `dataUrl(len:${qrBgDataUrl.length})` : 'none');

  // Diagnostics to understand why a background may not be applied
  let bgPathExists = false;
  let bgPathSize = -1;
  if (hasBgPath) {
    try {
      bgPathExists = fs.existsSync(bgPathText);
      if (bgPathExists) {
        bgPathSize = fs.statSync(bgPathText).size;
      }
    } catch {
      bgPathExists = false;
      bgPathSize = -1;
    }
  }

  const dataUrlLooksValid = typeof qrBgDataUrl === 'string' && /^data:image\//i.test(qrBgDataUrl);

  // Ensure destination folder exists
  if (!fs.existsSync(FolderPath)) {
    fs.mkdirSync(FolderPath, { recursive: true });
  }

  try {
    fs.appendFileSync(
      logFile,
      `\n[${new Date().toISOString()}] QR generation started | id: ${resolvedUniqIdText} | file: ${outPath} | url: ${url} | bg: ${bgInfo} | bgPathExists:${bgPathExists} | bgPathSize:${bgPathSize} | dataUrlValid:${dataUrlLooksValid} | pageType:${pageTypeText || 'unknown'} | page:${effectivePageWidth}x${effectivePageHeight}@${ALBUM_QR_DPI}dpi(${pageWidthIn}x${pageHeightIn}in) | qrTarget:${effectiveQrTargetSize}(${ALBUM_QR_SIZE_IN}in) | layoutReason:${layout.reason} | layoutOri:${layoutOrientation || 'unknown'} | folderOriForBg:${folderOrientationForBg || 'unknown'} | generateBarcode:${!!generateBarcode} | printFolderName:${!!printFolderNameBelowBarcode} | barcodeTextLen:${String(barcodeText ?? '').trim().length}`
    );
  } catch (_) {
    // ignore logging errors
  }

  try {
    // Overwrites album-qr.png if it already exists
    const { PNG } = require('pngjs');

    // Generate QR-only transparent page (no background) as qr-code.png
    // Page: 12x18 inches, QR: 2x2 inches, centered.
    try {
      await generateCenteredTransparentQrPage({
        url,
        outPath: qrOnlyOutPath,
        pageWidth: effectivePageWidth,
        pageHeight: effectivePageHeight,
        qrTargetSize: effectiveQrTargetSize
      });
      try {
        fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] QR-only generated | file: ${qrOnlyOutPath} | page: ${effectivePageWidth}x${effectivePageHeight} | qrTarget: ${effectiveQrTargetSize}px`);
      } catch (_) {
        // ignore
      }
    } catch (e) {
      // Do not fail the whole operation if the secondary image fails.
      try {
        const msg = e && e.message ? e.message : String(e);
        fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] QR-only generation failed | file: ${qrOnlyOutPath} | error: ${msg}`);
      } catch (_) {
        // ignore
      }
    }

    const bgResult = await generateQrPageWithBackground({
      url,
      outPath,
      backgroundPath: qrBgPath,
      backgroundDataUrl: qrBgDataUrl,
      pageWidth: effectivePageWidth,
      pageHeight: effectivePageHeight,
      qrTargetSize: effectiveQrTargetSize,
      folderOrientation: folderOrientationForBg
    });

    // Overlay logic:
    // Sequence requested:
    // QR (already drawn) -> couple name -> studio name -> (optional) barcode -> (optional) JobId:FolderName
    const wantBarcode = !!generateBarcode;
    const wantFolderName = !!printFolderNameBelowBarcode;
    const text = String(barcodeText ?? '').trim();

    const hasCouple = String(orderDetails?.coupleName ?? '').trim().length > 0;
    const hasStudio = String(orderDetails?.studioName ?? '').trim().length > 0;
    const hasAnyOverlays = hasCouple || hasStudio || wantBarcode || wantFolderName;

    if (hasAnyOverlays) {
      const existing = fs.readFileSync(outPath);
      const page = PNG.sync.read(existing);

      const pageWidth = page.width || layout.pageWidth || DEFAULT_PAGE_WIDTH;
      const pageHeight = page.height || layout.pageHeight || DEFAULT_PAGE_HEIGHT;

      const qrBottomY = (bgResult && bgResult.offsetY != null && bgResult.qrPixelSize != null)
        ? (bgResult.offsetY + bgResult.qrPixelSize)
        : Math.floor((pageHeight + effectiveQrTargetSize) / 2);

      // Start overlays immediately on the next line below the QR.
      // (Use a small, DPI-scaled gap so the first text sits right under the QR.)
      const gap = Math.max(8, inchesToPx(0.08, ALBUM_QR_DPI));
      const marginBelowQr = gap;

      const overlaysTop = [];
      const overlaysBottom = [];

      // Use identical box size for barcode + folder-name label so the white background looks consistent.
      const qrBoxWidth = (bgResult && Number(bgResult.qrPixelSize) > 0) ? Number(bgResult.qrPixelSize) : effectiveQrTargetSize;
      const overlayBoxWidth = Math.max(120, Math.min(pageWidth, Math.floor(qrBoxWidth)));

      // Barcode should be wider than the QR/text labels for better scan reliability.
      // Target ~10 inches wide (clamped to page width with margins).
      const sideMargin = Math.max(24, inchesToPx(0.5, ALBUM_QR_DPI));
      const maxBarcodeWidth = Math.max(1, pageWidth - (sideMargin * 2));
      const barcodeBoxWidth = Math.min(maxBarcodeWidth, Math.max(overlayBoxWidth, inchesToPx(10, ALBUM_QR_DPI)));

      const textLineHeight = Math.max(60, inchesToPx(0.35, ALBUM_QR_DPI));
      const barcodeBoxHeight = Math.max(90, inchesToPx(0.45, ALBUM_QR_DPI));

      // Couple name (line 1)
      if (hasCouple) {
        const coupleText = String(orderDetails.coupleName).trim();
        const coupleBuf = await tryRenderTextLabelBuffer(coupleText, overlayBoxWidth, textLineHeight);
        try {
          fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Couple label buffer | ok:${!!coupleBuf} | len:${coupleBuf ? coupleBuf.length : 0} | target:${overlayBoxWidth}x${textLineHeight}`);
        } catch (_) {
          // ignore
        }
        if (coupleBuf) {
          try {
            overlaysTop.push({ kind: 'couple', png: PNG.sync.read(coupleBuf) });
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            try { fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Couple label PNG read failed | error:${msg}`); } catch (_) {}
          }
        }
      }

      // Studio name (line 2)
      if (hasStudio) {
        const studioText = String(orderDetails.studioName).trim();
        const studioBuf = await tryRenderTextLabelBuffer(studioText, overlayBoxWidth, textLineHeight);
        try {
          fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Studio label buffer | ok:${!!studioBuf} | len:${studioBuf ? studioBuf.length : 0} | target:${overlayBoxWidth}x${textLineHeight}`);
        } catch (_) {
          // ignore
        }
        if (studioBuf) {
          try {
            overlaysTop.push({ kind: 'studio', png: PNG.sync.read(studioBuf) });
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            try { fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Studio label PNG read failed | error:${msg}`); } catch (_) {}
          }
        }
      }

      if (wantBarcode) {
        // Keep barcode compact so it doesn't dominate the page.
        const barcodeBuf = await tryRenderBarcodeBuffer(text, barcodeBoxWidth, barcodeBoxHeight, false);
        try {
          fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Barcode buffer | ok:${!!barcodeBuf} | len:${barcodeBuf ? barcodeBuf.length : 0} | target:${barcodeBoxWidth}x${barcodeBoxHeight}`);
        } catch (_) {
          // ignore
        }
        if (barcodeBuf) {
          try {
            overlaysBottom.push({ kind: 'barcode', png: PNG.sync.read(barcodeBuf) });
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            try { fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Barcode PNG read failed | error:${msg}`); } catch (_) {}
          }
        }
      }

      if (wantFolderName) {
        // Required format: Job ID: <FolderName>
        const folderNameText = path.basename(FolderPath || '') || '';
        const jobFolderText = `Job ID: ${folderNameText}`;
        const labelBuf = await tryRenderTextLabelBuffer(jobFolderText, overlayBoxWidth, textLineHeight);
        try {
          fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Job ID label buffer | ok:${!!labelBuf} | len:${labelBuf ? labelBuf.length : 0} | target:${overlayBoxWidth}x${textLineHeight}`);
        } catch (_) {
          // ignore
        }
        if (labelBuf) {
          try {
            overlaysBottom.push({ kind: 'jobfolder', png: PNG.sync.read(labelBuf) });
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            try { fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Job ID label PNG read failed | error:${msg}`); } catch (_) {}
          }
        }
      }

      const hasTop = overlaysTop.length > 0;
      const hasBottom = overlaysBottom.length > 0;

      if (hasTop || hasBottom) {
        const belowQrY = qrBottomY + marginBelowQr;

        // 1) Render top overlays (couple/studio) immediately below QR.
        let cursorY = belowQrY;
        for (const o of overlaysTop) {
          const overlay = o.png;
          if (!overlay || !(overlay.width > 0 && overlay.height > 0)) continue;
          const startX = Math.floor((pageWidth - overlay.width) / 2);
          blitOverlayPng(page, overlay, startX, cursorY);
          cursorY += overlay.height + gap;
        }

        // 2) Render bottom overlays (barcode + Job ID) so their block sits 20% above bottom.
        if (hasBottom) {
          const bottomOffset = Math.max(8, Math.floor(pageHeight * 0.20));
          const bottomBlockHeight = overlaysBottom.reduce((sum, o) => sum + (o.png?.height || 0), 0) + (gap * Math.max(0, overlaysBottom.length - 1));
          let bottomStartY = (pageHeight - bottomOffset) - bottomBlockHeight;

          // Ensure the bottom block stays below the top block.
          const minBottomStart = hasTop ? Math.max(cursorY, belowQrY) : belowQrY;
          if (bottomStartY < minBottomStart) bottomStartY = minBottomStart;

          // Ensure it fits on the page.
          if (bottomStartY + bottomBlockHeight > pageHeight - 2) {
            bottomStartY = Math.max(0, pageHeight - bottomBlockHeight - 2);
          }
          if (bottomStartY < 0) bottomStartY = 0;

          let y = bottomStartY;
          for (const o of overlaysBottom) {
            const overlay = o.png;
            if (!overlay || !(overlay.width > 0 && overlay.height > 0)) continue;
            const startX = Math.floor((pageWidth - overlay.width) / 2);
            blitOverlayPng(page, overlay, startX, y);
            y += overlay.height + gap;
          }
        }

        await writePngToFile(page, outPath);

        try {
          const outSize = fs.existsSync(outPath) ? fs.statSync(outPath).size : -1;
          fs.appendFileSync(
            logFile,
            `\n[${new Date().toISOString()}] Overlays rendered | top:${overlaysTop.length} | bottom:${overlaysBottom.length} | bottomOffsetPct:20 | outSize:${outSize}`
          );
        } catch (_) {
          // ignore
        }
      }
    } else if (hasAnyOverlays) {
      try {
        fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Overlay skipped | reason:${text ? 'no-overlays' : 'empty-text'} | couple:${hasCouple} | studio:${hasStudio} | barcode:${wantBarcode} | folderName:${wantFolderName} | barcodeTextLen:${text.length}`);
      } catch (_) {
        // ignore
      }
    }

    try {
      fs.appendFileSync(
        logFile,
        `\n[${new Date().toISOString()}] QR generated successfully | file: ${outPath} | page: ${effectivePageWidth}x${effectivePageHeight} | qrTarget: ${effectiveQrTargetSize}px | bg: ${bgInfo} | bgUsed:${bgResult?.used || 'unknown'}`
      );
    } catch (_) {
      // ignore logging errors
    }

    return { ok: true, outPath, url };
  } catch (err) {
    try {
      const msg = err && err.message ? err.message : String(err);
      fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] QR generation failed | error: ${msg}`);
    } catch (_) {
      // ignore logging errors
    }
    throw err;
  }
}

module.exports = { generateAlbumQr };
