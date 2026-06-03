/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      colors: {
        // High Contrast Custom Palette mapped to semantic names if needed, 
        // but using standard slate/indigo/emerald with dark mode variants is often enough.
      }
    },
  },
  plugins: [],
}
