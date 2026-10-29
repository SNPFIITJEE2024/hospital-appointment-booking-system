/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff9ff',
          100: '#dcf1ff',
          200: '#b3e3ff',
          300: '#79cdff',
          400: '#3faeff',
          500: '#1590f7',
          600: '#0472dd',
          700: '#035bb1',
          800: '#074d91',
          900: '#0a4277',
          950: '#072a4d',
        },
      },
      keyframes: {
        modalIn: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
