/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // ¡Corregido para que lea Angular!
  ],
  theme: {
    extend: {
      colors: {
        // Enlazamos Tailwind con las variables de tu ThemeService
        'primary': 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        'primary-container': 'var(--secondary-color)', 
        'surface-container-low': '#f2f3ff',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#131b2e',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        headline: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}