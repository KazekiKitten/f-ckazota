export const ACCENTS = [
  {
    id: "red",
    vi: "Đỏ",
    en: "Red",
    light: ["#dc2626", "#b91c1c"],
    dark: ["#ef4444", "#f87171"],
  },
  {
    id: "blue",
    vi: "Xanh dương",
    en: "Blue",
    light: ["#2563eb", "#1d4ed8"],
    dark: ["#3b82f6", "#60a5fa"],
  },
  {
    id: "green",
    vi: "Xanh lá",
    en: "Green",
    light: ["#16a34a", "#15803d"],
    dark: ["#22c55e", "#4ade80"],
  },
  {
    id: "violet",
    vi: "Tím",
    en: "Violet",
    light: ["#7c3aed", "#6d28d9"],
    dark: ["#8b5cf6", "#a78bfa"],
  },
  {
    id: "orange",
    vi: "Cam",
    en: "Orange",
    light: ["#ea580c", "#c2410c"],
    dark: ["#f97316", "#fb923c"],
  },
  {
    id: "pink",
    vi: "Hồng",
    en: "Pink",
    light: ["#db2777", "#be185d"],
    dark: ["#ec4899", "#f472b6"],
  },
];

export const ACCENT_IDS = ACCENTS.map((a) => a.id);

export const getAccent = (id) =>
  ACCENTS.find((a) => a.id === id) || ACCENTS[0];
