/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ps: {
          bg: "var(--ps-bg)",
          surf: "var(--ps-surf)",
          card: "var(--ps-card)",
          card2: "var(--ps-card2)",
          tile: "var(--ps-tile)",
          primary: "var(--ps-primary)",
          "purple-light": "var(--ps-purple-light)",
          "purple-dark": "var(--ps-purple-dark)",
          cyan: "var(--ps-cyan)",
          green: "var(--ps-green)",
          amber: "var(--ps-amber)",
          red: "var(--ps-red)",
          white: "var(--ps-white)",
          muted: "var(--ps-muted)",
          dim: "var(--ps-dim)",
          brd: "var(--ps-brd)",
          brd2: "var(--ps-brd2)",
        },
      },
      fontFamily: {
        sans: [
          "var(--ps-font-sans)",
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--ps-font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
        jakarta: ["Plus Jakarta Sans", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "ps-caption": ["var(--ps-text-caption)", { lineHeight: "var(--ps-leading-caption)" }],
        "ps-label": ["var(--ps-text-label)", { lineHeight: "var(--ps-leading-label)" }],
        "ps-body-sm": ["var(--ps-text-body-sm)", { lineHeight: "var(--ps-leading-body-sm)" }],
        "ps-body": ["var(--ps-text-body)", { lineHeight: "var(--ps-leading-body)" }],
        "ps-title": ["var(--ps-text-title)", { lineHeight: "var(--ps-leading-title)" }],
        "ps-title-lg": ["var(--ps-text-title-lg)", { lineHeight: "var(--ps-leading-title-lg)" }],
        "ps-display": ["var(--ps-text-display)", { lineHeight: "var(--ps-leading-display)" }],
      },
      borderRadius: {
        "ps-btn": "14px",
        "ps-input": "0.75rem",
      },
      transitionDuration: {
        "ps-instant": "100ms",
        "ps-fast": "160ms",
        "ps-normal": "250ms",
        "ps-moderate": "350ms",
        "ps-slow": "500ms",
      },
      transitionTimingFunction: {
        "ps-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "ps-enter": "cubic-bezier(0, 0, 0.2, 1)",
        "ps-exit": "cubic-bezier(0.4, 0, 1, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "ps-shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        marquee: "marquee 10s linear infinite",
        "ps-shimmer": "ps-shimmer 1.4s linear infinite",
      },
      minHeight: {
        "ps-hit": "44px",
      },
      minWidth: {
        "ps-hit": "44px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
  darkMode: "class",
};
