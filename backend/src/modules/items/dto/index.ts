import { z } from "zod";
const ITEM_TYPES = ["product","service","membership","subscription"] as const;
export const CreateItemDto = z.object({
  name: z.string().min(1), type: z.enum(ITEM_TYPES).default("service"),
  price: z.number().min(0), taxRate: z.number().min(0).max(100).default(0),
  category: z.string().optional(), customFields: z.record(z.unknown()).optional(),
});
export const UpdateItemDto = CreateItemDto.partial().extend({ active: z.boolean().optional() });
export type CreateItemInput = z.infer<typeof CreateItemDto>;
export type UpdateItemInput = z.infer<typeof UpdateItemDto>;
