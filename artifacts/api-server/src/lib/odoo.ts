import { logger } from "./logger";

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

export type OdooEmployee = {
  name: string;
  work_email?: string;
  mobile_phone?: string;
  work_phone?: string;
  birthday?: string;
  gender?: string;
  department_id?: number;
  job_id?: number;
  job_title?: string;
  date_of_birth?: string;
};

type JsonRpcResponse<T = unknown> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { message: string; data?: { message?: string } };
};

export function isOdooConfigured(): boolean {
  return !!(ODOO_URL && ODOO_DB && ODOO_USERNAME && ODOO_API_KEY);
}

async function jsonRpc<T = unknown>(
  endpoint: string,
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  if (!ODOO_URL) throw new Error("ODOO_URL not configured");

  const url = `${ODOO_URL}${endpoint}`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    id: Math.floor(Math.random() * 1000000),
    params: { service: "object", method, ...params },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse<T>;

  if (data.error) {
    const msg = data.error.data?.message ?? data.error.message;
    throw new Error(`Odoo RPC error: ${msg}`);
  }

  return data.result as T;
}

let _uid: number | null = null;

async function getUid(): Promise<number> {
  if (_uid !== null) return _uid;
  if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
    throw new Error("Odoo credentials not configured");
  }

  const res = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      id: 1,
      params: {
        db: ODOO_DB,
        login: ODOO_USERNAME,
        password: ODOO_API_KEY,
      },
    }),
  });

  const data = (await res.json()) as JsonRpcResponse<{ uid: number }>;
  if (data.error || !data.result?.uid) {
    throw new Error("Odoo authentication failed");
  }

  _uid = data.result.uid;
  return _uid;
}

export async function checkOdooConnection(): Promise<{
  connected: boolean;
  version: string | null;
  message: string | null;
}> {
  if (!isOdooConfigured()) {
    return {
      connected: false,
      version: null,
      message: "Odoo não configurado. Defina ODOO_URL, ODOO_DB, ODOO_USERNAME e ODOO_API_KEY.",
    };
  }

  try {
    const uid = await getUid();
    if (!uid) {
      return { connected: false, version: null, message: "Falha na autenticação com Odoo" };
    }
    return { connected: true, version: null, message: "Conectado ao Odoo com sucesso" };
  } catch (err) {
    logger.error({ err }, "Odoo connection check failed");
    return {
      connected: false,
      version: null,
      message: err instanceof Error ? err.message : "Erro ao conectar ao Odoo",
    };
  }
}

export async function createOdooEmployee(data: {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  department?: string;
  jobTitle?: string;
  jobPosition?: string;
  hireDate?: string;
}): Promise<number | null> {
  if (!isOdooConfigured()) {
    logger.warn("Odoo not configured, skipping Odoo employee creation");
    return null;
  }

  try {
    const uid = await getUid();

    const vals: Record<string, unknown> = {
      name: data.name,
    };
    if (data.email) vals.work_email = data.email;
    if (data.phone) vals.work_phone = data.phone;
    if (data.mobile) vals.mobile_phone = data.mobile;
    if (data.jobTitle) vals.job_title = data.jobTitle;
    if (data.birthDate) vals.birthday = data.birthDate;
    if (data.gender) vals.gender = data.gender;

    const id = await jsonRpc<number>("/jsonrpc", "execute_kw", {
      db: ODOO_DB,
      uid,
      password: ODOO_API_KEY,
      model: "hr.employee",
      method: "create",
      args: [vals],
      kwargs: {},
    });

    logger.info({ odooId: id }, "Employee created in Odoo");
    return id;
  } catch (err) {
    logger.error({ err }, "Failed to create employee in Odoo");
    return null;
  }
}

export async function getOdeoDepartments(): Promise<
  Array<{ id: number; name: string }>
> {
  if (!isOdooConfigured()) return [];

  try {
    const uid = await getUid();
    const records = await jsonRpc<Array<{ id: number; name: string }>>(
      "/jsonrpc",
      "execute_kw",
      {
        db: ODOO_DB,
        uid,
        password: ODOO_API_KEY,
        model: "hr.department",
        method: "search_read",
        args: [[]],
        kwargs: { fields: ["id", "name"], limit: 100 },
      }
    );
    return records;
  } catch (err) {
    logger.error({ err }, "Failed to fetch departments from Odoo");
    return [];
  }
}

export async function getOdooJobs(): Promise<
  Array<{ id: number; name: string }>
> {
  if (!isOdooConfigured()) return [];

  try {
    const uid = await getUid();
    const records = await jsonRpc<Array<{ id: number; name: string }>>(
      "/jsonrpc",
      "execute_kw",
      {
        db: ODOO_DB,
        uid,
        password: ODOO_API_KEY,
        model: "hr.job",
        method: "search_read",
        args: [[]],
        kwargs: { fields: ["id", "name"], limit: 100 },
      }
    );
    return records;
  } catch (err) {
    logger.error({ err }, "Failed to fetch jobs from Odoo");
    return [];
  }
}

export async function getOdooEmployees(): Promise<
  Array<{ id: number; name: string; work_email: string; job_title: string }>
> {
  if (!isOdooConfigured()) return [];

  try {
    const uid = await getUid();
    const records = await jsonRpc<
      Array<{ id: number; name: string; work_email: string; job_title: string }>
    >("/jsonrpc", "execute_kw", {
      db: ODOO_DB,
      uid,
      password: ODOO_API_KEY,
      model: "hr.employee",
      method: "search_read",
      args: [[]],
      kwargs: {
        fields: ["id", "name", "work_email", "job_title", "department_id"],
        limit: 200,
      },
    });
    return records;
  } catch (err) {
    logger.error({ err }, "Failed to fetch employees from Odoo");
    return [];
  }
}
