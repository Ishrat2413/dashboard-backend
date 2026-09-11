/**
 * @fileoverview Finance service — orchestration layer over FinanceDAO.
 *
 * Business logic only. All DB queries are delegated to FinanceDAO.
 * The service maps Prisma Decimal values to plain JavaScript numbers
 * so the controller / frontend always receives a simple JSON payload.
 *
 * @module finance-service
 */
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategoryGroup, ExpenseStatus, IncomeCategory, LiabilityStatus, ReceivableStatus, ReportStatus } from '@prisma/client';
import {
  FinanceDAO,
  FullReport,
  ReportSummary,
} from './dao/finance.dao';
import { CreateReportDto, UpdateReportDto } from './dto/validation/finance.dto';

// ─── Message constants ────────────────────────────────────────────────────────

const M = {
  REPORT_NOT_FOUND: 'Financial report not found.',
  REPORT_CONFLICT: 'A report for this month and year already exists.',
  REPORTS_RETRIEVED: 'Reports retrieved successfully.',
  REPORT_RETRIEVED: 'Report retrieved successfully.',
  REPORT_CREATED: 'Report created successfully.',
  REPORT_UPDATED: 'Report updated successfully.',
} as const;

// ─── Decimal mapper ───────────────────────────────────────────────────────────

/**
 * Convert a Prisma Decimal (or null/undefined) to a plain JS number.
 * All monetary fields in Prisma are `Decimal` — the JSON serialiser
 * would render them as strings without this conversion.
 */
function toNum(val: { toNumber(): number } | null | undefined): number {
  return val ? val.toNumber() : 0;
}

/**
 * Map a raw FinanceDAO `FullReport` to a plain serialisable object.
 * Decimal fields are converted to `number`, everything else is passed through.
 */
function mapFullReport(r: FullReport) {
  return {
    id: r.id,
    organization: r.organization,
    report_title: r.report_title,
    period: r.period,
    month: r.month,
    year: r.year,
    status: r.status,
    drive_verification_url: r.drive_verification_url,
    total_income_bdt: toNum(r.total_income_bdt as any),
    total_expenses_bdt: toNum(r.total_expenses_bdt as any),
    net_balance_bdt: toNum(r.net_balance_bdt as any),
    sub_total_income_bdt: toNum(r.sub_total_income_bdt as any),
    total_liabilities_bdt: toNum(r.total_liabilities_bdt as any),
    total_receivables_bdt: toNum(r.total_receivables_bdt as any),
    net_remaining_fund_balance_bdt: toNum(r.net_remaining_fund_balance_bdt as any),
    reconciliation_notes: r.reconciliation_notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    income_records: r.income_records.map((inc) => ({
      id: inc.id,
      source: inc.source,
      category: inc.category,
      amount_bdt: toNum(inc.amount_bdt as any),
      currency_meta: inc.currency_meta,
      notes: inc.notes,
      date: inc.date,
      verified: inc.verified,
    })),
    expense_records: r.expense_records.map((exp) => ({
      id: exp.id,
      category_title: exp.category_title,
      category_group: exp.category_group,
      amount_bdt: toNum(exp.amount_bdt as any),
      payment_method: exp.payment_method,
      payment_method_type: exp.payment_method_type,
      remaining_liability_bdt: exp.remaining_liability_bdt
        ? toNum(exp.remaining_liability_bdt as any)
        : undefined,
      notes: exp.notes,
      status: exp.status,
      date: exp.date,
      verified: exp.verified,
    })),
    liability_records: r.liability_records.map((lib) => ({
      id: lib.id,
      description: lib.description,
      vendor_or_creditor: lib.vendor_or_creditor,
      total_initial_bdt: toNum(lib.total_initial_bdt as any),
      paid_bdt: toNum(lib.paid_bdt as any),
      remaining_due_bdt: toNum(lib.remaining_due_bdt as any),
      status: lib.status,
      notes: lib.notes,
      due_date: lib.due_date,
    })),
    receivable_records: r.receivable_records.map((rec) => ({
      id: rec.id,
      description: rec.description,
      debtor_or_source: rec.debtor_or_source,
      total_receivable_bdt: toNum(rec.total_receivable_bdt as any),
      repayment_plan: rec.repayment_plan,
      status: rec.status,
      notes: rec.notes,
    })),
  };
}

