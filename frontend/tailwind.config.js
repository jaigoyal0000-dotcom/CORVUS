/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        corvus: {
          dark: '#0B0F17',
          card: '#121824',
          accent: '#3B82F6',
          emerald: '#10B981',
          border: '#1E293B',
          muted: '#64748B',
        },
      },
    },
  },
  plugins: [],
}
