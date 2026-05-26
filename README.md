# dushu

A Speechify/微信读书-style reading app with text-to-speech, supporting EPUB,PDF,TXT,and MOBI formats.

## Features

- Render books faithfully (EPUB reflowable, PDF page-native)
- Text-to-speech with word and sentence highlighting Bookmarks, highlights, and notes
- Reading progress tracking
- Web and mobile (React Native / Expo)

## Workspace Layout

- `apps/web` - Web reader (React + Vite + TanStack Query)
- `apps/native` - Mobile reader (Expo / React Native)
- `apps/server` - API server (Express + Mongoose)
- `packages/shared` - Shared types, utilities, and demo data
- `packages/epub-engine` -EPUB parsing and rendition helpers
- `packages/pde-engine`- PDF parsing and page helpers

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Language**: TypeScript(ESM, `"type": "module"`)
- **Web**: React 19, Vite,TanStack Query
- **Native**: Expo 54, React Native
- **Server**: Express 5, Mongoose,tsx
- **Database**: MongoDB (Docker)

## Commands

```bash
pnpm install          # install deps
docker compose up -d  # start MongoDB
pnpm dev              # run all apps in dev mode
pnpm build            # build all packages
pnpm lint             # lint all packages
pnpm typecheck        # type-check all packages
```
