import React, { useReducer, useState } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import {
  initialState,
  reducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import { DropdownComponent } from "../SpareMasterRegistration/SpareMasterRegistration";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";
import ApprovalSelection from "../../Component/Common/ApprovalSelection";
import LineMachinePicker from "../../Component/Common/LineMachinePicker";
import SpareApprovalTrack from "../../Component/Common/SpareApprovalTrack";

const url = "/v1/spare/deleteRequest";

/**
 * The paper form "REQUEST FOR DELETE" (FO/MTD/05/05/02): department, one part,
 * its reason and date, the tool-room-only answer, and the approval boxes.
 *
 * Input types follow the request forms: maker from the makers catalogue, and
 * line → machine from the same hierarchy cascade (only the machine id is sent;
 * the server resolves the line above it).
 */

const TEXT_FIELDS = [
  { label: "Part Name", field: "partName" },
  { label: "Part No", field: "partNo" },
];

const NUMBER_FIELDS = [
  { label: "Price", field: "price" },
  { label: "Qty", field: "qty" },
];

const buildDefaults = (initial) => ({
  requestFor: initial?.requestFor ?? "MTD",
  partName: initial?.partName ?? "",
  partNo: initial?.partNo ?? "",
  maker: initial?.maker ?? "",
  price: initial?.price ?? "",
  qty: initial?.qty ?? "",
  reason: initial?.reason ?? "",
  requestDate:
    initial?.requestDate ?? new Date().toISOString().slice(0, 10),
  toolRoom: {
    requestStatus: initial?.toolRoom?.requestStatus ?? "",
  },
});

const DeleteRequestForm = ({
  show,
  onHide,
  onSaved,
  isToolRoom = false,
  user,
  initialValues = null,
}) => {
  const isView = Boolean(initialValues);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const [hierarchyError, setHierarchyError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: buildDefaults(initialValues) });

  const requestFor = watch("requestFor");

  const selectedMachine = reduceState?.machines?.find(
    (item) => String(item?._id) === String(reduceState?.selectedMachine),
  );

  const handleSubmitRequest = async (formValue) => {
    if (!reduceState?.selectedMachine) {
      setHierarchyError("Please select the line and machine");
      return;
    }
    setHierarchyError("");

    const { isError } = await axiosPostOrPatch({
      url,
      apiType: "post",
      axiosBody: {
        ...formValue,
        machineId: reduceState.selectedMachine,
      },
    });
    if (!isError) onSaved?.();
  };

  const lineText = initialValues?.line?.line_name || "-";
  const machineText = [
    initialValues?.machine?.machine_code,
    initialValues?.machine?.machine_name,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialValues?.requestNo
            ? `Delete Request ${initialValues.requestNo}`
            : "New Delete Request"}
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(handleSubmitRequest)}>
        <Modal.Body style={{ maxHeight: "68vh", overflowY: "auto" }}>
          <div className="border p-2 mb-2 d-flex justify-content-between">
            <small>
              <b>Requested by:</b>{" "}
              {initialValues?.createdBy?.tm_name ?? user?.tm_name} (
              {initialValues?.createdBy?.tm_no ?? user?.tm_no})
            </small>
            <small className="text-muted">
              Checked by HOSS &amp; HOS → Approved by HOD → Tool Room
            </small>
          </div>

          <div className="border p-2 mb-2">
            <small className="fw-bold d-block mb-1">Request by</small>
            <div className="d-flex gap-3">
              {["MTD", "PRD"].map((value) => (
                <Form.Check
                  key={value}
                  inline
                  type="radio"
                  label={value}
                  value={value}
                  disabled={isView}
                  {...register("requestFor", { required: "Select MTD or PRD" })}
                />
              ))}
            </div>
          </div>

          {isView ? (
            <div className="border p-2 mb-2 d-flex gap-4">
              <small>
                <b>Line:</b> {lineText}
              </small>
              <small>
                <b>Machine:</b> {machineText || "-"}
              </small>
            </div>
          ) : (
            <>
              <LineMachinePicker
                label="Line / Machine"
                state={reduceState}
                dispatch={reducerDispatch}
                selectedMachine={selectedMachine}
              />
              {hierarchyError && (
                <p className="text-error mb-2">{hierarchyError}</p>
              )}
            </>
          )}

          <div className="border p-2 mb-2">
            <small className="fw-bold d-block mb-1">Part details</small>

            {TEXT_FIELDS.map(({ label, field }) => (
              <div
                className="d-flex justify-content-between align-items-center mb-1"
                key={field}
              >
                <small>{label}</small>
                <input
                  type="text"
                  disabled={isView}
                  className="w-50"
                  {...register(field)}
                />
              </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mb-1">
              <small>Maker</small>
              {isView ? (
                <input
                  type="text"
                  disabled
                  className="w-50"
                  {...register("maker")}
                />
              ) : (
                <DropdownComponent
                  control={control}
                  label="Maker"
                  fieldName="maker"
                  requestedFor="maker"
                />
              )}
            </div>

            {NUMBER_FIELDS.map(({ label, field }) => (
              <div
                className="d-flex justify-content-between align-items-center mb-1"
                key={field}
              >
                <small>{label}</small>
                <input
                  type="number"
                  min="0"
                  disabled={isView}
                  className="w-50"
                  {...register(field, {
                    setValueAs: (value) => (value === "" ? null : Number(value)),
                  })}
                />
              </div>
            ))}
          </div>

          <div className="mb-2">
            <small className="fw-bold d-block">Reason</small>
            <textarea
              className="w-100"
              rows={2}
              disabled={isView}
              placeholder="Reason for delete"
              {...register("reason", { required: "Please enter the reason" })}
            />
            {errors?.reason && (
              <p className="text-error">{errors?.reason?.message}</p>
            )}
          </div>

          <Row className="mb-2">
            <Col className="border p-2">
              <small className="fw-bold d-block mb-1">Date</small>
              <input type="date" disabled={isView} {...register("requestDate")} />
            </Col>
            <Col className="border p-2">
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
                  disabled={isView || !isToolRoom}
                  {...register("toolRoom.requestStatus")}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="NOT OK"
                  value="NOT OK"
                  disabled={isView || !isToolRoom}
                  {...register("toolRoom.requestStatus")}
                />
              </div>
            </Col>
          </Row>

          {!isView && (
            <ApprovalSelection
              url="/v1/spare/deleteRequest/approvers"
              register={register}
              control={control}
              errors={errors}
              department={requestFor}
            />
          )}

          {isView && (
            <SpareApprovalTrack
              approvals={initialValues?.approvals ?? []}
              currentApprovalIndex={initialValues?.currentApprovalIndex ?? 0}
              requestStatus={initialValues?.requestStatus}
            />
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {isView ? "Close" : "Cancel"}
          </Button>
          {!isView && <Button type="submit">Send for Approval</Button>}
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default DeleteRequestForm;
