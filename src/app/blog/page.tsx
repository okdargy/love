import Link from "next/link";
import { getAllPosts } from "@/lib/blog.server";

export default async function Blog() {
    const posts = await getAllPosts();

    return (
        <div className="my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.slug}>
                        <article className="border rounded-lg overflow-hidden hover:border-neutral-700 transition-colors">
                            <div className="aspect-video relative">
                                <img 
                                    src={`/thumbnails/${post.thumbnail}`}
                                    alt={post.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="p-4 space-y-3">
                                <h2 className="text-xl font-semibold line-clamp-2">{post.title}</h2>
                                <p className="text-sm text-neutral-400 line-clamp-3">{post.summary}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-2">
                                        {post.author.map((author) => (
                                            <img
                                                key={author.name}
                                                src={`/authors/${author.picture}`}
                                                alt={author.name}
                                                className="w-8 h-8 rounded-full border-2 border-neutral-900"
                                                title={author.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-sm text-neutral-400">
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    );
}