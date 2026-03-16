import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding business templates...");

  // GYM TEMPLATE
  const gym = await prisma.businessTemplate.upsert({
    where: { slug: "gym" },
    update: {},
    create: {
      slug: "gym",
      displayName: "Gym / Fitness Center",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: false,
        subscriptions: true,
        recurring: true,
        split_tax: false,
        pdf_receipts: true,
        whatsapp_reminders: true,
        inventory: false,
      },
      reminderConfig: {
        before_due: [3, 1],
        on_due: true,
        after_due: [1, 3],
        channel: "whatsapp",
      },
    },
  });

  await prisma.templateItem.createMany({
    data: [
      { templateId: gym.id, name: "Monthly Membership", type: "membership", defaultPrice: 1000, category: "Memberships" },
      { templateId: gym.id, name: "Quarterly Membership", type: "membership", defaultPrice: 2700, category: "Memberships" },
      { templateId: gym.id, name: "Personal Training Session", type: "service", defaultPrice: 500, category: "Services" },
      { templateId: gym.id, name: "Locker Rental", type: "service", defaultPrice: 200, category: "Services" },
    ],
    skipDuplicates: true,
  });

  // CLINIC TEMPLATE
  const clinic = await prisma.businessTemplate.upsert({
    where: { slug: "clinic" },
    update: {},
    create: {
      slug: "clinic",
      displayName: "Clinic / Healthcare",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: false,
        subscriptions: false,
        recurring: false,
        split_tax: true,
        pdf_receipts: true,
        whatsapp_reminders: true,
        inventory: false,
      },
      reminderConfig: {
        before_due: [1],
        on_due: true,
        after_due: [1],
        channel: "whatsapp",
      },
    },
  });

  await prisma.templateItem.createMany({
    data: [
      { templateId: clinic.id, name: "Consultation", type: "service", defaultPrice: 500, category: "Consultations" },
      { templateId: clinic.id, name: "Follow-up Visit", type: "service", defaultPrice: 300, category: "Consultations" },
      { templateId: clinic.id, name: "Blood Test", type: "service", defaultPrice: 800, category: "Lab Tests" },
      { templateId: clinic.id, name: "X-Ray", type: "service", defaultPrice: 600, category: "Diagnostics" },
    ],
    skipDuplicates: true,
  });

  // FREELANCER TEMPLATE
  const freelancer = await prisma.businessTemplate.upsert({
    where: { slug: "freelancer" },
    update: {},
    create: {
      slug: "freelancer",
      displayName: "Freelancer / Consultant",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: false,
        subscriptions: false,
        recurring: true,
        split_tax: false,
        pdf_receipts: true,
        whatsapp_reminders: true,
        inventory: false,
      },
      reminderConfig: {
        before_due: [3, 1],
        on_due: true,
        after_due: [1, 3, 7],
        channel: "whatsapp",
      },
    },
  });

  await prisma.templateItem.createMany({
    data: [
      { templateId: freelancer.id, name: "Hourly Consulting", type: "service", defaultPrice: 2000, category: "Services" },
      { templateId: freelancer.id, name: "Project Fixed Fee", type: "service", defaultPrice: 50000, category: "Services" },
      { templateId: freelancer.id, name: "Monthly Retainer", type: "subscription", defaultPrice: 15000, category: "Retainers" },
    ],
    skipDuplicates: true,
  });

  // TUTOR TEMPLATE
  const tutor = await prisma.businessTemplate.upsert({
    where: { slug: "tutor" },
    update: {},
    create: {
      slug: "tutor",
      displayName: "Tutor / Coaching Center",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: false,
        subscriptions: true,
        recurring: true,
        split_tax: false,
        pdf_receipts: true,
        whatsapp_reminders: true,
        inventory: false,
      },
      reminderConfig: {
        before_due: [3, 1],
        on_due: true,
        after_due: [1, 3],
        channel: "whatsapp",
      },
    },
  });

  await prisma.templateItem.createMany({
    data: [
      { templateId: tutor.id, name: "Monthly Tuition", type: "subscription", defaultPrice: 3000, category: "Tuition" },
      { templateId: tutor.id, name: "Single Session", type: "service", defaultPrice: 500, category: "Sessions" },
      { templateId: tutor.id, name: "Crash Course", type: "service", defaultPrice: 8000, category: "Courses" },
    ],
    skipDuplicates: true,
  });

  // RETAIL TEMPLATE
  const retail = await prisma.businessTemplate.upsert({
    where: { slug: "retail" },
    update: {},
    create: {
      slug: "retail",
      displayName: "Retail Store",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: true,
        subscriptions: false,
        recurring: false,
        split_tax: true,
        pdf_receipts: true,
        whatsapp_reminders: false,
        inventory: true,
      },
      reminderConfig: {
        before_due: [],
        on_due: false,
        after_due: [],
        channel: "whatsapp",
      },
    },
  });

  await prisma.templateItem.createMany({
    data: [
      { templateId: retail.id, name: "Sample Product 1", type: "product", defaultPrice: 499, category: "General" },
      { templateId: retail.id, name: "Sample Product 2", type: "product", defaultPrice: 999, category: "General" },
    ],
    skipDuplicates: true,
  });

  // RESTAURANT TEMPLATE
  const restaurant = await prisma.businessTemplate.upsert({
    where: { slug: "restaurant" },
    update: {},
    create: {
      slug: "restaurant",
      displayName: "Restaurant / Food Service",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: true,
        subscriptions: false,
        recurring: false,
        split_tax: true,
        pdf_receipts: true,
        whatsapp_reminders: false,
        inventory: false,
      },
      reminderConfig: {
        before_due: [],
        on_due: false,
        after_due: [],
        channel: "whatsapp",
      },
    },
  });

  // Restaurant gets empty category placeholders (owner fills during onboarding)
  await prisma.templateItem.createMany({
    data: [
      { templateId: restaurant.id, name: null, type: "product", defaultPrice: null, category: "Starters" },
      { templateId: restaurant.id, name: null, type: "product", defaultPrice: null, category: "Mains" },
      { templateId: restaurant.id, name: null, type: "product", defaultPrice: null, category: "Breads" },
      { templateId: restaurant.id, name: null, type: "product", defaultPrice: null, category: "Beverages" },
      { templateId: restaurant.id, name: null, type: "product", defaultPrice: null, category: "Desserts" },
    ],
    skipDuplicates: true,
  });

  // CUSTOM TEMPLATE
  await prisma.businessTemplate.upsert({
    where: { slug: "custom" },
    update: {},
    create: {
      slug: "custom",
      displayName: "Custom Business",
      defaultCurrency: "INR",
      featuresEnabled: {
        pos_mode: false,
        subscriptions: false,
        recurring: false,
        split_tax: false,
        pdf_receipts: true,
        whatsapp_reminders: true,
        inventory: false,
      },
      reminderConfig: {
        before_due: [3, 1],
        on_due: true,
        after_due: [1, 3],
        channel: "whatsapp",
      },
    },
  });

  console.log("✅ Templates seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
