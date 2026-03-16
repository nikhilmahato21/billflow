import { z } from "zod";

export const RegisterDto = z.object({
  name:         z.string().min(2),
  email:        z.string().email(),
  password:     z.string().min(8),
  businessName: z.string().min(2),
});

export const LoginDto = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const RefreshDto = z.object({
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput    = z.infer<typeof LoginDto>;
