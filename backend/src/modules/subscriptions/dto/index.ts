import { z } from "zod";
const CYCLES   = ["monthly","quarterly","annual"] as const;
const STATUSES = ["active","paused","cancelled"]  as const;

export const CreateSubscriptionDto = z.object({
  customerId:   z.string(),
  itemId:       z.string(),
  billingCycle: z.enum(CYCLES),
  startDate:    z.string().transform(s => new Date(s)),
  endDate:      z.string().transform(s => new Date(s)).optional(),
});

export const UpdateSubscriptionDto = z.object({
  status:  z.enum(STATUSES).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionDto>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionDto>;
