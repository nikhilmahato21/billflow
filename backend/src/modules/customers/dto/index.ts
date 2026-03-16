import { z } from "zod";
export const CreateCustomerDto = z.object({
  name:  z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});
export const UpdateCustomerDto = CreateCustomerDto.partial();
export type CreateCustomerInput = z.infer<typeof CreateCustomerDto>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerDto>;
