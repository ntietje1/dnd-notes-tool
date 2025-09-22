import { useRouter } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useCampaign } from "~/contexts/CampaignContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvex, useConvexMutation } from "@convex-dev/react-query";
import { validateTagDescription, validateTagName, validateTagNameAsync } from "./validators.ts";
import BaseTagDialog from "../base-tag-dialog/base-dialog.tsx";
import { toast } from "sonner";
import { Label } from "~/components/shadcn/ui/label";
import { Input } from "~/components/shadcn/ui/input";
import { ColorPicker } from "../base-tag-dialog/color-picker.tsx";
import type { Tag } from "convex/tags/types";
import { type TagDialogProps, defaultBaseFormValues, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, type BaseTagFormValues } from "../base-tag-dialog/types.ts";

export default function GenericTagDialog({
  mode,
  isOpen,
  onClose,
  config,
  tag,
  navigateToNote = false,
}: TagDialogProps) {
  const router = useRouter();
  const convex = useConvex();
  const { campaignWithMembership, dmUsername, campaignSlug } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;

  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.tags.mutations.createTag)
  });

  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.tags.mutations.updateTag)
  });

  const getCategoryId = useQuery(convexQuery(api.tags.queries.getTagCategoryByName, campaign?._id ? {
    campaignId: campaign?._id,
    categoryName: config.categoryName,
  } : "skip"));

  const getInitialValues = ({ mode, tag }: { mode: "create" | "edit"; tag?: Tag }): BaseTagFormValues => (
    mode === "edit" && tag ? {
      name: tag.displayName,
      description: tag.description || "",
      color: tag.color,
    } : defaultBaseFormValues
  );

  async function handleSubmit(value: BaseTagFormValues) {
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
          const result = await createMutation.mutateAsync({
            displayName: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
            campaignId: campaign._id,
            categoryId: getCategoryId.data._id,
          });

          toast.success(`${config.singular} created successfully`);
          onClose();

          if (navigateToNote && result.noteId) {
            router.navigate({
              to: "/campaigns/$dmUsername/$campaignSlug/notes/$noteId",
              params: {
                dmUsername,
                campaignSlug,
                noteId: result.noteId,
              },
            });
          }
        } else if (mode === "edit" && tag) {
          await updateMutation.mutateAsync({
            tagId: tag._id,
            displayName: value.name.trim(),
            description: value.description.trim() || undefined,
            color: value.color,
          });

          toast.success(`${config.singular} updated successfully`);
          onClose();
        }
      } catch (error) {
        console.error(`Failed to ${mode} tag:`, error);
        toast.error(`Failed to ${mode} ${config.singular.toLowerCase()}`);
      }
  }

  if (!isOpen) return null;

  return (
    <BaseTagDialog
      mode={mode}
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      tag={tag}
      getInitialValues={getInitialValues}
      onSubmit={async ({ values }) => handleSubmit(values)}
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
                  mode === "edit" && tag ? tag._id : undefined
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
        </>
      )}
    </BaseTagDialog>
  );
}
