import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: '#1B2B4B',
          50: '#F0F3F7',
          100: '#D6DDE8',
          200: '#A8B5CC',
          300: '#7A8DAF',
          400: '#4D6693',
          500: '#1B2B4B',
          600: '#162340',
          700: '#111B34',
          800: '#0C1428',
          900: '#070C1C',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#FBF8EF',
          100: '#F4EDD4',
          200: '#E9DBA9',
          300: '#DEC97E',
          400: '#D3B863',
          500: '#C9A84C',
          600: '#B0903A',
          700: '#8A712E',
          800: '#645222',
          900: '#3E3316',
        },
      },
    },
  },
  plugins: [],
};
export default config;
