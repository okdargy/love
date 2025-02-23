import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
    const { user } = await validateRequest();

    // if (!user) {
    //     return redirect("/login");
    // }

    return (
        <div className="container max-w-4xl py-2">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and connections
                    </p>
                </div>
                <Separator />
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between space-y-1">
                            <div className="space-y-1">
                                <p className="font-medium leading-none">
                                    Polytoria Account
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Connect your Polytoria account to post trade ads and badges on your profile
                                </p>
                            </div>
                            <Button 
                            >
                                Connect
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}