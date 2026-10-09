/**
 * SINGLE SOURCE OF TRUTH untuk token desain (dari DESIGN.md — Peta Belajar Mint).
 * Hex hanya boleh muncul di file ini. Tailwind config & CSS vars membaca dari sini.
 */
export const colors = {
  primary: "#1B1B1B",
  canvas: "#161616",
  window: "#E3EDE5",
  card: "#F4F6F3",
  dark: "#1B1B1B",
  "dark-elev": "#252B26",
  ink: "#171717",
  "ink-2": "#657066",
  line: "#D2DCD3",
  inverse: "#FFFFFF",
  "status-gap": "#B3452F",
  "status-half": "#C8A02E",
  "status-master": "#3E7C4F",
} as const;

export const radius = {
  frame: "40px",
  card: "24px",
  tile: "18px",
  control: "14px",
  pill: "999px",
} as const;

export const spacing = { unit: 8, page: 42, column: 18 } as const;
