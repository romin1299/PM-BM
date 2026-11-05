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

const url = "/v1/spare/changeRequest";

/**
 * The paper form "SPARE PARTS REQUEST / STOCK IN, CHANGE REQ.".
 *
 * Field types follow the request-sheet form: the maker is picked from the
 * makers catalogue, and each of the NEW and OLD columns has its own line →
 * machine cascade (only the machine id is sent; the server resolves the line
 * above it). The approval boxes at the bottom are one select per step of the
 * department's route.
 */

const TEXT_FIELDS = [
  { label: "Part Name", field: "partName" },
  { label: "Part No", field: "partNo" },
];

const NUMBER_FIELDS = [
  { label: "Max Qty", field: "maxQty" },
  { label: "Min Qty", field: "minQty" },
  { label: "Monthly Requirement", field: "monthlyRequirement" },
  { label: "Stock In Qty", field: "stockInQty" },
];

const emptyPart = () =>
  Object.fromEntries(
    [...TEXT_FIELDS, ...NUMBER_FIELDS, { field: "maker" }].map(({ field }) => [
      field,
      "",
    ]),
  );

const partDefaults = (part = {}) => ({
  ...emptyPart(),
  partName: part.partName ?? "",
  partNo: part.partNo ?? "",
  // Records raised before the maker dropdown existed stored "manufacturer".
  maker: part.maker ?? part.manufacturer ?? "",
  maxQty: part.maxQty ?? "",
  minQty: part.minQty ?? "",
  monthlyRequirement: part.monthlyRequirement ?? "",
  stockInQty: part.stockInQty ?? "",
});

const buildDefaults = (initial) => ({
  requestFor: initial?.requestFor ?? "MTD",
  partsCategory: initial?.partsCategory ?? "NEW",
  newPart: initial ? partDefaults(initial.newPart) : emptyPart(),
  oldPart: initial ? partDefaults(initial.oldPart) : emptyPart(),
  reason: initial?.reason ?? "",
  requestDate:
    initial?.requestDate ?? new Date().toISOString().slice(0, 10),
  toolRoom: {
    locationNo: initial?.toolRoom?.locationNo ?? "",
    requestStatus: initial?.toolRoom?.requestStatus ?? "",
  },
});

/** Line text for view mode, reading the current shape and the older ones. */
const lineTextOf = (part, sharedLine) => {
  if (part?.line?.line_name) return part.line.line_name;
  if (sharedLine?.line_name) return sharedLine.line_name;
  return typeof part?.line === "string" && part.line ? part.line : "-";
};

/** "CODE - NAME" for view mode, reading the current shape and the older ones. */
const machineTextOf = (part, sharedMachine) =>
  [
    part?.machine?.machine_code ||
      sharedMachine?.machine_code ||
      part?.machineNo,
    part?.machine?.machine_name ||
      sharedMachine?.machine_name ||
      part?.machineName,
  ]
    .filter(Boolean)
    .join(" - ");

const machineOf = (state) =>
  state?.machines?.find(
    (item) => String(item?._id) === String(state?.selectedMachine),
  );

const PartDetailsColumn = ({ title, prefix, register, control, readOnly }) => (
  <Col className="border p-2">
    <small className="fw-bold d-block mb-2">{title}</small>

    {TEXT_FIELDS.map(({ label, field }) => (
      <div
        className="d-flex justify-content-between align-items-center mb-1"
        key={field}
      >
        <small>{label}</small>
        <input
          type="text"
          disabled={readOnly}
          className="w-50"
          {...register(`${prefix}.${field}`)}
        />
      </div>
    ))}

    <div className="d-flex justify-content-between align-items-center mb-1">
      <small>Maker</small>
      {readOnly ? (
        <input
          type="text"
          disabled
          className="w-50"
          {...register(`${prefix}.maker`)}
        />
      ) : (
        <DropdownComponent
          control={control}
          label="Maker"
          fieldName={`${prefix}.maker`}
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
          disabled={readOnly}
          className="w-50"
          {...register(`${prefix}.${field}`, {
            setValueAs: (value) => (value === "" ? null : Number(value)),
          })}
        />
      </div>
    ))}
  </Col>
);

