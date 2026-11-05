import React from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";

import SpareApprovalTrack from "../../Component/Common/SpareApprovalTrack";

const Field = ({ label, value }) => (
  <Row className="mb-1">
    <Col className="col-4">
      <small className="text-muted">{label}</small>
    </Col>
    <Col>
      <small>{value || "-"}</small>
    </Col>
  </Row>
);

/**
 * Read-only view of a Repaired Part Quality Confirmation: the sheet's fields
 * and the whole MTD approval track, so anyone can see which stage the record is
 * at and who it is waiting on.
 */
const RepairedQualityConfirmationView = ({ show, onHide, row = {} }) => (
  <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" scrollable>
    <Modal.Header closeButton>
      <Modal.Title>
        Quality Confirmation {row?.uniqueID ?? ""}
        <small className="text-muted"> FO/MTD/05/09/00</small>
      </Modal.Title>
    </Modal.Header>

    <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <div className="border p-2 mb-2">
        <Field label="Part No" value={row?.partNumber} />
        <Field label="Part Name" value={row?.partName} />
        <Field label="Manufacturer" value={row?.maker} />
        <Field label="Issue / Problem" value={row?.issueProblem} />
        <Field label="Repaired Item" value={row?.repairedItem} />
        <Field label="Repaired On" value={row?.repairedOn} />
        <Field label="Repaired By" value={row?.repairedBy} />
        <Field label="Quality Confirmed By" value={row?.qualityConfirmedBy} />
        <Field
          label="Quality Confirmation Method"
          value={row?.qualityConfirmationMethod}
        />
        <Field label="Date" value={row?.qualityConfirmationDate} />
        <Field label="Tool Room Request" value={row?.toolRoomRequestStatus} />
        <Field label="Status" value={row?.requestStatus} />
        <Field label="Pending With" value={row?.pendingWith} />
      </div>

      <SpareApprovalTrack
        approvals={row?.approvals ?? []}
        currentApprovalIndex={row?.currentApprovalIndex ?? 0}
        requestStatus={row?.requestStatus}
      />
    </Modal.Body>

    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
);

export default RepairedQualityConfirmationView;
