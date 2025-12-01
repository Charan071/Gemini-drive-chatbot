/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#6366f1', // Indigo 500
                    hover: '#4f46e5',   // Indigo 600
                    light: '#e0e7ff',   // Indigo 100
                },
                dark: {
                    bg: '#343541',      // ChatGPT Dark BG
                    sidebar: '#202123', // ChatGPT Dark Sidebar
                    surface: '#444654', // ChatGPT Message Bubble
                    text: '#ececf1',    // ChatGPT Text
                    border: '#4d4d4f',  // Dark Border
                }
            }
        },
    },
    plugins: [],
}
