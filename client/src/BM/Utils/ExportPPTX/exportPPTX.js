import pptxgen from "pptxgenjs";
import { generateMonthlyBdPpt } from "./monthlyBdPPTX";
import { generateLineContributionPpt } from "./lineContributionPPTX";
import { generateProductLineWisePpt } from "./productLineWisePPTX";
import { generateTestPpt } from "./testPPTX";
import { generateManHourPpt } from "./manHourPPTX";
import { generateTMMTTRSkillPpt } from "./tmMTTRSkillPPTX";
import { commonPPTGeneratorForSameTemplate } from "./commonPPTGeneratorForSameTemplate";
import { generateKPIFromDBPpt } from "./generateKPIFromDBPpt";
import { generateLineWiseKpiStatusPpt } from "./generateLineWiseKpiStatusPpt";
import { generateTopMachineBdPpt } from "./topMachineBbPPTX";
import { generateTopMachineBdDefaultPpt } from "./topMachineBbDefaultPPTX";

export const EXPORT_REPORT = {
  PRODUCT_LINE_WISE: "Product-Line-Wise-Report",
  MAN_HOUR_REPORT: "Man-Hour-Report",
  MONTHLY_BD: "Monthly-BD-Report",
  LINE_CONTRIBUTION: "Line-Contribution-Report",
  TM_MTTR_SKILL: "TM-MTTR-Skill-Report",
  LINE_WISE_KPI_STATUS: "Line-Wise-Kpi-Status",
  COMMON_TEMPLATE_REPORT: "COMMON-TEMPLATE-REPORT",
  KPI_FROM_DB: "KPI-From-Database",
  TOP_MACHINE_BREAKDOWN: "Top-Machine-Breakdown",
  TOP_MACHINE_BD_DEFAULT: "Top-Machine-Bd-Default",
  TEST: "Test-Report",
};

export async function exportPPTX(reportName, urlOptions) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  switch (reportName) {
    case EXPORT_REPORT.PRODUCT_LINE_WISE:
      await generateProductLineWisePpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.MAN_HOUR_REPORT:
      await generateManHourPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.MONTHLY_BD:
      await generateMonthlyBdPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.LINE_CONTRIBUTION:
      await generateLineContributionPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.TM_MTTR_SKILL:
      await generateTMMTTRSkillPpt(pptx, urlOptions);
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

    case EXPORT_REPORT.TOP_MACHINE_BREAKDOWN:
      await generateTopMachineBdPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.TOP_MACHINE_BD_DEFAULT:
      await generateTopMachineBdDefaultPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.LINE_WISE_KPI_STATUS:
      await generateLineWiseKpiStatusPpt(pptx, urlOptions);
      break;

    case EXPORT_REPORT.TEST:
      await generateTestPpt(pptx, urlOptions);
      break;

    default:
      console.error("please provide valid string value for reportName");
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
