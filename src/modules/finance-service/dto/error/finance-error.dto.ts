/**
 * @fileoverview Error-response DTOs for finance-service endpoints.
 *
 * @module finance-service/dto/error
 */
import { ApiProperty } from '@nestjs/swagger';

export class ReportNotFoundDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Financial report not found.' })
  message!: string;

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  timestamp!: string;
}

export class ReportConflictDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'A report for this month and year already exists.' })
  message!: string;

  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  timestamp!: string;
}

export class ReportUnauthorizedDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Authorization header is missing or malformed' })
  message!: string;

  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  timestamp!: string;
}

export class ReportForbiddenDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'You do not have permission to perform this action. Required: ADMIN' })
  message!: string;

  @ApiProperty({ example: 403 })
  statusCode!: number;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  timestamp!: string;
}

export class ReportValidationErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ example: 422 })
  statusCode!: number;

  @ApiProperty({
    example: [{ field: 'month', message: 'month must be a string' }],
    isArray: true,
  })
  errors!: { field: string; message: string }[];
}
