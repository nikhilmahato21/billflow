import { customerRepository } from "../repository";
import { CreateCustomerInput, UpdateCustomerInput } from "../dto";
import { NotFoundError } from "../../../shared/errors";

export const customerService = {
  list:   (businessId: string, search?: string) => customerRepository.findAll(businessId, search),
  create: (businessId: string, data: CreateCustomerInput) => customerRepository.create(businessId, data),
  update: async (id: string, businessId: string, data: UpdateCustomerInput) => {
    const existing = await customerRepository.findAll(businessId);
    if (!existing.find((c: any) => c.id === id)) throw new NotFoundError("Customer");
    return customerRepository.update(id, businessId, data);
  },
  delete: (id: string, businessId: string) => customerRepository.delete(id, businessId),
};
