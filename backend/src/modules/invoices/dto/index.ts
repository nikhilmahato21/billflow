import { z } from "zod";

export const InvoiceItemDto = z.object({
  itemId:   z.string().optional(),
  name:     z.string().min(1),
  quantity: z.number().int().min(1),
  price:    z.number().min(0),
  taxRate:  z.number().min(0).max(100).default(0),
});

export const CreateInvoiceDto = z.object({
  customerId: z.string(),
  items:      z.array(InvoiceItemDto).min(1),
  dueDate:    z.string().transform(s => new Date(s)),
  notes:      z.string().optional(),
});

export const UpdateInvoiceStatusDto = z.object({
  status: z.enum(["draft","pending","paid","overdue"]),
});

export type CreateInvoiceInput       = z.infer<typeof CreateInvoiceDto>;
export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusDto>;

export interface ListInvoicesQuery {
  status?:     string;
  customerId?: string;
  page?:       number;
  limit?:      number;
}
