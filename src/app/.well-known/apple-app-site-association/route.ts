import { NextResponse } from 'next/server';

// iOS Universal Links verification file for the Thantra Astro app.
// Team ID: X7TQVGJ269 · bundle: com.lavish1.astrolearn
export function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: 'X7TQVGJ269.com.lavish1.astrolearn',
          paths: ['/shorts', '/shorts/*'],
        },
      ],
    },
  });
}
