# Next.js, Contentlayer & shadcn/ui Starter

A feature-rich starter template for building beautiful, content-driven websites with Next.js, Contentlayer, and shadcn/ui.

## ✨ Features

- **Framework:** Next.js 15 (App Router) & React 19
- **Styling:** Tailwind CSS v4 with CSS variables for easy theming.
- **UI Components:** Pre-configured with shadcn/ui.
- **Content:** MDX powered by Contentlayer for blogs, docs, and pages.
- **Code Highlighting:** Beautiful, copy-paste-friendly code blocks with rehype-pretty-code.
- **SEO:** Dynamic metadata generation, sitemaps, and `robots.ts`.
- **Developer Experience:** Pre-configured with ESLint and Prettier for code quality and consistency.

## 🚀 Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Contentlayer](https://www.contentlayer.dev/)
- [pnpm](https://pnpm.io/)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install dependencies

This project uses `pnpm` as the package manager.

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file by copying the example file.

```bash
cp .env.example .env.local
```

Update the variables in `.env.local` as needed.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Creates a production-ready build.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Runs ESLint to check for code quality issues.
- `pnpm format`: Formats code using Prettier.

## 📁 Project Structure

```
src
├── app/          # App Router pages and layouts
├── components/   # Shared and UI components
├── config/       # Site configuration files
├── content/      # MDX content files (blog, docs, etc.)
├── hooks/        # Custom React hooks
├── lib/          # Utility functions and libraries
└── styles/       # Global styles
```
