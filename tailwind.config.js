/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans Variable'", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          solid: "rgb(var(--brand-solid) / <alpha-value>)",
        },
        "on-brand": "rgb(var(--on-brand) / <alpha-value>)",
        "on-in": "rgb(var(--on-in) / <alpha-value>)",
        "on-out": "rgb(var(--on-out) / <alpha-value>)",
        dock: {
          DEFAULT: "rgb(var(--dock) / <alpha-value>)",
          text: "rgb(var(--on-dock) / <alpha-value>)",
          active: "rgb(var(--dock-active) / <alpha-value>)",
          "active-text": "rgb(var(--on-dock-active) / <alpha-value>)",
        },
        in: {
          DEFAULT: "rgb(var(--in) / <alpha-value>)",
          solid: "rgb(var(--in-solid) / <alpha-value>)",
        },
        out: {
          DEFAULT: "rgb(var(--out) / <alpha-value>)",
          solid: "rgb(var(--out-solid) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        sheet: "var(--shadow-sheet)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
