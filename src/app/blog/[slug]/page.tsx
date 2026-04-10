import { notFound } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Metadata, ResolvingMetadata } from 'next';
import { formatDateWithFallback } from '@/lib/utils';

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    try {
        const { default: Post, frontmatter } = await import(`@/content/${slug}.mdx`);

        return (
            <div className="space-y-5 my-2">
                <div className="space-y-2">
                    <div className="flex items-center justify-center">
                            <div className="flex items-center gap-3 border border-border px-4 py-2 rounded-full bg-card/60">
                                <div className="flex justify-center items-center relative">
                                    {frontmatter.author.map((author: { name: string; picture: string; }, index: number) => (
                                        <Tooltip key={author.name}>
                                            <TooltipTrigger>
                                                <div
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
                                            </TooltipTrigger>
                                            <TooltipContent side='bottom'>
                                                <p>{author.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                                <div className="text-sm text-muted-foreground ml-2">
                                    {formatDateWithFallback(frontmatter.publishedAt, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }, 'Unknown date', 'en-US')}
                                </div>
                            </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl text-center font-bold text-foreground">{frontmatter.title}</h1>
                        <p className="text-sm text-center max-w-lg mx-auto text-muted-foreground">{frontmatter.summary}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <img
                        src={`/thumbnails/${frontmatter.thumbnail}`}
                        alt={frontmatter.title}
                        className="rounded-lg mx-auto"
                    />
                    <div className="px-2 space-y-4">
                        <Post />
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        return notFound();
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    try {
      const { frontmatter } = await import(`@/content/${(await params).slug}.mdx`);
      const previousImages = (await parent).openGraph?.images || []
  
      return {
        title: frontmatter.title,
        description: frontmatter.summary,
        openGraph: {
          images: [`/thumbnails/${frontmatter.thumbnail}`, ...previousImages],
        },
      }
    } catch (e) {
      return {
        title: 'LOVE',
        description: 'The requested blog post could not be found.'
      }
    }
  }
  

export function generateStaticParams() {
    return [
        { params: { slug: 'ceasing-operations' } },
    ]
}

export const dynamicParams = true
export const dynamic = "force-dynamic";
