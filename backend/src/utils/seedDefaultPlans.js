// backend/src/utils/seedDefaultPlans.js
const prisma = require('../config/prisma');

const ALL_MODULES = [
  'Employees', 'Invoices', 'Reports', 'Contacts',
  'Clients', 'Estimates', 'Goals', 'Deals',
  'Projects', 'Payments', 'Assets', 'Leads',
  'Tickets', 'Taxes', 'Activities', 'Pipelines',
  'Attendance', 'Payroll'
];

function createFeatureMap(enabledList) {
  const map = {};
  ALL_MODULES.forEach(mod => {
    map[mod] = enabledList.includes(mod);
  });
  return map;
}

const DEFAULT_PLANS = [
  {
    name: 'Starter Plan',
    code: 'STARTER',
    description: 'Perfect for small Indian businesses and startups starting out with core HRMS.',
    priceMonthly: 1999.00,
    priceYearly: 19990.00,
    maxEmployees: 10,
    maxStorageGb: 5.0,
    features: createFeatureMap(['Employees', 'Attendance', 'Reports']),
    isActive: true
  },
  {
    name: 'Professional Plan',
    code: 'PROFESSIONAL',
    description: 'Ideal for growing Indian companies needing automated payroll, projects, and asset tracking.',
    priceMonthly: 4999.00,
    priceYearly: 49990.00,
    maxEmployees: 50,
    maxStorageGb: 25.0,
    features: createFeatureMap(['Employees', 'Attendance', 'Reports', 'Payroll', 'Projects', 'Assets', 'Tickets', 'Invoices', 'Clients']),
    isActive: true
  },
  {
    name: 'Enterprise Plan',
    code: 'ENTERPRISE',
    description: 'Full-featured enterprise suite for large Indian enterprises with unlimited employees and SLA support.',
    priceMonthly: 12999.00,
    priceYearly: 129990.00,
    maxEmployees: 99999,
    maxStorageGb: 100.0,
    features: createFeatureMap(ALL_MODULES),
    isActive: true
  }
];

async function seedDefaultPlans() {
  try {
    console.log('[SEED] Seeding SaaS Subscription Plans...');
    for (const planData of DEFAULT_PLANS) {
      await prisma.subscriptionPlan.upsert({
        where: { code: planData.code },
        update: {
          name: planData.name,
          description: planData.description,
          priceMonthly: planData.priceMonthly,
          priceYearly: planData.priceYearly,
          maxEmployees: planData.maxEmployees,
          maxStorageGb: planData.maxStorageGb,
          features: planData.features,
          isActive: planData.isActive
        },
        create: planData
      });
    }
    console.log('[SEED] SaaS Subscription Plans seeded successfully.');

    // Fetch default starter plan
    const starterPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: 'STARTER' }
    });

    if (starterPlan) {
      // Find all companies without an active subscription and create a 14-day trial
      const companies = await prisma.company.findMany({
        where: { subscription: null }
      });

      const trialDays = 14;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      for (const comp of companies) {
        await prisma.subscription.create({
          data: {
            companyId: comp.id,
            planId: starterPlan.id,
            status: 'TRIAL',
            billingCycle: 'MONTHLY',
            trialEndsAt: trialEndsAt
          }
        });
        console.log(`[SEED] Created 14-day trial subscription for Company "${comp.name}" (ID: ${comp.id})`);
      }
    }
  } catch (error) {
    console.error('[SEED] Error seeding default subscription plans:', error);
  }
}

module.exports = { seedDefaultPlans, DEFAULT_PLANS, ALL_MODULES, createFeatureMap };

