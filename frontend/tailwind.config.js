/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dancing': ['"Dancing Script"', 'cursive'],
        'great-vibes': ['"Great Vibes"', 'cursive'],
        'pacifico': ['"Pacifico"', 'cursive'],
      },
      colors: {
        'signature-black': '#000000',
        'signature-blue': '#0000FF',
        'signature-red': '#FF0000',
      },
      animation: {
        'bounce-once': 'bounce-once 0.5s ease-in-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

