import type { Handler } from "@netlify/functions";
import {
  listOdooEmployees,
  createOdooEmployee,
} from "./_lib/odoo";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod === "GET") {
    const employees = await listOdooEmployees();
    return { statusCode: 200, headers, body: JSON.stringify(employees) };
  }

  if (event.httpMethod === "POST") {
    const data = JSON.parse(event.body || "{}");
    if (!data.name || !data.email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Nome e e-mail são obrigatórios" }),
      };
    }
    const employee = await createOdooEmployee({
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      cpf: data.cpf,
      birthDate: data.birthDate,
      jobTitle: data.jobTitle,
    });
    return { statusCode: 201, headers, body: JSON.stringify(employee) };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
