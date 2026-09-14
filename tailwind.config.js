/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['"Tiro Bangla"', '"Hind Siliguri"', 'serif'],
        serifbn: ['"Tiro Bangla"', 'serif'],
      },
      colors: {
        // Durga Puja palette — Cherry Wine reds, Smooth Gold, Pure Linen
        maroon: {
          50: '#fdf3f4', 100: '#fae5e7', 200: '#f4c8cd', 300: '#e999a3',
          400: '#d95f6f', 500: '#c8373d', 600: '#ad2d38', 700: '#8d2430',
          800: '#7a1e29', 900: '#651822', 950: '#3d0c13',
        },
        gold: {
          50: '#fdfaf0', 100: '#faf3dc', 200: '#f4e4b4', 300: '#eccf82',
          400: '#e0b455', 500: '#cdac5f', 600: '#b08a3e', 700: '#8f6c31',
        },
        linen: '#FFF9EE',
      },
      boxShadow: {
        card: '0 2px 4px rgba(101,24,34,.04), 0 12px 28px -12px rgba(101,24,34,.14)',
        pop: '0 4px 10px rgba(101,24,34,.08), 0 24px 48px -16px rgba(101,24,34,.25)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .45s ease-out both',
      },
    },
  },
  plugins: [],
}
