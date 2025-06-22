/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Gunakan mode class untuk dark mode
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Untuk App Router (Next.js 13+)
    "./pages/**/*.{js,ts,jsx,tsx}", // Untuk Pages Router (Next.js <13)
    "./components/**/*.{js,ts,jsx,tsx}", // Untuk komponen
  ],
  theme: {
    extend: {
      // Anda dapat menambahkan tema kustom di sini
      colors: {
        primary: {
          light: '#3b82f6', // Warna biru terang
          DEFAULT: '#1d4ed8', // Warna biru sedang
          dark: '#1e40af', // Warna biru gelap
        },
        secondary: {
          light: '#9333ea', // Warna ungu terang
          DEFAULT: '#6b21a8', // Warna ungu sedang
          dark: '#4c1d95', // Warna ungu gelap
        },
      },
    },
  },
  plugins: [],
};