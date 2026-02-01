/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
        colors: {
          primary: {
            DEFAULT: '#0891b2', // cyan-600
            light: '#22d3ee', // cyan-400
            dark: '#0e7490', // cyan-700
          },
          background: '#f8fafc', // slate-50
          surface: '#ffffff',
          apple: {
            gray: "#F5F5F7",
            blue: "#0071e3",
          }
        }
    },
  },
  plugins: [],
}
