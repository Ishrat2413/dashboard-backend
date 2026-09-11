/**
 * @fileoverview Validation DTOs for finance-service write endpoints.
 *
 * @module finance-service/dto/validation
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ExpenseCategoryGroup,
  ExpenseStatus,
  IncomeCategory,
  LiabilityStatus,
  ReceivableStatus,
  ReportStatus,
} from '@prisma/client';

// ─── Nested input DTOs ────────────────────────────────────────────────────────

export class CurrencyMetaDto {
  @ApiPropertyOptional({ example: 'GBP', enum: ['GBP', 'USD', 'EUR', 'BDT'] })
  @IsOptional()
  @IsString()
  originalCurrency?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalAmount?: number;

  @ApiPropertyOptional({ example: 169.55 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRateEstimated?: number;

  @ApiPropertyOptional({ example: 'Base retainer + performance incentives' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  incentivesOrNotes?: string;
}

export class CreateIncomeLineDto {
  @ApiProperty({ example: 'Gavin (2000 GBP + Incentives)' })
  @IsString()
  @MaxLength(500)
  source!: string;

  @ApiProperty({ enum: IncomeCategory, example: IncomeCategory.CLIENT_RETAINER })
  @IsEnum(IncomeCategory)
  category!: IncomeCategory;

  @ApiProperty({ example: 339111.01 })
  @IsNumber()
  @Min(0)
  amount_bdt!: number;

  @ApiPropertyOptional({ type: () => CurrencyMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyMetaDto)
  currency_meta?: CurrencyMetaDto;

  @ApiPropertyOptional({ example: 'Primary international client wire transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ example: '2026-08-05' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class CreateExpenseLineDto {
  @ApiProperty({ example: 'Profit Share (Saad)' })
  @IsString()
  @MaxLength(500)
  category_title!: string;

  @ApiProperty({ enum: ExpenseCategoryGroup, example: ExpenseCategoryGroup.PROFIT_SHARE })
  @IsEnum(ExpenseCategoryGroup)
  category_group!: ExpenseCategoryGroup;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  amount_bdt!: number;

  @ApiProperty({ example: 'Bank Transfer' })
  @IsString()
  @MaxLength(255)
  payment_method!: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  payment_method_type?: string;

  @ApiPropertyOptional({ example: 155500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remaining_liability_bdt?: number;

  @ApiPropertyOptional({ example: 'August executive profit disbursement' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ enum: ExpenseStatus, example: ExpenseStatus.COMPLETED })
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class CreateLiabilityLineDto {
  @ApiProperty({ example: 'Macbook Advance Payment (Remaining)' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 'Apple Hardware Authorized Partner' })
  @IsString()
  @MaxLength(255)
  vendor_or_creditor!: string;

  @ApiProperty({ example: 411000 })
  @IsNumber()
  @Min(0)
  total_initial_bdt!: number;

  @ApiProperty({ example: 255500 })
  @IsNumber()
  @Min(0)
  paid_bdt!: number;

  @ApiProperty({ example: 155500 })
  @IsNumber()
  @Min(0)
  remaining_due_bdt!: number;

  @ApiProperty({ enum: LiabilityStatus, example: LiabilityStatus.DUE })
  @IsEnum(LiabilityStatus)
  status!: LiabilityStatus;

  @ApiPropertyOptional({ example: 'Outstanding payment balance on 2 Macbook Pro units.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: 'September 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  due_date?: string;
}

export class CreateReceivableLineDto {
  @ApiProperty({ example: 'Makibul Tamim Advance (Profit Deduction)' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 'Makibul Tamim' })
  @IsString()
  @MaxLength(255)
  debtor_or_source!: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  total_receivable_bdt!: number;

  @ApiProperty({ example: 'Monthly deduction from future profit share' })
  @IsString()
  repayment_plan!: string;

  @ApiProperty({ enum: ReceivableStatus, example: ReceivableStatus.IN_PROGRESS })
  @IsEnum(ReceivableStatus)
  status!: ReceivableStatus;

  @ApiPropertyOptional({ example: 'Outstanding asset to be recovered over coming cycles.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// ─── Top-level CreateReportDto ────────────────────────────────────────────────

export class CreateReportDto {
  @ApiProperty({ example: 'ZENTURA FINANCE' })
  @IsString()
  @MaxLength(255)
  organization!: string;

  @ApiProperty({ example: 'Financial Performance Report - August 2026' })
  @IsString()
  @MaxLength(500)
  report_title!: string;

  @ApiProperty({ example: 'August 1, 2026 – August 31, 2026' })
  @IsString()
  @MaxLength(255)
  period!: string;

  @ApiProperty({ example: 'August' })
  @IsString()
  @MaxLength(50)
  month!: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year!: number;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.AUDITED })
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @ApiPropertyOptional({ example: 'https://drive.google.com/...' })
  @IsOptional()
  @IsUrl()
  drive_verification_url?: string;

  @ApiProperty({ example: 619987.5 })
  @IsNumber()
  total_income_bdt!: number;

  @ApiProperty({ example: 453822.1 })
  @IsNumber()
  total_expenses_bdt!: number;

  @ApiProperty({ example: 166165.4 })
  @IsNumber()
  net_balance_bdt!: number;

  @ApiProperty({ example: 619987.5 })
  @IsNumber()
  sub_total_income_bdt!: number;

  @ApiProperty({ example: 155500 })
  @IsNumber()
  total_liabilities_bdt!: number;

  @ApiProperty({ example: 42500 })
  @IsNumber()
  total_receivables_bdt!: number;

  @ApiProperty({ example: 171165.4 })
  @IsNumber()
  net_remaining_fund_balance_bdt!: number;

  @ApiPropertyOptional({ example: 'Net remaining fund as of August 2026.' })
  @IsOptional()
  @IsString()
  reconciliation_notes?: string;

  @ApiPropertyOptional({ type: () => [CreateIncomeLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncomeLineDto)
  income_records?: CreateIncomeLineDto[];

  @ApiPropertyOptional({ type: () => [CreateExpenseLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseLineDto)
  expense_records?: CreateExpenseLineDto[];

  @ApiPropertyOptional({ type: () => [CreateLiabilityLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLiabilityLineDto)
  liability_records?: CreateLiabilityLineDto[];

  @ApiPropertyOptional({ type: () => [CreateReceivableLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceivableLineDto)
  receivable_records?: CreateReceivableLineDto[];
}

// ─── UpdateReportDto ─────────────────────────────────────────────────────────

export class UpdateReportDto {
  @ApiPropertyOptional({ enum: ReportStatus, example: ReportStatus.CLOSED })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ example: 'https://drive.google.com/...' })
  @IsOptional()
  @IsUrl()
  drive_verification_url?: string;

  @ApiPropertyOptional({ example: 'Updated reconciliation note.' })
  @IsOptional()
  @IsString()
  reconciliation_notes?: string;
}
