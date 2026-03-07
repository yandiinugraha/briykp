/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bri: {
          blue: '#0B5E9E',
          orange: '#F37021',
          light: '#EBF4FA',
          dark: '#063A63'
        }
      }
    },
  },
  plugins: [],
}
