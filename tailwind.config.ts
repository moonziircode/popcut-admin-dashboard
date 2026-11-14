import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F7F7F5",
          alt: "#EEEEEC",
          dim: "#DADAD8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          low: "#F4F4F2",
          high: "#E8E8E6",
          highest: "#E2E3E1",
        },
        brand: {
          DEFAULT: "#CCDE2A",
          hover: "#BFD118",
          light: "#F4F8D3",
          contrast: "#141704",
        },
        border: {
          DEFAULT: "#E8E8E5",
          subtle: "#F0F0ED",
          strong: "#DCDCD8",
        },
        content: {
          primary: "#202020",
          secondary: "#777777",
          muted: "#A4A4A0",
        },
        status: {
          success: {
            DEFAULT: "#10B981",
            bg: "#ECFDF5",
            text: "#065F46",
          },
          warning: {
            DEFAULT: "#F59E0B",
            bg: "#FFFBEB",
            text: "#92400E",
          },
          error: {
            DEFAULT: "#EF4444",
            bg: "#FEF2F2",
            text: "#991B1B",
          },
          info: {
            DEFAULT: "#3B82F6",
            bg: "#EFF6FF",
            text: "#1E40AF",
          },
        },
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        sans: ["Hanken Grotesk", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.03)",
        elevation: "0 8px 24px -4px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
