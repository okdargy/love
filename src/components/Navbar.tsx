import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { lucia, validateRequest } from "@/lib/auth"
import { cookies } from "next/headers";
import { redirect } from "next/navigation"
import { Menu, LogOut, Wrench } from 'lucide-react';
import { LoveIcon } from "@/components/icons";
import { useSession } from "./SessionContext"

const Links = [
    { href: "#", label: "Home" },
    { href: "/store", label: "Collectables" },
    { href: "#", label: "Updates" },
    { href: "#", label: "Calculator" },
    { href: "#", label: "Leaderboard" },
]

async function logout(): Promise<void> {
    "use server";
    const { session } = await validateRequest();

    if (!session) {
        return redirect("/");
    }

    await lucia.invalidateSession(session.id);

    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    redirect("/");
}

interface ActionResult {
    error: string | null;
}

export default function Navbar(props: { session: Awaited<ReturnType<typeof validateRequest>> }) {
    const { user } = props.session;

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background">
            <nav className="flex w-full max-w-screen-lg mx-auto gap-6 p-4 sm:p-6 justify-between">
                <Link
                    href="/"
                    className="p-2 hover:bg-red-500 hover:bg-opacity-20 transition-all rounded-lg"
                >
                    <LoveIcon className="h-6 w-6 fill-red-500" />
                </Link>

                <div className="flex items-center ml-auto gap-3">
                    {user ? (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full bg-transparent">
                                        <Image src={
                                            "https://cdn.discordapp.com/avatars/" + user.discordId + "/" + user.avatar + ".png"
                                        } alt={user.username} width={32} height={32} className="rounded-full" />
                                        <span className="sr-only">Toggle user menu</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 my-auto p-2 space-y-1" align="end">
                                    <form action={logout} id="logoutForm" className="w-full">
                                        <Button variant="ghost" type="submit" className="w-full flex items-center justify-between">
                                            <LogOut className="h-5 w-5 mr-2" />
                                            Logout
                                        </Button>
                                    </form>
                                </PopoverContent>
                            </Popover>
                        </>
                    ) : (
                        <Link href="/login/discord">
                            <Button variant="outline" className="">Login</Button>
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    )
}