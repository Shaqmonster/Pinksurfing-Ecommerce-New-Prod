/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        backgroundImage: {
          "gradient-to-r": "linear-gradient(to right, #6D00FB, #9747FF)"
        },
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 10s linear infinite",
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        robotoMono: ['"Roboto Mono"', 'monospace'], // Add Roboto Mono
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("daisyui")],
  darkMode: "class",
};
