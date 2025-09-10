"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionContext";
import { redirect } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { Spinner } from "@/components/icons";
import { Check, Copy, ExternalLink } from "lucide-react";

// Connection flow steps
type ConnectionStep = "initial" | "code-generated" | "verifying" | "verified";

// This was supposed to be a feature, but ended up being scrapped because of:
// https://discord.com/channels/350679908390797313/1341613731033120838 
export default function Page() {
    const { user } = useSession();
    const [username, setUsername] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<ConnectionStep>("initial");
    const [connectionData, setConnectionData] = useState<{
        code: string;
        polytoriaUsername: string;
        expiresAt: number;
    } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    // Timer effect for countdown
    useEffect(() => {
        if (!connectionData?.expiresAt || step !== "code-generated") return;

        const updateTimer = () => {
            const remaining = Math.max(0, connectionData.expiresAt - Date.now());
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            if (remaining <= 0) {
                setStep("initial");
                setConnectionData(null);
                toast.error("Code expired. Please generate a new one.");
            }
        };

        updateTimer(); // Initial update
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [connectionData?.expiresAt, step]);

    if (!user) {
        redirect("/login");
        return null;
    }

    const initConnection = trpc.initializeUserConnection.useMutation({
        onSuccess: (data) => {
            setConnectionData({
                code: data.code,
                polytoriaUsername: data.polytoriaUsername,
                expiresAt: data.expiresAt
            });
            setStep("code-generated");
            toast.success(`Code generated for ${data.polytoriaUsername}`);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const verifyConnection = trpc.verifyUser.useMutation({
        onSuccess: (data) => {
            setStep("verified");
            toast.success(data.message);
            // Close dialog after a short delay
            setTimeout(() => {
                handleCloseDialog();
            }, 2000);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleConnect = () => {
        if (!username.trim()) return;
        initConnection.mutate({ username: username.trim() });
    };

    const handleVerify = () => {
        setStep("verifying");
        verifyConnection.mutate();
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setUsername("");
        setStep("initial");
        setConnectionData(null);
    };

    const copyCodeToClipboard = () => {
        if (connectionData?.code) {
            navigator.clipboard.writeText(connectionData.code);
            toast.success("Code copied to clipboard!");
        }
    };

    const openPolytoriaSettings = () => {
        window.open('https://polytoria.com/my/settings/', '_blank');
    };

    const formatTimeRemaining = () => {
        return timeRemaining;
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
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
                                Connect your Polytoria account to post trade ads and obtain badges on your profile
                            </p>
                        </div>
                        <Dialog open={isOpen} onOpenChange={(open) => {
                            if (!open) handleCloseDialog();
                            else setIsOpen(true);
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="font-medium">Connect</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
                                <div className="p-6">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-xl font-semibold">
                                            {step === "initial" && "Connect your account"}
                                            {step === "code-generated" && "Verify your identity"}
                                            {step === "verifying" && "Verifying..."}
                                            {step === "verified" && "Account verified!"}
                                        </DialogTitle>
                                        <DialogDescription className="text-sm">
                                            {step === "initial" && "Enter your Polytoria username to link your account"}
                                            {step === "code-generated" && `Add the code below to your Polytoria "Profile Bio" to verify ownership of your account`}
                                            {step === "verifying" && "Checking your Polytoria bio for the verification code..."}
                                            {step === "verified" && "Your Polytoria account has been successfully linked!"}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {step === "initial" && (
                                        <>
                                            <div className="flex flex-col gap-2 mb-6">
                                                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                                <Input
                                                    id="username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder="Enter your Polytoria username"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && username.trim() && !initConnection.isLoading) {
                                                            handleConnect();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary" size="sm">Cancel</Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={handleConnect}
                                                    disabled={!username.trim() || initConnection.isLoading}
                                                    size="sm"
                                                >
                                                    {initConnection.isLoading ? (
                                                        <>
                                                            <Spinner width="12" height="12" className="mr-2 fill-white" />
                                                            Searching...
                                                        </>
                                                    ) : (
                                                        "Generate Code"
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    {step === "code-generated" && connectionData && (
                                        <>
                                            <div className="space-y-3 mb-6">
                                                <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                                                    <code className="text-lg font-mono font-bold select-all">
                                                        {connectionData.code}
                                                    </code>
                                                    <div className="flex gap-2 items-center">
                                                        <p className="text-right text-muted-foreground">
                                                            <span className="font-semibold">{formatTimeRemaining()}</span>
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={copyCodeToClipboard}
                                                            className="ml-2"
                                                            aria-label="Copy code"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={openPolytoriaSettings}
                                                    size="sm"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open Settings
                                                </Button>
                                                <Button onClick={handleVerify} size="sm">
                                                    Verify
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    {step === "verifying" && (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <Spinner width="24" height="24" className="fill-primary" />
                                            <p className="text-sm text-muted-foreground">
                                                Checking your bio for the verification code...
                                            </p>
                                        </div>
                                    )}

                                    {step === "verified" && (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-2xl">
                                                    <Check />
                                                </span>
                                            </div>
                                            <p className="text-center text-sm text-muted-foreground">
                                                Your account is now linked! You can remove the code from your bio.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}