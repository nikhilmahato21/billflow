import { prisma } from "../../../shared/prisma";
import type { Prisma } from "../../../generated/prisma/client";

export const businessRepository = {
  async findById(id: string) {
    return prisma.business.findUnique({
      where:   { id },
      include: { template: true },
    });
  },

  async updateProfile(id: string, data: {
    name?: string; address?: string; gstin?: string; currency?: string; logo?: string;
  }) {
    return prisma.business.update({ where: { id }, data });
  },

  async mergeSettingsOverride(id: string, settings: Prisma.InputJsonObject) {
    const biz = await prisma.business.findUnique({ where: { id }, select: { settingsOverride: true } });
    const merged = { ...((biz?.settingsOverride as Prisma.JsonObject | null) ?? {}), ...settings } satisfies Prisma.InputJsonObject;
    return prisma.business.update({ where: { id }, data: { settingsOverride: merged } });
  },

  async updateReminderConfig(id: string, config: Prisma.InputJsonObject) {
    return prisma.business.update({ where: { id }, data: { reminderConfig: config } });
  },

  async mergeTaxSettings(id: string, tax: Prisma.InputJsonObject) {
    const biz = await prisma.business.findUnique({ where: { id }, select: { settingsOverride: true } });
    const merged = { ...((biz?.settingsOverride as Prisma.JsonObject | null) ?? {}), tax } satisfies Prisma.InputJsonObject;
    return prisma.business.update({ where: { id }, data: { settingsOverride: merged } });
  },

  async setOnboardingComplete(id: string, data?: {
    name?: string; address?: string; gstin?: string; currency?: string;
  }) {
    return prisma.business.update({ where: { id }, data: { ...data, onboardingComplete: true } });
  },

  async applyTemplate(id: string, templateSlug: string) {
    const template = await prisma.businessTemplate.findUnique({
      where:   { slug: templateSlug },
      include: { templateItems: true },
    });
    if (!template) throw new Error(`Template '${templateSlug}' not found`);

    await prisma.$transaction(async (tx: any) => {
      await tx.business.update({
        where: { id },
        data: {
          templateId:      template.id,
          featuresEnabled: template.featuresEnabled,
          reminderConfig:  template.reminderConfig,
        },
      });

      const seededItems = template.templateItems.filter((ti: any) => ti.name !== null);
      if (seededItems.length > 0) {
        await tx.item.createMany({
          data: seededItems.map((ti: any) => ({
            businessId: id,
            name:       ti.name!,
            type:       ti.type as any,
            price:      ti.defaultPrice ?? 0,
            taxRate:    0,
            category:   ti.category,
          })),
          skipDuplicates: true,
        });
      }
    });

    return template;
  },
};
