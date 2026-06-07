/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#000000', // True Black for ultimate depth
          900: '#080c14', // Very deep obsidian navy
          800: '#0e1524',
          700: '#17223b',
          600: '#263b63',
        },
        accent: {
          gold: '#D4AF37', // Imperial Gold
          amber: '#F59E0B',
          glow: 'rgba(212,175,55,0.4)',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'], // Body text
        display: ['Cinzel', 'serif'],       // Majestic headings
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212,175,55,0.4)',
        'glow-gold-intense': '0 0 35px rgba(212,175,55,0.6)',
        'glow-amber': '0 0 15px rgba(245,158,11,0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212,175,55,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(212,175,55,0.6)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
