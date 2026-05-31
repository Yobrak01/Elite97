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
          950: '#060913',
          900: '#0a0e1a',
          800: '#11182c',
          700: '#1e2942',
          600: '#334155',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          glow: 'rgba(59,130,246,0.3)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.4)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(59, 130, 246, 0.6)' },
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
