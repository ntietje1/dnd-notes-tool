import type { Character } from "convex/characters/types";
import { convexQuery, useConvex, useConvexMutation } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Label } from "~/components/shadcn/ui/label";
import { Input } from "~/components/shadcn/ui/input";
import { ColorPicker } from "../base-tag-dialog/color-picker";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import BaseTagDialog from "../base-tag-dialog/base-dialog.tsx";
import { validateTagDescription, validateTagName, validateTagNameAsync } from "../generic-tag-dialog/validators.ts";
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, type TagDialogProps } from "../base-tag-dialog/types.ts";
import { defaultCharacterFormValues, type CharacterFormValues } from "./types.ts";

export default function CharacterDialog(props: TagDialogProps<Character>) {
  const router = useRouter();
  const convex = useConvex();
  const { campaignWithMembership, dmUsername, campaignSlug } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;

  // Extract properties based on discriminated union
  const isEditMode = props.mode === "edit";
  const character = isEditMode ? props.tag : undefined;
  const config = props.config;
  const navigateToNote = props.navigateToNote ?? false;
  const mode = props.mode;
  const isOpen = props.isOpen;
  const onClose = props.onClose;

  const playersQuery = useQuery(convexQuery(api.campaigns.queries.getPlayersByCampaign, campaign?._id ? {
    campaignId: campaign?._id,
  } : "skip"));

  const getCategoryId = useQuery(convexQuery(api.tags.queries.getTagCategoryByName, campaign?._id ? {
    campaignId: campaign?._id,
    categoryName: config.categoryName,
  } : "skip"));

  const createTagMutation = useMutation({
    mutationFn: useConvexMutation(api.tags.mutations.createTag)
  });
  const createCharacterMutation = useMutation({
    mutationFn: useConvexMutation(api.characters.mutations.createCharacter)
  });
  const updateTagMutation = useMutation({
    mutationFn: useConvexMutation(api.tags.mutations.updateTag)
  });
  const updateCharacterMutation = useMutation({
    mutationFn: useConvexMutation(api.characters.mutations.updateCharacter)
  });

  const getInitialValues = ({ mode }: { mode: "create" | "edit" }) => {
    if (mode === "edit" && character) {
      return {
        name: character.displayName || "",
        description: character.description || "",
        color: character.color,
        playerId: character.playerId || undefined,
      };
    }
    return defaultCharacterFormValues;
  };

  async function handleSubmit(args: { mode: "create" | "edit"; values: CharacterFormValues }) {
    const { mode, values } = args;
    if (!campaign) {
      toast.error("Campaign not found");
      return;
    }

    if (!getCategoryId.data) {
      toast.error(`Category "${config.categoryName}" not found`);
      return;
    }

    try {
      if (mode === "create") {
        const tagResult = await createTagMutation.mutateAsync({
          displayName: values.name.trim(),
          description: values.description.trim() || undefined,
          color: values.color,
          campaignId: campaign._id,
          categoryId: getCategoryId.data._id,
        });

        await createCharacterMutation.mutateAsync({
          tagId: tagResult.tagId,
          playerId: values.playerId || undefined,
        });

        toast.success(`${config.singular} created successfully`);
        onClose();

        if (navigateToNote && tagResult.noteId) {
          router.navigate({
            to: "/campaigns/$dmUsername/$campaignSlug/notes/$noteId",
            params: {
              dmUsername,
              campaignSlug,
              noteId: tagResult.noteId,
            },
          });
        }
      } else if (mode === "edit" && character) {
        await updateTagMutation.mutateAsync({
          tagId: character.tagId,
          displayName: values.name.trim(),
          description: values.description.trim() || undefined,
          color: values.color,
        });
        await updateCharacterMutation.mutateAsync({
          characterId: character.characterId,
          playerId: values.playerId || undefined,
        });

        toast.success(`${config.singular} updated successfully`);
        onClose();
      }
    } catch (error) {
      console.error(`Failed to ${mode} tag:`, error);
      toast.error(`Failed to ${mode} ${config.singular.toLowerCase()}`);
    }
  }

  return (
    <BaseTagDialog
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      tag={character as any}
      getInitialValues={getInitialValues}
      onSubmit={handleSubmit}
    >
      {({ form, isSubmitting }) => (
        <>
          {/* Name */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }: { value: string }) => validateTagName(value, MAX_NAME_LENGTH, config.singular),
              onChangeAsync: async ({ value }: { value: string }) => {
                if (!campaign) return undefined;
                return validateTagNameAsync(
                  convex,
                  campaign._id,
                  value,
                  mode === "edit" && character ? character.tagId : undefined
                );
              },
              onChangeAsyncDebounceMs: 300,
            }}
          >
            {(field: any) => (
              <div className="space-y-2 px-px">
                <Label htmlFor={`${config.singular.toLowerCase()}-name`}>{config.singular} Name</Label>
                <Input
                  id={`${config.singular.toLowerCase()}-name`}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={`Enter ${config.singular.toLowerCase()} name...`}
                  maxLength={MAX_NAME_LENGTH}
                  disabled={isSubmitting}
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                ) : null}
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description" validators={{
            onChange: ({ value }: { value: string }) => validateTagDescription(value, MAX_DESCRIPTION_LENGTH, config.singular),
          }}>
            {(field: any) => (
              <div className="space-y-2 px-px">
                <Label htmlFor={`${config.singular.toLowerCase()}-description`}>Description</Label>
                <textarea
                  id={`${config.singular.toLowerCase()}-description`}
                  rows={3}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  onBlur={field.handleBlur}
                  placeholder={`Describe this ${config.singular.toLowerCase()}...`}
                  disabled={isSubmitting}
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-sm text-red-500">{field.state.meta.errors[0]}</p>
                ) : null}
              </div>
            )}
          </form.Field>

          {/* Color */}
          <form.Field name="color">
            {(field: any) => (
              <div className="space-y-2 px-px">
                <Label htmlFor={`${config.singular.toLowerCase()}-color`}>{config.singular} Color</Label>
                <ColorPicker
                  selectedColor={field.state.value}
                  onColorChange={(color) => field.handleChange(color)}
                  disabled={isSubmitting}
                  aria-labelledby="color-picker-label"
                />
              </div>
            )}
          </form.Field>

          {/* Player */}
          <form.Field name="playerId">
            {(field: any) => (
              <div className="space-y-2 px-px">
                <Label htmlFor={`character-player`}>Player</Label>
                <select
                  id={`character-player`}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={String(field.state.value ?? "")}
                  onChange={(e) => field.handleChange(e.target.value as any)}
                  onBlur={field.handleBlur}
                  disabled={form.state.isSubmitting}
                >
                  <option value="">Select a player (optional)...</option>
                  {(playersQuery.data || []).map(option => (
                    <option key={option._id} value={option._id}>
                      {option.userProfile.name || option.userProfile.username || "Member"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
        </>
      )}
    </BaseTagDialog>
  );
}