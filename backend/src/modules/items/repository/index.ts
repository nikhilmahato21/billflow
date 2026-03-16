import { prisma } from "../../../shared/prisma";
import { CreateItemInput, UpdateItemInput } from "../dto";

export const itemRepository = {
  async findAll(businessId: string) {
    return prisma.item.findMany({ where: { businessId, active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  },
  async create(businessId: string, data: CreateItemInput) {
    return prisma.item.create({ data: { businessId, ...data } as any });
  },
  async update(id: string, businessId: string, data: UpdateItemInput) {
    return prisma.item.update({ where: { id, businessId }, data: data as any });
  },
  async softDelete(id: string, businessId: string) {
    return prisma.item.update({ where: { id, businessId }, data: { active: false } });
  },
};
