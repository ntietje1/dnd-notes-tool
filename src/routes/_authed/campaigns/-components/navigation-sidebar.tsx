import { Link, useLocation } from "@tanstack/react-router";
import { useCampaign } from "~/contexts/CampaignContext";
import { MapPin, Home, Users, Settings, FileText, User } from "~/lib/icons";
import { cn } from "~/lib/utils";

const navigationItems = [
  {
    name: "Overview",
    to: "/campaigns/$dmUsername/$campaignSlug",
    icon: Home,
    exact: true,
  },
  {
    name: "Notes",
    to: "/campaigns/$dmUsername/$campaignSlug/notes",
    icon: FileText,
  },
  {
    name: "Characters",
    to: "/campaigns/$dmUsername/$campaignSlug/characters",
    icon: User,
  },
  {
    name: "Locations",
    to: "/campaigns/$dmUsername/$campaignSlug/locations",
    icon: MapPin,
  },
  {
    name: "Players",
    to: "/campaigns/$dmUsername/$campaignSlug/players",
    icon: Users,
  },
  {
    name: "Settings",
    to: "/campaigns/$dmUsername/$campaignSlug/settings",
    icon: Settings,
  },
];

export const NavigationSidebar = () => {
  const { dmUsername, campaignSlug } = useCampaign()
  const { pathname } = useLocation()
  const isActive = (item: typeof navigationItems[number]) => {
    return pathname === item.to
  }

  return (
    <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-2">
      {navigationItems.map((item) => {
        return (
          <Link
            key={item.name}
            to={item.to}
            params={{ dmUsername, campaignSlug }}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative",
              isActive(item)
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
  )
}