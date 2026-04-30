// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'financial_forecaster';
const isCi = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: isCi ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io` : 'http://localhost:4321',
  base: isCi ? `/${repository}` : '/',
  integrations: [react()],
});
