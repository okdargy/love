"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { useSession } from "@/components/SessionContext";
import { redirect } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { Spinner } from "@/components/icons";
import Image from "next/image";
import { Link2, Unlink, ExternalLink, Link, ArrowLeftRight, Unplug, Plug, ChevronsLeftRight, ChevronsLeftRightEllipsis } from "lucide-react";

export default function Page() {
    const { user } = useSession();
    const [username, setUsername] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    if (!user) {
        redirect("/login");
        return null;
    }

    const connectionStatus = trpc.getUserConnectionStatus.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const initConnection = trpc.initializeUserConnection.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            handleCloseDialog();
            connectionStatus.refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const unlinkConnection = trpc.unlinkUserConnection.useMutation({
        onSuccess: (data) => {
            toast.success(data.message);
            connectionStatus.refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleConnect = () => {
        if (!username.trim()) return;
        initConnection.mutate({ username: username.trim() });
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setUsername("");
    };

    const isLinked = connectionStatus.data?.linked;
    const linkedAccount = connectionStatus.data?.account;
    const isBusy = initConnection.isLoading || unlinkConnection.isLoading;

    return (
        <div className="space-y-6 mx-auto">
            <div className="mb-2">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-base">Manage your account settings and connections</p>
            </div>

            <Card>
                <CardContent className="py-8 px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <p className="font-semibold text-lg">Polytoria Account</p>
                            <p className="text-sm text-muted-foreground">
                                Link your Polytoria account to post trade ads and show your account badge
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLinked && linkedAccount ? (
                                <>
                                    <a href={`https://polytoria.com/users/${linkedAccount.id}`} target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Profile
                                        </Button>
                                    </a>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => unlinkConnection.mutate()}
                                        disabled={isBusy}
                                    >
                                        {unlinkConnection.isLoading ? (
                                            <>
                                                <Spinner width="12" height="12" className="mr-2 fill-primary-foreground" />
                                                Unlinking...
                                            </>
                                        ) : (
                                            <>
                                                <Unlink className="h-4 w-4 mr-2" />
                                                Unlink
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Dialog open={isOpen} onOpenChange={(open) => {
                                    if (!open) handleCloseDialog();
                                    else setIsOpen(true);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="font-medium">
                                            <Link2 className="h-4 w-4 mr-2" />
                                            Link Account
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[440px]">
                                        <DialogHeader>
                                            <DialogTitle className="mb-1.5">Polytoria <ChevronsLeftRightEllipsis className="inline h-4 w-4 mx-1" /> LOVE</DialogTitle>
                                            <DialogDescription>
                                                Before linking, ensure you have your Discord account connected to your Polytoria account in <a href="https://polytoria.com/my/settings" target="_blank" rel="noreferrer" className="underline">Settings</a>.
                                                <br /><br />
                                                <b>Sure you did everything right?</b> Make sure to double-check your <a href="https://polytoria.com/my/settings/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Settings</a> and ensure that &quot;See your linked Discord on your profile&quot; is set to &quot;Everyone&quot;.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="text-sm">Polytoria Username</Label>
                                            <Input
                                                id="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="e.g. dargy"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && username.trim() && !isBusy) {
                                                        handleConnect();
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <DialogClose asChild>
                                                <Button variant="secondary" size="sm">Cancel</Button>
                                            </DialogClose>
                                            <Button
                                                onClick={handleConnect}
                                                disabled={!username.trim() || isBusy}
                                                size="sm"
                                            >
                                                {initConnection.isLoading ? (
                                                    <>
                                                        <Spinner width="12" height="12" className="mr-2 fill-primary-foreground" />
                                                        Linking...
                                                    </>
                                                ) : (
                                                    "Link"
                                                )}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
