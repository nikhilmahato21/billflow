import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "../repository";
import { env } from "../../../shared/config/env";
import { AuthUser } from "../../../shared/types";
import { UnauthorizedError, ConflictError } from "../../../shared/errors";
import { RegisterInput, LoginInput } from "../dto";

function signTokens(payload: AuthUser) {
  const accessToken  = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId: payload.userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const { business, user } = await authRepository.createBusinessAndOwner({
      businessName: input.businessName,
      userName:     input.name,
      email:        input.email,
      passwordHash,
    });

    const payload: AuthUser = { userId: user.id, businessId: business.id, role: "owner", email: user.email };
    const tokens = signTokens(payload);
    await authRepository.saveRefreshToken(user.id, tokens.refreshToken, new Date(Date.now() + 7 * 86400_000));

    return {
      user:     { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: business.id, name: business.name, onboardingComplete: false },
      ...tokens,
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    const payload: AuthUser = { userId: user.id, businessId: user.businessId, role: user.role as any, email: user.email };
    const tokens = signTokens(payload);
    await authRepository.saveRefreshToken(user.id, tokens.refreshToken, new Date(Date.now() + 7 * 86400_000));

    return {
      user:     { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: user.business.id, name: user.business.name, onboardingComplete: user.business.onboardingComplete },
      ...tokens,
    };
  },

  async refresh(token: string) {
    const stored = await authRepository.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedError("Invalid or expired refresh token");

    const payload: AuthUser = {
      userId: stored.user.id, businessId: stored.user.businessId,
      role: stored.user.role as any, email: stored.user.email,
    };
    const tokens = signTokens(payload);
    await authRepository.rotateRefreshToken(stored.id, tokens.refreshToken, new Date(Date.now() + 7 * 86400_000));
    return tokens;
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError("User not found");
    return {
      user:     { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: user.business.id, name: user.business.name, onboardingComplete: user.business.onboardingComplete, plan: user.business.plan },
    };
  },
};
