"use client";

import { Card, CardFooter, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import { SignInWithGitHub } from "./SignInWithGitHub";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";


export function SignInCard() {
    const { isAuthenticated } = useConvexAuth();

    if (isAuthenticated) {
        redirect("/onboarding");
    }

    return (
        <Card className="w-[380px]">
            <CardHeader>    
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid gap-4">
                <SignInWithGitHub />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </div>
            </CardFooter>
        </Card>
    );
}
