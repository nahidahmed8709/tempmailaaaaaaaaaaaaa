# AutoTempMail on Netlify

This project needs both the Vite frontend and a serverless API. The API is configured as a Netlify Function.

## Important
Do not use Netlify Drop / drag-and-drop static deploy for this full source ZIP: that method only uploads static files and does not install/deploy serverless functions. Deploy this ZIP through a Git repository connected to Netlify, or deploy with Netlify CLI.

## Git deployment
1. Extract this ZIP.
2. Upload all project files (including `netlify.toml`, `netlify/functions/api.ts`, `server.ts`, and `package.json`) to a GitHub repository.
3. In Netlify choose **Add new site → Import an existing project**, connect the repository, and deploy.
4. Build command: `npm run build`; publish directory: `dist` (already configured in `netlify.toml`).

## Netlify CLI option
From the extracted project directory run:

```bash
npm install
npx netlify login
npx netlify init
npx netlify deploy --build --prod
```

The temporary-mail providers are third-party services, so inbox creation and delivery still depend on those providers being reachable and accepting requests.
