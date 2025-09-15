import CharacterDialog from "~/routes/_authed/campaigns/$dmUsername.$campaignSlug/characters/-components/character-dialog";
import { GenericCategoryContextMenu, type GenericCategoryContextMenuProps } from "../generic-category-folder/generic-category-context-menu";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { User } from "lucide-react";
import { useCampaign } from "~/contexts/CampaignContext";
import { useRouter } from "@tanstack/react-router";
import LocationDialog from "~/routes/_authed/campaigns/$dmUsername.$campaignSlug/locations/-components/location-dialog";

export function LocationCategoryFolderContextMenu({
  children,
}: GenericCategoryContextMenuProps) {
  const router = useRouter();
  const { dmUsername, campaignSlug } = useCampaign();
  return (
    <GenericCategoryContextMenu
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Location}
      additionalItems={() => [
        {
          icon: <User className="h-4 w-4" />,
          label: "Go to Locations",
          onClick: () => {
            router.navigate({
              to: "/campaigns/$dmUsername/$campaignSlug/locations",
              params: {
                dmUsername,
                campaignSlug,
              },
            });
          },
        },
      ]}
      renderCreateDialog={(isOpen, onClose) => (
        <LocationDialog
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
