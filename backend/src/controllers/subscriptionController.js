// backend/src/controllers/subscriptionController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// Helper to resolve features map seamlessly
function resolveFeatures(planFeatures, customFeatures) {
  let base = planFeatures;
  if (typeof base === 'string') {
    try { base = JSON.parse(base); } catch (e) { base = {}; }
  }

  let baseMap = {};
  if (Array.isArray(base)) {
    base.forEach(item => { baseMap[item] = true; });
  } else if (base && typeof base === 'object') {
    baseMap = { ...base };
  }

  let custom = customFeatures;
  if (typeof custom === 'string') {
    try { custom = JSON.parse(custom); } catch (e) { custom = {}; }
  }

  if (custom && typeof custom === 'object' && !Array.isArray(custom)) {
    Object.assign(baseMap, custom);
  }

  return baseMap;
}

// ============================================================
// PLAN MANAGEMENT (Super Admin)
// ============================================================

async function getPlans(req, res) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { priceMonthly: 'asc' }
    });

    // Format response with subscriber count
    const formatted = plans.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      maxEmployees: p.maxEmployees,
      maxStorageGb: p.maxStorageGb,
      features: resolveFeatures(p.features),
      isActive: p.isActive,
      totalSubscribers: p._count.subscriptions,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
}

async function createPlan(req, res) {
  try {
    const { name, code, description, priceMonthly, priceYearly, maxEmployees, maxStorageGb, features, isActive } = req.body;

    if (!name || !code || priceMonthly === undefined || priceYearly === undefined) {
      return res.status(400).json({ message: 'Name, code, priceMonthly, and priceYearly are required' });
    }

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: code.toUpperCase() }
    });
    if (existing) {
      return res.status(400).json({ message: `Plan with code "${code}" already exists` });
    }

    let parsedFeatures = features || {};
    if (Array.isArray(features)) {
      parsedFeatures = {};
      features.forEach(f => { parsedFeatures[f] = true; });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || '',
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        maxEmployees: maxEmployees ? parseInt(maxEmployees, 10) : 10,
        maxStorageGb: maxStorageGb ? parseFloat(maxStorageGb) : 5.0,
        features: parsedFeatures,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: 'Failed to create subscription plan' });
  }
}

async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) return res.status(400).json({ message: 'Invalid plan ID' });

    const { name, description, priceMonthly, priceYearly, maxEmployees, maxStorageGb, features, isActive } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (priceMonthly !== undefined) dataToUpdate.priceMonthly = parseFloat(priceMonthly);
    if (priceYearly !== undefined) dataToUpdate.priceYearly = parseFloat(priceYearly);
    if (maxEmployees !== undefined) dataToUpdate.maxEmployees = parseInt(maxEmployees, 10);
    if (maxStorageGb !== undefined) dataToUpdate.maxStorageGb = parseFloat(maxStorageGb);
    if (features !== undefined) {
      if (Array.isArray(features)) {
        const featObj = {};
        features.forEach(f => { featObj[f] = true; });
        dataToUpdate.features = featObj;
      } else {
        dataToUpdate.features = features;
      }
    }
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: dataToUpdate
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: 'Failed to update subscription plan' });
  }
}

async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    const planId = parseInt(id, 10);
    if (isNaN(planId)) return res.status(400).json({ message: 'Invalid plan ID' });

    // Check if plan has active subscriptions
    const subCount = await prisma.subscription.count({ where: { planId } });
    if (subCount > 0) {
      // Soft-delete by setting isActive: false
      const plan = await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: false }
      });
      return res.json({ message: 'Plan deactivated because active subscribers exist', plan });
    }

    await prisma.subscriptionPlan.delete({ where: { id: planId } });
    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: 'Failed to delete plan' });
  }
}

// ============================================================
// TENANT SUBSCRIPTION MANAGEMENT (Super Admin)
// ============================================================

