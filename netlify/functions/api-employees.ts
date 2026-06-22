import type { Handler } from "@netlify/functions";
import { getPool, serializeEmployee } from "./_lib/db";
import { createOdooEmployee } from "./_lib/odoo";

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

  const pool = getPool();

  if (event.httpMethod === "GET") {
    const { rows } = await pool.query(
      "SELECT * FROM employees ORDER BY created_at ASC"
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rows.map(serializeEmployee)),
    };
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

    const odooId = await createOdooEmployee({
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      jobTitle: data.jobTitle,
      birthDate: data.birthDate,
    });

    const { rows } = await pool.query(
      `INSERT INTO employees
         (name, email, phone, mobile, cpf, birth_date, gender, department,
          job_title, job_position, hire_date, address, city, state, zip, odoo_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.mobile || null,
        data.cpf || null,
        data.birthDate || null,
        data.gender || null,
        data.department || null,
        data.jobTitle || null,
        data.jobPosition || null,
        data.hireDate || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.zip || null,
        odooId,
      ]
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(serializeEmployee(rows[0])),
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
