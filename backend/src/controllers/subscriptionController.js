// backend/src/controllers/subscriptionController.js
const prisma = require('../config/prisma');

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
      features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]'),
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

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || '',
        priceMonthly: parseFloat(priceMonthly),
        priceYearly: parseFloat(priceYearly),
        maxEmployees: maxEmployees ? parseInt(maxEmployees, 10) : 10,
        maxStorageGb: maxStorageGb ? parseFloat(maxStorageGb) : 5.0,
        features: Array.isArray(features) ? features : [],
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
    if (features !== undefined) dataToUpdate.features = Array.isArray(features) ? features : [];
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
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company scope found for user' });
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
        features: Array.isArray(sub.plan.features) ? sub.plan.features : JSON.parse(sub.plan.features || '[]')
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
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company scope found for user' });
    }

    const { planId, billingCycle } = req.body;
    const targetPlanId = parseInt(planId, 10);
    if (isNaN(targetPlanId)) {
      return res.status(400).json({ message: 'Target plan ID is required' });
    }

    const targetPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: targetPlanId }
    });

    if (!targetPlan || !targetPlan.isActive) {
      return res.status(404).json({ message: 'Selected plan is inactive or not found' });
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
      message: `Successfully upgraded to ${targetPlan.name}!`,
      subscription: sub,
      invoice,
      newQuota: targetPlan.maxEmployees
    });
  } catch (error) {
    console.error('Error changing company plan:', error);
    res.status(500).json({ message: 'Failed to upgrade subscription plan' });
  }
}

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  updateCompanySubscription,
  extendTrial,
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getCompanySubscription,
  getDashboardSummary,
  changeCompanyPlan
};
