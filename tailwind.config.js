/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe:    "#4CAF50",
        caution: "#FFC107",
        warning: "#FF7043",
        danger:  "#F44336",
        primary: "#7C3AED",
        "primary-light": "#A78BFA",
      },
    },
  },
  plugins: [],
}