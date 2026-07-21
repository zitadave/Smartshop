#!/usr/bin/env node
/**
 * Smart Shop — Netlify Environment Variable Setup Script
 * 
 * Usage: node setup-netlify-env.js
 * 
 * Alternatively, set these manually in Netlify Dashboard:
 * Site Settings → Environment Variables
 */

const NETLIFY_SITE = 'moonlit-kheer-826ac2';
// Get your token from: https://app.netlify.com/user/applications
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || '';

const ENV_VARS = {
  VITE_UMAMI_URL: 'https://cloud.umami.is/script.js',
  VITE_UMAMI_ID: '94d9f610-2e0f-491a-9c84-6b590a4dd50e',
  VITE_SENTRY_DSN: '', // Add your Sentry DSN here
};

async function setup() {
  if (!NETLIFY_TOKEN) {
    console.log('⚠️  No NETLIFY_TOKEN found.');
    console.log('\n📋 Please set these environment variables manually in Netlify Dashboard:');
    console.log('   Go to: https://app.netlify.com/sites/' + NETLIFY_SITE + '/settings/env');
    console.log('');
    for (const [key, value] of Object.entries(ENV_VARS)) {
      if (value) {
        console.log(`   ${key}=${value}`);
      } else {
        console.log(`   ${key}=<your-sentry-dsn>`);
      }
    }
    return;
  }

  console.log('🔧 Setting up Netlify environment variables...\n');

  for (const [key, value] of Object.entries(ENV_VARS)) {
    if (!value) {
      console.log(`⏭️  Skipping ${key} (no value provided)`);
      continue;
    }
    try {
      const res = await fetch(
        `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE}/env/${key}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            values: [{ value, context: 'all' }],
          }),
        }
      );
      if (res.ok) {
        console.log(`✅ Set ${key}=${value}`);
      } else {
        console.log(`❌ Failed to set ${key}: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.log(`❌ Error setting ${key}:`, err);
    }
  }

  console.log('\n🚀 Triggering redeploy...');
  try {
    await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE}/builds`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
      }
    );
    console.log('✅ Redeploy triggered!');
  } catch (err) {
    console.log('❌ Failed to trigger redeploy:', err);
  }
}

setup();
