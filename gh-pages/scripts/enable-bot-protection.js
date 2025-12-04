/**
 * Enable Vercel Bot Protection programmatically
 *
 * Usage:
 *   VERCEL_TOKEN=your_token VERCEL_PROJECT_ID=your_project_id node enable-bot-protection.js
 *
 * To get your token: https://vercel.com/account/tokens
 * To get project ID: vercel project ls (or from Vercel dashboard URL)
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, only needed for team projects

if (!VERCEL_TOKEN) {
  console.error('Error: VERCEL_TOKEN environment variable is required');
  console.error('Get your token at: https://vercel.com/account/tokens');
  process.exit(1);
}

if (!VERCEL_PROJECT_ID) {
  console.error('Error: VERCEL_PROJECT_ID environment variable is required');
  console.error('Find it with: vercel project ls');
  process.exit(1);
}

async function updateFirewallConfig(rulesetId, config) {
  const url = new URL(`https://api.vercel.com/v1/security/firewall/config`);
  url.searchParams.set('projectId', VERCEL_PROJECT_ID);
  if (VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', VERCEL_TEAM_ID);
  }

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'managedRules.update',
      id: rulesetId,
      value: config,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to update ${rulesetId}: ${response.status} - ${error}`
    );
  }

  return response.json();
}

async function enableBotProtection() {
  console.log('🛡️  Enabling Vercel Bot Protection...\n');

  try {
    // 1. Enable Bot Protection with Challenge action
    console.log('1. Enabling bot_protection (challenge mode)...');
    await updateFirewallConfig('bot_protection', {
      active: true,
      action: 'challenge', // 'log', 'deny', or 'challenge'
    });
    console.log('   ✅ Bot Protection enabled\n');

    // 2. Enable AI Bots protection (blocks AI scrapers like GPTBot, etc.)
    console.log('2. Enabling ai_bots protection (deny mode)...');
    await updateFirewallConfig('ai_bots', {
      active: true,
      action: 'deny',
    });
    console.log('   ✅ AI Bots protection enabled\n');

    // 3. Optionally enable bot_filter for additional filtering
    console.log('3. Enabling bot_filter (log mode)...');
    await updateFirewallConfig('bot_filter', {
      active: true,
      action: 'log', // Start with log to monitor
    });
    console.log('   ✅ Bot Filter enabled (logging only)\n');

    console.log('🎉 All bot protection rules enabled successfully!');
    console.log('\nView your firewall settings at:');
    console.log(
      `   https://vercel.com/${VERCEL_TEAM_ID || 'dashboard'}/${VERCEL_PROJECT_ID}/settings/security`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

enableBotProtection();
