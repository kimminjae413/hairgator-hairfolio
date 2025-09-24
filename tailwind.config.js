/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'sm:inline',
    'sm:flex-row',
    'sm:items-center',
    'flex-wrap',
    'gap-4',
    'whitespace-nowrap',
    'text-ellipsis',
    'overflow-hidden',
    'sm:w-auto',
    'w-full'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
