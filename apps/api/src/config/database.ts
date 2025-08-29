import { Client } from 'mysql';
import { config } from 'dotenv';

// Database configuration
let dbConfig: {
  hostname: string;
  port: number;
  username: string;
  password: string;
  db: string;
};

// Initialize environment variables and database configuration
async function initializeConfig() {
  // Environment variables are already loaded in main.ts, just read them
  dbConfig = {
    hostname: Deno.env.get('DB_HOST') || 'localhost',
    port: parseInt(Deno.env.get('DB_PORT') || '3306'),
    username: Deno.env.get('DB_USER') || 'root',
    password: Deno.env.get('DB_PASSWORD') || '',
    db: Deno.env.get('DB_NAME') || 'RRCompanion',
  };

  // Debug: Log the database configuration (without password)
  console.log('🔍 Database config loaded:', {
    hostname: dbConfig.hostname,
    port: dbConfig.port,
    username: dbConfig.username,
    db: dbConfig.db,
    passwordSet: !!dbConfig.password
  });
}

// Create database client
export const client = new Client();

// Database connection test
export async function testConnection(): Promise<void> {
  try {
    if (!dbConfig) {
      await initializeConfig();
    }

    // First, try to connect without specifying a database
    const testConfig = {
      hostname: dbConfig.hostname,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      db: '', // Don't specify database initially
      charset: 'utf8mb4',
    };

    await client.connect(testConfig);
    await client.query('SELECT 1');
    console.log('✅ MySQL server connection successful');

    // Check if the database exists
    const databases = await client.query('SHOW DATABASES');
    const dbExists = databases.some((db: any) => db.Database === dbConfig.db);

    if (!dbExists) {
      console.log('🔍 Database does not exist, creating it...');
      await client.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Database created successfully');
    }

    // Close the current connection
    await client.close();

    // Now connect with the specific database
    const finalConfig = {
      ...dbConfig,
      charset: 'utf8mb4',
    };
    await client.connect(finalConfig);
    await client.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  try {
    if (!dbConfig) {
      await initializeConfig();
    }
    // Ensure we're connected
    if (!client.pool) {
      const finalConfig = {
        ...dbConfig,
        charset: 'utf8mb4',
      };
      await client.connect(finalConfig);
    }

    // Set the database character set to utf8mb4
    await client.execute(`ALTER DATABASE ${dbConfig.db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    // Convert existing tables to utf8mb4 if they exist
    try {
      await client.execute(`ALTER TABLE fiction CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Converted fiction table to utf8mb4');
    } catch (error) {
      console.log('ℹ️ Fiction table does not exist yet or already converted');
    }

    try {
      await client.execute(`ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Converted users table to utf8mb4');
    } catch (error) {
      console.log('ℹ️ Users table does not exist yet or already converted');
    }

    try {
      await client.execute(`ALTER TABLE sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Converted sessions table to utf8mb4');
    } catch (error) {
      console.log('ℹ️ Sessions table does not exist yet or already converted');
    }

    try {
      await client.execute(`ALTER TABLE userFiction CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Converted userFiction table to utf8mb4');
    } catch (error) {
      console.log('ℹ️ userFiction table does not exist yet or already converted');
    }

    // Create users table with OAuth support
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_oauth (oauth_provider, oauth_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create sessions table for JWT blacklisting
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create fiction table for Royal Road fiction data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS fiction (
        id INT AUTO_INCREMENT PRIMARY KEY,
        royalroad_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        author_id VARCHAR(255),
        author_avatar TEXT,
        description TEXT,
        image_url TEXT,
        status VARCHAR(100),
        type VARCHAR(100),
        tags JSON,
        warnings JSON,
        pages INT DEFAULT 0,
        ratings INT DEFAULT 0,
        followers INT DEFAULT 0,
        favorites INT DEFAULT 0,
        views INT DEFAULT 0,
        score DECIMAL(3,2) DEFAULT 0.00,
        overall_score DECIMAL(3,2) DEFAULT 0.00,
        style_score DECIMAL(3,2) DEFAULT 0.00,
        story_score DECIMAL(3,2) DEFAULT 0.00,
        grammar_score DECIMAL(3,2) DEFAULT 0.00,
        character_score DECIMAL(3,2) DEFAULT 0.00,
        total_views INT DEFAULT 0,
        average_views INT DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_royalroad_id (royalroad_id),
        INDEX idx_author_id (author_id),
        INDEX idx_status (status),
        INDEX idx_type (type),
        INDEX idx_score (score),
        INDEX idx_followers (followers),
        INDEX idx_views (views)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add new columns to existing fiction table if they don't exist
    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN overall_score DECIMAL(3,2) DEFAULT 0.00`);
      console.log('✅ Added overall_score column to fiction table');
    } catch (error) {
      console.log('ℹ️ overall_score column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN style_score DECIMAL(3,2) DEFAULT 0.00`);
      console.log('✅ Added style_score column to fiction table');
    } catch (error) {
      console.log('ℹ️ style_score column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN story_score DECIMAL(3,2) DEFAULT 0.00`);
      console.log('✅ Added story_score column to fiction table');
    } catch (error) {
      console.log('ℹ️ story_score column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN grammar_score DECIMAL(3,2) DEFAULT 0.00`);
      console.log('✅ Added grammar_score column to fiction table');
    } catch (error) {
      console.log('ℹ️ grammar_score column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN character_score DECIMAL(3,2) DEFAULT 0.00`);
      console.log('✅ Added character_score column to fiction table');
    } catch (error) {
      console.log('ℹ️ character_score column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN total_views INT DEFAULT 0`);
      console.log('✅ Added total_views column to fiction table');
    } catch (error) {
      console.log('ℹ️ total_views column already exists in fiction table');
    }

    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN average_views INT DEFAULT 0`);
      console.log('✅ Added average_views column to fiction table');
    } catch (error) {
      console.log('ℹ️ average_views column already exists in fiction table');
    }



    // Create userFiction table to join users and fictions
    await client.execute(`
      CREATE TABLE IF NOT EXISTS userFiction (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        fiction_id INT NOT NULL,
        status ENUM('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read') DEFAULT 'plan_to_read',
        rating INT CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        current_chapter INT DEFAULT 0,
        total_chapters INT DEFAULT 0,
        last_read_at TIMESTAMP NULL,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_fiction (user_id, fiction_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_fiction_id (fiction_id),
        INDEX idx_status (status),
        INDEX idx_rating (rating),
        INDEX idx_is_favorite (is_favorite),
        INDEX idx_last_read_at (last_read_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create fictionHistory table to store historical fiction data (simplified)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS fictionHistory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fiction_id INT NOT NULL,
        royalroad_id VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(100),
        type VARCHAR(100),
        tags JSON,
        warnings JSON,
        pages INT DEFAULT 0,
        ratings INT DEFAULT 0,
        followers INT DEFAULT 0,
        favorites INT DEFAULT 0,
        views INT DEFAULT 0,
        score DECIMAL(3,2) DEFAULT 0.00,
        overall_score DECIMAL(3,2) DEFAULT 0.00,
        style_score DECIMAL(3,2) DEFAULT 0.00,
        story_score DECIMAL(3,2) DEFAULT 0.00,
        grammar_score DECIMAL(3,2) DEFAULT 0.00,
        character_score DECIMAL(3,2) DEFAULT 0.00,
        total_views INT DEFAULT 0,
        average_views INT DEFAULT 0,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
        INDEX idx_fiction_id (fiction_id),
        INDEX idx_royalroad_id (royalroad_id),
        INDEX idx_captured_at (captured_at),
        UNIQUE KEY unique_fiction_history (fiction_id, captured_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create risingStars table to track Rising Stars rankings
    await client.execute(`
      CREATE TABLE IF NOT EXISTS risingStars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fiction_id INT NOT NULL,
        genre VARCHAR(100) NOT NULL,
        position INT NOT NULL,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
        INDEX idx_fiction_id (fiction_id),
        INDEX idx_genre (genre),
        INDEX idx_position (position),
        INDEX idx_captured_at (captured_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Rename old fictionHistory table if it exists and has the old structure
    try {
      // Check if the old fictionHistory table has title column (old structure)
      const columns = await client.query(`SHOW COLUMNS FROM fictionHistory LIKE 'title'`);
      if (columns.length > 0) {
        console.log('🔄 Detected old fictionHistory structure, migrating...');

        // Create new risingStars table from old fictionHistory data
        await client.execute(`
          INSERT IGNORE INTO risingStars (fiction_id, genre, position, captured_at)
          SELECT fiction_id, genre, position, captured_at 
          FROM fictionHistory 
          WHERE genre IS NOT NULL AND position IS NOT NULL
        `);

        // Drop old columns from fictionHistory
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN title`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN author_name`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN position`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN author_id`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN author_avatar`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN image_url`);
        await client.execute(`ALTER TABLE fictionHistory DROP COLUMN genre`);

        console.log('✅ Migrated old fictionHistory structure to new schema');
      }
    } catch (error) {
      console.log('ℹ️ fictionHistory table does not exist or already has new structure');
    }

    // Create migrations table to track database schema changes
    await client.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64),
        INDEX idx_migration_name (migration_name),
        INDEX idx_executed_at (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Run migrations
    await runMigrations(client);

    console.log('✅ Database tables initialized with utf8mb4 character set');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  await client.close();
  console.log('✅ Database connection closed');
}

// Migration system
interface Migration {
  name: string;
  sql?: string;
  conditional?: boolean;
}

async function runMigrations(client: Client): Promise<void> {
  const migrations: Migration[] = [
    {
      name: '001_create_users_table',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(255),
          oauth_provider VARCHAR(50),
          oauth_id VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_oauth (oauth_provider, oauth_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '002_create_sessions_table',
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '003_create_fiction_table',
      sql: `
        CREATE TABLE IF NOT EXISTS fiction (
          id INT AUTO_INCREMENT PRIMARY KEY,
          royalroad_id VARCHAR(255) UNIQUE NOT NULL,
          title VARCHAR(500) NOT NULL,
          author_name VARCHAR(255) NOT NULL,
          author_id VARCHAR(255),
          author_avatar TEXT,
          description TEXT,
          image_url TEXT,
          status VARCHAR(100),
          type VARCHAR(100),
          tags JSON,
          warnings JSON,
          pages INT DEFAULT 0,
          ratings INT DEFAULT 0,
          followers INT DEFAULT 0,
          favorites INT DEFAULT 0,
          views INT DEFAULT 0,
          score DECIMAL(3,2) DEFAULT 0.00,
          overall_score DECIMAL(3,2) DEFAULT 0.00,
          style_score DECIMAL(3,2) DEFAULT 0.00,
          story_score DECIMAL(3,2) DEFAULT 0.00,
          grammar_score DECIMAL(3,2) DEFAULT 0.00,
          character_score DECIMAL(3,2) DEFAULT 0.00,
          total_views INT DEFAULT 0,
          average_views INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_royalroad_id (royalroad_id),
          INDEX idx_author_id (author_id),
          INDEX idx_status (status),
          INDEX idx_type (type),
          INDEX idx_score (score),
          INDEX idx_followers (followers),
          INDEX idx_views (views)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '004_create_userFiction_table',
      sql: `
        CREATE TABLE IF NOT EXISTS userFiction (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          fiction_id INT NOT NULL,
          status ENUM('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read') DEFAULT 'plan_to_read',
          rating INT CHECK (rating >= 1 AND rating <= 5),
          review TEXT,
          current_chapter INT DEFAULT 0,
          total_chapters INT DEFAULT 0,
          last_read_at TIMESTAMP NULL,
          is_favorite BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_fiction (user_id, fiction_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_fiction_id (fiction_id),
          INDEX idx_status (status),
          INDEX idx_rating (rating),
          INDEX idx_is_favorite (is_favorite),
          INDEX idx_last_read_at (last_read_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '005_create_fictionHistory_table',
      sql: `
        CREATE TABLE IF NOT EXISTS fictionHistory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fiction_id INT NOT NULL,
          royalroad_id VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(100),
          type VARCHAR(100),
          tags JSON,
          warnings JSON,
          pages INT DEFAULT 0,
          ratings INT DEFAULT 0,
          followers INT DEFAULT 0,
          favorites INT DEFAULT 0,
          views INT DEFAULT 0,
          score DECIMAL(3,2) DEFAULT 0.00,
          overall_score DECIMAL(3,2) DEFAULT 0.00,
          style_score DECIMAL(3,2) DEFAULT 0.00,
          story_score DECIMAL(3,2) DEFAULT 0.00,
          grammar_score DECIMAL(3,2) DEFAULT 0.00,
          character_score DECIMAL(3,2) DEFAULT 0.00,
          total_views INT DEFAULT 0,
          average_views INT DEFAULT 0,
          captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          INDEX idx_fiction_id (fiction_id),
          INDEX idx_royalroad_id (royalroad_id),
          INDEX idx_captured_at (captured_at),
          UNIQUE KEY unique_fiction_history (fiction_id, captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '006_create_risingStars_table',
      sql: `
        CREATE TABLE IF NOT EXISTS risingStars (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fiction_id INT NOT NULL,
          genre VARCHAR(100) NOT NULL,
          position INT NOT NULL,
          captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          INDEX idx_fiction_id (fiction_id),
          INDEX idx_genre (genre),
          INDEX idx_position (position),
          INDEX idx_captured_at (captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '007_migrate_old_fictionHistory_structure',
      conditional: true
    },
    {
      name: '008_add_fiction_score_columns',
      conditional: true
    },
    {
      name: '009_create_sponsorship_logs_table',
      sql: `
        CREATE TABLE IF NOT EXISTS sponsorship_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fiction_id INT NOT NULL,
          user_id INT NOT NULL,
          stripe_payment_intent_id VARCHAR(255) NOT NULL,
          amount INT NOT NULL,
          status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_fiction_id (fiction_id),
          INDEX idx_user_id (user_id),
          INDEX idx_payment_intent_id (stripe_payment_intent_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '010_add_user_fiction_order_table',
      sql: `
        CREATE TABLE IF NOT EXISTS userFictionOrder (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          fiction_id INT NOT NULL,
          position INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- Ensure each user can only have one position per fiction
          UNIQUE KEY unique_user_fiction (user_id, fiction_id),
          
          -- Foreign key constraints
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          
          -- Index for efficient ordering queries
          INDEX idx_user_position (user_id, position)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '011_add_admin_column',
      sql: `ALTER TABLE users ADD COLUMN admin BOOLEAN DEFAULT FALSE`
    },
    {
      name: '011b_add_admin_index',
      sql: `CREATE INDEX idx_users_admin ON users(admin)`
    },
    {
      name: '012_create_coupon_codes_table',
      sql: `
        CREATE TABLE IF NOT EXISTS coupon_codes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(20) NOT NULL UNIQUE,
          discount_percent INT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          used_by_user_id INT NULL,
          used_for_fiction_id INT NULL,
          used_at TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_code (code),
          INDEX idx_is_active (is_active),
          INDEX idx_expires_at (expires_at),
          INDEX idx_used (used),
          FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (used_for_fiction_id) REFERENCES fiction(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '013_add_coupon_code_id_to_sponsorship_logs',
      sql: `
        ALTER TABLE sponsorship_logs 
        ADD COLUMN coupon_code_id INT NULL,
        ADD INDEX idx_coupon_code_id (coupon_code_id),
        ADD FOREIGN KEY (coupon_code_id) REFERENCES coupon_codes(id) ON DELETE SET NULL
      `
    },
    {
      name: '014_fix_coupon_used_column',
      sql: `
        ALTER TABLE coupon_codes 
        CHANGE COLUMN used_count used BOOLEAN DEFAULT FALSE,
        ADD COLUMN used_by_user_id INT NULL,
        ADD COLUMN used_for_fiction_id INT NULL,
        ADD COLUMN used_at TIMESTAMP NULL,
        ADD INDEX idx_used (used),
        ADD FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        ADD FOREIGN KEY (used_for_fiction_id) REFERENCES fiction(id) ON DELETE SET NULL
      `
    },
    {
      name: '015_make_stripe_payment_intent_id_nullable',
      sql: `
        ALTER TABLE sponsorship_logs 
        MODIFY COLUMN stripe_payment_intent_id VARCHAR(255) NULL
      `
    },
    {
      name: '016_ensure_userFiction_favorite_column',
      conditional: true
    },
    {
      name: '017_add_multi_use_coupon_support',
      sql: `
        ALTER TABLE coupon_codes 
        ADD COLUMN max_uses INT DEFAULT 1,
        ADD COLUMN current_uses INT DEFAULT 0,
        ADD INDEX idx_max_uses (max_uses),
        ADD INDEX idx_current_uses (current_uses)
      `
    },
    {
      name: '018_populate_existing_coupon_usage_fields',
      sql: `
        UPDATE coupon_codes 
        SET max_uses = 1, current_uses = CASE WHEN used = 1 THEN 1 ELSE 0 END
        WHERE max_uses IS NULL OR current_uses IS NULL
      `
    },
    {
      name: '019_create_popular_fictions_table',
      sql: `
        CREATE TABLE IF NOT EXISTS popular_fictions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fiction_id INT NOT NULL,
          royalroad_id VARCHAR(255) NOT NULL,
          title VARCHAR(500) NOT NULL,
          author_name VARCHAR(255) NOT NULL,
          author_id VARCHAR(255),
          author_avatar TEXT,
          description TEXT,
          image_url TEXT,
          status VARCHAR(100),
          type VARCHAR(100),
          tags JSON,
          warnings JSON,
          pages INT DEFAULT 0,
          ratings INT DEFAULT 0,
          followers INT DEFAULT 0,
          favorites INT DEFAULT 0,
          views INT DEFAULT 0,
          score DECIMAL(3,2) DEFAULT 0.00,
          overall_score DECIMAL(3,2) DEFAULT 0.00,
          style_score DECIMAL(3,2) DEFAULT 0.00,
          story_score DECIMAL(3,2) DEFAULT 0.00,
          grammar_score DECIMAL(3,2) DEFAULT 0.00,
          character_score DECIMAL(3,2) DEFAULT 0.00,
          total_views INT DEFAULT 0,
          average_views INT DEFAULT 0,
          captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
          
          INDEX idx_fiction_id (fiction_id),
          INDEX idx_royalroad_id (royalroad_id),
          INDEX idx_captured_at (captured_at),
          INDEX idx_score (score),
          INDEX idx_followers (followers),
          INDEX idx_views (views),
          
          UNIQUE KEY unique_fiction_snapshot (fiction_id, captured_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '015_create_coffee_logs_table',
      sql: `
        CREATE TABLE IF NOT EXISTS coffee_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          stripe_payment_intent_id VARCHAR(255) NOT NULL,
          amount INT NOT NULL,
          status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: '016_remove_sponsored_column',
      sql: `
        ALTER TABLE fiction DROP COLUMN IF EXISTS sponsored
      `
    }
  ];

  for (const migration of migrations) {
    const hasRun = await hasMigrationRun(client, migration.name);

    if (!hasRun) {
      console.log(`🔄 Running migration: ${migration.name}`);

      try {
        if (migration.conditional) {
          await runConditionalMigration(client, migration);
        } else if (migration.sql) {
          await client.execute(migration.sql);
        } else {
          throw new Error(`Migration ${migration.name} has no SQL or conditional logic`);
        }

        await markMigrationComplete(client, migration.name);
        console.log(`✅ Completed migration: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Failed to run migration ${migration.name}:`, error);
        throw error;
      }
    } else {
      console.log(`ℹ️ Migration ${migration.name} already completed`);
    }
  }
}

async function hasMigrationRun(client: Client, migrationName: string): Promise<boolean> {
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM migrations WHERE migration_name = ?', [migrationName]);
    return result[0].count > 0;
  } catch (error) {
    // If migrations table doesn't exist yet, consider it as not run
    return false;
  }
}

async function markMigrationComplete(client: Client, migrationName: string): Promise<void> {
  await client.execute('INSERT INTO migrations (migration_name) VALUES (?)', [migrationName]);
}

async function runConditionalMigration(client: Client, migration: Migration): Promise<void> {
  switch (migration.name) {
    case '007_migrate_old_fictionHistory_structure':
      await migrateOldFictionHistoryStructure(client);
      break;
    case '008_add_fiction_score_columns':
      await addFictionScoreColumns(client);
      break;
    case '016_ensure_userFiction_favorite_column':
      await ensureUserFictionFavoriteColumn(client);
      break;
    default:
      throw new Error(`Unknown conditional migration: ${migration.name}`);
  }
}

async function migrateOldFictionHistoryStructure(client: Client): Promise<void> {
  try {
    // Check if the old fictionHistory table has title column (old structure)
    const columns = await client.query(`SHOW COLUMNS FROM fictionHistory LIKE 'title'`);
    if (columns.length > 0) {
      console.log('🔄 Detected old fictionHistory structure, migrating...');

      // Create new risingStars table from old fictionHistory data
      await client.execute(`
        INSERT IGNORE INTO risingStars (fiction_id, genre, position, captured_at)
        SELECT fiction_id, genre, position, captured_at 
        FROM fictionHistory 
        WHERE genre IS NOT NULL AND position IS NOT NULL
      `);

      // Drop old columns from fictionHistory
      const oldColumns = ['title', 'author_name', 'position', 'author_id', 'author_avatar', 'image_url', 'genre'];
      for (const column of oldColumns) {
        try {
          await client.execute(`ALTER TABLE fictionHistory DROP COLUMN ${column}`);
          console.log(`✅ Dropped ${column} column from fictionHistory`);
        } catch (error) {
          console.log(`ℹ️ Column ${column} already dropped or doesn't exist`);
        }
      }

      console.log('✅ Migrated old fictionHistory structure to new schema');
    } else {
      console.log('ℹ️ fictionHistory table already has new structure');
    }
  } catch (error) {
    console.log('ℹ️ fictionHistory table does not exist or already has new structure');
  }
}

async function addFictionScoreColumns(client: Client): Promise<void> {
  const scoreColumns = [
    { name: 'overall_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
    { name: 'style_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
    { name: 'story_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
    { name: 'grammar_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
    { name: 'character_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
    { name: 'total_views', type: 'INT DEFAULT 0' },
    { name: 'average_views', type: 'INT DEFAULT 0' }
  ];

  for (const column of scoreColumns) {
    try {
      await client.execute(`ALTER TABLE fiction ADD COLUMN ${column.name} ${column.type}`);
      console.log(`✅ Added ${column.name} column to fiction table`);
    } catch (error) {
      console.log(`ℹ️ ${column.name} column already exists in fiction table`);
    }
  }
}

async function ensureUserFictionFavoriteColumn(client: Client): Promise<void> {
  try {
    // Check if the is_favorite column exists
    const columns = await client.query(`SHOW COLUMNS FROM userFiction LIKE 'is_favorite'`);
    if (columns.length === 0) {
      console.log('🔄 Adding is_favorite column to userFiction table...');
      await client.execute(`
        ALTER TABLE userFiction 
        ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
        ADD INDEX idx_is_favorite (is_favorite)
      `);
      console.log('✅ Added is_favorite column to userFiction table');
    } else {
      console.log('ℹ️ is_favorite column already exists in userFiction table');
    }
  } catch (error) {
    console.log('ℹ️ Could not add is_favorite column to userFiction table:', error);
  }
}