async function getSubscriptions(req, res) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        company: {
          include: {
            users: {
              where: { role: 'COMPANY_ADMIN' },
              take: 1
            },
            _count: {
              select: { users: true }
            }
          }
        },
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    const formatted = subscriptions.map(sub => {
      const trialEnds = new Date(sub.trialEndsAt);
      const diffTime = trialEnds.getTime() - now.getTime();
      const trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const isExpired = sub.status === 'TRIAL' && diffTime <= 0;

      const adminUser = sub.company.users[0] || null;

      return {
        id: sub.id,
        companyId: sub.company.id,
        companyName: sub.company.name,
        companySubdomain: sub.company.subdomain,
        companyLogo: sub.company.logoUrl,
        adminName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'N/A',
        adminEmail: adminUser ? adminUser.email : sub.company.email,
        planId: sub.plan.id,
        planName: sub.plan.name,
        planCode: sub.plan.code,
        priceMonthly: sub.plan.priceMonthly,
        priceYearly: sub.plan.priceYearly,
        maxEmployees: sub.plan.maxEmployees,
        currentEmployeeCount: sub.company._count.users,
        features: resolveFeatures(sub.plan.features, sub.customFeatures),
        customFeatures: sub.customFeatures || null,
        status: isExpired ? 'EXPIRED' : sub.status,
        billingCycle: sub.billingCycle,
        startDate: sub.startDate,
        endDate: sub.endDate,
        trialEndsAt: sub.trialEndsAt,
        trialDaysLeft: isExpired ? 0 : trialDaysLeft,
        lastInvoice: sub.invoices[0] || null,
        createdAt: sub.createdAt
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Failed to fetch tenant subscriptions' });
  }
}

async function updateCompanyFeatures(req, res) {
  try {
    const { companyId } = req.params;
    const cid = parseInt(companyId, 10);
    if (isNaN(cid)) return res.status(400).json({ message: 'Invalid company ID' });

    const { customFeatures } = req.body;

    let sub = await prisma.subscription.findUnique({ where: { companyId: cid } });
    if (!sub) {
      return res.status(404).json({ message: 'Subscription not found for company' });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { customFeatures: customFeatures || {} },
      include: { plan: true, company: true }
    });

    res.json({
      message: 'Company custom features updated successfully',
      subscription: updated,
      features: resolveFeatures(updated.plan.features, updated.customFeatures)
    });
  } catch (error) {
    console.error('Error updating company custom features:', error);
    res.status(500).json({ message: 'Failed to update company custom features' });
  }
}

async function updateCompanySubscription(req, res) {
  try {
    const { companyId } = req.params;
    const cid = parseInt(companyId, 10);
    if (isNaN(cid)) return res.status(400).json({ message: 'Invalid company ID' });

    const { planId, status, billingCycle, trialDays } = req.body;

    let sub = await prisma.subscription.findUnique({ where: { companyId: cid } });

    const updateData = {};
    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(planId, 10) } });
      if (!plan) return res.status(404).json({ message: 'Target plan not found' });
      updateData.planId = plan.id;
    }
    if (status) updateData.status = status;
    if (billingCycle) updateData.billingCycle = billingCycle;

    if (trialDays !== undefined) {
      const newTrialDate = new Date();
      newTrialDate.setDate(newTrialDate.getDate() + parseInt(trialDays, 10));
      updateData.trialEndsAt = newTrialDate;
    }

    if (!sub) {
      // Create if missing
      const defaultPlan = await prisma.subscriptionPlan.findFirst();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      sub = await prisma.subscription.create({
        data: {
          companyId: cid,
          planId: updateData.planId || defaultPlan.id,
          status: updateData.status || 'TRIAL',
          billingCycle: updateData.billingCycle || 'MONTHLY',
          trialEndsAt: updateData.trialEndsAt || trialEndsAt
        },
        include: { plan: true, company: true }
      });
    } else {
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: updateData,
        include: { plan: true, company: true }
      });
    }

    res.json({ message: 'Company subscription updated successfully', subscription: sub });
  } catch (error) {
    console.error('Error updating company subscription:', error);
    res.status(500).json({ message: 'Failed to update company subscription' });
  }
}

