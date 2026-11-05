import React from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { axiosPostOrPatch } from "../../Utils/axiosUtils";

/**
 * The approval popup shared by the change and delete request dashboards: a
 * read-only summary of the request, then approve / reject with remarks.
 *
 * The caller supplies the summary rows and the endpoint, so the two request
 * types differ only in what they show, not in how a decision is recorded.
 */
const SpareRequestApprovalModal = ({
  show,
  onHide,
  onSaved,
  row = {},
  url,
  title = "Request Approval",
  details = [],
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { isApproved: "", remarks: "" },
  });

  const isApproved = watch("isApproved");

  const handleDecision = async (formValue) => {
    const { isError } = await axiosPostOrPatch({
      url,
      apiType: "patch",
      axiosBody: formValue,
      axiosProps: { params: { _id: row?._id } },
    });
    if (!isError) onSaved?.();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(handleDecision)}>
        <Modal.Body>
          <div className="border p-2 mb-2">
            {details.map(({ label, value }) => (
              <Row className="mb-1" key={label}>
                <Col className="col-4">
                  <small className="text-muted">{label}</small>
                </Col>
                <Col>
                  <small>{value || "-"}</small>
                </Col>
              </Row>
            ))}
          </div>

          <div className="border p-2">
            <small className="fw-bold d-block mb-1">Decision</small>
            <div className="d-flex gap-3">
              <Form.Check
                inline
                type="radio"
                label="Approve"
                value="Yes"
                {...register("isApproved", {
                  required: "Please approve or reject",
                })}
              />
              <Form.Check
                inline
                type="radio"
                label="Reject"
                value="No"
                {...register("isApproved", {
                  required: "Please approve or reject",
                })}
              />
            </div>
            {errors?.isApproved && (
              <p className="text-error">{errors?.isApproved?.message}</p>
            )}

            {isApproved === "No" && (
              <div className="mt-2">
                <small className="text-muted d-block">Rejection remarks</small>
                <textarea
                  className="w-100"
                  rows={2}
                  placeholder="Enter rejection remarks"
                  {...register("remarks", {
                    required: "Please enter the rejection remarks",
                  })}
                />
                {errors?.remarks && (
                  <p className="text-error">{errors?.remarks?.message}</p>
                )}
              </div>
            )}
          </div>
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

export default SpareRequestApprovalModal;
