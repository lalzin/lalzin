import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette funky disco 70s — jewel tones chauds, premium club
        magenta: {
          DEFAULT: '#E8487E',
          deep: '#C7305F',
          soft: '#F2789F',
        },
        coral: {
          DEFAULT: '#EE6C3A',
          deep: '#D2531F',
          soft: '#F5895E',
        },
        gold: {
          DEFAULT: '#E9AE3E',
          deep: '#CC8E1E',
          soft: '#F4CB72',
        },
        teal: {
          DEFAULT: '#1AA293',
          deep: '#0F756A',
          soft: '#4FC8BB',
        },
        // Fond nuit chaud oxblood/aubergine — jamais de noir pur
        night: {
          DEFAULT: '#1F0E1A',
          deep: '#160912',
          soft: '#2C1726',
          plum: '#3A1E33',
        },
        cream: '#F5E8CF',
      },
      fontFamily: {
        display: ['var(--font-display)', 'cursive'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        blob: '42% 58% 63% 37% / 41% 44% 56% 59%',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(4deg)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      animation: {
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
        shimmer: 'shimmer 4s ease-in-out infinite',
        wobble: 'wobble 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
