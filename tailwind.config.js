/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#A855F7',
          pink: '#EC4899',
          blue: '#06B6D4',
          green: '#10B981',
          yellow: '#FCD34D',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        'gradient-rainbow': 'linear-gradient(135deg, #A855F7 0%, #EC4899 25%, #06B6D4 50%, #10B981 75%, #FCD34D 100%)',
      },
    },
  },
  plugins: [],
  }
