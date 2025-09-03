/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        montserrat: ['Montserrat Alternates', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        dmsans: ['DM Sans', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        pacifico: ['Pacifico', 'cursive'],
      },
      colors: {
        'navy': '#0a1929',
        'black': '#000913'
      }
    },
  },
  plugins: [],
}