function mapSummary(r: ReportSummary) {
  return {
    id: r.id,
    organization: r.organization,
    report_title: r.report_title,
    period: r.period,
    month: r.month,
    year: r.year,
    status: r.status,
    drive_verification_url: r.drive_verification_url,
    total_income_bdt: toNum(r.total_income_bdt as any),
    total_expenses_bdt: toNum(r.total_expenses_bdt as any),
    net_balance_bdt: toNum(r.net_balance_bdt as any),
    sub_total_income_bdt: toNum(r.sub_total_income_bdt as any),
    total_liabilities_bdt: toNum(r.total_liabilities_bdt as any),
    total_receivables_bdt: toNum(r.total_receivables_bdt as any),
    net_remaining_fund_balance_bdt: toNum(r.net_remaining_fund_balance_bdt as any),
    reconciliation_notes: r.reconciliation_notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly financeDAO: FinanceDAO) {}

  // ── Reads ─────────────────────────────────────────────────────────────────

  async getReports() {
    const reports = await this.financeDAO.findAll();
    return {
      message: M.REPORTS_RETRIEVED,
      data: reports.map(mapSummary),
    };
  }

  async getReportById(id: string) {
    const report = await this.financeDAO.findById(id);
    if (!report) throw new NotFoundException(M.REPORT_NOT_FOUND);
    return {
      message: M.REPORT_RETRIEVED,
      data: mapFullReport(report),
    };
  }

  async getReportByMonthYear(month: string, year: number) {
    // Normalise month to Title Case ("august" → "August")
    const normalisedMonth =
      month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    const report = await this.financeDAO.findByMonthYear(normalisedMonth, year);
    if (!report) throw new NotFoundException(M.REPORT_NOT_FOUND);
    return {
      message: M.REPORT_RETRIEVED,
      data: mapFullReport(report),
    };
  }

  // ── Writes ────────────────────────────────────────────────────────────────

  async createReport(dto: CreateReportDto) {
    // Guard: no duplicate month/year pairs
    const exists = await this.financeDAO.existsByMonthYear(dto.month, dto.year);
    if (exists) throw new ConflictException(M.REPORT_CONFLICT);

    const report = await this.financeDAO.create({
      ...dto,
      income_records: dto.income_records?.map((inc) => ({
        ...inc,
        date: new Date(inc.date),
        verified: inc.verified ?? false,
      })),
      expense_records: dto.expense_records?.map((exp) => ({
        ...exp,
        date: new Date(exp.date),
        verified: exp.verified ?? false,
      })),
      liability_records: dto.liability_records,
      receivable_records: dto.receivable_records,
    });

    return {
      message: M.REPORT_CREATED,
      data: mapFullReport(report),
    };
  }

  async updateReport(id: string, dto: UpdateReportDto) {
    const exists = await this.financeDAO.findById(id);
    if (!exists) throw new NotFoundException(M.REPORT_NOT_FOUND);
    const updated = await this.financeDAO.update(id, dto);
    return {
      message: M.REPORT_UPDATED,
      data: mapSummary(updated),
    };
  }

  // ── Seed ─────────────────────────────────────────────────────────────────

  /**
   * Idempotent seed of the August 2026 report.
   * Safe to call on every application startup — if the record already
   * exists, this is a no-op. Called from the Prisma seed script in
   * development to ensure the dashboard always has data.
   */
  async seedAugustReport(): Promise<void> {
    const exists = await this.financeDAO.existsByMonthYear('August', 2026);
    if (exists) {
      this.logger.log('August 2026 seed report already exists — skipping.');
      return;
    }

    await this.financeDAO.create({
      organization: 'ZENTURA FINANCE',
      report_title: 'Financial Performance Report - August 2026',
      period: 'August 1, 2026 – August 31, 2026',
      month: 'August',
      year: 2026,
      status: ReportStatus.AUDITED,
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
      income_records: [
        {
          source: 'Opening Balance (Existing Fund)',
          category: IncomeCategory.RETAINED_FUND,
          amount_bdt: 164886.4,
          notes: 'Carried forward cash reserve from previous fiscal cycle',
          date: new Date('2026-08-01'),
          verified: true,
        },
        {
          source: 'Gavin (2000 GBP + Incentives)',
          category: IncomeCategory.CLIENT_RETAINER,
          amount_bdt: 339111.01,
          currency_meta: {
            originalCurrency: 'GBP',
            originalAmount: 2000,
            exchangeRateEstimated: 169.55,
            incentivesOrNotes: 'Base retainer 2000 GBP plus milestone performance incentives',
          },
          notes: 'Primary international client direct wire transfer',
          date: new Date('2026-08-05'),
          verified: true,
        },
        {
          source: 'Fiverr Withdrawal (Tamim) - $645',
          category: IncomeCategory.FREELANCE_ESCROW,
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
          category: IncomeCategory.BONUS_AND_TIPS,
          amount_bdt: 17095.98,
          currency_meta: {
            originalCurrency: 'GBP',
            originalAmount: 100,
            exchangeRateEstimated: 170.96,
            incentivesOrNotes: 'Client discretionary tip & performance incentive payout',
          },
          notes: 'Extra appreciation bonus for sprint speed',
          date: new Date('2026-08-18'),
          verified: true,
        },
        {
          source: 'Wordpress Project Half Payment (Dipu)',
          category: IncomeCategory.PROJECT_MILESTONE,
          amount_bdt: 7500.0,
          notes: 'Initial 50% milestone advance payment from Dipu. Remaining 50% (7,500 BDT) is an outstanding receivable.',
          date: new Date('2026-08-22'),
          verified: true,
        },
        {
          source: 'Fiverr Withdrawal (Ishrat) - $125',
          category: IncomeCategory.FREELANCE_ESCROW,
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
      expense_records: [
        {
          category_title: 'Profit Share (Saad)',
          category_group: ExpenseCategoryGroup.PROFIT_SHARE,
          amount_bdt: 25000.0,
          payment_method: 'Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'August executive profit disbursement transferred via online banking',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-10'),
          verified: true,
        },
        {
          category_title: 'Profit Share (Tamim)',
          category_group: ExpenseCategoryGroup.PROFIT_SHARE,
          amount_bdt: 25000.0,
          payment_method: 'Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'August executive profit disbursement transferred via online banking',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-10'),
          verified: true,
        },
        {
          category_title: 'Profit Share (Joy)',
          category_group: ExpenseCategoryGroup.PROFIT_SHARE,
          amount_bdt: 25000.0,
          payment_method: 'Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'August executive profit disbursement transferred via online banking',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-10'),
          verified: true,
        },
        {
          category_title: 'Profit Share (Ishrat)',
          category_group: ExpenseCategoryGroup.PROFIT_SHARE,
          amount_bdt: 25000.0,
          payment_method: 'Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'August executive profit disbursement transferred via online banking',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-10'),
          verified: true,
        },
        {
          category_title: 'Macbook Advance Payment (2 units)',
          category_group: ExpenseCategoryGroup.CAPITAL_ASSETS,
          amount_bdt: 255500.0,
          payment_method: 'Bank / Vendor Direct',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'Amount left 1,55,500 BDT (Remaining liability due to hardware vendor)',
          remaining_liability_bdt: 155500.0,
          status: ExpenseStatus.PARTIALLY_PAID,
          date: new Date('2026-08-14'),
          verified: true,
        },
        {
          category_title: "Saad Rayhan's Money Back (Completed)",
          category_group: ExpenseCategoryGroup.DEBT_SETTLEMENT,
          amount_bdt: 40000.0,
          payment_method: 'Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'Full settlement of prior short-term loan/capital advance. Debt cleared.',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-15'),
          verified: true,
        },
        {
          category_title: 'Fiverr Investment ($40+$50)',
          category_group: ExpenseCategoryGroup.MARKETING_AND_GROWTH,
          amount_bdt: 13950.0,
          payment_method: 'Card / Digital Escrow',
          payment_method_type: 'CARD',
          notes: 'Promoted gigs & agency account growth ads ($40 + $50 = $90 total)',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-17'),
          verified: true,
        },
        {
          category_title: 'Makibul Tamim Advance (Profit Deduction)',
          category_group: ExpenseCategoryGroup.TEAM_ADVANCES,
          amount_bdt: 35000.0,
          payment_method: 'Direct Bank Transfer',
          payment_method_type: 'BANK_TRANSFER',
          notes: 'Outstanding Receivable (Repayment Plan: Monthly deduction from future profit share)',
          status: ExpenseStatus.ADVANCE_RECEIVABLE,
          date: new Date('2026-08-20'),
          verified: true,
        },
        {
          category_title: 'Software (Claude & Gemini Dual)',
          category_group: ExpenseCategoryGroup.SOFTWARE_AND_SAAS,
          amount_bdt: 2977.4,
          payment_method: 'Card / Virtual Visa',
          payment_method_type: 'CARD',
          notes: 'Dual AI developer subscriptions for daily engineering workflow & automation',
          status: ExpenseStatus.RECURRING,
          date: new Date('2026-08-03'),
          verified: true,
        },
        {
          category_title: 'Khana Pina (Consolidated 1, 2, 3)',
          category_group: ExpenseCategoryGroup.OFFICE_AND_FOOD,
          amount_bdt: 4141.0,
          payment_method: 'Cash / Mobile Banking',
          payment_method_type: 'CASH',
          notes: 'Consolidated office meal, refreshments, snacks, and team lunch vouchers across 3 phases',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-25'),
          verified: true,
        },
        {
          category_title: 'Google Workspace',
          category_group: ExpenseCategoryGroup.SOFTWARE_AND_SAAS,
          amount_bdt: 1082.7,
          payment_method: 'Card Auto-Debit',
          payment_method_type: 'CARD',
          notes: 'Enterprise business email, Drive storage, and security domain management',
          status: ExpenseStatus.RECURRING,
          date: new Date('2026-08-02'),
          verified: true,
        },
        {
          category_title: 'Operational (Meeting, Bazar, NPSB)',
          category_group: ExpenseCategoryGroup.OPERATIONS_AND_BANKING,
          amount_bdt: 1170.0,
          payment_method: 'Cash / NPSB Charges',
          payment_method_type: 'CASH',
          notes: 'Strategic meeting logistics, office supplies bazaar, and interbank NPSB routing fees',
          status: ExpenseStatus.COMPLETED,
          date: new Date('2026-08-28'),
          verified: true,
        },
      ],
      liability_records: [
        {
          description: 'Macbook Advance Payment (Remaining)',
          vendor_or_creditor: 'Apple Hardware Authorized Partner',
          total_initial_bdt: 411000.0,
          paid_bdt: 255500.0,
          remaining_due_bdt: 155500.0,
          status: LiabilityStatus.DUE,
          notes: 'Outstanding payment balance on 2 units of developer Macbook Pro machines.',
          due_date: 'September 2026',
        },
      ],
      receivable_records: [
        {
          description: 'Makibul Tamim Advance (Profit Deduction)',
          debtor_or_source: 'Makibul Tamim',
          total_receivable_bdt: 35000.0,
          repayment_plan: 'Monthly deduction from future profit share distribution',
          status: ReceivableStatus.IN_PROGRESS,
          notes: 'Recognized as an outstanding asset receivable to be recovered over coming cycles.',
        },
        {
          description: 'Wordpress Project Half Payment (Dipu)',
          debtor_or_source: 'Dipu (Client Project)',
          total_receivable_bdt: 7500.0,
          repayment_plan: 'Milestone 2 handover upon final production delivery',
          status: ReceivableStatus.PENDING,
          notes: '50% remaining project compensation upon client approval.',
        },
      ],
    });

    this.logger.log('August 2026 seed report created successfully.');
  }
}
