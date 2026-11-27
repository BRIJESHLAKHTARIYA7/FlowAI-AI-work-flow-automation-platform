/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Indigo primary
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        accent: {
          500: '#8B5CF6', // Violet
          600: '#7C3AED',
          700: '#6D28D9',
        },
        surface: {
          light: '#FFFFFF',
          muted: '#F8FAFC',
          border: '#E2E8F0',
          dark: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
