import React from "react";
import { Col, Form, Row } from "react-bootstrap";

const SendForApprovalRadioButtons = ({ register }) => {
  return (
    <>
      <Row className="m-1 d-flex justify-content-start">
        <Col className="col-lg-5 col-md-4 m-1 p-2 bg-lightyellow rounded">
          Want to send for approval?{" "}
          <div className="d-flex">
            <Form.Check
              flex
              label="Yes"
              name="wantToSendForApproval"
              type="radio"
              value="Yes"
              id="wantToSendForApproval"
              {...register("wantToSendForApproval")}
            />{" "}
            &nbsp;
            <Form.Check
              flex
              label="No"
              name="wantToSendForApproval"
              type="radio"
              value="No"
              id="wantToSendForApproval"
              {...register("wantToSendForApproval")}
            />
          </div>
        </Col>
      </Row>
    </>
  );
};

export default SendForApprovalRadioButtons;
