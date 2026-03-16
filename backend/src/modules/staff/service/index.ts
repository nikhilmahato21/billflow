import bcrypt from "bcryptjs";
import { prisma } from "../../../shared/prisma";
import { ConflictError, NotFoundError, ForbiddenError, PlanLimitError } from "../../../shared/errors";
import { getPlanLimits } from "../../../shared/utils";

export const staffService = {
  async list(businessId: string) {
    return prisma.user.findMany({ where: { businessId }, select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  },

  async invite(businessId: string, currentUserId: string, data: { name: string; email: string; password: string; role: "staff" | "accountant" }) {
    const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { plan: true, _count: { select: { users: true } } } });
    if (!biz) throw new NotFoundError("Business");

    const limits = getPlanLimits(biz.plan);
    if (biz._count.users >= limits.staffUsers) {
      throw new PlanLimitError(`Your ${biz.plan} plan allows ${limits.staffUsers} user(s). Upgrade to add more staff.`, "staffUsers", biz._count.users, limits.staffUsers);
    }

    const existing = await prisma.user.findUnique({ where: { email_businessId: { email: data.email, businessId } } });
    if (existing) throw new ConflictError("A user with this email already exists in your business");

    const passwordHash = await bcrypt.hash(data.password, 12);
    return prisma.user.create({ data: { businessId, name: data.name, email: data.email, passwordHash, role: data.role }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  },

  async updateRole(id: string, businessId: string, currentUserId: string, role: "staff" | "accountant") {
    if (id === currentUserId) throw new ForbiddenError("You cannot change your own role");
    const target = await prisma.user.findFirst({ where: { id, businessId } });
    if (!target) throw new NotFoundError("Staff member");
    if (target.role === "owner") throw new ForbiddenError("Cannot change the owner's role");
    return prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
  },

  async remove(id: string, businessId: string, currentUserId: string) {
    if (id === currentUserId) throw new ForbiddenError("You cannot remove yourself");
    const target = await prisma.user.findFirst({ where: { id, businessId } });
    if (!target) throw new NotFoundError("Staff member");
    if (target.role === "owner") throw new ForbiddenError("Cannot remove the business owner");
    return prisma.user.delete({ where: { id } });
  },
};
