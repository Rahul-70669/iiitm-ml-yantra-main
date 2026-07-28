/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#ab3505",
                "primary-container": "#f06637",
                "primary-fixed": "#ffdbd0",
                "primary-fixed-dim": "#ffb59e",
                "secondary": "#9f3a60",
                "secondary-container": "#fe85ad",
                "secondary-fixed": "#ffd9e2",
                "tertiary": "#a73923",
                "tertiary-fixed": "#ffdad3",
                "tertiary-container": "#ea6a4f",
                "surface": "#faf9f6",
                "surface-container": "#efeeeb",
                "surface-container-high": "#e9e8e5",
                "surface-dim": "#dbdad7",
                "on-surface": "#1a1c1a",
                "on-surface-variant": "#59413a",
                "outline": "#8c7169",
                "outline-variant": "#e0bfb6",
                "on-primary": "#ffffff",
                "on-primary-container": "#531400",
                "background-light": "#faf9f6",
                "background-dark": "#1a1214",
            },
            fontFamily: {
                "headline": ["Space Grotesk", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"],
                "heading": ["Space Grotesk", "sans-serif"],
                "display": ["Space Grotesk", "sans-serif"],
                "sans": ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "3xl": "2.5rem",
                "full": "9999px",
            },
            animation: {
                'spin-slow': 'spin 12s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
}