async function extendTrial(req, res) {
  try {
    const { companyId } = req.params;
    const cid = parseInt(companyId, 10);
    const { extraDays } = req.body;

    const daysToAdd = extraDays ? parseInt(extraDays, 10) : 14;

    const sub = await prisma.subscription.findUnique({ where: { companyId: cid } });
    if (!sub) return res.status(404).json({ message: 'Subscription not found for this company' });

    const currentTrialEnd = new Date(sub.trialEndsAt) > new Date() ? new Date(sub.trialEndsAt) : new Date();
    currentTrialEnd.setDate(currentTrialEnd.getDate() + daysToAdd);

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        trialEndsAt: currentTrialEnd,
        status: 'TRIAL'
      },
      include: { plan: true }
    });

    res.json({ message: `Trial extended by ${daysToAdd} days`, trialEndsAt: updated.trialEndsAt, subscription: updated });
  } catch (error) {
    console.error('Error extending trial:', error);
    res.status(500).json({ message: 'Failed to extend trial' });
  }
}

// ============================================================
// INVOICE & BILLING MANAGEMENT (Super Admin)
// ============================================================

async function getInvoices(req, res) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        company: true,
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      companyId: inv.companyId,
      companyName: inv.company.name,
      companyLogo: inv.company.logoUrl,
      planName: inv.subscription?.plan?.name || 'Standard Plan',
      billingCycle: inv.subscription?.billingCycle || 'MONTHLY',
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      paymentMethod: inv.paymentMethod || 'Credit Card / Stripe',
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
}

async function createInvoice(req, res) {
  try {
    const { companyId, amount, currency, dueDate, paymentMethod } = req.body;
    const cid = parseInt(companyId, 10);
    if (isNaN(cid) || !amount) {
      return res.status(400).json({ message: 'companyId and amount are required' });
    }

    const sub = await prisma.subscription.findUnique({ where: { companyId: cid } });

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        companyId: cid,
        subscriptionId: sub ? sub.id : null,
        invoiceNumber,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        status: 'UNPAID',
        dueDate: due,
        paymentMethod: paymentMethod || 'STRIPE'
      },
      include: { company: true }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
}

