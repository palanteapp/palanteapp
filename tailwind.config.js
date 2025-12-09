/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                ivory: '#F8F5F2',
                sage: '#B5C2A3',
                'pale-gold': '#E5D6A7',
                'warm-gray-green': '#6F7B6D',
                'sand-beige': '#EDE4DA',
                // Tier accent colors
                'zen-accent': '#B5C2A3',
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
        },
    },
    plugins: [],
}
