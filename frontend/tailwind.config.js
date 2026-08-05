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
        // Tema escuro + âmbar (paleta "Ravi.Malhotra")
        primary: {
          50: '#fef8ec',
          100: '#fcecc7',
          200: '#f8d78a',
          300: '#f5c15e',
          400: '#f2b03c',
          500: '#f0a020',
          600: '#d9861a',
          700: '#b56d12',
          800: '#8f550e',
          900: '#6b3f0a',
        },
        electric: {
          DEFAULT: '#f0a020',
          50: '#fef8ec',
          100: '#fcecc7',
          200: '#f8d78a',
          300: '#f5c15e',
          400: '#f2b03c',
          500: '#f0a020',
          600: '#d9861a',
          700: '#b56d12',
          800: '#8f550e',
          900: '#6b3f0a',
        },
        surface: {
          DEFAULT: '#0a0a0c',
          light: '#1c1c21',
          card: '#16161a',
          elevated: '#1f1f24',
        },
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-from) 0%, transparent 70%)',
        'card-glow': 'linear-gradient(180deg, transparent 0%, rgba(240, 160, 32, 0.08) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(240, 160, 32, 0.15)',
        'glow-lg': '0 0 40px rgba(240, 160, 32, 0.2)',
        'glow-inner': 'inset 0 0 30px rgba(240, 160, 32, 0.05)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(240, 160, 32, 0.15)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 30px rgba(240, 160, 32, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
