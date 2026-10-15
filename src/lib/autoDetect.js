const SCAN_WIDTH = 400; // px — row analysis runs at this width regardless of source
const CROP_QUALITY = 0.9;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Yielding keeps each unit of work under the long-task threshold, so the
// processing banner and spinner keep animating between pages/crops.
const yieldToEventLoop = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const cropRegion = (source, sx, sy, sw, sh) => {
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  const dataUrl = cropCanvas.toDataURL("image/jpeg", CROP_QUALITY);
  // Release the crop bitmap immediately instead of waiting for GC
  cropCanvas.width = 0;
  cropCanvas.height = 0;
  return dataUrl;
};

export const detectQuestionsFromPages = async (pages, onProgress) => {
  const questions = [];

  for (let i = 0; i < pages.length; i++) {
    if (onProgress) onProgress(i + 1, pages.length);
    const pageImage = pages[i];
    const img = await loadImage(pageImage);

    // Row analysis on a downscaled canvas: ~25x fewer pixels to read back
    // and scan than the full-resolution page.
    const scanScale = Math.min(1, SCAN_WIDTH / img.width);
    const scanWidth = Math.max(1, Math.round(img.width * scanScale));
    const scanHeight = Math.max(1, Math.round(img.height * scanScale));
    const scanCanvas = document.createElement("canvas");
    scanCanvas.width = scanWidth;
    scanCanvas.height = scanHeight;
    const scanCtx = scanCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    scanCtx.drawImage(img, 0, 0, scanWidth, scanHeight);
    const { data } = scanCtx.getImageData(0, 0, scanWidth, scanHeight);
    scanCanvas.width = 0;
    scanCanvas.height = 0;

    const rowBrightness = new Float32Array(scanHeight);
    const threshold = 240;
    // Sampling every other row halves the scan time; skipped rows inherit
    // the previous sampled value so gap boundaries stay contiguous.
    for (let y = 0; y < scanHeight; y += 2) {
      let whitePixels = 0;
      const rowOffset = y * scanWidth * 4;
      for (let x = 0; x < scanWidth; x++) {
        const idx = rowOffset + x * 4;
        if ((data[idx] + data[idx + 1] + data[idx + 2]) / 3 > threshold)
          whitePixels++;
      }
      const ratio = whitePixels / scanWidth;
      rowBrightness[y] = ratio;
      if (y + 1 < scanHeight) rowBrightness[y + 1] = ratio;
    }

    // Map scan-space rows back to full-resolution crops
    const toFullY = (y) => Math.min(img.height, Math.max(0, Math.round(y / scanScale)));

    const gaps = [];
    let gapStart = null;
    const whiteThreshold = 0.85;
    const minGapHeight = Math.floor(scanHeight * 0.02);
    for (let y = 0; y < rowBrightness.length; y++) {
      if (rowBrightness[y] > whiteThreshold) {
        if (gapStart === null) gapStart = y;
      } else {
        if (gapStart !== null && y - gapStart > minGapHeight)
          gaps.push({ start: gapStart, end: y });
        gapStart = null;
      }
    }

    const pushQuestion = (startY, endY) => {
      const top = toFullY(startY);
      const bottom = toFullY(endY);
      if (bottom - top < 2) return;
      questions.push({
        id: Date.now() + questions.length,
        pageIndex: i,
        image: cropRegion(img, 0, top, img.width, bottom - top),
        correctAnswer: [],
        type: "none",
      });
    };

    if (gaps.length > 0) {
      let lastY = 0;
      for (const gap of gaps) {
        if (gap.start - lastY > scanHeight * 0.05) pushQuestion(lastY, gap.start);
        lastY = gap.end;
      }
      if (scanHeight - lastY > scanHeight * 0.05)
        pushQuestion(lastY, scanHeight);
    } else {
      questions.push({
        id: Date.now() + questions.length,
        pageIndex: i,
        image: pageImage,
        correctAnswer: [],
        type: "none",
      });
    }

    // Let the browser paint between pages
    await yieldToEventLoop();
  }

  return questions;
};
