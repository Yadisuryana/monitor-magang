/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/mhs',  // Endpoint yang digunakan dalam aplikasi
          destination: 'https://mmc-clinic.com/dipa/api/mhs.php',  // URL asli API
        },
      ];
    },
  };
  
  export default nextConfig;
  