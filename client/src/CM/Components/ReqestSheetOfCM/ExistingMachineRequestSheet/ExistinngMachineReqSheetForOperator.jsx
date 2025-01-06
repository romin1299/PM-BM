import React from "react";
import { Row, Col } from "react-bootstrap";

import MiddlewareForTablesOfMTD from "./MiddlewareForTablesOfMTD";
import UserApprovalSelectFields from "../RSComponents/UserApprovalSelectFields/UserApprovalSelectFields";

const ExistinngMachineReqSheetForOperator = ({
  isEditable = false,
  setValue,
  register,
  errors,
  watch,
}) => {
  //   if (watch("mtdHOS") === undefined) {
  //     setError(
  //       "mtdHOS",
  //       {
  //         message: "This field is required !",
  //       },
  //       {
  //         shouldFocus: true,
  //       }
  //     );
  //   }
  //   if (
  //     watch("isPermissionOfMTDTL") === "Yes" &&
  //     watch("mtdTL") === undefined
  //   ) {
  //     setError(
  //       "mtdTL",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //   }
  //   if (
  //     watch("isPermissionOfPRDTL") === "Yes" &&
  //     watch("prdTL") === undefined
  //   ) {
  //     setError(
  //       "prdTL",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //   }
  //   if (watch("attachedFileByAssignedUser")?.length === 0) {
  //     setError(
  //       "attachedFileByAssignedUser",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //   }
  //   // if (watch("mtdHOS") === "") {
  //   //   setError(
  //   //     "mtdHOS",
  //   //     {
  //   //       message: "This field is required !",
  //   //     },
  //   //     { shouldFocus: true }
  //   //   );
  //   //   flagCountForHandlingError++;
  //   // }
  //   if (
  //     cmSelectedSheetForView?.cmBasicDataFilledByMTD_TL
  //       ?.partSuggestionByMTDTL &&
  //     allDataOFTableFilledByOperator?.parts.length === 0
  //   ) {
  //     setError(
  //       "partList",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //   }
  //   if (allDataOFTableFilledByOperator?.actions?.length === 0) {
  //     setError(
  //       "actionValidation",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //     // console.log(flagCountForHandlingError);
  //   }
  //   if (allDataOFTableFilledByOperator?.workDetails?.length === 0) {
  //     setError(
  //       "workDetailsValidation",
  //       {
  //         message: "This field is required !",
  //       },
  //       { shouldFocus: true }
  //     );
  //     flagCountForHandlingError++;
  //   }
  //   // console.log("flag ", flagCountForHandlingError);
  //   return flagCountForHandlingError;
  // };

  return (
    <>
      {watch("upto_currentYear_current_commonDataFilledByAssignUser")?.map(
        (year) =>
          year.quarterlyDataOfTheCM?.map((quarter) => (
            <MiddlewareForTablesOfMTD
              setValue={setValue}
              requestSheet_year={
                year?.preAggregationTimeStampOfRequestSheet?.requestSheet_year
              }
              requestSheet_quarter={quarter?.requestSheet_quarter}
              plannedDateAndTimeOfCM={quarter?.plannedDateAndTimeOfCM}
              partsData={quarter?.changedParts}
              workData={quarter?.workDetails}
              actionData={quarter?.actionAndCounterMeasureStep}
              isEditable={
                isEditable &&
                watch("currentFYYearAndQuarter.year") ===
                  year?.preAggregationTimeStampOfRequestSheet
                    ?.requestSheet_year &&
                watch("currentFYYearAndQuarter.quarter") ===
                  quarter?.requestSheet_quarter
              }
            />
          ))
      )}

      <UserApprovalSelectFields
        setValue={setValue}
        watch={watch}
        register={register}
        errors={errors}
        isEditable={isEditable}
      />

      {isEditable && (
        <Row className="m-0 border p-2 d-flex justify-content-between">
          <Col lg={6} md={6} sm={12}>
            <button
              type="submit"
              className="btn bg-success"
              style={{ marginTop: "1rem" }}
            >
              Submit
            </button>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ExistinngMachineReqSheetForOperator;
