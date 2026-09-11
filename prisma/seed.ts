/**
 * @fileoverview Prisma seed script (entrypoint).
 *
 * Bootstraps three dev-only accounts, one per role, so you can log in and
 * exercise the API immediately after `npm run setup`. All three share the
 * password `12345678` and are pre-verified (`acc_verified: true`) so you can
 * skip the OTP step during local development.
 *
 * Also seeds the August 2026 Financial Report so the dashboard always has
 * data on first boot. This seed is idempotent — safe to re-run.
 *
 * DEV ONLY — this script no-ops entirely when `NODE_ENV=production` so it can
 * never accidentally create default credentials in a real environment.
 *
 * Execution:
 *   npm run prisma:seed
 *
 * Safety:
 *   - Idempotent: upsert-based, safe to re-run
 *   - No destructive operations (no deletes)
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_USERS = [
  { name: 'System Admin', email: 'admin@example.com', role: UserRole.ADMIN },
  { name: 'Shop Owner', email: 'shopowner@example.com', role: UserRole.SHOP_OWNER },
  { name: 'Customer', email: 'customer@example.com', role: UserRole.CUSTOMER },
] as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.log('⏭️  Skipping seed — NODE_ENV=production.');
    return;
  }

  const hashedPassword = await bcrypt.hash('12345678', 10);

  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        acc_verified: true,
      },
    });
    console.log(`👤 Seeded ${user.role} → ${user.email} (password: 12345678)`);
  }

  // ── August 2026 Financial Report ─────────────────────────────────────────
  // Idempotent: only creates if the record does not already exist.
  const existing = await prisma.financialReport.count({
    where: { month: 'August', year: 2026 },
  });

  if (existing === 0) {
    await prisma.financialReport.create({
      data: {
        organization: 'ZENTURA FINANCE',
        report_title: 'Financial Performance Report - August 2026',
        period: 'August 1, 2026 – August 31, 2026',
        month: 'August',
        year: 2026,
        status: 'AUDITED',
        drive_verification_url:
          'https://drive.google.com/drive/folders/1eUTQMU0rfQftTwfREf9-FzVcfNFLHyGM?usp=drive_link',
        total_income_bdt: 619987.5,
        total_expenses_bdt: 453822.1,
        net_balance_bdt: 166165.4,
        sub_total_income_bdt: 619987.5,
        total_liabilities_bdt: 155500.0,
        total_receivables_bdt: 42500.0,
        net_remaining_fund_balance_bdt: 171165.4,
        reconciliation_notes:
          'The net remaining fund balance as of August 2026 is 1,71,165.40 BDT. This reflects verified bank & cash holdings after all recorded transactions and petty adjustments.',
        income_records: {
          create: [
            {
              source: 'Opening Balance (Existing Fund)',
              category: 'RETAINED_FUND',
              amount_bdt: 164886.4,
              notes: 'Carried forward cash reserve from previous fiscal cycle',
              date: new Date('2026-08-01'),
              verified: true,
            },
            {
              source: 'Gavin (2000 GBP + Incentives)',
              category: 'CLIENT_RETAINER',
              amount_bdt: 339111.01,
              currency_meta: {
                originalCurrency: 'GBP',
                originalAmount: 2000,
                exchangeRateEstimated: 169.55,
                incentivesOrNotes:
                  'Base retainer 2000 GBP plus milestone performance incentives',
              },
              notes: 'Primary international client direct wire transfer',
              date: new Date('2026-08-05'),
              verified: true,
            },
            {
              source: 'Fiverr Withdrawal (Tamim) - $645',
              category: 'FREELANCE_ESCROW',
              amount_bdt: 76682.11,
              currency_meta: {
                originalCurrency: 'USD',
                originalAmount: 645,
                exchangeRateEstimated: 118.89,
                incentivesOrNotes: 'Tamim Fiverr account payout via Payoneer/Bank',
              },
              notes: 'Platform freelance client deliverables payout',
              date: new Date('2026-08-12'),
              verified: true,
            },
            {
              source: 'Gavin Tips (100 GBP + Incentive)',
              category: 'BONUS_AND_TIPS',
              amount_bdt: 17095.98,
              currency_meta: {
                originalCurrency: 'GBP',
                originalAmount: 100,
                exchangeRateEstimated: 170.96,
                incentivesOrNotes:
                  'Client discretionary tip & performance incentive payout',
              },
              notes: 'Extra appreciation bonus for sprint speed',
              date: new Date('2026-08-18'),
              verified: true,
            },
            {
              source: 'Wordpress Project Half Payment (Dipu)',
              category: 'PROJECT_MILESTONE',
              amount_bdt: 7500.0,
              notes:
                'Initial 50% milestone advance payment from Dipu. Remaining 50% (7,500 BDT) is an outstanding receivable.',
              date: new Date('2026-08-22'),
              verified: true,
            },
            {
              source: 'Fiverr Withdrawal (Ishrat) - $125',
              category: 'FREELANCE_ESCROW',
              amount_bdt: 14712.0,
              currency_meta: {
                originalCurrency: 'USD',
                originalAmount: 125,
                exchangeRateEstimated: 117.7,
                incentivesOrNotes: 'Ishrat Fiverr account payout',
              },
              notes: 'Design & branding freelance client deliverables payout',
              date: new Date('2026-08-27'),
              verified: true,
            },
          ],
        },
        expense_records: {
          create: [
            {
              category_title: 'Profit Share (Saad)',
              category_group: 'PROFIT_SHARE',
              amount_bdt: 25000.0,
              payment_method: 'Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'August executive profit disbursement transferred via online banking',
              status: 'COMPLETED',
              date: new Date('2026-08-10'),
              verified: true,
            },
            {
              category_title: 'Profit Share (Tamim)',
              category_group: 'PROFIT_SHARE',
              amount_bdt: 25000.0,
              payment_method: 'Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'August executive profit disbursement transferred via online banking',
              status: 'COMPLETED',
              date: new Date('2026-08-10'),
              verified: true,
            },
            {
              category_title: 'Profit Share (Joy)',
              category_group: 'PROFIT_SHARE',
              amount_bdt: 25000.0,
              payment_method: 'Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'August executive profit disbursement transferred via online banking',
              status: 'COMPLETED',
              date: new Date('2026-08-10'),
              verified: true,
            },
            {
              category_title: 'Profit Share (Ishrat)',
              category_group: 'PROFIT_SHARE',
              amount_bdt: 25000.0,
              payment_method: 'Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'August executive profit disbursement transferred via online banking',
              status: 'COMPLETED',
              date: new Date('2026-08-10'),
              verified: true,
            },
            {
              category_title: 'Macbook Advance Payment (2 units)',
              category_group: 'CAPITAL_ASSETS',
              amount_bdt: 255500.0,
              payment_method: 'Bank / Vendor Direct',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'Amount left 1,55,500 BDT (Remaining liability due to hardware vendor)',
              remaining_liability_bdt: 155500.0,
              status: 'PARTIALLY_PAID',
              date: new Date('2026-08-14'),
              verified: true,
            },
            {
              category_title: "Saad Rayhan's Money Back (Completed)",
              category_group: 'DEBT_SETTLEMENT',
              amount_bdt: 40000.0,
              payment_method: 'Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes: 'Full settlement of prior short-term loan/capital advance. Debt cleared.',
              status: 'COMPLETED',
              date: new Date('2026-08-15'),
              verified: true,
            },
            {
              category_title: 'Fiverr Investment ($40+$50)',
              category_group: 'MARKETING_AND_GROWTH',
              amount_bdt: 13950.0,
              payment_method: 'Card / Digital Escrow',
              payment_method_type: 'CARD',
              notes: 'Promoted gigs & agency account growth ads ($40 + $50 = $90 total)',
              status: 'COMPLETED',
              date: new Date('2026-08-17'),
              verified: true,
            },
            {
              category_title: 'Makibul Tamim Advance (Profit Deduction)',
              category_group: 'TEAM_ADVANCES',
              amount_bdt: 35000.0,
              payment_method: 'Direct Bank Transfer',
              payment_method_type: 'BANK_TRANSFER',
              notes:
                'Outstanding Receivable (Repayment Plan: Monthly deduction from future profit share)',
              status: 'ADVANCE_RECEIVABLE',
              date: new Date('2026-08-20'),
              verified: true,
            },
            {
              category_title: 'Software (Claude & Gemini Dual)',
              category_group: 'SOFTWARE_AND_SAAS',
              amount_bdt: 2977.4,
              payment_method: 'Card / Virtual Visa',
              payment_method_type: 'CARD',
              notes:
                'Dual AI developer subscriptions for daily engineering workflow & automation',
              status: 'RECURRING',
              date: new Date('2026-08-03'),
              verified: true,
            },
            {
              category_title: 'Khana Pina (Consolidated 1, 2, 3)',
              category_group: 'OFFICE_AND_FOOD',
              amount_bdt: 4141.0,
              payment_method: 'Cash / Mobile Banking',
              payment_method_type: 'CASH',
              notes:
                'Consolidated office meal, refreshments, snacks, and team lunch vouchers across 3 phases',
              status: 'COMPLETED',
              date: new Date('2026-08-25'),
              verified: true,
            },
            {
              category_title: 'Google Workspace',
              category_group: 'SOFTWARE_AND_SAAS',
              amount_bdt: 1082.7,
              payment_method: 'Card Auto-Debit',
              payment_method_type: 'CARD',
              notes:
                'Enterprise business email, Drive storage, and security domain management',
              status: 'RECURRING',
              date: new Date('2026-08-02'),
              verified: true,
            },
            {
              category_title: 'Operational (Meeting, Bazar, NPSB)',
              category_group: 'OPERATIONS_AND_BANKING',
              amount_bdt: 1170.0,
              payment_method: 'Cash / NPSB Charges',
              payment_method_type: 'CASH',
              notes:
                'Strategic meeting logistics, office supplies bazaar, and interbank NPSB routing fees',
              status: 'COMPLETED',
              date: new Date('2026-08-28'),
              verified: true,
            },
          ],
        },
        liability_records: {
          create: [
            {
              description: 'Macbook Advance Payment (Remaining)',
              vendor_or_creditor: 'Apple Hardware Authorized Partner',
              total_initial_bdt: 411000.0,
              paid_bdt: 255500.0,
              remaining_due_bdt: 155500.0,
              status: 'DUE',
              notes:
                'Outstanding payment balance on 2 units of developer Macbook Pro machines.',
              due_date: 'September 2026',
            },
          ],
        },
        receivable_records: {
          create: [
            {
              description: 'Makibul Tamim Advance (Profit Deduction)',
              debtor_or_source: 'Makibul Tamim',
              total_receivable_bdt: 35000.0,
              repayment_plan: 'Monthly deduction from future profit share distribution',
              status: 'IN_PROGRESS',
              notes:
                'Recognized as an outstanding asset receivable to be recovered over coming cycles.',
            },
            {
              description: 'Wordpress Project Half Payment (Dipu)',
              debtor_or_source: 'Dipu (Client Project)',
              total_receivable_bdt: 7500.0,
              repayment_plan: 'Milestone 2 handover upon final production delivery',
              status: 'PENDING',
              notes: '50% remaining project compensation upon client approval.',
            },
          ],
        },
      },
    });
    console.log('📊 Seeded August 2026 financial report');
  } else {
    console.log('📊 August 2026 report already exists — skipping.');
  }

  console.log('✅ Database seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
