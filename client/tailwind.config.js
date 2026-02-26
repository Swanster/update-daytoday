/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Color Hunt Palette
        'ch-light': '#f9f7f7',
        'ch-soft': '#dbe2ef',
        'ch-primary': '#3f72af',
        'ch-dark': '#112d4e',

        // Semantic mappings
        'primary-dark': '#112d4e', // mapped to ch-dark
        'primary-accent': '#3f72af', // mapped to ch-primary
        'bg-cream': '#f9f7f7', // mapped to ch-light
        'bg-green': '#f0fdf4', // keeping for table alternate or map to ch-soft if desired
        'row-primary': '#ffffff',
        'row-secondary': '#f9f7f7', // ch-light
        'row-hover': '#dbe2ef', // ch-soft
        'border-color': '#dbe2ef', // ch-soft 
        'text-dark': '#112d4e', // ch-dark
        'text-light': '#f9f7f7',
        'accent-coral': '#3f72af', // mapped to ch-primary
        'status-done': '#10b981', // keeping logical colors for statuses
        'status-progress': '#3f72af', // ch-primary
        'status-hold': '#f59e0b',
        'brand': {
          50: '#f9f7f7',
          100: '#dbe2ef',
          500: '#3f72af',
          600: '#305c91', // darker shade of ch-primary for hover
          700: '#112d4e',
        }
      },
      fontFamily: {
        'lexend': ['Lexend', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Softer shadow
        'custom-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
