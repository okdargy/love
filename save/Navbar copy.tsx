import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { lucia, validateRequest } from "@/lib/auth"
import { cookies } from "next/headers";
import { redirect } from "next/navigation"

export const LoveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg id="LOVE" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 312 312" {...props}>
        <path d="M160.2,0c5.24,3.05,10.47,6.13,15.71,9.16,12.17,7.04,24.35,14.06,36.53,21.09,13.64,7.88,27.29,15.76,40.92,23.65,3.97,2.3,7.99,4.52,11.86,6.97,7.27,4.61,7.3,16.99-.05,21.46-9.37,5.7-18.88,11.17-28.39,16.63-4.29,2.47-8.79,2.61-13.14.12-11-6.28-21.95-12.63-32.92-18.97-9.58-5.54-19.16-11.09-28.74-16.64-4.46-2.58-8.74-1.96-13.04.55-18.79,10.93-37.61,21.81-56.42,32.7-1.38.8-2.76,1.61-4.16,2.37-4.63,2.53-9.23,2.2-13.69-.4-9.22-5.36-18.44-10.75-27.6-16.21-7.51-4.47-7.78-17.09-.29-21.6,11.44-6.9,23.07-13.5,34.63-20.19,12.08-6.99,24.18-13.96,36.29-20.91,10.72-6.16,21.46-12.29,32.18-18.45.67-.39,1.28-.9,1.91-1.35,2.8,0,5.6,0,8.4,0Z" />
        <path d="M181.8,312c-6.35-2.92-8.54-8.1-8.43-14.8.16-9.5.08-19,.03-28.49-.03-5.59,2.22-9.83,7.09-12.62,19.83-11.33,39.69-22.62,59.49-34.01,4.59-2.64,7.32-6.43,7.29-12.14-.12-22.89-.03-45.79-.07-68.68,0-6.12,2.35-10.67,7.84-13.7,8.2-4.53,16.26-9.33,24.42-13.96,4.68-2.66,9.39-3.52,14.51-.79,4.1,2.19,5.99,5.47,6,9.87.05,30.19.03,60.39.03,90.58,0,9.7-.1,19.4.04,29.09.06,4.41-1.96,7.65-5.42,9.72-11.29,6.77-22.74,13.28-34.13,19.87-13.56,7.84-27.12,15.66-40.68,23.48-8.64,4.98-17.29,9.94-25.93,14.93-.85.49-1.65,1.09-2.47,1.64h-9.6Z" />
        <path d="M121.2,312c-23.74-13.7-47.49-27.41-71.23-41.11-10.54-6.08-21.09-12.14-31.62-18.23-4.2-2.43-6.4-5.85-6.39-10.97.1-39.48.05-78.97.06-118.45,0-8.11,7.13-13.97,14.97-11.67,4.22,1.24,8.11,3.72,12.02,5.88,6.46,3.57,12.77,7.4,19.21,11,4.86,2.71,6.53,7.1,6.54,12.25.07,22.89.13,45.78-.04,68.67-.05,6.33,2.93,10.24,8.09,13.18,12.91,7.35,25.76,14.82,38.64,22.21,6.23,3.57,12.4,7.25,18.75,10.6,5.73,3.02,8.51,7.45,8.42,13.96-.14,9.29-.16,18.59,0,27.89.12,6.7-2.08,11.88-8.43,14.8h-9Z" />
        <path d="M157.1,129.29c2.74-2.94,5.15-5.82,7.86-8.39,8.94-8.46,19.66-11.74,31.8-10.19,11.31,1.44,20.33,6.85,26.17,16.71,6.79,11.47,6.55,23.45,1.51,35.53-4.62,11.08-11.91,20.32-19.88,29.16-10.98,12.17-23.48,22.6-36.56,32.38-2.44,1.82-5.35,3-7.93,4.65-2.27,1.46-4.43,1.13-6.4-.23-6.27-4.36-12.8-8.44-18.56-13.4-8.73-7.51-17.19-15.38-25.21-23.63-8.85-9.09-16.46-19.3-20.76-31.36-5.82-16.32-2.68-33.67,12.97-44.21,10.37-6.98,22.12-7.97,34.03-3.67,8.41,3.04,15,8.48,20.05,15.83.21.31.57.52.91.83Z" />
    </svg>
)

const Links = [
    { href: "#", label: "Home" },
    { href: "/store", label: "Collectables" },
    { href: "#", label: "Updates" },
    { href: "#", label: "Calculator" },
    { href: "#", label: "Leaderboard" },
]

async function logout(): Promise<ActionResult> {
	"use server";
	const { session } = await validateRequest();
	if (!session) {
		return {
			error: "Unauthorized"
		};
	}

	await lucia.invalidateSession(session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
	return redirect("/");
}

interface ActionResult {
	error: string | null;
}

export default async function Navbar() {
    const { user } = await validateRequest();

    return (
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <LoveIcon className="h-6 w-6 fill-red-500" />
                    <span className="sr-only">LOVE</span>
                </Link>
                {Links.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto flex-1 sm:flex-initial">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold md:text-base"
                    >
                        <LoveIcon className="h-6 w-6 fill-red-500" />
                        <span className="sr-only">LOVE</span>
                    </Link>
                </div>  
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full bg-transparent">
                                <img src={
                                    "https://cdn.discordapp.com/avatars/" + user.discordId + "/" + user.avatar + ".png"
                                } alt={user.username} width={32} height={32} className="rounded-full" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                                <p className="text-md">{user.display_name}</p>
                                <p className="text-xs font-normal">@{user.username}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.role === "admin" ? (
                                <>
                                    <DropdownMenuItem>
                                        <Link href="/admin">
                                            Admin Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            ) : null}
                            <DropdownMenuItem className="p-0">
                                <form action={logout} id="logoutForm" className="w-full">
                                    <Button variant="outline" type="submit" className="w-full h-min">Logout</Button>
                                </form>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link href="/login/discord">
                        <Button variant="secondary">Login</Button>
                    </Link>
                )}
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="h-5 w-5 stroke-2 stroke-black">
                            <line x1="4" x2="20" y1="12" y2="12"></line>
                            <line x1="4" x2="20" y1="6" y2="6"></line>
                            <line x1="4" x2="20" y1="18" y2="18"></line>
                        </svg>
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            href="#"
                            className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <LoveIcon className="h-6 w-6 fill-red-500" />
                            <span className="sr-only">LOVE</span>
                        </Link>
                        {Links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            
        </header>
    )
}