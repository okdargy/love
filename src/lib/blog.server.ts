import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

interface PostMetadata {
    title: string
    publishedAt: string
    summary: string
    author: {
        name: string
        picture: string
    }[]
    thumbnail: string
    slug: string
}

export const getAllPosts = async (): Promise<PostMetadata[]> => {
    const postsDirectory = path.join(process.cwd(), 'src/content')
    const files = fs.readdirSync(postsDirectory)

    const posts = files.map((filename) => {
        const filePath = path.join(postsDirectory, filename)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(fileContents)
        
        return {
            ...data,
            slug: filename.replace('.mdx', '')
        } as PostMetadata
    })

    return posts.sort((a, b) => (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))
}