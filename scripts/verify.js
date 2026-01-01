const baseUrl = 'http://localhost:3000';

async function run() {
  console.log('--- Verification Start ---');

  // 1. Check Status
  console.log('1. Check Status');
  let res = await fetch(`${baseUrl}/api/auth/setup`);
  let data = await res.json();
  console.log('Initialized:', data.initialized);
  if (data.initialized) {
      console.log('Warning: Already initialized. Verification might fail if user exists.');
  }

  // 2. Setup
  console.log('\n2. Setup');
  const authHash = 'test_hash';
  const salt = 'test_salt';
  res = await fetch(`${baseUrl}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authHash, salt })
  });
  data = await res.json();
  console.log('Setup Result:', data);
  
  if (data.error && data.error === 'User already initialized') {
      console.log('Skipping setup (already done).');
  }

  // 3. Login
  console.log('\n3. Login');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authHash })
  });
  data = await res.json();
  console.log('Login Result:', data);
  if (data.success) {
      console.log('Login successful!');
  } else {
      console.error('Login failed:', data.error);
      process.exit(1);
  }

  // 4. Sync Vault
  console.log('\n4. Sync Vault');
  const vaultData = { iv: 'test_iv', data: 'test_encrypted_data' };
  res = await fetch(`${baseUrl}/api/vault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vaultData)
  });
  data = await res.json();
  console.log('Sync Result:', data);

  // 5. Read Vault
  console.log('\n5. Read Vault');
  res = await fetch(`${baseUrl}/api/vault`);
  data = await res.json();
  console.log('Read Result:', data);
  
  if (data.vault && data.vault.data === 'test_encrypted_data') {
      console.log('Vault verification successful!');
  } else {
      console.error('Vault verification failed!');
      process.exit(1);
  }
  
  console.log('\n--- Verification Complete ---');
}

run().catch(console.error);
