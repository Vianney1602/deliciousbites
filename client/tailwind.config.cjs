/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bakeryPink: '#ffe5ec',
        bakerySoftPink: '#fff5f8',
        bakeryMidPink: '#ed859d',
        bakeryPrimary: '#ff6f91',
        bakeryBrown: '#5C4033',
        bakeryCream: '#fff8f2',
        bakeryPistachio: '#d8f3dc',
        bakeryRose: '#ffd6e0',
        bakeryIvory: '#fffdf8'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe UI"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        display: ['"Fraunces"', 'serif'],
        script: ['"Parisienne"', 'cursive']
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

