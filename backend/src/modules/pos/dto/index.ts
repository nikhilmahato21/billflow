import { z } from "zod";
export const PosCheckoutDto = z.object({
  customerId:    z.string().optional(),
  items:         z.array(z.object({ itemId: z.string(), quantity: z.number().int().min(1) })).min(1),
  paymentMethod: z.enum(["cash","upi","card","online"]),
  splitTax:      z.boolean().optional(),
});
export type PosCheckoutInput = z.infer<typeof PosCheckoutDto>;