async function updateInvoiceStatus(req, res) {
  try {
    const { id } = req.params;
    const invId = parseInt(id, 10);
    const { status, paymentMethod } = req.body;

    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (paymentMethod) dataToUpdate.paymentMethod = paymentMethod;

    if (status === 'PAID') {
      dataToUpdate.paidAt = new Date();

      // If invoice marked as paid, ensure company's subscription status is set to ACTIVE
      const invoice = await prisma.invoice.findUnique({ where: { id: invId } });
      if (invoice && invoice.companyId) {
        await prisma.subscription.updateMany({
          where: { companyId: invoice.companyId },
          data: { status: 'ACTIVE' }
        });
      }
    }

    const updated = await prisma.invoice.update({
      where: { id: invId },
      data: dataToUpdate,
      include: { company: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Failed to update invoice status' });
  }
}

// ============================================================
// TENANT COMPANY ADMIN SUBSCRIPTION VIEW
// ============================================================

async function getCompanySubscription(req, res) {
  try {
    let companyId = req.user?.companyId;

    if (!companyId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { companyId: true }
      });
      companyId = dbUser?.companyId;
    }

    if (!companyId && req.headers.host) {
      const hostParts = req.headers.host.split('.');
      if (hostParts.length > 1) {
        const subdomain = hostParts[0].toLowerCase();
        const company = await prisma.company.findUnique({ where: { subdomain } });
        if (company) companyId = company.id;
      }
    }

    if (!companyId) {
      return res.status(400).json({ message: 'No company scope found for user session.' });
    }

    let sub = await prisma.subscription.findUnique({
      where: { companyId },
      include: {
        plan: true,
        company: {
          include: {
            _count: { select: { users: true } }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!sub) {
      // Auto-provision 14-day trial if missing
      const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      sub = await prisma.subscription.create({
        data: {
          companyId,
          planId: starterPlan ? starterPlan.id : 1,
          status: 'TRIAL',
          billingCycle: 'MONTHLY',
          trialEndsAt
        },
        include: {
          plan: true,
          company: { include: { _count: { select: { users: true } } } },
          invoices: true
        }
      });
    }

    const now = new Date();
    const trialEnds = new Date(sub.trialEndsAt);
    const diffTime = trialEnds.getTime() - now.getTime();
    const trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const isExpired = sub.status === 'TRIAL' && diffTime <= 0;

    res.json({
      subscriptionId: sub.id,
      companyId: sub.companyId,
      companyName: sub.company.name,
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        code: sub.plan.code,
        description: sub.plan.description,
        priceMonthly: sub.plan.priceMonthly,
        priceYearly: sub.plan.priceYearly,
        maxEmployees: sub.plan.maxEmployees,
        maxStorageGb: sub.plan.maxStorageGb,
        features: resolveFeatures(sub.plan.features, sub.customFeatures)
      },
      status: isExpired ? 'EXPIRED' : sub.status,
      billingCycle: sub.billingCycle,
      startDate: sub.startDate,
      endDate: sub.endDate,
      trialEndsAt: sub.trialEndsAt,
      trialDaysLeft: isExpired ? 0 : trialDaysLeft,
      currentEmployeeCount: sub.company._count.users,
      maxEmployees: sub.plan.maxEmployees,
      invoices: sub.invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        paymentMethod: inv.paymentMethod,
        createdAt: inv.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching company subscription:', error);
    res.status(500).json({ message: 'Failed to fetch company subscription details' });
  }
}

async function getDashboardSummary(req, res) {
  try {
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({ where: { isActive: true } });
    const totalSubscribers = await prisma.subscription.count();

    const paidInvoicesSum = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' }
    });
    const totalEarnings = paidInvoicesSum._sum.amount || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newCompaniesToday = await prisma.company.count({
      where: { createdAt: { gte: todayStart } }
    });

    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        users: { where: { role: 'COMPANY_ADMIN' }, take: 1 },
        subscription: { include: { plan: true } }
      }
    });

    res.json({
      totalCompanies,
      activeCompanies,
      totalSubscribers,
      totalEarnings,
      newCompaniesToday,
      recentCompanies: recentCompanies.map(c => ({
        id: c.id,
        name: c.name,
        subdomain: c.subdomain,
        email: c.email,
        adminName: c.users[0]?.name || 'N/A',
        planName: c.subscription?.plan?.name || 'Trial',
        status: c.isActive ? 'Active' : 'Inactive',
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
}

async function changeCompanyPlan(req, res) {
  try {
    let companyId = req.params?.companyId ? parseInt(req.params.companyId, 10) : (req.body?.companyId ? parseInt(req.body.companyId, 10) : req.user?.companyId);

    if (!companyId && req.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { companyId: true }
      });
      companyId = dbUser?.companyId;
    }

    if (!companyId && req.headers.host) {
      const hostParts = req.headers.host.split('.');
      if (hostParts.length > 1) {
        const subdomain = hostParts[0].toLowerCase();
        const company = await prisma.company.findUnique({ where: { subdomain } });
        if (company) companyId = company.id;
      }
    }

    if (!companyId) {
      return res.status(400).json({ message: 'No company scope found for user session.' });
    }

    const { planId, billingCycle } = req.body;
    const targetPlanId = parseInt(planId, 10);
    if (isNaN(targetPlanId)) {
      return res.status(400).json({ message: 'Target plan ID is required.' });
    }

    const targetPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: targetPlanId }
    });

    if (!targetPlan || !targetPlan.isActive) {
      return res.status(404).json({ message: 'Selected plan is inactive or not found.' });
    }

    // Check active employee count before allowing downgrade
    const activeEmployeeCount = await prisma.user.count({
      where: {
        companyId,
        accountStatus: 'ACTIVE',
        role: { not: 'SUPER_ADMIN' }
      }
    });

    if (activeEmployeeCount > targetPlan.maxEmployees) {
      return res.status(400).json({
        message: `Cannot switch to ${targetPlan.name} plan because your company currently has ${activeEmployeeCount} active employees, which exceeds the limit of ${targetPlan.maxEmployees}. If you still want to degrade your plan, please remove or deactivate employees first.`
      });
    }

    const cycle = billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
    const amount = cycle === 'YEARLY' ? targetPlan.priceYearly : targetPlan.priceMonthly;

    let sub = await prisma.subscription.findUnique({ where: { companyId } });

    const now = new Date();
    const endDate = new Date();
    if (cycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    if (!sub) {
      sub = await prisma.subscription.create({
        data: {
          companyId,
          planId: targetPlan.id,
          status: 'ACTIVE',
          billingCycle: cycle,
          startDate: now,
          endDate: endDate,
          trialEndsAt: now
        }
      });
    } else {
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: targetPlan.id,
          status: 'ACTIVE',
          billingCycle: cycle,
          startDate: now,
          endDate: endDate
        }
      });
    }

    // Auto-generate invoice for upgrade
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        subscriptionId: sub.id,
        invoiceNumber,
        amount,
        currency: 'INR',
        status: 'PAID',
        dueDate: now,
        paidAt: now,
        paymentMethod: 'STRIPE'
      }
    });

    res.json({
      message: `Successfully changed plan to ${targetPlan.name}!`,
      subscription: sub,
      invoice,
      newQuota: targetPlan.maxEmployees
    });
  } catch (error) {
    console.error('Error changing company plan:', error);
    res.status(500).json({ message: error.message || 'Failed to update subscription plan' });
  }
}

