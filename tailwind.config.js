/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Vibrant Lime Green (Energetic, Action-oriented)
        lime: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#3f6212',
          900: '#365314',
        },
        // Secondary - Electric Blue (Trust, Technology)
        electric: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Accent - Hot Pink (Fun, Social)
        hotpink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Signal - the light-mode accent. Lime reads as neon on a dark
        // canvas but disappears on white (1.5:1), so the light canvas
        // uses these instead: still energetic, still KIKY, legible.
        signal: {
          300: '#4d9c1a',
          400: '#3f8415',
          500: '#2f6b11',
          600: '#275a0e',
          700: '#1d460b',
        },
        // Sunset Orange (Warmth, Energy)
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
        },
        // Ocean Teal (Calm, Nature)
        ocean: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Dark theme colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        /* Canvas + ink for the light-first system. `dark-*` is the
           app-wide semantic scale, so these five tokens are what a
           light canvas is actually built from. */
        canvas: '#f7f5f2',
        surface: '#ffffff',
        ink: '#14161a',
        mute: '#5c6470',
        faint: '#6a7078',
        hairline: '#e6e2dc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      boxShadow: {
        'glow-lime': 'none',
        'glow-electric': 'none',
        'glow-pink': 'none',
        'card': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'float': '0 12px 32px rgba(0, 0, 0, 0.45)',
        'inner-glow': 'none',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.125rem',
        '4xl': '1.25rem',
      },
      transitionDuration: {
        '150': '180ms',
        '200': '180ms',
        '300': '180ms',
        '500': '180ms',
        '700': '180ms',
        '1000': '180ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-slow': 'none',
        'bounce-slow': 'none',
        'slide-up': 'slideUp 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.36s ease-out',
        'scale-in': 'scaleIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow': 'spin 8s linear infinite',
        'wiggle': 'none',
        'gradient': 'none',
        'morph': 'none',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-40px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      },
    },
  },
  plugins: [],
}