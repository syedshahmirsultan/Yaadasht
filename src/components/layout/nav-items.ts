import { CalendarDays, Library, Search, Sun, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/collections", label: "Collections", icon: Library },
  { href: "/search", label: "Search", icon: Search },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
