import pg from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Simple parser for .env file
const loadEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (parts) {
        let val = parts[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[parts[1]] = val;
      }
    });
  } catch (e) {
    console.error('Failed to load .env file:', e);
  }
};

loadEnv();

const askPassword = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Please enter your Supabase Database Password: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const run = async () => {
  let connStr = process.env.SUPABASE_DB_CONNECTION_STRING;
  
  if (!connStr || connStr.includes('YOUR_DB_PASSWORD')) {
    console.log('Database connection string is missing the password in .env.');
    const password = await askPassword();
    if (!password) {
      console.error('No password provided. Aborting schema deployment.');
      process.exit(1);
    }
    // Encode password for connection string safety
    const encodedPassword = encodeURIComponent(password);
    connStr = `postgresql://postgres:${encodedPassword}@db.gueiqnmwrezlssstnrxl.supabase.co:5432/postgres`;
  }

  console.log('Connecting to Supabase Database...');
  const { Client } = pg;
  const client = new Client({
    connectionString: connStr,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');
    
    const schemaPath = path.resolve(process.cwd(), 'src/services/database/supabase_schema.sql');
    console.log(`Reading schema SQL from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Deploying schema tables and security policies to Supabase...');
    await client.query(sql);
    console.log('Schema deployed successfully! All 10 tables and RLS policies are active.');
  } catch (err) {
    console.error('Schema deployment failed:', err.message);
  } finally {
    await client.end();
  }
};

run();
