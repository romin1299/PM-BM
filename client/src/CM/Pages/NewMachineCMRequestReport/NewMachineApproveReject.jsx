import React from "react";
import { Form } from "react-bootstrap";
import axios from "axios";

import { APPROVAL_STAGES, currentStage, signatureAt } from "./newMachineApprovalStages";

/**
 * The decision the current approver records on the sheet.
 *
 * Fields only, registered on the sheet's own form: saving the sheet and
 * deciding on it are one action for the approver, so they are one submit —
 * a separate button for the decision left the two able to disagree about what
 * had been saved.
 *
 * Approving hands the sheet to the next stage of the chain; rejecting ends it,
 * and the remark saying why is required — a sheet returned without a reason
 * tells the requester nothing about what to change.
 */

export const DECISION_FIELD = "approvalDecision";
export const DECISION_REMARKS_FIELD = "approvalRemarks";

/**
 * Records the decision. The endpoint works out which signature box to sign
 * from the sheet's status, and needs the whole chain with it to name the next
 * approver, so every signature is sent rather than only the one being signed.
 */
export const submitApprovalDecision = async ({ sheet, decision, remarks }) => {
  const signatures = Object.fromEntries(
    APPROVAL_STAGES.map((stage) => [stage.bodyKey, signatureAt(sheet, stage)]),
  );

  return axios.patch(`/approveOrRejectNewMachineRequestSheet/${sheet?._id}`, {
    ...signatures,
    statusOfNewRequestOfCM: sheet?.statusOfNewRequestOfCM,
    approvalOfRequestSheet: decision,
    rejectedRemarksOfRequestSheet:
      decision === "No" ? String(remarks ?? "").trim() : undefined,
  });
};

const NewMachineApproveReject = ({ sheet, register, watch, errors }) => {
  const stage = currentStage(sheet);
  if (!stage) return null;

  const decision = watch(DECISION_FIELD);

  return (
    <div className="border rounded p-2 mt-3 bg-light mm-no-print">
      <div className="mb-1">
        <b>Your approval is pending — {stage.label}</b>{" "}
        <small className="text-muted">({stage.caption})</small>
      </div>

      <div className="d-flex align-items-center gap-3 flex-wrap">
        <Form.Check
          inline
          type="radio"
          id="newMachineApproval_yes"
          label="Approve"
          value="Yes"
          {...register(DECISION_FIELD, { required: "Select Approve or Reject." })}
        />
        <Form.Check
          inline
          type="radio"
          id="newMachineApproval_no"
          label="Reject"
          value="No"
          {...register(DECISION_FIELD, { required: "Select Approve or Reject." })}
        />

        {/* Asked for on a rejection only: an approval needs no explanation. */}
        {decision === "No" && (
          <Form.Control
            size="sm"
            style={{ maxWidth: 420 }}
            placeholder="Remarks (required)"
            {...register(DECISION_REMARKS_FIELD, {
              validate: (value) =>
                watch(DECISION_FIELD) !== "No" ||
                String(value ?? "").trim().length > 0 ||
                "Enter the remarks for rejecting this sheet.",
            })}
          />
        )}
      </div>

      {errors?.[DECISION_FIELD] ? (
        <div className="text-danger mt-1">{errors[DECISION_FIELD].message}</div>
      ) : null}
      {errors?.[DECISION_REMARKS_FIELD] ? (
        <div className="text-danger mt-1">
          {errors[DECISION_REMARKS_FIELD].message}
        </div>
      ) : null}
    </div>
  );
};

export default NewMachineApproveReject;
