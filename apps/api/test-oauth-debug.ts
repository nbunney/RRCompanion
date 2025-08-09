import { client } from './src/config/database.ts';

async function testOAuthUserCreation() {
  try {
    console.log('🔍 Testing OAuth user creation...');

    // Test data from Discord
    const discordUserData = {
      id: "718878191489384488",
      username: "n_swanson",
      global_name: "NateDogg",
      email: "nateswansonauthor@gmail.com",
      avatar: "fce47a9f5f766fc183a76e7752c30a8f"
    };

    console.log('📋 Discord user data:', discordUserData);

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await client.query(
      'SELECT id, email, name, oauth_provider, oauth_id FROM users WHERE oauth_id = ? AND oauth_provider = ?',
      [discordUserData.id, 'discord']
    );

    console.log('📋 Existing user result:', existingUser);

    if (existingUser.length > 0) {
      console.log('✅ User exists, updating...');
      const user = existingUser[0];
      await client.execute(
        'UPDATE users SET name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?',
        [discordUserData.global_name || discordUserData.username, `https://cdn.discordapp.com/avatars/${discordUserData.id}/${discordUserData.avatar}.png`, user.id]
      );
      console.log('✅ User updated successfully');
    } else {
      console.log('🆕 Creating new user...');

      // Check if email already exists
      const emailCheck = await client.query(
        'SELECT id, email FROM users WHERE email = ?',
        [discordUserData.email]
      );
      console.log('📋 Email check result:', emailCheck);

      if (emailCheck.length > 0) {
        console.log('⚠️ Email already exists, updating existing user with OAuth info...');
        await client.execute(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar_url = ?, updated_at = NOW() WHERE email = ?',
          ['discord', discordUserData.id, `https://cdn.discordapp.com/avatars/${discordUserData.id}/${discordUserData.avatar}.png`, discordUserData.email]
        );
        console.log('✅ Existing user updated with OAuth info');
      } else {
        console.log('🆕 Creating completely new user...');
        const insertResult = await client.execute(
          'INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
          [
            discordUserData.email,
            discordUserData.global_name || discordUserData.username,
            'discord',
            discordUserData.id,
            `https://cdn.discordapp.com/avatars/${discordUserData.id}/${discordUserData.avatar}.png`
          ]
        );
        console.log('✅ New user created with ID:', insertResult.lastInsertId);
      }
    }

    // Verify the user was created/updated
    const finalUser = await client.query(
      'SELECT id, email, name, oauth_provider, oauth_id, avatar_url FROM users WHERE oauth_id = ? AND oauth_provider = ?',
      [discordUserData.id, 'discord']
    );
    console.log('📋 Final user data:', finalUser);

  } catch (error) {
    console.error('❌ Error during OAuth user creation test:', error);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run the test
testOAuthUserCreation(); 