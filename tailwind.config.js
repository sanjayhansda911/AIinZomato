/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zomato: {
          DEFAULT: '#E23744',
          50: '#FDECEF',
          100: '#FBD2D7',
          200: '#F7A7B0',
          300: '#F37D8A',
          400: '#EF5263',
          500: '#E23744',
          600: '#CB202D',
          700: '#A41723',
          800: '#7D0F19',
          900: '#56080F',
          dark: '#1C1C1C',
          gold: '#FFB800',
          green: '#24963F',
          pureVeg: '#008000',
          surface: '#F8F9FA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'phone': '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 12px #1E293B, 0 0 0 14px #334155',
        'bottom-nav': '0 -4px 16px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
};
