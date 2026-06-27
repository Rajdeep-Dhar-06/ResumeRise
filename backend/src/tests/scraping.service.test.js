import { test, mock } from 'node:test';
import assert from 'node:assert';
import { scrapeJobDescription } from '../services/scraping.service.js';
import axios from 'axios';

test('Scraping Service - Throws error when URL is missing', async () => {
  await assert.rejects(
    async () => {
      await scrapeJobDescription(null);
    },
    /URL is required/
  );
});

test('Scraping Service - Handles browser/network failure gracefully', async (t) => {
  // Mock axios get to throw an error
  const mockGet = mock.method(axios, 'get', async () => {
    throw new Error('Network timeout simulation');
  });

  t.after(() => {
    mockGet.mock.restore();
  });

  await assert.rejects(
    async () => {
      await scrapeJobDescription('https://example.com/job');
    },
    /Failed to retrieve job description from URL/
  );
});
