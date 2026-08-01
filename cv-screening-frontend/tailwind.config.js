/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B63F6',
        secondary: '#0EA371',
        info: '#0284C7',
        danger: '#DC2626',
        warning: '#D97706',
      }
    },
  },
  plugins: [],
}
