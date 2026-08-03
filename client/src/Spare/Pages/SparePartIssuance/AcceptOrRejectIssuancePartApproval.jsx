import React from "react";
import { Row, Col, Form } from "react-bootstrap";

const AcceptOrRejectIssuancePartApproval = ({ register, watch, errors }) => {
  return (
    <>
      <Row className="mt-1">
        <Col className="d-flex align-items-center col-auto">
          <small>Kindly approve request-sheet.</small>&nbsp;
          <Form.Check
            flex
            label="Yes"
            style={{ fontSize: "14px" }}
            type="radio"
            value="Yes"
            {...register("isApproved")}
          />{" "}
          &nbsp;
          <Form.Check
            flex
            label="No"
            style={{ fontSize: "14px" }}
            type="radio"
            value="No"
            {...register("isApproved")}
          />
        </Col>
      </Row>
      {watch("isApproved") === "No" && (
        <Row className="mt-1">
          <Col className="d-flex align-items-center col-auto rounded">
            <div>
              <input
                type="text"
                name="rejectedRemarks"
                style={{ fontSize: "14px" }}
                placeholder="Enter rejected remarks"
                className="p-1 m-1"
                {...register("rejectedRemarks", {
                  required: "Please enter remarks",
                })}
              />
              {errors?.rejectedRemarks && (
                <p className="text-error">{errors?.rejectedRemarks?.message}</p>
              )}
            </div>
          </Col>
        </Row>
      )}
    </>
  );
};

export default AcceptOrRejectIssuancePartApproval;
