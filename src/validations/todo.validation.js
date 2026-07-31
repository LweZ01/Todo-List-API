import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

export const listTodosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
