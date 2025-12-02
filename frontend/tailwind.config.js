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
    },
  },
  plugins: [],
}
