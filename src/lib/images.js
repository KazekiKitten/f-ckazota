const MAX_IMAGE_DIMENSION = 2000;
const IMAGE_QUALITY = 0.92;

/**
 * Decodes a data URL, and if the image is larger than
 * MAX_IMAGE_DIMENSION on its longest edge, re-encodes it at a smaller
 * size. Test questions stay fully readable while the in-memory footprint
 * of the page shrinks by an order of magnitude for phone-camera uploads.
 */
const downscaleIfNeeded = (dataUrl, mimeType) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const longestEdge = Math.max(img.width, img.height);
      if (!longestEdge || longestEdge <= MAX_IMAGE_DIMENSION) {
        resolve(dataUrl);
        return;
      }
      const scale = MAX_IMAGE_DIMENSION / longestEdge;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const outputType =
        mimeType === "image/png" ? "image/png" : "image/jpeg";
      resolve(
        outputType === "image/png"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", IMAGE_QUALITY),
      );
      canvas.width = 0;
      canvas.height = 0;
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const readImagesAsDataUrls = async (files) => {
  const dataUrls = await Promise.all(
    Array.from(files).map((file) => readAsDataUrl(file)),
  );
  return Promise.all(
    dataUrls.map((dataUrl, index) =>
      downscaleIfNeeded(dataUrl, files[index].type),
    ),
  );
};