async function createCompanyWithSubscription(req, res) {
  try {
    const {
      name,
      email,
      subdomain,
      phone,
      password,
      planId,
      planName,
      billingCycle,
      status,
      address,
      industry,
      companySize
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Company Name and Email are required.' });
    }

    let cleanSubdomain = (subdomain || name).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!cleanSubdomain || cleanSubdomain.length < 2) {
      cleanSubdomain = `comp${Date.now().toString().slice(-6)}`;
    }

    // Check if subdomain is already taken; append number if needed
    let finalSubdomain = cleanSubdomain;
    let counter = 2;
    while (true) {
      const taken = await prisma.company.findUnique({ where: { subdomain: finalSubdomain } });
      if (!taken) break;
      finalSubdomain = `${cleanSubdomain}${counter}`;
      counter++;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Find target plan by planId or planName or default to Starter Plan
    let selectedPlan = null;
    if (planId) {
      const pid = parseInt(planId, 10);
      if (!isNaN(pid)) {
        selectedPlan = await prisma.subscriptionPlan.findUnique({ where: { id: pid } });
      }
    }
    if (!selectedPlan && planName) {
      selectedPlan = await prisma.subscriptionPlan.findFirst({
        where: { name: { contains: planName } }
      });
    }
    if (!selectedPlan) {
      selectedPlan = await prisma.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
    }
    if (!selectedPlan) {
      selectedPlan = await prisma.subscriptionPlan.findFirst();
    }

    const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);
    const cycle = (billingCycle === 'YEARLY' || billingCycle === 'Yearly') ? 'YEARLY' : 'MONTHLY';
    const subStatus = (status === 'ACTIVE' || status === 'Active') ? 'ACTIVE' : 'TRIAL';

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { seedDefaultCompanyRoles } = require('../utils/seedDefaultRoles');

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          email,
          subdomain: finalSubdomain,
          phone: phone || null,
          address: address || null,
          industry: industry || null,
          companySize: companySize || null,
          isActive: true,
          isEmailVerified: true
        }
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: `${name} Admin`,
          email,
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          accountStatus: 'ACTIVE'
        }
      });

      await tx.companySetting.create({
        data: { companyId: company.id }
      });

      if (typeof seedDefaultCompanyRoles === 'function') {
        await seedDefaultCompanyRoles(tx, company.id);
      }

      const subscription = await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: selectedPlan.id,
          status: subStatus,
          billingCycle: cycle,
          trialEndsAt
        },
        include: { plan: true }
      });

      return { company, user, subscription };
    });

    res.status(201).json({
      success: true,
      message: `Company "${result.company.name}" created successfully with ${result.subscription.plan.name} (${result.subscription.status}).`,
      company: result.company,
      subscription: result.subscription
    });
  } catch (error) {
    console.error('Error creating company with subscription:', error);
    res.status(500).json({ message: error.message || 'Failed to create company' });
  }
}

