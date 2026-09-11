/**
 * @fileoverview Swagger success-response DTOs for finance-service endpoints.
 *
 * @module finance-service/dto/success
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuccessResponseDto } from 'src/common/dto/success-response.dto';
import { Methods } from 'src/common/enum/methods.enum';

// ─── Nested data shapes ───────────────────────────────────────────────────────

export class IncomeRecordDataDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id!: string;

  @ApiProperty({ example: 'Gavin (2000 GBP + Incentives)' })
  source!: string;

  @ApiProperty({ example: 'CLIENT_RETAINER' })
  category!: string;

  @ApiProperty({ example: 339111.01 })
  amount_bdt!: number;

  @ApiPropertyOptional({ example: { originalCurrency: 'GBP', originalAmount: 2000 } })
  currency_meta?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Primary international client wire transfer' })
  notes?: string;

  @ApiProperty({ example: '2026-08-05T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ example: true })
  verified!: boolean;
}

export class ExpenseRecordDataDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id!: string;

  @ApiProperty({ example: 'Profit Share (Saad)' })
  category_title!: string;

  @ApiProperty({ example: 'PROFIT_SHARE' })
  category_group!: string;

  @ApiProperty({ example: 25000 })
  amount_bdt!: number;

  @ApiProperty({ example: 'Bank Transfer' })
  payment_method!: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
  payment_method_type?: string;

  @ApiPropertyOptional({ example: 155500 })
  remaining_liability_bdt?: number;

  @ApiPropertyOptional({ example: 'August executive profit disbursement' })
  notes?: string;

  @ApiProperty({ example: 'COMPLETED' })
  status!: string;

  @ApiProperty({ example: '2026-08-10T00:00:00.000Z' })
  date!: string;

  @ApiProperty({ example: true })
  verified!: boolean;
}

export class LiabilityRecordDataDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id!: string;

  @ApiProperty({ example: 'Macbook Advance Payment (Remaining)' })
  description!: string;

  @ApiProperty({ example: 'Apple Hardware Authorized Partner' })
  vendor_or_creditor!: string;

  @ApiProperty({ example: 411000 })
  total_initial_bdt!: number;

  @ApiProperty({ example: 255500 })
  paid_bdt!: number;

  @ApiProperty({ example: 155500 })
  remaining_due_bdt!: number;

  @ApiProperty({ example: 'DUE' })
  status!: string;

  @ApiPropertyOptional({ example: 'Outstanding balance on 2 Macbook Pro units.' })
  notes?: string;

  @ApiPropertyOptional({ example: 'September 2026' })
  due_date?: string;
}

export class ReceivableRecordDataDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id!: string;

  @ApiProperty({ example: 'Makibul Tamim Advance (Profit Deduction)' })
  description!: string;

  @ApiProperty({ example: 'Makibul Tamim' })
  debtor_or_source!: string;

  @ApiProperty({ example: 35000 })
  total_receivable_bdt!: number;

  @ApiProperty({ example: 'Monthly deduction from future profit share' })
  repayment_plan!: string;

  @ApiProperty({ example: 'IN_PROGRESS' })
  status!: string;

  @ApiPropertyOptional({ example: 'Outstanding asset to be recovered.' })
  notes?: string;
}

export class ReportSummaryDataDto {
  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  id!: string;

  @ApiProperty({ example: 'ZENTURA FINANCE' })
  organization!: string;

  @ApiProperty({ example: 'Financial Performance Report - August 2026' })
  report_title!: string;

  @ApiProperty({ example: 'August 1, 2026 – August 31, 2026' })
  period!: string;

  @ApiProperty({ example: 'August' })
  month!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 'AUDITED', enum: ['DRAFT', 'AUDITED', 'CLOSED'] })
  status!: string;

  @ApiPropertyOptional({ example: 'https://drive.google.com/...' })
  drive_verification_url?: string;

  @ApiProperty({ example: 619987.5 })
  total_income_bdt!: number;

  @ApiProperty({ example: 453822.1 })
  total_expenses_bdt!: number;

  @ApiProperty({ example: 166165.4 })
  net_balance_bdt!: number;

  @ApiProperty({ example: 619987.5 })
  sub_total_income_bdt!: number;

  @ApiProperty({ example: 155500 })
  total_liabilities_bdt!: number;

  @ApiProperty({ example: 42500 })
  total_receivables_bdt!: number;

  @ApiProperty({ example: 171165.4 })
  net_remaining_fund_balance_bdt!: number;

  @ApiPropertyOptional({ example: 'Net remaining fund as of August 2026.' })
  reconciliation_notes?: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  created_at!: string;

  @ApiPropertyOptional({ example: '2026-09-05T12:00:00.000Z' })
  updated_at?: string;
}

export class FullReportDataDto extends ReportSummaryDataDto {
  @ApiProperty({ type: [IncomeRecordDataDto] })
  income_records!: IncomeRecordDataDto[];

  @ApiProperty({ type: [ExpenseRecordDataDto] })
  expense_records!: ExpenseRecordDataDto[];

  @ApiProperty({ type: [LiabilityRecordDataDto] })
  liability_records!: LiabilityRecordDataDto[];

  @ApiProperty({ type: [ReceivableRecordDataDto] })
  receivable_records!: ReceivableRecordDataDto[];
}

// ─── Envelope DTOs ────────────────────────────────────────────────────────────

export class ListReportsSuccessDto extends SuccessResponseDto<ReportSummaryDataDto[]> {
  @ApiProperty({ example: 'Reports retrieved successfully.' })
  declare message: string;

  @ApiProperty({ example: Methods.GET, enum: Methods })
  declare method: Methods.GET;

  @ApiProperty({ example: '/api/v1/reports' })
  declare endpoint: string;

  @ApiProperty({ example: 200 })
  declare statusCode: number;

  @ApiProperty({ type: [ReportSummaryDataDto] })
  declare data: ReportSummaryDataDto[];
}

export class GetReportSuccessDto extends SuccessResponseDto<FullReportDataDto> {
  @ApiProperty({ example: 'Report retrieved successfully.' })
  declare message: string;

  @ApiProperty({ example: Methods.GET, enum: Methods })
  declare method: Methods.GET;

  @ApiProperty({ example: '/api/v1/reports/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  declare endpoint: string;

  @ApiProperty({ example: 200 })
  declare statusCode: number;

  @ApiProperty({ type: FullReportDataDto })
  declare data: FullReportDataDto;
}

export class CreateReportSuccessDto extends SuccessResponseDto<FullReportDataDto> {
  @ApiProperty({ example: 'Report created successfully.' })
  declare message: string;

  @ApiProperty({ example: Methods.POST, enum: Methods })
  declare method: Methods.POST;

  @ApiProperty({ example: '/api/v1/reports' })
  declare endpoint: string;

  @ApiProperty({ example: 201 })
  declare statusCode: number;

  @ApiProperty({ type: FullReportDataDto })
  declare data: FullReportDataDto;
}

export class UpdateReportSuccessDto extends SuccessResponseDto<ReportSummaryDataDto> {
  @ApiProperty({ example: 'Report updated successfully.' })
  declare message: string;

  @ApiProperty({ example: Methods.PATCH, enum: Methods })
  declare method: Methods.PATCH;

  @ApiProperty({ example: '/api/v1/reports/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  declare endpoint: string;

  @ApiProperty({ example: 200 })
  declare statusCode: number;

  @ApiProperty({ type: ReportSummaryDataDto })
  declare data: ReportSummaryDataDto;
}
