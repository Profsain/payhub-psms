const fetch = require('node-fetch');

async function testCORS() {
  console.log('🧪 Testing CORS configuration...');
  
  try {
    // Test OPTIONS request (preflight)
    console.log('Testing OPTIONS request...');
    const optionsResponse = await fetch('http://localhost:5000/api/auth/super-admin', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS request successful');
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    // Test actual POST request
    console.log('\nTesting POST request...');
    const postResponse = await fetch('http://localhost:5000/api/auth/super-admin', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:8080',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User'
      })
    });
    
    console.log('✅ POST request successful');
    console.log('Response status:', postResponse.status);
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:5000');
      await testCORS();
    } else {
      console.log('⚠️ Server responded but health check failed');
    }
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('  npm run dev:server');
  }
}

checkServer(); 