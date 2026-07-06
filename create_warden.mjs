const supabaseUrl = 'https://kukvnmbzzxanzrdrkgpg.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3ZubWJ6enhhbnpyZHJrZ3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyOTMsImV4cCI6MjA5MTI0MTI5M30.DuB4Iutv8fYrs1Mx3U2a_d2q0cqba7s8gXAM9ZYxSPE';

async function main() {
  const email = 'warden@test.com';
  const password = 'password123';
  
  // 1. Sign up
  const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const signUpData = await signUpRes.json();
  if (signUpData.error || signUpData.code) {
    if (signUpData.msg !== 'User already registered') {
       console.error('Signup error:', signUpData);
       return;
    }
  }
  
  // Log in to get the user id
  const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const signInData = await signInRes.json();
  const userId = signInData?.user?.id;
  
  if (!userId) {
     console.error('Failed to get user id', signInData);
     return;
  }
  
  console.log('User ID:', userId);
  
  // 2. Update profile
  const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${signInData.access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ role: 'warden' })
  });
  
  const updateData = await updateRes.json();
  console.log('Update result:', updateData);
}

main();
