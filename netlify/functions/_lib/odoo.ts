type JsonRpcResponse<T = unknown> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { message: string; data?: { message?: string; debug?: string } };
};

function isOdooConfigured(): boolean {
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

export async function createOdooEmployee(data: {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  birthDate?: string;
}): Promise<number | null> {
  if (!isOdooConfigured()) return null;
  try {
    const vals: Record<string, unknown> = { name: data.name };
    if (data.email) vals.work_email = data.email;
    if (data.phone) vals.work_phone = data.phone;
    if (data.mobile) vals.mobile_phone = data.mobile;
    if (data.jobTitle) vals.job_title = data.jobTitle;
    if (data.birthDate) vals.birthday = data.birthDate;
    return await callKw<number>("hr.employee", "create", [vals]);
  } catch {
    return null;
  }
}

export async function getOdooDepartments(): Promise<Array<{ id: number; name: string }>> {
  if (!isOdooConfigured()) return [];
  try {
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.department", "search_read", [[]], { fields: ["id", "name"], limit: 100 }
    );
  } catch {
    return [];
  }
}

export async function getOdooJobs(): Promise<Array<{ id: number; name: string }>> {
  if (!isOdooConfigured()) return [];
  try {
    return await callKw<Array<{ id: number; name: string }>>(
      "hr.job", "search_read", [[]], { fields: ["id", "name"], limit: 100 }
    );
  } catch {
    return [];
  }
}
