/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: 'var(--color-text-main)',
        slate: {
          400: 'var(--color-text-muted)',
          500: 'var(--color-text-muted-dark)',
          800: 'var(--color-bg-800)',
          900: 'var(--color-bg-900)',
        },
        navy: {
          950: 'var(--color-bg-950)',
          900: 'var(--color-bg-900)',
          800: 'var(--color-bg-800)',
          700: 'var(--color-bg-700)',
          600: 'var(--color-bg-600)',
        },
        accent: {
          gold: 'var(--color-accent-gold)',
          amber: 'var(--color-accent-amber)',
          glow: 'var(--color-glow-cyan)',
        },
        textMain: 'var(--color-text-main)',
        textMuted: 'var(--color-text-muted)',
      },
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        display: ['Syncopate', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px var(--color-glow-cyan)',
        'glow-cyan-intense': '0 0 35px var(--color-glow-cyan)',
        'glow-amber': '0 0 15px var(--color-glow-amber)',
        'glow-red': '0 0 15px var(--color-glow-red)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px var(--color-glow-cyan)' },
          '50%': { boxShadow: '0 0 25px var(--color-glow-cyan)' },
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
