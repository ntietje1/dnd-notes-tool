"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";

// landing -> (if no campaigns exist yet) -> create campaign -> creation flow -> notes editor
// landing -> (if campaigns exist) -> select campaign (with a button to navigate to create campaign) -> notes editor

// campaign creation flow:
// 1. name
// 2. description
// 3. link
// 4. create

// campaign selection flow:

export default function CampaignCreate() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createCampaign = useMutation(api.campaigns.mutations.createCampaign);

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    await createCampaign({ name, description, token: "1234567890" })
      .then(() => {
        setSuccess("Campaign created successfully");
      })
      .catch((error) => {
        setError("Failed to create campaign");
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div>
      <h1>Campaign Create</h1>
      <form onSubmit={handleCreateCampaign} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white rounded-md p-2"
        >
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
    </div>
  );
}
