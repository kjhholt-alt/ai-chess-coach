import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "chess-dark": "#779952",
        "chess-light": "#edeed1",
        "chess-bg": "#111827",
        "chess-card": "#1f2937",
        "chess-accent": "#10b981",
        "chess-accent-hover": "#059669",
      },
    },
  },
  plugins: [],
};
export default config;
