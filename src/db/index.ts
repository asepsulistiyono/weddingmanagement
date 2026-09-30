import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { isSupabaseConfigured, supabaseUrl } from '../../supabase.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool using the Object Method
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const getActiveConnectionInfo = () => {
  if (isSupabaseConfigured && supabaseUrl) {
    let parsedHost = supabaseUrl;
    try {
      parsedHost = new URL(supabaseUrl).host;
    } catch {
      // keep raw
    }
    return {
      isExternalSupabase: true,
      supabaseUrl,
      host: parsedHost,
      database: 'postgres (Supabase External)',
      provider: `Supabase Cloud PostgreSQL (${parsedHost})`,
    };
  }
  return {
    isExternalSupabase: false,
    supabaseUrl: '',
    host: process.env.SQL_HOST || '127.0.0.1',
    database: process.env.SQL_DB_NAME || 'ai_studio_db',
    provider: 'PostgreSQL 16 (Menunggu Konfigurasi Supabase Eksternal)',
  };
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };
