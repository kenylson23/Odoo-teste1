import { Pool } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return _pool;
}

export type EmployeeRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  cpf: string | null;
  birth_date: string | null;
  gender: string | null;
  department: string | null;
  job_title: string | null;
  job_position: string | null;
  hire_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  odoo_id: number | null;
  created_at: Date;
};

export function serializeEmployee(row: EmployeeRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    cpf: row.cpf,
    birthDate: row.birth_date,
    gender: row.gender,
    department: row.department,
    jobTitle: row.job_title,
    jobPosition: row.job_position,
    hireDate: row.hire_date,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    odooId: row.odoo_id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}
