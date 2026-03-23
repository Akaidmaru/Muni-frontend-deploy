/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79', // Botón
          hover: '#3F7FB8',   // Hover
          // Opacity handled by utilities usually, but specific 50% matches #1F4E79 at 50%
        },
        background: {
          DEFAULT: '#F2F3F5', // Fondo
          alt: '#E6F0FA',     // Fondo 2
          footer: '#1C1C1C'   // Using Final/Black for footer mainly, though footer component currently uses gray-900
        },
        header: '#E6E8EB',
        text: {
          main: '#1C1C1C', // Final
          title: '#0F0F0F', // H1-H2
          subtitle: '#2A2A2A', // H3-H4
          secondary: '#5A5A5A', // Montserrat Secundario
          light: '#FFFFFF'
        }
      },
      fontFamily: {
        titles: ['Inter', 'sans-serif'],      // H1-H4
        button: ['Space Grotesk', 'sans-serif'], // Botones
        body: ['Montserrat', 'sans-serif'],    // Secundario/Cuerpo
        legal: ['Play', 'sans-serif']          // Footer/Derechos
      },
      fontSize: {
        'h1': '40px', // H1 H2 size
        'h3': '25px', // H3 H4 size
        'body': '16px', // Montserrat 16-14
        'sm-body': '14px',
        'btn': '14px', // Botón size
        'legal': '14px' // Play size
      }
    },
  },
  plugins: [],
}
