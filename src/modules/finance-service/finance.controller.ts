/**
 * @fileoverview Finance controller — financial report CRUD endpoints.
 *
 * Routes:
 *  GET    /api/v1/reports                      — List all monthly reports (summary)
 *  GET    /api/v1/reports/:id                  — Full report by UUID
 *  GET    /api/v1/reports/month/:year/:month   — Full report by year+month
 *  POST   /api/v1/reports                      — Create a new monthly report (ADMIN only)
 *  PATCH  /api/v1/reports/:id                  — Update report status/notes (ADMIN only)
 *
 * All routes are JWT-guarded. Write routes additionally require the ADMIN role.
 *
 * @module finance-service
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiErrorResponses } from 'src/common/decorators/api-error-response.decorator';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UuidParam } from 'src/common/decorators/uuid-param.decorator';
import { AuthenticatedUserThrottleGuard } from 'src/common/throttles/user/authenticated-user-throttle.guard';
import config from 'src/shared/config/app.config';
import type { AuthUser } from 'src/shared/interfaces/auth-user.interface';
import type { ServicePayload } from 'src/shared/interfaces/response.interface';
import { JwtAuthGuard } from '../auth-service/guards/jwt-auth.guard';
import { RolesGuard } from '../auth-service/guards/roles.guard';
import {
  ReportConflictDto,
  ReportForbiddenDto,
  ReportNotFoundDto,
  ReportUnauthorizedDto,
  ReportValidationErrorDto,
} from './dto/error/finance-error.dto';
import {
  CreateReportSuccessDto,
  GetReportSuccessDto,
  ListReportsSuccessDto,
  UpdateReportSuccessDto,
} from './dto/success/finance-success.dto';
import { CreateReportDto, UpdateReportDto } from './dto/validation/finance.dto';
import { FinanceService } from './finance.service';

const THROTTLE_ENABLED = config.THROTTLE_ENABLED;

@ApiTags('Finance Reports')
@ApiBearerAuth('Authorization')
@UseGuards(
  JwtAuthGuard,
  ...(THROTTLE_ENABLED ? [AuthenticatedUserThrottleGuard] : []),
)
@Controller({ path: 'reports', version: '1' })
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ── List all reports ───────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all monthly financial reports',
    description:
      'Returns a summary list of all monthly reports (no line items). ' +
      'Ordered by year descending, then month ascending.',
  })
  @ApiSuccessResponse(ListReportsSuccessDto, HttpStatus.OK)
  @ApiErrorResponses({ unauthorized: ReportUnauthorizedDto })
  async getReports(): Promise<ServicePayload<unknown>> {
    return this.financeService.getReports();
  }

  // ── Report by month+year ───────────────────────────────────────────────────

  @Get('month/:year/:month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a full report by year and month',
    description:
      'Returns the full report (with all line items) for the given year and month. ' +
      'Month is case-insensitive (e.g. "august", "August", "AUGUST" all work).',
  })
  @ApiParam({ name: 'year', example: 2026, type: Number })
  @ApiParam({ name: 'month', example: 'August', type: String })
  @ApiSuccessResponse(GetReportSuccessDto, HttpStatus.OK)
  @ApiErrorResponses({ notFound: ReportNotFoundDto, unauthorized: ReportUnauthorizedDto })
  async getReportByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month') month: string,
  ): Promise<ServicePayload<unknown>> {
    return this.financeService.getReportByMonthYear(month, year);
  }

  // ── Report by UUID ─────────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a full report by UUID',
    description: 'Returns the full report (with all line items) for the given UUID.',
  })
  @ApiSuccessResponse(GetReportSuccessDto, HttpStatus.OK)
  @ApiErrorResponses({ notFound: ReportNotFoundDto, unauthorized: ReportUnauthorizedDto })
  async getReportById(
    @UuidParam('id') id: string,
  ): Promise<ServicePayload<unknown>> {
    return this.financeService.getReportById(id);
  }

  // ── Create report ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new monthly financial report',
    description:
      'Creates a new monthly financial report with all nested line items ' +
      '(income, expenses, liabilities, receivables) in a single atomic transaction. ' +
      'Requires ADMIN role.',
  })
  @ApiSuccessResponse(CreateReportSuccessDto, HttpStatus.CREATED)
  @ApiErrorResponses({
    conflict: ReportConflictDto,
    validation: ReportValidationErrorDto,
    unauthorized: ReportUnauthorizedDto,
    forbidden: ReportForbiddenDto,
  })
  async createReport(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateReportDto,
  ): Promise<ServicePayload<unknown>> {
    return this.financeService.createReport(dto);
  }

  // ── Update report ──────────────────────────────────────────────────────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update report status or notes',
    description:
      'Partial update of report-level fields (status, drive URL, reconciliation notes). ' +
      'Line items cannot be modified through this endpoint. Requires ADMIN role.',
  })
  @ApiSuccessResponse(UpdateReportSuccessDto, HttpStatus.OK)
  @ApiErrorResponses({
    notFound: ReportNotFoundDto,
    validation: ReportValidationErrorDto,
    unauthorized: ReportUnauthorizedDto,
    forbidden: ReportForbiddenDto,
  })
  async updateReport(
    @UuidParam('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateReportDto,
  ): Promise<ServicePayload<unknown>> {
    return this.financeService.updateReport(id, dto);
  }
}
