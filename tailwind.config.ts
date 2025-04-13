import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        fg: 'hsl(var(--fg) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        button: 'hsl(var(--button) / <alpha-value>)',
        button_txt: 'hsl(var(--button_txt) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        special: 'hsl(var(--special) / <alpha-value>)',
        asset: 'hsl(var(--asset) / <alpha-value>)',
        error: 'hsl(var(--error) / <alpha-value>)',
        error_txt: 'hsl(var(--error_txt) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        success_txt: 'hsl(var(--success_txt) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
export default config;
