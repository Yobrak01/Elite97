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
          950: '#000000', // True Void Black
          900: '#02050A', // Abyssal depth
          800: '#040A14',
          700: '#081224',
          600: '#0D1E3A',
        },
        accent: {
          gold: '#00F0FF', // Ice Cyan
          amber: '#4A00E0', // Deep purple
          glow: 'rgba(0, 240, 255, 0.4)',
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'], // Body text
        display: ['Syncopate', 'sans-serif'], // Chilling headings
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.4)',
        'glow-cyan-intense': '0 0 35px rgba(0, 240, 255, 0.6)',
        'glow-amber': '0 0 15px rgba(74, 0, 224, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.6)' },
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