async function getSuperAdminCompanies(req, res) {
  try {
    const { search, plan, status, domainStatus } = req.query;

    let whereClause = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subdomain: { contains: search } }
      ];
    }
    if (status === 'Active' || status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'Inactive' || status === 'inactive') {
      whereClause.isActive = false;
    }
    if (domainStatus) {
      whereClause.domainStatus = domainStatus.toUpperCase();
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCompanies = companies.map(comp => {
      const sub = comp.subscription;
      const planName = sub?.plan?.name || 'Starter';
      const cycle = sub?.billingCycle ? ` (${sub.billingCycle.charAt(0) + sub.billingCycle.slice(1).toLowerCase()})` : ' (Monthly)';
      const fullPlanDisplay = `${planName}${cycle}`;

      return {
        id: comp.id,
        name: comp.name,
        email: comp.email,
        subdomain: comp.subdomain,
        accountUrl: `${comp.subdomain}.yourhrms.com`,
        logoUrl: comp.logoUrl,
        plan: fullPlanDisplay,
        planId: sub?.planId,
        planName: planName,
        billingCycle: sub?.billingCycle || 'MONTHLY',
        subscriptionStatus: sub?.status || 'TRIAL',
        createdAt: comp.createdAt,
        isActive: comp.isActive,
        status: comp.isActive ? 'Active' : 'Inactive',
        domainStatus: comp.domainStatus || 'APPROVED',
        userCount: comp._count?.users || 0
      };
    });

    // Stats for dashboard cards
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({ where: { isActive: true } });
    const inactiveCompanies = await prisma.company.count({ where: { isActive: false } });
    const pendingDomains = await prisma.company.count({ where: { domainStatus: 'PENDING' } });

    res.json({
      companies: formattedCompanies,
      stats: {
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        pendingDomains
      }
    });
  } catch (error) {
    console.error('Error in getSuperAdminCompanies:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch companies' });
  }
}

async function updateSuperAdminCompany(req, res) {
  try {
    const { id } = req.params;
    const { name, email, subdomain, phone, address, isActive, domainStatus } = req.body;

    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(subdomain && { subdomain: subdomain.toLowerCase().trim().replace(/[^a-z0-9]/g, '') }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(domainStatus && { domainStatus })
      }
    });

    res.json({ message: 'Company updated successfully', company: updated });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: error.message || 'Failed to update company' });
  }
}

async function deleteSuperAdminCompany(req, res) {
  try {
    const { id } = req.params;
    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false }
    });

    res.json({ message: 'Company deactivated successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: error.message || 'Failed to delete company' });
  }
}

async function getSuperAdminDomains(req, res) {
  try {
    const { status, search } = req.query;

    let whereClause = {};
    if (status && status !== 'all') {
      whereClause.domainStatus = status.toUpperCase();
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subdomain: { contains: search } }
      ];
    }

    const domains = await prisma.company.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedDomains = domains.map(d => ({
      id: d.id,
      companyName: d.name,
      email: d.email,
      domain: `${d.subdomain}.yourhrms.com`,
      subdomain: d.subdomain,
      status: d.domainStatus || 'PENDING',
      isActive: d.isActive,
      createdDate: d.createdAt,
      plan: d.subscription?.plan?.name || 'Starter'
    }));

    res.json({ domains: formattedDomains });
  } catch (error) {
    console.error('Error fetching domain requests:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch domain requests' });
  }
}

async function updateDomainStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const newStatus = status ? status.toUpperCase() : 'APPROVED';
    const isApproved = newStatus === 'APPROVED';

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        domainStatus: newStatus,
        isActive: isApproved
      }
    });

    if (isApproved && !company.subscription) {
      let starterPlan = await prisma.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
      if (!starterPlan) {
        starterPlan = await prisma.subscriptionPlan.findFirst();
      }

      if (starterPlan) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        await prisma.subscription.create({
          data: {
            companyId: company.id,
            planId: starterPlan.id,
            status: 'TRIAL',
            billingCycle: 'MONTHLY',
            trialEndsAt
          }
        });
      }
    }

    res.json({
      message: `Domain request ${newStatus.toLowerCase()} successfully`,
      company: updatedCompany
    });
  } catch (error) {
    console.error('Error updating domain status:', error);
    res.status(500).json({ message: error.message || 'Failed to update domain status' });
  }
}

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  updateCompanySubscription,
  updateCompanyFeatures,
  extendTrial,
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getCompanySubscription,
  getDashboardSummary,
  changeCompanyPlan,
  createCompanyWithSubscription,
  getSuperAdminCompanies,
  updateSuperAdminCompany,
  deleteSuperAdminCompany,
  getSuperAdminDomains,
  updateDomainStatus
};
