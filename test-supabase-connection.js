#!/usr/bin/env node

/**
 * Test Supabase connection
 * Run with: node test-supabase-connection.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  console.error("Required:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

console.log("🔗 Testing Supabase Connection...");
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);

// Test 1: Connection test via HTTP
const testHttpConnection = async () => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    
    if (response.ok) {
      console.log("✅ HTTP connection: OK");
      return true;
    } else {
      console.error(`❌ HTTP connection failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ HTTP connection error: ${error.message}`);
    return false;
  }
};

// Test 2: Auth endpoint test
const testAuthEndpoint = async () => {
  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/settings`,
      {
        headers: {
          apikey: supabaseKey,
        },
      }
    );
    
    if (response.ok) {
      console.log("✅ Auth endpoint: OK");
      return true;
    } else {
      console.error(`❌ Auth endpoint failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Auth endpoint error: ${error.message}`);
    return false;
  }
};

// Run tests
(async () => {
  console.log("");
  const httpOk = await testHttpConnection();
  const authOk = await testAuthEndpoint();
  
  console.log("");
  if (httpOk && authOk) {
    console.log("✅ Database connection: ACTIVE");
    console.log("📦 Supabase is properly configured and reachable");
  } else {
    console.log("⚠️  Database connection: ISSUES DETECTED");
    console.log("💡 Check your credentials or network connectivity");
  }
})();
