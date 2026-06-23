/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // Soft Slate-50 background for clean healthcare SaaS look
        card: {
          DEFAULT: '#ffffff',
          hover: '#f8fafc',
          border: '#e2e8f0',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Healthcare Blue (Primary)
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        security: {
          light: '#34d399',
          DEFAULT: '#10b981', // Success
          dark: '#059669',
        },
        intelligence: {
          light: '#22d3ee',
          DEFAULT: '#06b6d4', // Trust Cyan
          dark: '#0891b2',
        },
        emergency: {
          light: '#f87171',
          DEFAULT: '#ef4444', // Danger
          dark: '#dc2626',
        },
        audit: {
          light: '#fcd34d',
          DEFAULT: '#f59e0b', // Warning
          dark: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.8), inset 0 1px 2px 0 rgba(255, 255, 255, 0.05)',
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-security': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-intelligence': '0 0 15px rgba(139, 92, 246, 0.15)',
        'glow-emergency': '0 0 20px rgba(239, 68, 68, 0.25)',
      },
      backdropBlur: {
        'glass': '12px',
        'glass-lg': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'radar': 'radar 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        radar: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}


