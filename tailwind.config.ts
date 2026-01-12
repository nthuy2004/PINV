import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Brand colors
                primary: {
                    50: "#FFF9E6",
                    100: "#FFF2CC",
                    200: "#FFE699",
                    300: "#FFD966",
                    400: "#FFCD33",
                    500: "#FFC000", // Main yellow
                    600: "#CC9A00",
                    700: "#997300",
                    800: "#664D00",
                    900: "#332600",
                },
                accent: {
                    50: "#FFE5E5",
                    100: "#FFCCCC",
                    200: "#FF9999",
                    300: "#FF6B6B", // Main accent
                    400: "#FF3838",
                    500: "#FF0505",
                    600: "#CC0404",
                    700: "#990303",
                    800: "#660202",
                    900: "#330101",
                },
                dark: {
                    50: "#f5f5f5",
                    100: "#e5e5e5",
                    200: "#d4d4d4",
                    300: "#a3a3a3",
                    400: "#737373",
                    500: "#525252",
                    600: "#404040",
                    700: "#2d2d2d",
                    800: "#1a1a1a",
                    900: "#0d0d0d",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Outfit", "system-ui", "sans-serif"],
            },
            boxShadow: {
                "card": "0 4px 20px rgba(0, 0, 0, 0.08)",
                "card-hover": "0 8px 30px rgba(0, 0, 0, 0.12)",
                "glow": "0 0 20px rgba(255, 192, 0, 0.3)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-up": "slideUp 0.4s ease-out",
                "slide-down": "slideDown 0.4s ease-out",
                "scale-in": "scaleIn 0.2s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                bounceSubtle: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-5px)" },
                },
            },
            borderRadius: {
                "xl": "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
            },
        },
    },
    plugins: [],
};

export default config;
