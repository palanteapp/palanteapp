/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ivory: '#E0DCD8', // Darkened by 25% from #F8F5F2
                sage: '#6F7B6D', // Updated to match dark mode background (warm-gray-green)
                'pale-gold': '#E5D6A7',
                'warm-gray-green': '#6F7B6D',
                'sand-beige': '#EDE4DA',
                // New Warm Palette for Coach
                'terracotta': {
                    300: '#FDA489', // Soft Peach/Terracotta
                    500: '#E07A5F', // Warm Terra Cotta
                    600: '#C0593E', // Deep Burnt Orange
                },
                // Tier accent colors
                'zen-accent': '#6F7B6D',
                'stoic-accent': '#6F7B6D',
                'grit-accent': '#E5D6A7',
                'luxe-gold': '#E5D6A7', // Legacy compatibility
            },
            fontFamily: {
                display: ['Poppins', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'spa': '0 4px 12px rgba(0, 0, 0, 0.08)',
                'spa-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                shimmer: 'shimmer 2s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
