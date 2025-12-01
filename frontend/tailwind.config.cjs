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
                heading: ['Inter', 'sans-serif'],
            },
            colors: {
                // n8n Theme Colors with User Customization
                primary: {
                    DEFAULT: '#ea4b4b', // User preferred Red/Pink
                    hover: '#d43b3b',   // Darker variant
                    light: '#fdecec',   // Light variant
                },
                // System Grays & Backgrounds
                gray: {
                    50: '#FCFCFD',  // n8n Grey 50
                    100: '#F2F2F7', // System Gray 6
                    200: '#E5E5EA', // System Gray 5
                    300: '#D1D1D6', // System Gray 4
                    400: '#C7C7CC', // System Gray 3
                    500: '#AEAEB2', // System Gray 2
                    600: '#8E8E93', // System Gray
                    700: '#636366',
                    800: '#48484A',
                    900: '#3A3A3C',
                },
                dark: {
                    bg: '#040506',       // n8n Brand Black
                    sidebar: '#292727',  // User requested Grey
                    surface: '#101330',  // n8n Deep Blue
                    text: '#FFFFFF',     // White
                    border: '#2D3142',   // Lighter Blue/Gray
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
