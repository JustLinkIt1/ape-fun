/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'api.launch.fun'], // Add your image domains here
  },
}

module.exports = nextConfig
