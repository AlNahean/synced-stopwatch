export const siteConfig = {
  name: "Al Nahean",
  url: "https://nahean.com",
  ogImage: "https://nahean.com/og.jpg",
  description:
    "A set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks. Open Source. Open Code.",
  links: {
    twitter: "https://x.com/nahean95",
    github: "https://github.com/alnahean",
  },
  author: {
    name: "nahean",
    url: "https://nahean.com",
  },
  creator: {
    name: "nahean",
  },
};

export type SiteConfig = typeof siteConfig;

export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

export const navLinks = [
  {
    label: "Changelog",
    href: "/changelog",
    isActive: (pathname: string) => pathname === "/changelog",
    external: false,
  },
  {
    label: "About",
    href: "/about",
    isActive: (pathname: string) => pathname === "/about",
    external: false,
  },
  // {
  //   label: "Blocks",
  //   href: "/blocks",
  //   isActive: (pathname: string) => pathname.startsWith("/blocks"),
  //   external: false,
  // },
  // {
  //   label: "Charts",
  //   href: "/charts",
  //   isActive: (pathname: string) =>
  //     pathname.startsWith("/docs/component/chart") ||
  //     pathname.startsWith("/charts"),
  //   external: false,
  // },
  // {
  //   label: "Themes",
  //   href: "/themes",
  //   isActive: (pathname: string) => pathname.startsWith("/themes"),
  //   external: false,
  // },
  // {
  //   label: "Colors",
  //   href: "/colors",
  //   isActive: (pathname: string) => pathname.startsWith("/colors"),
  //   external: false,
  // },
];
export type Project = {
  title: string;
  description: string;
  href: string;
  github?: string;
  image: string;
  tags: string[];
  featured?: boolean;
};
export const PROJECTS: Project[] = [
  {
    title: "Resume creator tool with AI",
    description:
      "Create your resume in a few minutes. The tool will help you with the content and design.",
    href: "https://cvzdarma.cz",
    image: "/projects/cvzdarma-project.png",
    tags: [
      "Next.js 15",
      "Tailwind CSS",
      "Prisma",
      "OpenAI",
      "Server actions",
      "shadcn/ui",
      "nodemailer",
      "Clerk",
    ],
    featured: true,
  },
  {
    title: "Place of amazing portfolios",
    description:
      "Are you looking for inspiration for your portfolio? You're in the right place! Here you will find a collection of amazing portfolios by amazing people.",
    href: "https://list.swajp.me",
    github: "https://github.com/swajp/list-swajp.me",
    image: "/projects/list-project.png",
    tags: [
      "Next.js 14",
      "Tailwind CSS",
      "Convex",
      "shadcn/ui",
      "nodemailer",
      "Clerk",
    ],
    featured: true,
  },
  {
    title: "devkoutek.cz",
    description:
      "A discord place for czech developers. To show their projects and help each other.",
    href: "https://devkoutek.cz",
    github: "https://github.com/swajp/devkoutek.cz",
    image: "/projects/devkoutek-project.png",
    tags: ["NextJS", "Tailwind CSS"],
  },
  {
    title: "casecobra",
    description:
      "E-commerce website for a company selling cases for mobile phones.",
    href: "https://shop-casecobra.vercel.app",
    github: "https://github.com/swajp/casecobra",
    image: "/projects/casecobra-project.png",
    tags: ["Next.js", "React", "Tailwind CSS", "Stripe", "Prisma"],
  },
  {
    title: "DRIE",
    description: "Full-stack developer, designer, and creator.",
    href: "https://drie.cz",
    image: "/projects/drie-project.png",
    tags: ["Next.js", "React", "Tailwind CSS", "Framer motion"],
  },
  {
    title: "yogaboskovice",
    description: "Website for yoga studio in Boskovice.",
    href: "https://yogaboskovice.cz",
    image: "/projects/yogaboskovice-project.png",
    tags: ["Wordpress", "Elementor"],
  },
  {
    title: "mujqrkod.cz",
    description: "QR code generator without registration. Fast and simple.",
    href: "https://mujqrkod.vercel.app",
    github: "https://github.com/swajp/mujqrkod",
    image: "/projects/mujqrkod-project.png",
    tags: ["Next.js", "Tailwind CSS", "shadcn/ui"],
  },
  {
    title: "uzx-elektro",
    description: "A website for an company using Loxone technology",
    href: "https://uzx-elektro.cz",
    image: "/projects/uzxelektro-project.png",
    tags: ["Next.js", "Tailwind CSS"],
  },
  {
    title: "uzx-security",
    description: "A website for a security company.",
    href: "https://uzx-security.cz",
    image: "/projects/uzxsecurity-project.png",
    tags: ["Next.js", "Tailwind CSS"],
  },
  {
    title: "Shortner Tool",
    description: "Fast and simple URL shortner tool.",
    href: "https://short.drie.cz",
    image: "/projects/short-project.png",
    tags: ["Next.js", "Tailwind CSS", "MongoDB"],
  },
  {
    title: "my-story",
    description: "Share your stories with the world.",
    href: "https://story-sharing-app-nu.vercel.app/",
    github: "https://github.com/swajp/my-story",
    image: "/projects/mystory-project.png",
    tags: ["Next.js", "Tailwind CSS", "Framer motion", "Convex"],
  },
  {
    title: "LoRa",
    description: "LoRa network offered in Boskovice.",
    href: "https://lora.drie.cz",
    image: "/projects/lora-project.png",
    tags: ["Next.js", "Tailwind CSS", "Framer motion"],
  },
  {
    title: "betterUML",
    description: "Create effectively and easy class diagrams.",
    href: "https://better-uml.vercel.app",
    image: "/projects/betteruml-project.png",
    tags: ["Next.js", "Tailwind CSS", "Framer motion"],
  },
];
