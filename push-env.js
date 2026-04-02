const { execSync } = require('child_process');

function addEnv(key, value) {
  console.log(`Adding ${key}...`);
  try {
    execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`Replacing ${key}...`);
      execSync(`npx vercel env rm ${key} production -y`, { stdio: 'inherit' });
      execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
    } else {
      console.error(e);
    }
  }
}

addEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://wiiojzxpruhjsilkzmhs.supabase.co');
addEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_D55O9ha6-jOMeZUOza756Q_zmsPFhq_');
addEnv('TEAMS_WEBHOOK_URL', 'https://defaulte2d70a05f3524e9d8c182194f1d9ef.31.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d14acd64256844bdaf7c8b7c6b163a3e/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3BzPbx0GN1XvjOHRmHPUZNNVTf35dIWWr-l-M5IRVak');
