import { z } from "zod";

export const InviteStaffDto = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(["staff", "accountant"]),
});

export const UpdateStaffRoleDto = z.object({
  role: z.enum(["staff", "accountant"]),
});

export type InviteStaffInput    = z.infer<typeof InviteStaffDto>;
export type UpdateStaffRoleInput = z.infer<typeof UpdateStaffRoleDto>;
