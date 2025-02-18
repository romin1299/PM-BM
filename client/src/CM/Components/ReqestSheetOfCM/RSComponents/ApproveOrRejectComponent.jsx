import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import axios from "axios";

import { SuccessToast } from "../../../../BM/Component/ShowTostify";

const ApproveOrRejectComponent = ({
  register,
  errors,
  watch,
  handlePopupStatus,
}) => {
  const approveRequestSheetFromHigherAuthority = async () => {
    try {
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
              id="approvalOfRequestSheet"
              {...register("approvalOfRequestSheet")}
            />{" "}
            &nbsp;
            <Form.Check
              flex
              label="No"
              name="approvalOfRequestSheet"
              type="radio"
              value="No"
              id="approvalOfRequestSheet"
              {...register("approvalOfRequestSheet")}
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
                {...register("rejectedRemarksOfRequestSheet")}
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
              approveRequestSheetFromHigherAuthority();
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
