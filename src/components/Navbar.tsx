import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { lucia, validateRequest } from "@/lib/auth"
import { cookies } from "next/headers";
import { redirect } from "next/navigation"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { CalculatorIcon, ClockIcon, HomeIcon, LogInIcon, LogOut, NewspaperIcon, Wrench } from 'lucide-react';
import { LoveIcon } from "@/components/icons";
import PlayerSearch from "./PlayerSearch";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/calculator", label: "Calculator", icon: CalculatorIcon },
    { href: "/blog", label: "Blog", icon: NewspaperIcon },
    { href: "/recent", label: "Recent", icon: ClockIcon },
];

async function logout(): Promise<void> {
    "use server";
    const { session } = await validateRequest();

    if (!session) {
        return redirect("/");
    }

    await lucia.invalidateSession(session.id);

    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    redirect("/");
}

export default function Navbar(props: { session: Awaited<ReturnType<typeof validateRequest>> }) {
    const { user } = props.session;

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="gap-4">
                <div className="flex items-center gap-3 px-2 pt-1">
                    <Link
                        href="/"
                        className="p-2 hover:bg-primary/20 transition-all rounded-lg"
                    >
                        <LoveIcon className="h-6 w-6 fill-primary" />
                    </Link>
                    <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 uppercase rounded-md font-semibold tracking-wide">Beta</span>
                </div>

                <div className="px-2">
                    <PlayerSearch />
                </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarMenu>
                        {NAV_LINKS.map((link) => (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton asChild>
                                    <Link href={link.href} className="flex items-center gap-3">
                                        <link.icon className="h-4 w-4" />
                                        <span>{link.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between rounded-md border px-2 py-1.5">
                            <span className="text-sm text-muted-foreground">Theme</span>
                            <ThemeToggle />
                        </div>
                    </SidebarMenuItem>

                    {user ? (
                        <>
                            <SidebarMenuItem>
                                <div className="flex items-center gap-2 rounded-md border p-2">
                                <Image src={
                                    "https://cdn.discordapp.com/avatars/" + user.discordId + "/" + user.avatar + ".png"
                                } alt={user.username} width={32} height={32} className="rounded-full" />
                                <div className="min-w-0 text-sm leading-tight">
                                    <p className="truncate font-medium">{user.username}</p>
                                    <p className="text-muted-foreground">Signed in</p>
                                </div>
                                </div>
                            </SidebarMenuItem>

                            {user.role === "admin" && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/admin">
                                            <Wrench className="h-4 w-4" />
                                            Admin Panel
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            <SidebarMenuItem>
                                <form action={logout} id="logoutForm" className="w-full">
                                    <Button variant="ghost" type="submit" className="w-full justify-start">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Logout
                                    </Button>
                                </form>
                            </SidebarMenuItem>
                        </>
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton className="flex items-center gap-3">
                                <LogInIcon className="h-4 w-4" />
                                <Link href="/login/discord" prefetch={false}>Login</Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
