import React from "react";
import { Row, Col } from "react-bootstrap";
import { APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM } from "./GlobalApprovalList";

const RequestSheetCustomizedApproval = () => {
  return (
    <div>
      <Row>
        <Col className="cell">
          <p>Minor BD Approval Selection</p>
          {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
            return (
              <>
                <input type="radio" name={obj?.value} /> &nbsp;
                <label>{obj?.value}</label> <br />
              </>
            );
          })}
        </Col>
        <Col className="cell">
          <p>Major BD Approval Selection</p>
          {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
            return (
              <>
                <input type="radio" name={obj?.value} /> &nbsp;
                <label>{obj?.value}</label> <br />
              </>
            );
          })}
        </Col>
      </Row>
    </div>
  );
};

export default RequestSheetCustomizedApproval;
