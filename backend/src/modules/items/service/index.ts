import { itemRepository } from "../repository";
import { CreateItemInput, UpdateItemInput } from "../dto";

export const itemService = {
  async list(businessId: string, grouped?: boolean) {
    const items = await itemRepository.findAll(businessId);
    if (!grouped) return items;
    const map: Record<string, typeof items> = {};
    for (const item of items) {
      const key = item.category || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  },
  create: (businessId: string, data: CreateItemInput) => itemRepository.create(businessId, data),
  update: (id: string, businessId: string, data: UpdateItemInput) => itemRepository.update(id, businessId, data),
  delete: (id: string, businessId: string) => itemRepository.softDelete(id, businessId),
};
