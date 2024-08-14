const { light, dark } = require('@charcoal-ui/theme')
const { createTailwindConfig } = require('@charcoal-ui/tailwind-config')
/**
 * @type {import('tailwindcss/tailwind-config').TailwindConfig}
 */
module.exports = {
  darkMode: true,
  content: ['./src/**/*.tsx', './src/**/*.html'],
  presets: [
    createTailwindConfig({
      version: 'v3',
      theme: {
        ':root': light,
      },
    }),
  ],
  theme: {
    extend: {
      colors: {
        primary: '#856292',
        'primary-hover': '#8E76A1',
        'primary-press': '#988BB0',
        'primary-disabled': '#6F48694D',
        secondary: '#FF617F',
        'secondary-hover': '#FF849B',
        'secondary-press': '#FF9EB1',
        'secondary-disabled': '#FF617F4D',
        base: '#FBE2CA',
        'text-primary': '#514062',
      },
      fontFamily: {
        M_PLUS_2: ['Montserrat', 'M_PLUS_2', 'sans-serif'],
        Montserrat: ['Montserrat', 'sans-serif'],
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      width: {
        '1/2': '50%',
      },
      zIndex: {
        5: '5',
        15: '15',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
