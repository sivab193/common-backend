# Portfolio Backend API

A robust, serverless-ready Node.js & Express backend designed to power a modern developer portfolio. It uses the native MongoDB driver for database interactions and integrates directly with the GitHub and Gemini AI APIs to intelligently auto-sync your software projects.

## Features

- **MongoDB Native Driver:** Fast, unopinionated database operations without heavy ORMs.
- **Smart GitHub Sync:** Automatically fetches your public GitHub repositories and upserts them into your database.
- **Gemini AI Integration:** Utilizes `@google/genai` (Gemini 2.5 Flash) to parse repository `README.md` files and automatically generate clean titles, descriptions, technology tags, and feature highlights for new projects.
- **Encrypted Secrets:** Uses `@dotenvx/dotenvx` for secure, encrypted environment variable management.
- **Serverless Ready:** Pre-configured with a `vercel.json` to be deployed instantly as a Vercel Serverless Function.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Native Node Driver)
- **AI:** Google Gemini (`@google/genai`)
- **Environment Management:** dotenvx

## Getting Started

### Prerequisites

- Node.js installed locally.
- A MongoDB Atlas cluster/URI.
- A Google Gemini API Key.
- Optional: A GitHub Personal Access Token (to prevent rate-limiting during syncs).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sivab193/common-backend.git
   cd common-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Duplicate `.env.example` to `.env` and fill in your credentials:
   ```env
   PORT=3001
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/personal-website?retryWrites=true&w=majority
   GEMINI_API_KEY=your_gemini_api_key_here
   GITHUB_TOKEN=your_optional_github_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   # OR just: node server.js
   ```

## API Endpoints

### Projects
- `GET /api/projects` - Fetch all visible projects, sorted by newest first.
- `GET /api/projects/all` - Fetch all projects (including hidden ones).
- `POST /api/projects` - Manually create a new project.
- `PATCH /api/projects/:id` - Update existing project details.
- `PATCH /api/projects/:id/visibility` - Toggle the `visible` boolean flag.
- `DELETE /api/projects/:id` - Delete a project.

### Sync
- `POST /api/projects/sync-github` - Triggers the automatic GitHub + Gemini synchronization pipeline. It skips existing projects (only updates timestamps) and generates rich MongoDB entries for new repositories based on their READMEs.

## Deployment

This API is configured for seamless deployment to **Vercel**.

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add your `MONGO_URI` and `GEMINI_API_KEY` to Vercel's Environment Variables settings.
4. Deploy! Vercel will automatically detect `vercel.json` and wrap the Express app in a serverless function.
