/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b1020",
          subtle: "#0f172a",
          elevated: "#111b33",
        },
        fg: {
          DEFAULT: "#e5e7eb",
          muted: "#a3aab8",
        },
        border: "#22304f",
        accent: {
          DEFAULT: "#6366f1",
          2: "#a78bfa",
        },
        priority: {
          low: "#22c55e",
          medium: "#eab308",
          high: "#f97316",
          urgent: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        display: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
}

