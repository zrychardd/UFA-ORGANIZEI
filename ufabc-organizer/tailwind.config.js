/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ufabcVerde: '#00674F',
        ufabcDourado: '#d3af37',
      }
    },
  },
  plugins: [],
}