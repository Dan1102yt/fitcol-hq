/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        gold: "var(--gold)",
        goldsoft: "var(--gold-soft)",
        rojo: "var(--red)",
        cielo: "var(--blue)",
        good: "var(--good)",
        warn: "var(--warn)",
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', "Impact", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
