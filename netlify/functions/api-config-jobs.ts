import type { Handler } from "@netlify/functions";
import { getOdooJobs } from "./_lib/odoo";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const jobs = await getOdooJobs();
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(jobs),
  };
};
