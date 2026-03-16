import { prisma } from "../../../shared/prisma";

export const staffRepository = {
  findAll: (businessId: string) =>
    prisma.user.findMany({
      where:   { businessId },
      select:  { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

  findByEmail: (email: string, businessId: string) =>
    prisma.user.findUnique({ where: { email_businessId: { email, businessId } } }),

  findById: (id: string, businessId: string) =>
    prisma.user.findFirst({ where: { id, businessId } }),

  countForBusiness: async (businessId: string) =>
    prisma.user.count({ where: { businessId } }),

  create: (data: { businessId: string; name: string; email: string; passwordHash: string; role: "staff" | "accountant" }) =>
    prisma.user.create({
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),

  updateRole: (id: string, role: string) =>
    prisma.user.update({
      where:  { id },
      data:   { role: role as any },
      select: { id: true, name: true, email: true, role: true },
    }),

  delete: (id: string) => prisma.user.delete({ where: { id } }),
};
