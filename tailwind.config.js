/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Desert-inspired color palette for Southwest USA
        desert: {
          50: '#fef7ed',
          100: '#fdecd3',
          200: '#fad5a5',
          300: '#f6b96d',
          400: '#f19432',
          500: '#ee7c15',
          600: '#d9610a',
          700: '#b44c0c',
          800: '#913d10',
          900: '#763411',
          950: '#411a06',
        },
        canyon: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        sunset: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glass-shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(255, 255, 255, 0.05)',
        'glass-lg': '0 25px 50px -12px rgba(255, 255, 255, 0.08)',
      }
    },
  },
  plugins: [],
};
