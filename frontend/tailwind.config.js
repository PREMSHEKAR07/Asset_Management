/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-contrast clean panel colors matching the mockup
        brand: {
          dark: "#0c1e35", // Navy sidebar background
          accent: "#2563eb", // Blue buttons & indicators
          "accent-hover": "#1d4ed8",
        }
      }
    },
  },
  plugins: [],
}
