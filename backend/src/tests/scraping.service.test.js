import { test, mock } from 'node:test';
import assert from 'node:assert';
import { scrapeJobDescription } from '../services/scraping.service.js';
import puppeteer from 'puppeteer';

test('Scraping Service - Throws error when URL is missing', async () => {
  await assert.rejects(
    async () => {
      await scrapeJobDescription(null);
    },
    /URL is required/
  );
});

test('Scraping Service - Handles browser failure gracefully', async (t) => {
  // Mock puppeteer launch to throw an error
  const mockLaunch = mock.method(puppeteer, 'launch', async () => {
    throw new Error('Chromium crash simulation');
  });

  t.after(() => {
    mockLaunch.mock.restore();
  });

  await assert.rejects(
    async () => {
      await scrapeJobDescription('https://example.com/job');
    },
    /Failed to retrieve job description from URL/
  );
});
