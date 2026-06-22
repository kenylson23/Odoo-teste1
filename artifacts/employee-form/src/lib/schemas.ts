import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  department: z.string().optional(),
  jobTitle: z.string().min(2, "Cargo é obrigatório e deve ter pelo menos 2 caracteres"),
  jobPosition: z.string().optional(),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
