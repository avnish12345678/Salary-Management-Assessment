import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { toCsv, toExcelBuffer } from '../../utils/export';
import * as reportsService from './reports.service';
import { ReportFilters } from './reports.validation';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = req.query as unknown as ReportFilters;
    const report = await reportsService.buildReports(filters);

    if (filters.format === 'csv') {
      const flat = reportsService.flattenReportForExport(report);
      const csv = toCsv(flat.headers, flat.rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="acme-salary-report.csv"');
      return res.status(200).send(csv);
    }

    if (filters.format === 'xlsx') {
      const flat = reportsService.flattenReportForExport(report);
      const buffer = await toExcelBuffer('Salary Report', flat.headers, flat.rows);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="acme-salary-report.xlsx"');
      return res.status(200).send(buffer);
    }

    return sendSuccess(res, report);
  } catch (error) {
    return next(error);
  }
}
