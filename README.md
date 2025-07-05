# D&D Notes Tool

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-FF731D?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)

A modern note-taking and sharing platform designed specifically for Dungeon Masters and their players. Seamlessly organize, manage, and share campaign notes while maintaining the perfect balance between open information and DM secrets.

## 🎲 Features

### For Dungeon Masters

- **Campaign Management**
  - Create and manage multiple campaigns
  - Generate invite links for players
  - Full control over note sharing and visibility
  - Organize notes hierarchically with markdown support
  - Tag system for easy categorization (characters, locations, etc.)
  - Upload and manage campaign assets (maps, character portraits, etc.)

### For Players

- **Dual Note Interface**
  - Join one or more campaigns
  - View DM-shared content in a dedicated window
  - Session-based tagging
  - Create and maintain personal notes
  - Add personal annotations to DM-shared content

### Core Features

- **Smart Note Organization**
  - Intuitive sidebar navigation
  - Markdown formatting support
  - Tag-based organization
  - Hierarchical note structure
  - Image support for maps and assets

- **Real-time Sharing**
  - Instant updates for shared content
  - Selective content sharing based on tags
  - DM control over shared content
  - Retroactive edit capability

- **Search & Filter**
  - Full-text search across notes
  - Filter by tags

## 🎯 Planned Features

- **Enhanced Organization**
  - Custom tag creation
  - Wiki-style note linking
  - Advanced filtering options
  - Embedded documents and other file formats

- **Additional Tools**
  - Combat assistant
  - Character sheet creator
  - Virtual Tabletop

## 🔧 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex Functions
- **Authentication**: Convex Auth, GitHub OAuth
- **Storage**: Convex realtime DB & File Storage

## 🚀 Getting Started

### Prerequisites

- Node.js
- pnpm
- Convex account
- GitHub account (for authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ntietje1/dnd-notes-tool
cd dnd-notes-tool
```

2. Install dependencies:

```bash
pnpm install
```

3. Convex Setup (it will prompt you to log into [Convex](https://convex.dev) and create a project.)

```bash
pnpm run dev
```

4. Obtain your Authorization callback URL
   - In your Convex project, go to Settings > URL & Deploy Key > Show development credentials > HTTP Actions URL
   - The full Authorization callback URL will be your actions URL plus `api/auth/callback/github`.
   - So if your actions URL is `https://fast-horse-123.convex.site` then your callback URL will be: `https://fast-horse-123.convex.site/api/auth/callback/github`
5. GitHub OAuth Setup
   - Create a GitHub OAuth app, supplying your Authorization callback URL
   - Generate your client secret, copy it
   - Add the following environment variables to your `.env.local` file:
     - `AUTH_GITHUB_ID`
     - `AUTH_GITHUB_SECRET`

6. Generate JWT private key:

```bash
npx @convex-dev/auth
node setup.mjs
```

5. Start the development server:

```bash
pnpm run dev
```
