import React from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { DropdownComponent } from "../SpareMasterRegistration/SpareMasterRegistration";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";

const url = "/v1/spare/master/repaired/qualityConfirmation";

/**
 * "REPAIRED PART QUALITY CONFIRMATION SHEET" (FO/MTD/05/09/00).
 *
 * Submitted by the Tool Room. The paper's fields are saved on the Repaired
 * Parts Master record itself (part name / part no / maker in the master's own
 * fields, the repair and quality details in the fields added for the sheet), so
 * the part appears in the table below and is maintained through the normal
 * master edit form.
 *
 * The route is always MTD — this sheet is only used by MTD, so there is no
 * department choice.
 */
const TEXT_FIELDS = [
  { label: "Part Name", field: "partName" },
  { label: "Part No.", field: "partNo" },
  { label: "Issue / Problem", field: "issueProblem" },
  { label: "Repaired Item", field: "repairedItem" },
  { label: "Repaired By", field: "repairedBy" },
  { label: "Quality Confirmed By", field: "qualityConfirmedBy" },
  { label: "Quality Confirmation Method", field: "qualityConfirmationMethod" },
];

const DATE_FIELDS = [
  { label: "Repaired On", field: "repairedOn" },
  { label: "Date", field: "qualityConfirmationDate" },
];

const RepairedQualityConfirmationForm = ({
  show,
  onHide,
  onSaved,
  isToolRoom = false,
  user,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      partName: "",
      partNo: "",
      maker: "",
      issueProblem: "",
      repairedItem: "",
      repairedOn: "",
      repairedBy: "",
      qualityConfirmedBy: "",
      qualityConfirmationMethod: "",
      qualityConfirmationDate: "",
      toolRoomRequestStatus: "",
    },
  });

  const handleSubmitRequest = async (formValue) => {
    const { isError } = await axiosPostOrPatch({
      url,
      apiType: "post",
      axiosBody: formValue,
    });
    if (!isError) onSaved?.();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Repaired Part Quality Confirmation{" "}
          <small className="text-muted">FO/MTD/05/09/00</small>
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(handleSubmitRequest)}>
        <Modal.Body style={{ maxHeight: "68vh", overflowY: "auto" }}>
          <div className="border p-2 mb-2 d-flex justify-content-between">
            <small>
              <b>Requested by:</b> {user?.tm_name} ({user?.tm_no})
            </small>
            <small className="text-muted">
              Checked / Approved by HOS &amp; HOSS → Tool Room
            </small>
          </div>

          <div className="border p-2 mb-2">
            <small className="text-muted">
              Department: <b>MTD</b> (default — this sheet follows the MTD
              approval flow)
            </small>
          </div>

          {TEXT_FIELDS.map(({ label, field }) => (
            <div
              className="d-flex justify-content-between align-items-center mb-1"
              key={field}
            >
              <small>{label}</small>
              <input
                type="text"
                className="w-50"
                {...register(
                  field,
                  field === "partName"
                    ? { required: "Please enter the part name" }
                    : field === "partNo"
                      ? { required: "Please enter the part number" }
                      : {},
                )}
              />
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mb-1">
            <small>Manufacturer</small>
            <DropdownComponent
              control={control}
              label="Manufacturer"
              fieldName="maker"
              requestedFor="maker"
            />
          </div>

          {DATE_FIELDS.map(({ label, field }) => (
            <div
              className="d-flex justify-content-between align-items-center mb-1"
              key={field}
            >
              <small>{label}</small>
              <input type="date" className="w-50" {...register(field)} />
            </div>
          ))}

          {errors?.partName && (
            <p className="text-error">{errors?.partName?.message}</p>
          )}
          {errors?.partNo && (
            <p className="text-error">{errors?.partNo?.message}</p>
          )}

          <Row className="border p-2 mt-2">
            <Col>
              <small className="fw-bold d-block mb-1">
                Only for Tool Room use
              </small>
              <div className="d-flex align-items-center gap-3">
                <small>Request</small>
                <Form.Check
                  inline
                  type="radio"
                  label="OK"
                  value="OK"
                  disabled={!isToolRoom}
                  {...register("toolRoomRequestStatus")}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="NOT OK"
                  value="NOT OK"
                  disabled={!isToolRoom}
                  {...register("toolRoomRequestStatus")}
                />
              </div>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default RepairedQualityConfirmationForm;
