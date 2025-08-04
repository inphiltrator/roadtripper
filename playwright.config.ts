import { defineConfig } from '@playwright/test';

export default defineConfig({
	// Use existing dev server on port 5173
	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: true,
		timeout: 120000
	},
	testDir: 'e2e',
	use: {
		baseURL: 'http://localhost:5173',
		headless: true,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	timeout: 30000,
	expect: {
		timeout: 10000
	},
	retries: 1
});
