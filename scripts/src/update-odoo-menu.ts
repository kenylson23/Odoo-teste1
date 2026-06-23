const ODOO_URL = process.env.ODOO_URL!.replace(/\/$/, "");
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;
const NETLIFY_URL = "https://odoohr.netlify.app";

async function rpc<T>(path: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${ODOO_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: 1, params }),
  });
  const data = (await res.json()) as { result?: T; error?: { data?: { message?: string } } };
  if (data.error) throw new Error(data.error.data?.message ?? "RPC error");
  return data.result as T;
}

async function callKw<T>(uid: number, model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<T> {
  return rpc<T>("/jsonrpc", {
    service: "object", method: "execute_kw",
    args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
  });
}

async function main() {
  console.log("A autenticar no Odoo...");
  const uid = await rpc<number>("/jsonrpc", {
    service: "common", method: "authenticate",
    args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
  });
  if (!uid) throw new Error("Autenticação falhou");
  console.log(`Autenticado como uid=${uid}`);

  // Procurar acções act_url existentes com o nome do sistema
  const actions = await callKw<Array<{ id: number; name: string; url: string }>>(
    uid, "ir.actions.act_url", "search_read",
    [[["name", "ilike", "Nexus HR"]]],
    { fields: ["id", "name", "url"] }
  );

  if (actions.length > 0) {
    console.log(`\nActualizando ${actions.length} acção(ões) encontrada(s):`);
    for (const action of actions) {
      console.log(`  ID ${action.id}: "${action.name}" — URL actual: ${action.url}`);
      await callKw(uid, "ir.actions.act_url", "write", [[action.id], { url: NETLIFY_URL }]);
      console.log(`  ✓ Actualizado para: ${NETLIFY_URL}`);
    }
  } else {
    console.log("\nNenhuma acção encontrada com nome 'Nexus HR'. A criar de raiz...");

    const actionId = await callKw<number>(uid, "ir.actions.act_url", "create", [{
      name: "Nexus HR",
      url: NETLIFY_URL,
      target: "new",
    }]);
    console.log(`  ✓ Acção criada com ID=${actionId}`);

    // Procurar menu existente
    const menus = await callKw<Array<{ id: number; name: string }>>(
      uid, "ir.ui.menu", "search_read",
      [[["name", "ilike", "Nexus HR"]]],
      { fields: ["id", "name"] }
    );

    if (menus.length > 0) {
      console.log(`  Actualizando menu existente (ID=${menus[0].id})...`);
      await callKw(uid, "ir.ui.menu", "write", [[menus[0].id], { action: `ir.actions.act_url,${actionId}` }]);
    } else {
      const menuId = await callKw<number>(uid, "ir.ui.menu", "create", [{
        name: "Nexus HR",
        action: `ir.actions.act_url,${actionId}`,
        parent_id: false,
        sequence: 99,
      }]);
      console.log(`  ✓ Menu criado com ID=${menuId}`);
    }
  }

  console.log("\n✅ Concluído! O menu no Odoo aponta agora para:", NETLIFY_URL);
}

main().catch((err) => { console.error("Erro:", err.message); process.exit(1); });
