/**
 * @fileoverview Finance Data Access Object (DAO).
 *
 * Responsibility: ALL and ONLY database operations for the financial
 * ledger models (FinancialReport, IncomeRecord, ExpenseRecord,
 * LiabilityRecord, ReceivableRecord).
 *
 * Architecture follows the same pattern as UserDAO:
 *   Controller → Service (business logic) → DAO (DB queries) → Prisma → PostgreSQL
 *
 * All write operations that touch multiple tables use `prisma.$transaction()`
 * to guarantee atomicity — a report is never created with partial line items.
 *
 * @module finance-service/dao
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  ExpenseCategoryGroup,
  ExpenseStatus,
  IncomeCategory,
  LiabilityStatus,
  Prisma,
  ReceivableStatus,
  ReportStatus,
} from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

// ─────────────────────────────────────────────────────────────────────────────
// SELECT PROJECTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal fields for listing reports (no line items). */
const REPORT_SUMMARY_SELECT = {
  id: true,
  organization: true,
  report_title: true,
  period: true,
  month: true,
  year: true,
  status: true,
  drive_verification_url: true,
  total_income_bdt: true,
  total_expenses_bdt: true,
  net_balance_bdt: true,
  sub_total_income_bdt: true,
  total_liabilities_bdt: true,
  total_receivables_bdt: true,
  net_remaining_fund_balance_bdt: true,
  reconciliation_notes: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.FinancialReportSelect;

/** Full report including all nested line-item relations. */
const REPORT_FULL_SELECT = {
  ...REPORT_SUMMARY_SELECT,
  income_records: {
    orderBy: { date: 'asc' as const },
  },
  expense_records: {
    orderBy: { date: 'asc' as const },
  },
  liability_records: {
    orderBy: { created_at: 'asc' as const },
  },
  receivable_records: {
    orderBy: { created_at: 'asc' as const },
  },
} satisfies Prisma.FinancialReportSelect;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Report with summary fields only (no line items). Returned by `findAll`. */
export type ReportSummary = Prisma.FinancialReportGetPayload<{
  select: typeof REPORT_SUMMARY_SELECT;
}>;

/** Full report with all nested line-item relations. */
export type FullReport = Prisma.FinancialReportGetPayload<{
  select: typeof REPORT_FULL_SELECT;
}>;

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateIncomeLine {
  source: string;
  category: IncomeCategory;
  amount_bdt: number;
  currency_meta?: {
    originalCurrency?: string;
    originalAmount?: number;
    exchangeRateEstimated?: number;
    incentivesOrNotes?: string;
  } | null;
  notes?: string;
  date: Date;
  verified?: boolean;
}

export interface CreateExpenseLine {
  category_title: string;
  category_group: ExpenseCategoryGroup;
  amount_bdt: number;
  payment_method: string;
  payment_method_type?: string;
  remaining_liability_bdt?: number;
  notes?: string;
  status: ExpenseStatus;
  date: Date;
  verified?: boolean;
}

export interface CreateLiabilityLine {
  description: string;
  vendor_or_creditor: string;
  total_initial_bdt: number;
  paid_bdt: number;
  remaining_due_bdt: number;
  status: LiabilityStatus;
  notes?: string;
  due_date?: string;
}

export interface CreateReceivableLine {
  description: string;
  debtor_or_source: string;
  total_receivable_bdt: number;
  repayment_plan: string;
  status: ReceivableStatus;
  notes?: string;
}

export interface CreateReportData {
  organization: string;
  report_title: string;
  period: string;
  month: string;
  year: number;
  status: ReportStatus;
  drive_verification_url?: string;
  total_income_bdt: number;
  total_expenses_bdt: number;
  net_balance_bdt: number;
  sub_total_income_bdt: number;
  total_liabilities_bdt: number;
  total_receivables_bdt: number;
  net_remaining_fund_balance_bdt: number;
  reconciliation_notes?: string;
  income_records?: CreateIncomeLine[];
  expense_records?: CreateExpenseLine[];
  liability_records?: CreateLiabilityLine[];
  receivable_records?: CreateReceivableLine[];
}

export type UpdateReportData = Partial<
  Pick<
    CreateReportData,
    | 'status'
    | 'drive_verification_url'
    | 'reconciliation_notes'
    | 'total_income_bdt'
    | 'total_expenses_bdt'
    | 'net_balance_bdt'
    | 'sub_total_income_bdt'
    | 'total_liabilities_bdt'
    | 'total_receivables_bdt'
    | 'net_remaining_fund_balance_bdt'
  >
>;

// ─────────────────────────────────────────────────────────────────────────────
// DAO
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class FinanceDAO {
  private readonly logger = new Logger(FinanceDAO.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ─────────────────────────────────────────────────────────────────

  /**
   * Return a summary list of all monthly reports, ordered newest first.
   * Line items are NOT loaded here — use `findById` for the full shape.
   */
  async findAll(): Promise<ReportSummary[]> {
    return this.prisma.financialReport.findMany({
      select: REPORT_SUMMARY_SELECT,
      orderBy: [{ year: 'desc' }, { month: 'asc' }],
    });
  }

  /**
   * Return a single report by UUID with all line-item relations.
   * Returns `null` when not found.
   */
  async findById(id: string): Promise<FullReport | null> {
    return this.prisma.financialReport.findUnique({
      where: { id },
      select: REPORT_FULL_SELECT,
    });
  }

  /**
   * Return a single report by month+year slug (e.g. "August", 2026).
   * Returns `null` when not found.
   */
  async findByMonthYear(month: string, year: number): Promise<FullReport | null> {
    return this.prisma.financialReport.findUnique({
      where: { month_year: { month, year } },
      select: REPORT_FULL_SELECT,
    });
  }

  /**
   * Returns `true` if a report for the given month/year already exists.
   * Used for idempotent seeding.
   */
  async existsByMonthYear(month: string, year: number): Promise<boolean> {
    const count = await this.prisma.financialReport.count({
      where: { month, year },
    });
    return count > 0;
  }

  // ── Writes ────────────────────────────────────────────────────────────────

  /**
   * Create a full report with all its nested line items in a single atomic
   * database transaction. If any part fails, the entire write is rolled back.
   */
  async create(data: CreateReportData): Promise<FullReport> {
    const {
      income_records,
      expense_records,
      liability_records,
      receivable_records,
      ...reportFields
    } = data;

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.financialReport.create({
        data: {
          ...reportFields,
          income_records: income_records?.length
            ? {
                create: income_records.map((item) => ({
                  ...item,
                  currency_meta: item.currency_meta
                    ? (item.currency_meta as Prisma.InputJsonValue)
                    : undefined,
                })),
              }
            : undefined,
          expense_records: expense_records?.length
            ? { create: expense_records }
            : undefined,
          liability_records: liability_records?.length
            ? { create: liability_records }
            : undefined,
          receivable_records: receivable_records?.length
            ? { create: receivable_records }
            : undefined,
        },
        select: REPORT_FULL_SELECT,
      });

      this.logger.log(
        `Created financial report [${report.month} ${report.year}] id=${report.id}`,
      );

      return report as unknown as FullReport;
    });
  }

  /**
   * Update report-level metadata fields (status, notes, totals).
   * Line items are managed separately — use dedicated income/expense
   * endpoints for those when they are added.
   */
  async update(id: string, data: UpdateReportData): Promise<ReportSummary> {
    return this.prisma.financialReport.update({
      where: { id },
      data,
      select: REPORT_SUMMARY_SELECT,
    });
  }
}
