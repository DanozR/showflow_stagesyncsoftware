/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#333333',
        taupe: '#B8A394',
        coral: '#f28c82'
      }
    },
  },
  plugins: [],
};