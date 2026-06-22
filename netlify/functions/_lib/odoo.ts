type JsonRpcResponse<T = unknown> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { message: string; data?: { message?: string; debug?: string } };
};

export function isOdooConfigured(): boolean {
  return !!(
    process.env.ODOO_URL &&
    process.env.ODOO_DB &&
    process.env.ODOO_USERNAME &&
    process.env.ODOO_API_KEY
  );
}

async function rpc<T = unknown>(
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  const base = process.env.ODOO_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      id: Math.floor(Math.random() * 1_000_000),
      params: payload,
    }),
  });
  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as JsonRpcResponse<T>;
  if (data.error) {
    const msg =
      data.error.data?.message ?? data.error.data?.debug ?? data.error.message;
    throw new Error(`Odoo RPC error: ${msg}`);
  }
  return data.result as T;
}

let _uid: number | null = null;

async function getUid(): Promise<number> {
  if (_uid !== null) return _uid;
  const uid = await rpc<number | false>("/jsonrpc", {
    service: "common",
    method: "authenticate",
    args: [
      process.env.ODOO_DB,
      process.env.ODOO_USERNAME,
      process.env.ODOO_API_KEY,
      {},
    ],
  });
  if (!uid) throw new Error("Odoo authentication failed");
  _uid = uid;
  return _uid;
}

async function callKw<T = unknown>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await getUid();
  return rpc<T>("/jsonrpc", {
    service: "object",
    method: "execute_kw",
    args: [
      process.env.ODOO_DB,
      uid,
      process.env.ODOO_API_KEY,
      model,
      method,
      args,
      kwargs,
    ],
  });
}

type OdooEmployeeRaw = {
  id: number;
  name: string;
  work_email: string | false;
  work_phone: string | false;
  mobile_phone: string | false;
  job_title: string | false;
  birthday: string | false;
  identification_id: string | false;
  department_id: [number, string] | false;
  job_id: [number, string] | false;
  create_date: string | false;
};

export type OdooEmployee = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  cpf: string | null;
  birthDate: string | null;
  gender: null;
  department: string | null;
  jobTitle: string | null;
  jobPosition: string | null;
  hireDate: null;
  address: null;
  city: null;
  state: null;
  zip: null;
  odooId: number;
  createdAt: string;
};

function f(val: string | false | null | undefined): string | null {
  return val || null;
}

function parseDate(val: string | false): string | null {
  if (!val) return null;
  return val.includes(" ") ? new Date(val).toISOString() : val;
}

function deserialize(raw: OdooEmployeeRaw): OdooEmployee {
  return {
    id: raw.id,
    name: raw.name,
    email: f(raw.work_email),
    phone: f(raw.work_phone),
    mobile: f(raw.mobile_phone),
    cpf: f(raw.identification_id),
    birthDate: parseDate(raw.birthday),
    gender: null,
    department: Array.isArray(raw.department_id) ? raw.department_id[1] : null,
    jobTitle: f(raw.job_title),
    jobPosition: Array.isArray(raw.job_id) ? raw.job_id[1] : null,
    hireDate: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    odooId: raw.id,
    createdAt: parseDate(raw.create_date) ?? new Date().toISOString(),
  };
}

const FIELDS = [
  "id", "name", "work_email", "work_phone", "mobile_phone",
  "job_title", "birthday", "identification_id",
  "department_id", "job_id", "create_date",
];

export async function listOdooEmployees(): Promise<OdooEmployee[]> {
  const rows = await callKw<OdooEmployeeRaw[]>(
    "hr.employee", "search_read",
    [[["active", "=", true]]],
    { fields: FIELDS, order: "create_date asc", limit: 500 }
  );
  return rows.map(deserialize);
}

export async function getOdooEmployee(id: number): Promise<OdooEmployee | null> {
  const rows = await callKw<OdooEmployeeRaw[]>(
    "hr.employee", "search_read",
    [[["id", "=", id]]],
    { fields: FIELDS, limit: 1 }
  );
  return rows.length > 0 ? deserialize(rows[0]) : null;
}

export async function createOdooEmployee(data: {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  cpf?: string;
  birthDate?: string;
  jobTitle?: string;
}): Promise<OdooEmployee> {
  const vals: Record<string, unknown> = { name: data.name };
  if (data.email) vals.work_email = data.email;
  if (data.phone) vals.work_phone = data.phone;
  if (data.mobile) vals.mobile_phone = data.mobile;
  if (data.jobTitle) vals.job_title = data.jobTitle;
  if (data.birthDate) vals.birthday = data.birthDate;
  if (data.cpf) vals.identification_id = data.cpf;

  const newId = await callKw<number>("hr.employee", "create", [vals]);
  const employee = await getOdooEmployee(newId);
  if (!employee) throw new Error("Employee created but could not be retrieved");
  return employee;
}

export async function checkOdooConnection(): Promise<{
  connected: boolean;
  version: string | null;
  message: string | null;
}> {
  if (!isOdooConfigured()) {
    return { connected: false, version: null, message: "Odoo não configurado." };
  }
  try {
    _uid = null;
    await getUid();
    return { connected: true, version: null, message: "Conectado ao Odoo com sucesso" };
  } catch (err) {
    return {
      connected: false,
      version: null,
      message: err instanceof Error ? err.message : "Erro ao conectar ao Odoo",
    };
  }
}

export async function getOdooDepartments(): Promise<Array<{ id: number; name: string }>> {
  if (!isOdooConfigured()) return [];
  try {
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.department", "search_read", [[]], { fields: ["id", "name"], limit: 100 }
    );
  } catch { return []; }
}

export async function getOdooJobs(): Promise<Array<{ id: number; name: string }>> {
  if (!isOdooConfigured()) return [];
  try {
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.job", "search_read", [[]], { fields: ["id", "name"], limit: 100 }
    );
  } catch { return []; }
}
