import type { Config } from "tailwindcss";
import { colors, radius } from "./src/lib/design-tokens";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Token DESIGN.md (hex hanya di src/lib/design-tokens.ts)
        ...colors,
      },
      borderRadius: { ...radius },
      fontFamily: { sans: ["var(--font-manrope)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
