/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0f',
          900: '#0e0e16',
          800: '#14141f',
          700: '#1c1c2b',
          600: '#262638',
        },
        accent: {
          violet: '#7c5cff',
          cyan: '#22d3ee',
          emerald: '#34d399',
          amber: '#fbbf24',
          blue: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Clash Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 92, 255, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)' },
          '50%': { boxShadow: '0 0 35px rgba(124, 92, 255, 0.7), 0 0 60px rgba(34, 211, 238, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
