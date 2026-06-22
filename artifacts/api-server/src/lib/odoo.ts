import { logger } from "./logger";

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

export function isOdooConfigured(): boolean {
  return !!(ODOO_URL && ODOO_DB && ODOO_USERNAME && ODOO_API_KEY);
}

// Odoo uses JSON-RPC 2.0. For API Key auth, the password field IS the API key.
// Authenticate via /web/dataset/call_kw using uid=1 is not correct —
// we must first get the uid via common/authenticate, then use the API key as password.

type JsonRpcResponse<T = unknown> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { message: string; data?: { message?: string; debug?: string } };
};

async function rpc<T = unknown>(
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (!ODOO_URL) throw new Error("ODOO_URL not configured");
  const url = `${ODOO_URL.replace(/\/$/, "")}${path}`;
  const body = {
    jsonrpc: "2.0",
    method: "call",
    id: Math.floor(Math.random() * 1_000_000),
    params: payload,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse<T>;

  if (data.error) {
    const msg =
      data.error.data?.message ?? data.error.data?.debug ?? data.error.message;
    throw new Error(`Odoo RPC error: ${msg}`);
  }

  return data.result as T;
}

// Cache the uid per process lifetime (it doesn't change for a given user)
let _uid: number | null = null;

async function getUid(): Promise<number> {
  if (_uid !== null) return _uid;
  if (!ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
    throw new Error("Odoo credentials not configured");
  }

  // Odoo API Key auth: authenticate with the API key as the password
  const uid = await rpc<number>("/web/dataset/call_kw", {
    model: "res.users",
    method: "search",
    args: [[["login", "=", ODOO_USERNAME]]],
    kwargs: {},
  }).catch(() => null);

  // Use the standard common authenticate endpoint — API key works as password here
  const authUid = await rpc<number | false>("/jsonrpc", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
  });

  if (!authUid) {
    throw new Error("Odoo authentication failed — check credentials");
  }

  _uid = authUid;
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
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
  });
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
      message:
        "Odoo não configurado. Defina ODOO_URL, ODOO_DB, ODOO_USERNAME e ODOO_API_KEY.",
    };
  }

  try {
    // Reset cached uid so we re-authenticate with fresh secrets
    _uid = null;
    await getUid();
    return {
      connected: true,
      version: null,
      message: "Conectado ao Odoo com sucesso",
    };
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
    const vals: Record<string, unknown> = { name: data.name };
    if (data.email) vals.work_email = data.email;
    if (data.phone) vals.work_phone = data.phone;
    if (data.mobile) vals.mobile_phone = data.mobile;
    if (data.jobTitle) vals.job_title = data.jobTitle;
    if (data.birthDate) vals.birthday = data.birthDate;

    const id = await callKw<number>("hr.employee", "create", [vals]);
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
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.department",
      "search_read",
      [[]],
      { fields: ["id", "name"], limit: 100 }
    );
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
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.job",
      "search_read",
      [[]],
      { fields: ["id", "name"], limit: 100 }
    );
  } catch (err) {
    logger.error({ err }, "Failed to fetch jobs from Odoo");
    return [];
  }
}
