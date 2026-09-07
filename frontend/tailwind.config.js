/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // LogSetu brand: deep indigo/graphite (SOC feel) + saffron accent (national theme, used sparingly)
        base: {
          light: '#f7f7f5',
          dark: '#0b0e14',
        },
        panel: {
          light: '#ffffff',
          dark: '#11161f',
        },
        accent: '#ff7a1a', // saffron-adjacent accent, used sparingly for CTAs/alerts
        signal: '#2dd4bf',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
