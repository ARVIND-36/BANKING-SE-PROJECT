import { neon } from '@neondatabase/serverless';
const sql = neon("postgresql://neondb_owner:npg_XCjuiGmo4FE9@ep-blue-brook-a120cr33-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
const rows = await sql`SELECT id, name, email, upi_id, wallet_balance, has_set_pin, is_verified FROM users ORDER BY id`;
console.log(JSON.stringify(rows, null, 2));
