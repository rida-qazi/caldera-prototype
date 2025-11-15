/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        "cal-bg": "#F3F7F3",
        "cal-surface": "#FFFFFF",
        "cal-border": "#E0E8E0",
        "cal-primary": "#6ABF69",
        "cal-primary-soft": "#E8F5E9",
        "cal-primary-deep": "#4E8055",
        "cal-text": "#2A2F28",
        "cal-muted": "#6B7B6A",
      },
      fontFamily: {
        heading: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      borderRadius: {
        soft: "14px",
      },
    },
  },
  plugins: [require("daisyui")], // you can keep this or remove it later if you don’t use DaisyUI components
};
