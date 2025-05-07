// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'
// import path from 'path'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   build: {
//     outDir: '/dist',
//     rollupOptions: {
//       input: path.resolve(__dirname, 'src/main.js'),
//       output: {
//         entryFileNames: 'main.js',
//       }
//     },
//     lib: {
//       entry: 'src/main.js',
//       formats: ['cjs']
//     },
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'react-dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        template: path.resolve(__dirname, 'template.html')
      }
    },
  },
})
