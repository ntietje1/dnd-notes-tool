import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { FormDialog } from "./form-dialog";
import { FormActions } from "./form-actions";
import { Plus } from "~/lib/icons";
import type { Tag } from "convex/tags/types";
import type { TagCategoryConfig } from "./types";

interface BaseTagDialogProps<TTag extends Tag = Tag, TFormValues = Record<string, unknown>> {
  mode: "create" | "edit";
  isOpen: boolean;
  onClose: () => void;
  config: TagCategoryConfig;
  tag?: TTag;
  getInitialValues: (args: { mode: "create" | "edit"; tag?: TTag }) => TFormValues;
  onSubmit: (args: { mode: "create" | "edit"; values: TFormValues }) => Promise<void>;
  children: (args: { form: any; isSubmitting: boolean }) => React.ReactNode;
}

export default function BaseTagDialog<TTag extends Tag = Tag, TFormValues = Record<string, unknown>>({
  mode,
  isOpen,
  onClose,
  config,
  tag,
  getInitialValues,
  onSubmit,
  children,
}: BaseTagDialogProps<TTag, TFormValues>) {
  const initialValues = getInitialValues({ mode, tag });

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit({ mode, values: value });
      onClose();
    },
  });

  // Reset form when dialog mode/tag changes
  useEffect(() => {
    form.reset(getInitialValues({ mode, tag }));
  }, [mode, tag?._id]);

  const handleClose = () => {
    if (form.state.isSubmitting) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "create" ? `Create New ${config.singular}` : `Edit ${config.singular}`}
      description={
        mode === "create"
          ? `Add a new ${config.singular.toLowerCase()} to your campaign.`
          : `Update ${config.singular.toLowerCase()} details`
      }
      icon={config.icon}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {children({ form, isSubmitting: form.state.isSubmitting })}

        <FormActions
          actions={[
            {
              label: "Cancel",
              onClick: handleClose,
              variant: "outline",
              disabled: form.state.isSubmitting,
            },
            {
              label: mode === "create" ? `Create ${config.singular}` : `Update ${config.singular}`,
              type: "submit",
              disabled: form.state.isSubmitting,
              loading: form.state.isSubmitting,
              loadingText: mode === "create" ? "Creating..." : "Updating...",
              icon: mode === "create" ? Plus : undefined,
            },
          ]}
        />
      </form>
    </FormDialog>
  );
}


