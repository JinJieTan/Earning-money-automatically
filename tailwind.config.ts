import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a111f",
        panel: "#121d33",
        accent: "#35d5ff",
        good: "#23c16b",
        warn: "#f8b84e",
        bad: "#ef5f67"
      }
    }
  },
  plugins: []
};

export default config;
