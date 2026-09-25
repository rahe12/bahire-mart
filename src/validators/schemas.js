const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  businessName: z.string().min(2).max(180)
});

const productSchema = z.object({
  name: z.string().min(1).max(180),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  sku: z.string().max(80).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  buyingPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  minimumStock: z.coerce.number().min(0).default(0),
  unit: z.string().max(30).default("piece")
});

const expenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  amount: z.coerce.number().positive(),
  expenseDate: z.string().datetime().optional()
});

module.exports = { registerSchema, productSchema, expenseSchema };
