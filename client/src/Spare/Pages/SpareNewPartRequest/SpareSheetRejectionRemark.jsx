import React from "react";
import { Row, Col } from "react-bootstrap";

/**
 * Shows who rejected the sheet and why.
 *
 * A rejection clears the approval chain but leaves the rejecting approver's slot
 * intact, carrying its status, timestamp and remarks. Surfacing it here is what
 * tells the requester what to fix before sending the sheet again.
 */
const SpareSheetRejectionRemark = ({ rejection }) => {
  if (!rejection) return null;

  const { userType, user, approvalDateAndTime, rejectedRemarks } = rejection;

  return (
    <Row className="border d-flex align-items-center">
      <Col className="d-flex align-items-center col-auto border gap-2">
        <small className="text-error">
          <b>Rejected by:</b>
        </small>
        <small>
          {[userType, user?.tm_name, approvalDateAndTime]
            .filter(Boolean)
            .join(" | ")}
          {rejectedRemarks && (
            <>
              &nbsp;|&nbsp;<b>Remarks:</b> {rejectedRemarks}
            </>
          )}
        </small>
      </Col>
    </Row>
  );
};

export default SpareSheetRejectionRemark;
