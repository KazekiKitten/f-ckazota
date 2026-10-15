import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const PAGE_RENDER_SCALE = 1.6;
// JPEG encodes several times faster than PNG for a full page, keeping each
// page's main-thread work well under the long-task threshold (and smaller in
// memory). At this scale and quality, text stays crisp for cropping.
const PAGE_ENCODE_QUALITY = 0.95;

let pdfjsPromise = null;

const getPdfjs = () => (pdfjsPromise ??= import("pdfjs-dist"));

const applyWorker = (pdfjsLib) => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
};

export const pdfToImages = async (file, onPage) => {
  const pdfjsLib = await getPdfjs();
  applyWorker(pdfjsLib);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      try {
        const viewport = page.getViewport({ scale: PAGE_RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        await page.render({ canvasContext: context, viewport }).promise;
        images.push({
          dataUrl: canvas.toDataURL("image/jpeg", PAGE_ENCODE_QUALITY),
          pageNumber: i,
        });
        // Release the decoded bitmap right away instead of waiting for GC
        canvas.width = 0;
        canvas.height = 0;
        onPage?.(i, pdf.numPages);
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await pdf.destroy();
  }

  return images;
};
