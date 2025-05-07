/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./template.html"
    ],
    theme: {
        extend: {
          colors: {
            'mint': '#A3D1C6', // custom color
          },
        },
    },
    plugins: [require('tailwind-scrollbar')({
        nocompatible: true,
        preferredStrategy: 'pseudoelements',
    })],
  }
  