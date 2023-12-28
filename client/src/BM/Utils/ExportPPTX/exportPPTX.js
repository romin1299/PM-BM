import pptxgen from "pptxgenjs";
import { generateMonthlyBdPpt } from "./monthlyBdPPTX";
import { generateLineContributionPpt } from "./lineContributionPPTX";
import { generateProductLineWisePpt } from "./productLineWisePPTX";
import { generateTestPpt } from "./testPPTX";
import { generateManHourPpt } from "./manHourPPTX";
import { generateTMMTTRSkillPpt } from "./tmMTTRSkillPPTX";

export const EXPORT_REPORT = {
  PRODUCT_LINE_WISE: "Product-Line-Wise-Report",
  MAN_HOUR_REPORT: "Man-Hour-Report",
  MONTHLY_BD: "Monthly-BD-Report",
  LINE_CONTRIBUTION: "Line-Contribution-Report",
  TM_MTTR_SKILL: "TM-MTTR-Skill-Report",
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

    case EXPORT_REPORT.TEST:
      await generateTestPpt(pptx, urlOptions);
      break;

    default:
      console.error("please provide valid string value for reportName");
      return null;
  }

  // Save the PPT file
  pptx.writeFile({
    fileName: `${reportName}_${new Date().toISOString()}.pptx`,
    compression: true,
  });
}
