import { z } from "zod";
export const RecordPaymentDto = z.object({
  invoiceId: z.string(),
  amount:    z.number().positive(),
  method:    z.enum(["cash","upi","card","online","razorpay"]),
  notes:     z.string().optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentDto>;
