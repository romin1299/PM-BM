import React from "react";
import { Row, Col, Form } from "react-bootstrap";

const HODNGBudgetApproval = ({ register, watch, errors }) => {
  return (
    <Row className="border d-flex align-items-center gap-2">
      <Col className="d-flex align-items-center col-auto bg-lightyellow rounded">
        <small>Kindly approve request-sheet.</small>&nbsp;
        <Form.Check
          flex
          label="Yes"
          style={{ fontSize: "14px" }}
          type="radio"
          value="Yes"
          {...register("mtdApprovalIfNGBudget")}
        />{" "}
        &nbsp;
        <Form.Check
          flex
          label="No"
          style={{ fontSize: "14px" }}
          type="radio"
          value="No"
          {...register("mtdApprovalIfNGBudget")}
        />
        &nbsp;
        {watch("mtdApprovalIfNGBudget") === "No" && (
          <div>
            <input
              type="text"
              name="mtdHODApprovalIfBudgetIsNG.rejectedRemarks"
              style={{ fontSize: "14px" }}
              placeholder="Enter rejected remarks"
              className="p-1 m-1"
              {...register("mtdHODApprovalIfBudgetIsNG.rejectedRemarks", {
                required: "Please enter remarks",
              })}
            />
            {errors?.mtdHODApprovalIfBudgetIsNG?.rejectedRemarks && (
              <p className="text-error">
                {errors?.mtdHODApprovalIfBudgetIsNG?.rejectedRemarks?.message}
              </p>
            )}
          </div>
        )}
      </Col>
    </Row>
  );
};

export default HODNGBudgetApproval;
