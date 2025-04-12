/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                fade: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideLeft: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                slideRight: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                }
            },
            animation: {
                fade: 'fade 0.5s ease-in-out',
                slideLeft: 'slideLeft 0.5s ease-in-out',
                slideRight: 'slideRight 0.5s ease-in-out',
            }
        },
    },
    plugins: [],
};
