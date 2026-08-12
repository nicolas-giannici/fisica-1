export const MEDIA = Object.freeze({
  vacuum: { name: "Vacío", index: 1 },
  air: { name: "Aire", index: 1.00029 },
  water: { name: "Agua", index: 1.33 },
  ice: { name: "Hielo", index: 1.309 },
  glass: { name: "Vidrio", index: 1.5 },
  glycerin: { name: "Glicerina", index: 1.473 },
  diamond: { name: "Diamante", index: 2.419 }
});

export const PRESETS = Object.freeze([
  ["Aire → agua", "air", "water"],
  ["Agua → aire", "water", "air"],
  ["Aire → vidrio", "air", "glass"],
  ["Vidrio → aire", "glass", "air"],
  ["Diamante → aire", "diamond", "air"]
]);
