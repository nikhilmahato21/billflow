import { subscriptionRepository } from "../repository";
import { CreateSubscriptionInput, UpdateSubscriptionInput } from "../dto";

export const subscriptionService = {
  list:   (businessId: string) => subscriptionRepository.findAll(businessId),
  create: (businessId: string, data: CreateSubscriptionInput) => subscriptionRepository.create(businessId, data),
  update: (id: string, businessId: string, data: UpdateSubscriptionInput) =>
    subscriptionRepository.update(id, businessId, data),
};
