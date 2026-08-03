import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A1220",
        deep: "#0B2A4A",
        "deep-light": "#123A66",
        storm: "#4C6480",
        mist: "#F1F4F9",
        "mist-dark": "#E4E9F1",
        gold: "#C9973B",
        "gold-light": "#E4C170",
        "gold-deep": "#A97C25",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        "droplet-grid":
          "radial-gradient(circle at 1px 1px, rgba(201,151,59,0.15) 1px, transparent 0)",
      },
      keyframes: {
        rainfall: {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(220%)", opacity: "0" },
        },
        ripple: {
          "0%": { transform: "scale(0.6)", opacity: "0.6" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rainfall: "rainfall 2.6s linear infinite",
        ripple: "ripple 2.2s ease-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(11,42,74,0.25)",
        "card-hover": "0 20px 40px -14px rgba(11,42,74,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
