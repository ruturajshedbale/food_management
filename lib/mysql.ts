import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;

export function getMySQLPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'food_user',
      password: process.env.MYSQL_PASSWORD || 'food_rescue_secure_pass_2026',
      database: process.env.MYSQL_DATABASE || 'food_rescue_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true,
    });
  }
  return pool;
}

export async function query<T = RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  const p = getMySQLPool();
  const [rows] = await p.execute(sql, params);
  return rows as unknown as T;
}

export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getMySQLPool();
  const connection = await p.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
