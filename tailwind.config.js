/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
      colors: {
        background: '#0B0C0F',
        sidebar: '#101114',
        card: '#181A1F',
        cardHover: '#1F2228',
        border: '#26282D',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        text: '#D0D2D6',
        textMuted: '#6E7176',
        inputBg: '#1C1E23',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
