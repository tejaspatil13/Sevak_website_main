import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#003580',
        'navy-dark': '#00224F',
        sky: '#0EA5E9',
        saffron: '#F97316',
        bg: '#F5F7FA',
        card: '#FFFFFF',
        ink: '#1A1A2E',
        muted: '#6B7280',
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 6px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
