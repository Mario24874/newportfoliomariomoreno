/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        blinkCaret: {
          'from, to': { 'border-right-color': 'transparent' },
          '50%': { 'border-right-color': 'currentColor' },
        }
      },
      animation: {
        blink: 'blinkCaret .75s step-end infinite',
      }
    },
  },
  plugins: [],
}