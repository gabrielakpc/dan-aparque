import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6F0",
        card: "#FFFFFF",
        ink: "#2A201C",
        ink2: "#4E403A",
        muted: "#8B7B72",
        line: "#EBE2D8",
        line2: "#DBD0C3",
        wine: { DEFAULT: "#A81B27", deep: "#7E1119" },
        blush: "#FAEDEC",
        brass: "#47505A",
        ok: { DEFAULT: "#1F6B4A", bg: "#E9F3ED" },
        warn: { DEFAULT: "#A9700B", bg: "#FBF1DF" },
        bad: { DEFAULT: "#A81B27", bg: "#FAE7E6" },
        off: { DEFAULT: "#8E8683", bg: "#F1EDE8" },
      },
      fontFamily: {
        display: ["'Bodoni Moda'", "Georgia", "serif"],
        sans: ["Montserrat", "ui-sans-serif", "system-ui"],
        body: ["'Public Sans'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
