/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'k-background': '#E8F5E9',
        'k-green': '#81C784',
        'k-green-dark': '#2E7D32',
        'k-yellow': '#FFF59D',
        'k-gray': '#9E9E9E',
      },
      maxWidth: {
        'mobile': '430px',
      },
    },
  },
  plugins: [],
}
