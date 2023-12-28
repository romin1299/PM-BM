import pptxgen from "pptxgenjs";
import { generateMonthlyBdPpt } from "./monthlyBdPPTX";
import { generateLineContributionPpt } from "./lineContributionPPTX";
import { generateProductLineWisePpt } from "./productLineWisePPTX";
import { generateTestPpt } from "./testPPTX";
import { commonPPTGeneratorForSameTemplate } from "./commonPPTGeneratorForSameTemplate";
import { generateKPIFromDBPpt } from "./generateKPIFromDBPpt";
import { generateLineWiseKpiStatusPpt } from "./generateLineWiseKpiStatusPpt";

export const EXPORT_REPORT = {
  MONTHLY_BD: "Man-Hour-Report",
  LINE_CONTRIBUTION: "Line-Contribution-Report",
  PRODUCT_LINE_WISE: "Product-Line-Wise-Report",
  LINE_WISE_KPI_STATUS: "Line-Wise-Kpi-Status",
  COMMON_TEMPLATE_REPORT: "COMMON-TEMPLATE-REPORT",
  KPI_FROM_DB: "KPI-From-Database",
  TEST: "Test-Report",
};

export async function exportPPTX(reportName, urlOptions) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  switch (reportName) {
    case EXPORT_REPORT.MONTHLY_BD:
      await generateMonthlyBdPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.LINE_CONTRIBUTION:
      await generateLineContributionPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.PRODUCT_LINE_WISE:
      await generateProductLineWisePpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.LINE_WISE_KPI_STATUS:
      await generateLineWiseKpiStatusPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.COMMON_TEMPLATE_REPORT:
      await commonPPTGeneratorForSameTemplate(pptx, urlOptions);
      break;

    case EXPORT_REPORT.KPI_FROM_DB:
      await generateKPIFromDBPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.TEST:
      await generateTestPpt(pptx, urlOptions);
      break;

    default:
      console.error("please provide valid reportName name");
      return null;
  }

  // Save the PPT file
  pptx.writeFile({
    fileName: `${
      reportName === EXPORT_REPORT?.COMMON_TEMPLATE_REPORT
        ? urlOptions?.name
        : reportName
    }_${new Date().toISOString()}.pptx`,
    compression: true,
  });
}
