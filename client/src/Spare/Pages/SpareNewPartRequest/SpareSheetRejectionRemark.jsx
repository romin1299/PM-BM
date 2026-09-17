import React from "react";
import { Row, Col } from "react-bootstrap";

/**
 * Shows who rejected the sheet and why.
 *
 * A rejection is final, so this is the sheet's closing note: which approver
 * stopped it, when, and why. The full chain is shown by SpareSheetApprovalTrack.
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
