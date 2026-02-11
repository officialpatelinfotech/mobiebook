const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const DEFAULT_PAGE_WIDTH = 1024;
const DEFAULT_PAGE_HEIGHT = 768;
const DEFAULT_QR_TARGET_SIZE = 420; // px
const QUIET_ZONE_MODULES = 4; // standard QR quiet-zone

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

async function generateQrPageWithBackground({ url, outPath, backgroundPath, backgroundDataUrl, pageWidth, pageHeight, qrTargetSize }) {
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

  // If the background orientation doesn't match the target page, rotate it 90°.
  // Important: do NOT crop during rotation (we swap dimensions).
  try {
    const bgW = Number(bgImage?.width) || Number(bgImage?.bitmap?.width) || 0;
    const bgH = Number(bgImage?.height) || Number(bgImage?.bitmap?.height) || 0;
    const pageIsLandscape = resolvedPageWidth >= resolvedPageHeight;
    const bgIsLandscape = bgW >= bgH;
    if (bgW > 0 && bgH > 0 && bgW !== bgH && pageIsLandscape !== bgIsLandscape) {
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
    const w = Number(dim?.width);
    const h = Number(dim?.height);
    if (!(w > 0 && h > 0)) continue;

    if (firstWidth == null) {
      firstWidth = w;
      firstHeight = h;
    } else if (w !== firstWidth || h !== firstHeight) {
      mixedSizes = true;
    }

    if (h >= w) seenPortrait = true; else seenLandscape = true;
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
    const jimp = require('jimp');
    const Jimp = jimp.Jimp;
    const JimpMime = jimp.JimpMime;

    // Generate a Code128 barcode
    const rawPng = await bwipjs.toBuffer({
      bcid: 'code128',
      text: t,
      scale: 3,
      height: 12,
      includetext: !!includeText,
      textxalign: 'center',
      textsize: 12,
      backgroundcolor: 'FFFFFF'
    });

    const barcode = await Jimp.read(rawPng);
    // Force exact target size to keep layout stable
    barcode.contain({ w: targetWidth, h: targetHeight });
    return await barcode.getBuffer(JimpMime.png);
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
  const url = `http://localhost:4200/#/?q=${resolvedUniqIdText}`;

  const layout = detectLayoutFromFolderImages(FolderPath);

  const pageTypeText = String(pageType ?? '').trim().toLowerCase();
  const isSpreadMode = pageTypeText === 'spread';

  // When PageType is Spread, the QR should be created at HALF the spread size (single-page size).
  // However, for portrait folders the detected layout is already a single page (portrait WxH),
  // so we should NOT halve the width again.
  const layoutOrientation = String(layout?.orientation ?? '').trim().toLowerCase();
  const shouldHalfWidthForSpread = isSpreadMode && layoutOrientation === 'landscape';

  const effectivePageWidth = (shouldHalfWidthForSpread && Number(layout.pageWidth) > 1)
    ? Math.max(1, Math.floor(Number(layout.pageWidth) / 2))
    : Number(layout.pageWidth);
  const effectivePageHeight = Number(layout.pageHeight);

  const effectiveMinSide = Math.min(effectivePageWidth, effectivePageHeight);
  const effectiveQrTargetSize = Math.max(
    220,
    Math.min(Math.floor(effectiveMinSide * 0.45), Math.floor(effectiveMinSide - 40))
  );

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
      `\n[${new Date().toISOString()}] QR generation started | id: ${resolvedUniqIdText} | file: ${outPath} | url: ${url} | bg: ${bgInfo} | bgPathExists:${bgPathExists} | bgPathSize:${bgPathSize} | dataUrlValid:${dataUrlLooksValid} | pageType:${pageTypeText || 'unknown'} | page:${effectivePageWidth}x${effectivePageHeight} | qrTarget:${effectiveQrTargetSize} | layoutReason:${layout.reason}`
    );
  } catch (_) {
    // ignore logging errors
  }

  try {
    // Overwrites album-qr.png if it already exists
    const { PNG } = require('pngjs');

    const bgResult = await generateQrPageWithBackground({
      url,
      outPath,
      backgroundPath: qrBgPath,
      backgroundDataUrl: qrBgDataUrl,
      pageWidth: effectivePageWidth,
      pageHeight: effectivePageHeight,
      qrTargetSize: effectiveQrTargetSize
    });

    // Flag logic:
    // 1. Barcode requested? -> Render barcode (with or without text based on printFolderNameBelowBarcode)
    // 2. Barcode NOT requested but Text requested? -> Render text only.

    if (generateBarcode) {
      const text = String(barcodeText ?? '').trim();
      if (text) {
        // Read the generated QR page and overlay barcode under QR.
        const existing = fs.readFileSync(outPath);
        const page = PNG.sync.read(existing);

        const pageWidth = page.width || layout.pageWidth || DEFAULT_PAGE_WIDTH;
        const pageHeight = page.height || layout.pageHeight || DEFAULT_PAGE_HEIGHT;

        const barcodeWidth = Math.max(220, Math.floor(pageWidth * 0.55));
        const includeText = !!printFolderNameBelowBarcode;
        const barcodeHeight = Math.max(55, Math.floor(pageHeight * (includeText ? 0.12 : 0.09)));
        const barcodeBuf = await tryRenderBarcodeBuffer(text, barcodeWidth, barcodeHeight, includeText);

        if (barcodeBuf) {
          const overlay = PNG.sync.read(barcodeBuf);

          // Position: centered, directly below the QR
          const margin = 18;
          const qrBottomY = (bgResult && bgResult.offsetY != null && bgResult.qrPixelSize != null)
            ? (bgResult.offsetY + bgResult.qrPixelSize)
            : Math.floor((pageHeight + effectiveQrTargetSize) / 2);

          const startX = Math.floor((pageWidth - overlay.width) / 2);
          let startY = qrBottomY + margin;
          if (startY + overlay.height > pageHeight) {
            // Clamp to fit
            startY = Math.max(0, pageHeight - overlay.height - 8);
          }

          blitOverlayPng(page, overlay, startX, startY);

          // Write final page (QR + barcode)
          await writePngToFile(page, outPath);
        }
      }
    } else if (printFolderNameBelowBarcode) {
      // Just text, no barcode
      const text = String(barcodeText ?? '').trim();
      if (text) {
        const existing = fs.readFileSync(outPath);
        // We need Jimp to render text easily
        const { Jimp, JimpMime } = require('jimp');

        const image = await Jimp.read(existing);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK); // Standard black font

        const pageWidth = Number(image.width) || Number(image.bitmap.width);
        const pageHeight = Number(image.height) || Number(image.bitmap.height);

        // Measure text width to center it
        const textWidth = Jimp.measureText(font, text);
        const textHeight = Jimp.measureTextHeight(font, text, pageWidth);

        const qrBottomY = (bgResult && bgResult.offsetY != null && bgResult.qrPixelSize != null)
          ? (bgResult.offsetY + bgResult.qrPixelSize)
          : Math.floor((pageHeight + effectiveQrTargetSize) / 2);

        const margin = 20;
        const startX = Math.max(0, Math.floor((pageWidth - textWidth) / 2));
        let startY = qrBottomY + margin;

        if (startY + textHeight > pageHeight) {
          startY = Math.max(0, pageHeight - textHeight - 8);
        }

        image.print({ font, x: startX, y: startY, text: text });

        // Save back to disk
        const buffer = await image.getBuffer(JimpMime.png);
        const { PNG } = require('pngjs');
        const finalPage = PNG.sync.read(buffer);
        await writePngToFile(finalPage, outPath);
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
