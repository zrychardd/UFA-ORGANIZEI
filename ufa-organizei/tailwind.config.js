/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // "class" = o dark mode só ativa quando a classe `dark` estiver no <html>
  // Isso nos dá controle total via botão, independente do sistema do usuário
  darkMode: 'class',
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