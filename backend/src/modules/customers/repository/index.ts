import { prisma } from "../../../shared/prisma";
import { CreateCustomerInput, UpdateCustomerInput } from "../dto";

export const customerRepository = {
  async findAll(businessId: string, search?: string) {
    return prisma.customer.findMany({
      where: { businessId, ...(search && { OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]})},
      orderBy: { createdAt: "desc" },
    });
  },
  async create(businessId: string, data: CreateCustomerInput) {
    return prisma.customer.create({ data: { businessId, ...data } });
  },
  async update(id: string, businessId: string, data: UpdateCustomerInput) {
    return prisma.customer.update({ where: { id, businessId }, data });
  },
  async delete(id: string, businessId: string) {
    return prisma.customer.delete({ where: { id, businessId } });
  },
};