const ChangeRequestForm = ({
  show,
  onHide,
  onSaved,
  isToolRoom = false,
  user,
  initialValues = null,
}) => {
  const isView = Boolean(initialValues);

  const [newReduceState, newReducerDispatch] = useReducer(
    reducer,
    initialState(),
  );
  const [oldReduceState, oldReducerDispatch] = useReducer(
    reducer,
    initialState(),
  );
  const [hierarchyError, setHierarchyError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: buildDefaults(initialValues) });

  const requestFor = watch("requestFor");

  const newMachine = machineOf(newReduceState);
  const oldMachine = machineOf(oldReduceState);

  const handleSubmitRequest = async (formValue) => {
    if (!newReduceState?.selectedMachine) {
      setHierarchyError("Please select the NEW line and machine");
      return;
    }
    if (!oldReduceState?.selectedMachine) {
      setHierarchyError("Please select the OLD line and machine");
      return;
    }
    setHierarchyError("");

    const { isError } = await axiosPostOrPatch({
      url,
      apiType: "post",
      axiosBody: {
        ...formValue,
        newPartMachineId: newReduceState.selectedMachine,
        oldPartMachineId: oldReduceState.selectedMachine,
      },
    });
    if (!isError) onSaved?.();
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          {initialValues?.requestNo
            ? `Change Request ${initialValues.requestNo}`
            : "New Change Request"}
        </Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(handleSubmitRequest)}>
        {/* Explicit height as well as `scrollable`: the form is long, and the
            approval row at the bottom must never be out of reach. */}
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

          <Row className="mb-2">
            <Col className="border p-2">
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
            </Col>
            <Col className="border p-2">
              <small className="fw-bold d-block mb-1">Parts Category</small>
              <div className="d-flex gap-3">
                {["NEW", "RE-USE"].map((value) => (
                  <Form.Check
                    key={value}
                    inline
                    type="radio"
                    label={value}
                    value={value}
                    disabled={isView}
                    {...register("partsCategory", {
                      required: "Select the parts category",
                    })}
                  />
                ))}
              </div>
            </Col>
          </Row>

          {isView ? (
            <>
              <div className="border p-2 mb-2 d-flex gap-4">
                <small>
                  <b>NEW line:</b>{" "}
                  {lineTextOf(initialValues?.newPart, initialValues?.line)}
                </small>
                <small>
                  <b>NEW machine:</b>{" "}
                  {machineTextOf(initialValues?.newPart, initialValues?.machine) ||
                    "-"}
                </small>
              </div>
              <div className="border p-2 mb-2 d-flex gap-4">
                <small>
                  <b>OLD line:</b>{" "}
                  {lineTextOf(initialValues?.oldPart, initialValues?.line)}
                </small>
                <small>
                  <b>OLD machine:</b>{" "}
                  {machineTextOf(initialValues?.oldPart, initialValues?.machine) ||
                    "-"}
                </small>
              </div>
            </>
          ) : (
            <>
              <LineMachinePicker
                label="NEW — Line / Machine"
                state={newReduceState}
                dispatch={newReducerDispatch}
                selectedMachine={newMachine}
              />

              <LineMachinePicker
                label="OLD — Line / Machine"
                state={oldReduceState}
                dispatch={oldReducerDispatch}
                selectedMachine={oldMachine}
              />

              {hierarchyError && (
                <p className="text-error mb-2">{hierarchyError}</p>
              )}
            </>
          )}

          <Row className="mb-2">
            <PartDetailsColumn
              title="NEW"
              prefix="newPart"
              register={register}
              control={control}
              readOnly={isView}
            />
            <PartDetailsColumn
              title="OLD"
              prefix="oldPart"
              register={register}
              control={control}
              readOnly={isView}
            />
          </Row>

          <div className="mb-2">
            <small className="fw-bold d-block">Reason</small>
            <textarea
              className="w-100"
              rows={2}
              disabled={isView}
              placeholder="Reason for the change"
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
                <div>
                  <small>Location No.</small>
                  <input
                    type="text"
                    disabled={isView || !isToolRoom}
                    placeholder="Location"
                    className="ms-1"
                    {...register("toolRoom.locationNo")}
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
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
              </div>
            </Col>
          </Row>

          {!isView && (
            <ApprovalSelection
              url="/v1/spare/changeRequest/approvers"
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

export default ChangeRequestForm;
