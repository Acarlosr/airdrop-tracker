/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema escuro + azul elétrico (dashboard moderno)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        electric: {
          DEFAULT: '#00d4ff',
          50: '#e6fbff',
          100: '#b3f3ff',
          200: '#80ebff',
          300: '#4de3ff',
          400: '#1adbff',
          500: '#00d4ff',
          600: '#00a8cc',
          700: '#007d99',
          800: '#005166',
          900: '#002633',
        },
        surface: {
          DEFAULT: '#0f1419',
          light: '#1a2332',
          card: '#161e2e',
          elevated: '#1e293b',
        },
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-from) 0%, transparent 70%)',
        'card-glow': 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.08) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.2)',
        'glow-inner': 'inset 0 0 30px rgba(0, 212, 255, 0.05)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 30px rgba(0, 212, 255, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
