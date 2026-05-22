/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe:          "#22C55E",
        safe_light:    "#F0FDF4",
        caution:       "#FACC15",
        caution_light: "#FFFDE7",
        warning:       "#FB923C",
        warn_light:    "#FFECDC",
        danger:        "#EF4444",
        danger_light:  "#FFEBEB",
        primary:       "#3B82F6",
        primary_light: "#EFF6FF",
      },
    },
  },
  plugins: [],
}