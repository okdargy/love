// ---
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    console.log(slug);
    const { default: Post, frontmatter } = await import(`../_content/${slug}.mdx`);

    return (
        <div className="space-y-3 my-2">
            <div className="space-y-1">
                <h1 className="text-4xl text-center font-bold text-neutral-100">{frontmatter.title}</h1>
                <p className="text-sm text-center max-w-lg mx-auto text-neutral-300">{frontmatter.summary}</p>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-center">
                    <div className="flex gap-x-3">
                        <div className="flex justify-center items-center relative">
                            {frontmatter.author.map((author: { name: string; picture: string; }, index: number) => (
                                <div
                                    key={author.name}
                                    className={frontmatter.author.length > 1 ? (
                                        index === 0 ? '' : '-ml-1'
                                    ) : 'gap-x-2'}
                                    style={{ zIndex: frontmatter.author.length - index }}
                                >
                                    <img
                                        src={`/authors/${author.picture}`}
                                        alt={author.name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <img
                        src={`/thumbnails/${frontmatter.thumbnail}`}
                        alt={frontmatter.title}
                        className="rounded-lg mx-auto"
                />
            </div>
            <Post />
        </div>
    );
}

export function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function generateStaticParams() {
    return [
        { params: { slug: 'hello' } },
        { params: { slug: 'another-post' } },
    ]
}

export const dynamicParams = false