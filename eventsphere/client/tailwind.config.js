/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0a0a0f",
        surface: "rgba(255, 255, 255, 0.04)",
        accent: "#6366f1",
        "accent-cyan": "#22d3ee",
        "text-primary": "#f1f5f9",
        "border-glass": "rgba(255, 255, 255, 0.08)",
      },
      borderRadius: {
        glass: "12px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite alternate",
        "float-card": "floatCard 4s ease-in-out infinite",
        "count-up": "countUp 1.5s ease-out forwards",
      },
      keyframes: {
        pulseGlow: {
          "0%": { boxShadow: "0 0 5px rgba(99, 102, 241, 0.2), 0 0 15px rgba(34, 211, 238, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(99, 102, 241, 0.5), 0 0 30px rgba(34, 211, 238, 0.3)" },
        },
        floatCard: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
      },
    },
  },
  plugins: [],
}
