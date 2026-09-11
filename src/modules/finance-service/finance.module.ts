/**
 * @fileoverview Finance module.
 *
 * Provides financial ledger management:
 *  - GET  /api/v1/reports              — List all monthly reports
 *  - GET  /api/v1/reports/:id          — Full report by UUID
 *  - GET  /api/v1/reports/month/:y/:m  — Full report by year+month
 *  - POST /api/v1/reports              — Create report (ADMIN)
 *  - PATCH /api/v1/reports/:id         — Update report (ADMIN)
 *
 * Imports SharedAuthModule for JWT guards (no circular dependency with AuthModule).
 *
 * @module finance-service
 */
import { Module } from '@nestjs/common';
import { SharedAuthModule } from '../auth-service/shared-auth.module';
import { FinanceDAO } from './dao/finance.dao';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [SharedAuthModule],
  controllers: [FinanceController],
  providers: [FinanceDAO, FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
