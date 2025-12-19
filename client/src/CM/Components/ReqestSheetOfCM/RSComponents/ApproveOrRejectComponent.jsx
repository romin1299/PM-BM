import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import axios from "axios";

import { SuccessToast } from "../../../../BM/Component/ShowTostify";

const ApproveOrRejectComponent = ({
  register,
  errors,
  watch,
  handlePopupStatus,
  targetDateOfCM,
  setError,
  clearErrors,
  fromNewMachineApproval = false,
}) => {
  const handleCustomError = () => {
    const approval = watch("approvalOfRequestSheet");
    const remark = watch("rejectedRemarksOfRequestSheet");

    if (!approval) {
      setError(
        "approvalOfRequestSheet",
        {
          type: "manual",
          message: "Select Yes or No!",
        },
        { shouldFocus: true }
      );
      return false;
    }

    if (approval === "No" && (!remark || remark.trim() === "")) {
      setError(
        "rejectedRemarksOfRequestSheet",
        {
          type: "manual",
          message: "Please enter remarks",
        },
        { shouldFocus: true }
      );
      return false;
    }

    return true;
  };

  const approveRequestSheetFromHigherAuthority = async () => {
    try {
      const isValid = handleCustomError();
      if (!isValid) return;

      const response = await axios.patch(
        `/approveOrRejectRequestSheet/${watch("_id")}`,
        {
          current_commonDataFilledByAssignUser: watch(
            "current_commonDataFilledByAssignUser"
          ),

          approvalOfMTD_TL: watch("approvalObj_MTD_TL.approvalOfMTD_TL"),
          approvalOfMTD_HOSS: watch("approvalObj_MTD_HOSS.approvalOfMTD_HOSS"),
          approvalOfMTD_HOS: watch("approvalObj_MTD_HOS.approvalOfMTD_HOS"),
          isPermissionOfPRDTL: watch("isPermissionOfPRDTL"),
          approvalOfPRD_TL: watch("approvalObj_PRD_TL.approvalOfPRD_TL"),

          approvalOfRequestSheet: watch("approvalOfRequestSheet"),
          rejectedRemarksOfRequestSheet: watch("rejectedRemarksOfRequestSheet"),
          targetDateOfCM: targetDateOfCM,
        }
      );

      if (response.status === 201) {
        SuccessToast(response.data.message);
        handlePopupStatus(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const newMachineApproveRequestSheetFromHigherAuthority = async () => {
    try {
      const isValid = handleCustomError();
      if (!isValid) return;

      const response = await axios.patch(
        `/approveOrRejectNewMachineRequestSheet/${watch("_id")}`,
        {
          statusOfNewRequestOfCM: watch("statusOfNewRequestOfCM"),
          // current_commonDataFilledByAssignUser: watch(
          //   "current_commonDataFilledByAssignUser"
          // ),
          preparedByPED_TL: watch(
            "newMachineRequestFilledByPED.preparedByPED_TL"
          ),
          checkedByPED_HOS: watch(
            "PED_Filled_CheckedBy_PED_HOS.checkedByPED_HOS"
          ),
          approvedByPED_HOD: watch(
            "PED_Filled_ApprovedBy_PED_HOD.approvedByPED_HOD"
          ),
          modificationWork_ApprovedByMTD_HOS: watch(
            "MTD_Modification_ApprovedByMTD_HOS.modificationWork_ApprovedByMTD_HOS"
          ),
          modificationWork_AssignedMTD_TL: watch(
            "MTD_Modification_AssignedMTD_TL.modificationWork_AssignedMTD_TL"
          ),
          modificationWork_ApprovedByMTD_HOD: watch(
            "MTD_Modification_ApprovedByMTD_HOD.modificationWork_ApprovedByMTD_HOD"
          ),
          approvalOfRequestSheet: watch("approvalOfRequestSheet"),
          rejectedRemarksOfRequestSheet: watch("rejectedRemarksOfRequestSheet"),
        }
      );

      if (response.status === 201) {
        SuccessToast(response.data.message);
        handlePopupStatus(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Row className="m-1 d-flex justify-content-end">
        <Col className="col-lg-5 col-md-4 m-1 p-2 bg-lightyellow rounded">
          Kindly approve request-sheet.{" "}
          <div className="d-flex">
            <Form.Check
              flex
              label="Yes"
              name="approvalOfRequestSheet"
              type="radio"
              value="Yes"
              id="approvalOfRequestSheet_yes"
              {...register("approvalOfRequestSheet", {
                // required: "Select Yes or No",
              })}
            />{" "}
            &nbsp;
            <Form.Check
              flex
              label="No"
              name="approvalOfRequestSheet"
              type="radio"
              value="No"
              id="approvalOfRequestSheet_no"
              {...register("approvalOfRequestSheet", {
                // required: "Select Yes or No",
              })}
            />
          </div>
          {errors?.["approvalOfRequestSheet"] && (
            <p className="text-error">
              {errors?.["approvalOfRequestSheet"]?.message}
            </p>
          )}
          {watch("approvalOfRequestSheet") === "No" ? (
            <>
              <input
                type="text"
                name="rejectedRemarksOfRequestSheet"
                placeholder="Enter rejected remarks"
                className="p-1 m-1"
                {...register("rejectedRemarksOfRequestSheet", {
                  // required:
                  //   watch("approvalOfRequestSheet") === "No"
                  //     ? "Please enter remarks"
                  //     : false,
                })}
              />
              {errors?.["rejectedRemarksOfRequestSheet"] && (
                <p className="text-error">
                  {errors?.["rejectedRemarksOfRequestSheet"]?.message}
                </p>
              )}
            </>
          ) : (
            ""
          )}
          &nbsp;
          <button
            type="button"
            className="btn bg-warning"
            onClick={() => {
              fromNewMachineApproval
                ? newMachineApproveRequestSheetFromHigherAuthority()
                : approveRequestSheetFromHigherAuthority();
            }}
          >
            Submit
          </button>
        </Col>
      </Row>
    </>
  );
};

export default ApproveOrRejectComponent;
