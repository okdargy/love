import type { MDXComponents } from 'mdx/types'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="font-bold text-xl">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="font-bold text-lg">{children}</h3>
    ),
    a: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
      <a
        className="link"
        {...props}
      >
        {children}
      </a>
    ),
  }
}