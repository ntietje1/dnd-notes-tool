"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  MapPin,
  FileText,
  User,
  Settings,
  Home,
  Sword,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { CampaignValidation } from "@/app/campaigns/[dmUsername]/[campaignSlug]/components/campaign-validation";
import { NotesProvider } from "@/contexts/NotesContext";

interface CampaignLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

const navigationItems = [
  {
    name: "Overview",
    href: "",
    icon: Home,
    exact: true,
  },
  {
    name: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    name: "Characters",
    href: "/characters",
    icon: User,
  },
  {
    name: "Locations",
    href: "/locations",
    icon: MapPin,
  },
  {
    name: "Players",
    href: "/players",
    icon: Users,
  },
  {
    name: "Scene",
    href: "/scene",
    icon: Sword,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function CampaignLayoutContent({ children, params }: CampaignLayoutProps) {
  const pathname = usePathname();
  const { dmUsername, campaignSlug } = React.use(params);

  const basePath = `/campaigns/${dmUsername}/${campaignSlug}`;

  const isJoinPage = pathname.includes("/join");

  if (isJoinPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-[calc(100vh-2.5rem)] bg-slate-50">
      <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-2">

        {navigationItems.map((item) => {
          const isActive = item.exact
            ? pathname === basePath
            : pathname.startsWith(`${basePath}${item.href}`);

          return (
            <Link
              key={item.name}
              href={`${basePath}${item.href}`}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative",
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              title={item.name}
            >
              <item.icon className="h-5 w-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </div>
    </div>
  );
}

function NotesProviderWrapper({
  children,
  dmUsername,
  campaignSlug,
}: {
  children: React.ReactNode;
  dmUsername: string;
  campaignSlug: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const isNotesRoute = pathname.includes("/notes");
  const noteId = isNotesRoute ? searchParams.get("noteId") : null;
  const characterId = isNotesRoute ? searchParams.get("characterId") : null;
  const locationId = isNotesRoute ? searchParams.get("locationId") : null;
  const sessionId = isNotesRoute ? searchParams.get("sessionId") : null;

  //TODO: make a hook that handles converting characterId, locationId, or sessionId to noteId

  return (
    <NotesProvider
      dmUsername={dmUsername}
      campaignSlug={campaignSlug}
      noteId={noteId || undefined}
    >
      {children}
    </NotesProvider>
  );
}

export default function CampaignLayout({
  children,
  params,
}: CampaignLayoutProps) {
  const { dmUsername, campaignSlug } = React.use(params);

  return (
    <CampaignValidation dmUsername={dmUsername} campaignSlug={campaignSlug}>
      <NotesProviderWrapper
        dmUsername={dmUsername}
        campaignSlug={campaignSlug}
      >
        <CampaignLayoutContent params={params}>{children}</CampaignLayoutContent>
      </NotesProviderWrapper>
    </CampaignValidation>
  );
}
