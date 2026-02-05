/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#393939',
        'primary-accent': '#FF7F5B',
        'bg-cream': '#FFFCEF',
        'bg-green': '#D2EBCD',
        'row-primary': '#FFFCEF',
        'row-secondary': '#D2EBCD',
        'row-hover': '#e8f5e9',
        'border-color': '#393939',
        'text-dark': '#393939',
        'text-light': '#FFFCEF',
        'accent-coral': '#FF7F5B',
        'status-done': '#4caf50',
        'status-progress': '#FF7F5B',
        'status-hold': '#ffa726',
      },
      fontFamily: {
        'lexend': ['Lexend', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 20px rgba(57, 57, 57, 0.2)',
        'custom-sm': '0 2px 8px rgba(57, 57, 57, 0.15)',
      }
    },
  },
  plugins: [],
}
