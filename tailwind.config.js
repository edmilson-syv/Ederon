/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fff9eb',
          100: '#ffeed1',
          200: '#ffd9a3',
          300: '#ffbe66',
          400: '#ff9b29',
          500: '#d4af37',
          600: '#cc8d1a',
          700: '#aa6d18',
          800: '#8a571a',
          900: '#72491a',
          950: '#42260b',
        },
        card: {
          dark: '#121212',
        },
        accent: {
          dark: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
