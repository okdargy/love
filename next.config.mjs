import createMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    experimental: {
        authInterrupts: true,
    },
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
                hostname: 'c0.ptacdn.com',
                port: '',
                pathname: '/thumbnails/avatars/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.polytoria.com',
                port: '',
                pathname: '/thumbnails/assets/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.polytoria.com',
                port: '',
                pathname: '/thumbnails/avatars/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                port: '',
                pathname: '/avatars/**',
            },
        ]
    },
};

const withMDX = createMDX({
    options: {
        jsx: true,
        rehypePlugins: [],
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter]
    }
})

export default withMDX(nextConfig);
