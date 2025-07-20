"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usernameValidators, displayNameValidators } from "./validators";
import type { ValidationResult } from "@/lib/validation";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [validationStates, setValidationStates] = useState<
    Record<string, ValidationResult>
  >({});

  const userProfile = useQuery(api.users.queries.getUserProfile);
  const createProfile = useMutation(api.users.mutations.createUserProfile);
  
  // Only check username availability if username is at least 3 characters
  const usernameExists = useQuery(
    api.users.queries.checkUsernameExists,
    username.length >= 3 ? { username: username } : "skip"
  );

  // Redirect if user is already onboarded
  useEffect(() => {
    if (userProfile?.isOnboarded) {
      redirect("/campaigns");
    }
  }, [userProfile]);

  const handleValidationChange =
    (field: string) => (result: ValidationResult) => {
      setValidationStates((prev) => ({ ...prev, [field]: result }));
    };

  // Check if required fields are empty
  const areRequiredFieldsEmpty = () => {
    return !username.trim();
  };

  // Check if form is valid (no validation errors and no required fields empty)
  const isFormValid = () => {
    if (areRequiredFieldsEmpty()) {
      return false;
    }
    
    // Check if any validation has failed
    const hasErrors = Object.values(validationStates).some(
      (state) => state.state === "error"
    );
    
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if required fields are empty
    if (areRequiredFieldsEmpty()) {
      return;
    }
    
    // Check if there are any validation errors
    const hasErrors = Object.values(validationStates).some(
      (state) => state.state === "error"
    );
    
    if (!hasErrors) {
      try {
        await createProfile({
          username: username.toLowerCase(),
          displayName: displayName || username,
        });
        router.push("/campaigns");
      } catch (error) {
        console.error("Failed to create profile:", error);
        // Handle error (show toast, etc.)
      }
    }
  };

  if (userProfile?.isOnboarded) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to D&D Connect!</CardTitle>
          <CardDescription>
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ValidatedInput
              label="Username"
              value={username}
              helperText="This can't be changed later!"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              validators={usernameValidators(usernameExists)}
              onValidationChange={handleValidationChange("username")}
              required
            />

            <ValidatedInput
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name (optional)"
              validators={displayNameValidators}
              onValidationChange={handleValidationChange("displayName")}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid()}
            >
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 