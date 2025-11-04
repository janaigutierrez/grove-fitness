/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'grove-primary': '#2D5016',
        'grove-secondary': '#4CAF50',
        'grove-light': '#e8f5e9',
        'grove-dark': '#1B3010',
      }
    },
  },
  plugins: [],
}