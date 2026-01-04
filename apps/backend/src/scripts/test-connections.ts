import { createClient } from '@supabase/supabase-js';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  console.log('\n📦 Testing Supabase connection...');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.log('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    return false;
  }

  try {
    const supabase = createClient(url, key);

    // Test by querying the profiles table (or any table)
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      // Table might not exist yet, but connection works
      if (error.code === '42P01') {
        console.log('✅ Supabase connected (profiles table not yet created)');
        return true;
      }
      console.log('❌ Supabase error:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (err) {
    console.log('❌ Supabase connection failed:', err);
    return false;
  }
}

async function testPlaid() {
  console.log('\n🏦 Testing Plaid connection...');

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV || 'sandbox';

  if (!clientId || !secret) {
    console.log('❌ Missing PLAID_CLIENT_ID or PLAID_SECRET');
    return false;
  }

  try {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    const plaidClient = new PlaidApi(configuration);

    // Test by getting supported institutions
    const response = await plaidClient.institutionsGet({
      count: 1,
      offset: 0,
      country_codes: ['US'],
    });

    if (response.data.institutions.length > 0) {
      console.log('✅ Plaid connected successfully!');
      console.log(`   Found institution: ${response.data.institutions[0].name}`);
      return true;
    }

    console.log('✅ Plaid connected (no institutions returned)');
    return true;
  } catch (err: any) {
    console.log('❌ Plaid connection failed:', err.response?.data?.error_message || err.message);
    return false;
  }
}

async function main() {
  console.log('🔌 Testing API Connections\n');
  console.log('Using env file:', process.cwd() + '/.env');

  const supabaseOk = await testSupabase();
  const plaidOk = await testPlaid();

  console.log('\n---');
  console.log('Results:');
  console.log(`  Supabase: ${supabaseOk ? '✅' : '❌'}`);
  console.log(`  Plaid: ${plaidOk ? '✅' : '❌'}`);

  process.exit(supabaseOk && plaidOk ? 0 : 1);
}

main();
