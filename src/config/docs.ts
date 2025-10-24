import { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
  chartsNav: SidebarNavItem[];
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
  ],
  sidebarNav: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Docs",
          href: "/docs",
          items: [],
        },
        {
          title: "In Progress",
          href: "/docs/in-progress",
          items: [],
          label: "New",
        },
      ],
    },
  ],
};
