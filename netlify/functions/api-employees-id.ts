import type { Handler } from "@netlify/functions";
import { getOdooEmployee } from "./_lib/odoo";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const rawId = event.queryStringParameters?.id;
  const id = rawId ? parseInt(rawId, 10) : NaN;

  if (isNaN(id)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "ID inválido" }) };
  }

  const employee = await getOdooEmployee(id);
  if (!employee) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Funcionário não encontrado" }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify(employee) };
};
