/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#22C55E',
          'green-dark': '#16A34A',
          'green-light': '#DCFCE7',
          'green-bg': '#F0FDF4',
        },
      },
    },
  },
  plugins: [],
};
