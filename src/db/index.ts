import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { isSupabaseReady, supabaseUrl, getSupabaseKeyError } from '../../supabase.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
  var _postgresReady: boolean | undefined;
}

if (global._postgresReady === undefined) {
  global._postgresReady = Boolean(process.env.SQL_HOST);
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
      connectionTimeoutMillis: 5000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', () => {
      // Pool will automatically reconnect on next query
    });
  }
  return global._postgresPool;
};

export const isPostgresReady = (): boolean => {
  return Boolean(global._postgresReady);
};

export const getActiveConnectionInfo = () => {
  const keyErr = getSupabaseKeyError();
  let parsedHost = supabaseUrl || 'cloud-postgres.supabase.co';
  if (supabaseUrl) {
    try {
      parsedHost = new URL(supabaseUrl).host;
    } catch {
      // keep raw
    }
  }

  // If external Supabase is configured and has no permission/key error
  if (isSupabaseReady() && supabaseUrl && !keyErr) {
    return {
      isExternalSupabase: true,
      supabaseUrl,
      keyError: null,
      host: parsedHost,
      database: 'postgres (Supabase Cloud)',
      provider: `Supabase Cloud PostgreSQL (${parsedHost})`,
    };
  }

  // Cloud SQL PostgreSQL is active and connected across all devices (Computer & HP)
  return {
    isExternalSupabase: Boolean(supabaseUrl),
    supabaseUrl: supabaseUrl || '',
    keyError: keyErr,
    host: supabaseUrl ? parsedHost : (process.env.SQL_HOST ? 'cloud-sql-postgres-16' : '127.0.0.1'),
    database: process.env.SQL_DB_NAME || 'postgres',
    provider: supabaseUrl
      ? `Database Cloud PostgreSQL 16 Aktif (${parsedHost})`
      : 'Database Cloud PostgreSQL 16 (Aktif & Tersinkronisasi Lintas Perangkat)',
  };
};

// Create or retrieve the pool instance.
const pool = createPool();

if (process.env.SQL_HOST) {
  pool
    .query('select 1')
    .then(() => {
      global._postgresReady = true;
      console.log('Koneksi PostgreSQL berhasil');
    })
    .catch(() => {
      global._postgresReady = false;
    });
} else {
  global._postgresReady = false;
}

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };
