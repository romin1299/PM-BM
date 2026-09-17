import React, { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { Row, Col } from "react-bootstrap";

import {
  SPARE_APPROVAL_FIELD_KEYS,
  SPARE_APPROVAL_LOG_FIELD_KEYS,
  SPARE_APPROVAL_STAGE_LABELS,
} from "../../Utils/dropdownUtils";

const STATUS_CLASS = {
  Accepted: "text-success",
  Rejected: "text-error",
  Pending: "text-warning",
};

/**
 * Where the sheet stands in its approval chain: every approver it was sent to,
 * in chain order, with their decision. Each slot holds its approver's latest
 * decision; when a slot is empty the newest entry of that slot's append-only
 * log stands in for it, so sheets whose slots were cleared by an earlier
 * rejection still show who had accepted before the sheet was stopped. Nothing
 * is shown until the sheet has been sent for approval.
 */
const SpareSheetApprovalTrack = ({ control }) => {
  const slots = useWatch({ control, name: SPARE_APPROVAL_FIELD_KEYS });
  const logs = useWatch({ control, name: SPARE_APPROVAL_LOG_FIELD_KEYS });
  const requestSheetStatus = useWatch({ control, name: "requestSheetStatus" });
  const pendingApprovalBy = useWatch({ control, name: "pendingApprovalBy" });

  const stages = useMemo(
    () =>
      SPARE_APPROVAL_FIELD_KEYS.map((key, index) => ({
        key,
        slot: slots?.[index]?.user?.tm_name
          ? slots[index]
          : logs?.[index]?.[logs[index].length - 1],
      }))
        .filter(({ slot }) => slot?.user?.tm_name)
        .map(({ key, slot }) => ({
          key,
          stage: slot.userType || SPARE_APPROVAL_STAGE_LABELS[key] || key,
          approver: slot.user.tm_name,
          status: slot.approvalStatus || "Pending",
          on: slot.approvalDateAndTime,
          remarks: slot.rejectedRemarks,
          isCurrent:
            Boolean(pendingApprovalBy) &&
            String(slot.user._id) === String(pendingApprovalBy),
        })),
    [slots, logs, pendingApprovalBy],
  );

  if (!stages.length) return null;

  return (
    <Row className="border">
      <Col className="p-0">
        <div className="d-flex align-items-center gap-2 p-1 border-bottom">
          <small>
            <b>Approval tracking</b>
          </small>
          <small>
            | Current status: <b>{requestSheetStatus}</b>
          </small>
        </div>
        <table className="ar-table w-auto m-1">
          <thead>
            <tr className="bg-button">
              {["Stage", "Approver", "Status", "Date & time", "Remarks"].map(
                (heading) => (
                  <th key={heading} className="td-padding text-white">
                    <small>{heading}</small>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.key} className="ar-table-thead-header4 tableRowColor">
                <td className="td-padding">
                  <small>{stage.stage}</small>
                </td>
                <td className="td-padding">
                  <small>{stage.approver}</small>
                </td>
                <td className="td-padding">
                  <small className={STATUS_CLASS[stage.status] ?? ""}>
                    <b>{stage.status}</b>
                    {stage.isCurrent && " (waiting)"}
                  </small>
                </td>
                <td className="td-padding">
                  <small>{stage.on ?? "-"}</small>
                </td>
                <td className="td-padding">
                  <small>{stage.remarks ?? "-"}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Col>
    </Row>
  );
};

export default SpareSheetApprovalTrack;
