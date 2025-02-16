import { validateRequest } from "@/lib/auth";
import Link from "next/link";
import { ReactNode } from "react";
import { forbidden } from 'next/navigation'

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const { user } = await validateRequest();
    
    if (!user || user.role !== "admin") {
        return forbidden();
    }

    const Links = [
        {
            label: "Home",
            href: "/admin"
        },
        {
            label: "Audit Logs",
            href: "/admin/logs"
        },
        {
            label: "Tags",
            href: "/admin/tags"
        }
    ]

    return (
        <div className="space-y-3 divide-y">
            <div>
                <h1 className="text-2xl font-bold">Welcome, {user.display_name}</h1>
                <p className="text-neutral-400">Your current ID is <code>{user.id}</code> with a role of <code>{user.role}</code></p>
            </div>
            <div className="pt-4 mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav className="grid gap-4 text-sm text-muted-foreground" x-chunk="dashboard-04-chunk-0">
                    {Links.map((link, index) => (
                        <Link key={index} href={link.href} className="hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </nav>
                {children}
            </div>
        </div>
    );
}