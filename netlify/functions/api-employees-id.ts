import type { Handler } from "@netlify/functions";
import { getPool, serializeEmployee } from "./_lib/db";

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

  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT * FROM employees WHERE id = $1",
    [id]
  );

  if (rows.length === 0) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "Funcionário não encontrado" }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(serializeEmployee(rows[0])),
  };
};
