import { emptyOptions } from "./questions";

export const getRelativePosition = (e, img) => {
  const rect = img.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
};

export const cropToDataUrl = (img, selection) => {
  const { x, y, width, height } = selection;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.naturalWidth * width;
  canvas.height = img.naturalHeight * height;
  ctx.drawImage(
    img,
    img.naturalWidth * x,
    img.naturalHeight * y,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/png");
};

export const finalizeCroppedQuestions = (croppedQuestions) =>
  croppedQuestions.map((q, idx) => ({
    ...q,
    number: idx + 1,
    type: "multiple_choice",
    options: emptyOptions(),
  }));
