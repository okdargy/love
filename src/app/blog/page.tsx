import Link from "next/link";
import { getAllPosts } from "@/lib/blog.server";
import { formatDateWithFallback } from "@/lib/utils";

export default async function Blog() {
    const posts = await getAllPosts();

    return (
        <div className="my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.slug}>
                        <article className={`border border-border rounded-lg overflow-hidden hover:border-primary/60 transition-colors ${post.hidden ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
                            <div className="aspect-video relative">
                                                            {post.hidden && (
                                <div className="absolute top-2 right-2 bg-card/25 text-foreground text-xs px-2 py-0.5 rounded-full">
                                    Hidden
                                </div>
                            )}
                                <img 
                                    src={`/thumbnails/${post.thumbnail}`}
                                    alt={post.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <div className="p-4 space-y-3">
                                <h2 className="text-xl font-semibold line-clamp-2">{post.title}</h2>
                                <p className="text-sm text-muted-foreground line-clamp-3">{post.summary}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-2">
                                        {post.author.map((author) => (
                                            <img
                                                key={author.name}
                                                src={`/authors/${author.picture}`}
                                                alt={author.name}
                                                className="w-8 h-8 rounded-full border-2 border-background"
                                                title={author.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDateWithFallback(post.publishedAt, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }, 'Unknown date', 'en-US')}
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
