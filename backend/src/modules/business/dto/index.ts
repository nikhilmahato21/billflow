import { z } from "zod";

export const UpdateProfileDto = z.object({
  name:     z.string().min(1).optional(),
  address:  z.string().optional(),
  gstin:    z.string().optional(),
  currency: z.string().optional(),
  logo:     z.string().optional(),
});

export const UpdateSettingsDto = z.object({
  settings: z.record(z.unknown()),
});

export const UpdateRemindersDto = z.object({
  before_due:      z.array(z.number()).optional(),
  on_due:          z.boolean().optional(),
  after_due:       z.array(z.number()).optional(),
  channel:         z.enum(["whatsapp", "email"]).optional(),
  messageTemplate: z.string().optional(),
});

export const UpdateTaxDto = z.object({
  defaultTaxRate: z.number().min(0).max(100).optional(),
  splitTax:       z.boolean().optional(),
  taxInclusive:   z.boolean().optional(),
});

export type UpdateProfileInput   = z.infer<typeof UpdateProfileDto>;
export type UpdateSettingsInput  = z.infer<typeof UpdateSettingsDto>;
export type UpdateRemindersInput = z.infer<typeof UpdateRemindersDto>;
export type UpdateTaxInput       = z.infer<typeof UpdateTaxDto>;
