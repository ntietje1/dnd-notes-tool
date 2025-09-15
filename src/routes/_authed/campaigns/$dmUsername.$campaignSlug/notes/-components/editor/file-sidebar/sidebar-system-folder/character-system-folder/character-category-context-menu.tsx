import CharacterDialog from "~/routes/_authed/campaigns/$dmUsername.$campaignSlug/characters/-components/character-dialog";
import { GenericCategoryContextMenu, type GenericCategoryContextMenuProps } from "../generic-category-folder/generic-category-context-menu";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { User } from "lucide-react";
import { useCampaign } from "~/contexts/CampaignContext";
import { useRouter } from "@tanstack/react-router";

export function CharacterCategoryFolderContextMenu({
  children,
}: GenericCategoryContextMenuProps) {
  const router = useRouter();
  const { dmUsername, campaignSlug } = useCampaign();
  return (
    <GenericCategoryContextMenu
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Character}
      additionalItems={() => [
        {
          icon: <User className="h-4 w-4" />,
          label: "Go to Characters",
          onClick: () => {
            router.navigate({
              to: "/campaigns/$dmUsername/$campaignSlug/characters",
              params: {
                dmUsername,
                campaignSlug,
              },
            });
          },
        },
      ]}
      renderCreateDialog={(isOpen, onClose) => (
        <CharacterDialog
          mode="create"
          isOpen={isOpen}
          onClose={onClose}
          navigateToNote={true}
        />
      )}
    >
      {children}
    </GenericCategoryContextMenu>
  );
}
