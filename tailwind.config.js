const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Componentes HeroUI (single: button.js o glob de todos)
    "./node_modules/@heroui/theme/dist/components/button.js",
    "./node_modules/@heroui/theme/dist/components/(button|snippet|code|input|switch|card|navbar|divider|progress|chip).js",
    "./node_modules/@heroui/theme/dist/**/*.js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
