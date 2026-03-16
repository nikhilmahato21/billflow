import { prisma } from "../../../shared/prisma";
import { ForbiddenError, NotFoundError } from "../../../shared/errors";

export const businessService = {
  async getById(id: string, requestingBusinessId: string) {
    if (id !== requestingBusinessId) throw new ForbiddenError("Access denied");
    const biz = await prisma.business.findUnique({ where: { id }, include: { template: true } });
    if (!biz) throw new NotFoundError("Business");
    const effectiveFeatures = { ...(biz.template?.featuresEnabled as any ?? {}), ...(biz.featuresEnabled as any ?? {}), ...(biz.settingsOverride as any ?? {}) };
    return { ...biz, effectiveFeatures };
  },

  async updateProfile(id: string, data: { name?: string; address?: string; gstin?: string; currency?: string; logo?: string }) {
    return prisma.business.update({ where: { id }, data });
  },

  async updateSettings(id: string, settings: Record<string, unknown>) {
    const biz = await prisma.business.findUnique({ where: { id }, select: { settingsOverride: true } });
    const merged = { ...(biz?.settingsOverride as object ?? {}), ...settings };
    return prisma.business.update({ where: { id }, data: { settingsOverride: merged } });
  },

  async updateReminders(id: string, config: object) {
    return prisma.business.update({ where: { id }, data: { reminderConfig: config } });
  },

  async updateTax(id: string, tax: object) {
    const biz = await prisma.business.findUnique({ where: { id }, select: { settingsOverride: true } });
    const merged = { ...(biz?.settingsOverride as object ?? {}), tax };
    return prisma.business.update({ where: { id }, data: { settingsOverride: merged } });
  },

  async completeOnboarding(id: string, data: { name?: string; address?: string; gstin?: string; currency?: string }) {
    return prisma.business.update({ where: { id }, data: { ...data, onboardingComplete: true } });
  },
};
