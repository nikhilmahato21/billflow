import { prisma } from "../../../shared/prisma";

export const authRepository = {
  async createBusinessAndOwner(data: {
    businessName: string;
    userName: string;
    email: string;
    passwordHash: string;
  }) {
    return prisma.$transaction(async (tx: any) => {
      const business = await tx.business.create({ data: { name: data.businessName, currency: "INR" } });
      const user = await tx.user.create({
        data: { businessId: business.id, name: data.userName, email: data.email, passwordHash: data.passwordHash, role: "owner" },
      });
      return { business, user };
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findFirst({ where: { email }, include: { business: true } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { business: true } });
  },

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token }, include: { user: { include: { business: true } } } });
  },

  async rotateRefreshToken(id: string, newToken: string, expiresAt: Date) {
    return prisma.refreshToken.update({ where: { id }, data: { token: newToken, expiresAt } });
  },

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.deleteMany({ where: { token } });
  },
};
