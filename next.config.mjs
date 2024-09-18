/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'c0.ptacdn.com',
                port: '',
                pathname: '/thumbnails/assets/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                port: '',
                pathname: '/avatars/**',
            }
        ]
    },
};

export default nextConfig;
