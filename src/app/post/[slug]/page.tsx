// ---
// title: 'Ceasing Operations with LOVE'
// publishedAt: '2025-02-26'
// summary: '...'
// thumbnail: 'ceasing_thumbnail.png'
// author: [
//     {
//         name: 'dargy',
//         picture: 'dargy.png'
//     }
// ]
// ---
export default async function Page({ params }: { params: Promise<{ slug: string }>}) {
  const slug = (await params).slug;
  console.log(slug);
  const { default: Post, frontmatter } = await import(`../_content/${slug}.mdx`);
  
  return (
      <div>
          <img 
              src={`/thumbnails/${frontmatter.thumbnail}`} 
              alt={frontmatter.title} 
              className="w-1/2 rounded-md mx-auto" 
          />
          <h1 className="text-center">{frontmatter.title}</h1>
          <p className="text-center">{frontmatter.summary}</p>
          <div className="flex items-center gap-x-2">
          <div className="flex">
          {frontmatter.author.map((author: {
              name: string;
              picture: string;
          }, index: number) => (
              <div 
                  key={author.name} 
                  className={`flex items-center ${frontmatter.author.length > 1 ? (
                      // 'gap-x-0 -ml-2'
                      index === 0 ? 'gap-x-0' : 'gap-x-0 -ml-2'
                  ) : 'gap-x-2'}`}
                  style={{ zIndex: frontmatter.author.length - index }}
              >
                  <img 
                      src={`/authors/${author.picture}`} 
                      alt={author.name} 
                      className="w-6 h-6 rounded-full" 
                  />
                  {frontmatter.author.length === 1 && <p>{author.name}</p>}
              </div>
          ))}
          </div>
          {frontmatter.author.length > 1 && (
              <p>
                  {frontmatter.author.map((author: {
                      name: string;
                      picture: string;
                  }) => author.name).join(' & ')}
              </p>
          )}
          </div>
          <p>Published on {formatDate(frontmatter.publishedAt)}</p>
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