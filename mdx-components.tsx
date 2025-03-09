import type { MDXComponents } from 'mdx/types'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="font-bold text-xl">{children}</h2>
    ),
    a: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <a
        className="underline decoration-2 underline-offset-2 decoration-neutral-500 hover:decoration-neutral-300 transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
  }
}