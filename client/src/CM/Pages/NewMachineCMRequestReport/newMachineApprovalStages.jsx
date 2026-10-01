import React from "react";
import moment from "moment";

/**
 * The approval chain of the modification-work sheet, in the order the form
 * routes it: the requesting department checks and approves its own request,
 * then MTD approves the work.
 *
 * One list, used by everything that needs to know the chain — the track on the
 * sheet, the approve/reject panel, and the approval dashboard — so the order
 * and the wording cannot drift between them.
 */
export const APPROVAL_STAGES = [
  {
    label: "PED HOS",
    caption: "Checked by",
    /** Where the signature lives on the sheet. */
    path: "newMachineRequestFilledByPED.checkedByPED_HOS",
    /** The sheet's status while it waits here. */
    status: "Under PED HOS Approval",
    /** What the approval endpoint calls this signature. */
    bodyKey: "checkedByPED_HOS",
  },
  {
    label: "PED HOD",
    caption: "Approved by HOD",
    path: "newMachineRequestFilledByPED.approvedByPED_HOD",
    status: "Under PED HOD Approval",
    bodyKey: "approvedByPED_HOD",
  },
  {
    label: "MTD HOSS",
    caption: "Modification work approval",
    path: "filledByMTD_User.modificationWork_ApprovedByMTD_HOSS",
    status: "Under MTD HOSS Approval",
    bodyKey: "modificationWork_ApprovedByMTD_HOSS",
  },
  {
    label: "MTD HOS",
    caption: "Modification work approval",
    path: "filledByMTD_User.modificationWork_ApprovedByMTD_HOS",
    status: "Under MTD HOS Approval",
    bodyKey: "modificationWork_ApprovedByMTD_HOS",
  },
  {
    label: "MTD HOD",
    caption: "Modification work approval",
    path: "filledByMTD_User.modificationWork_ApprovedByMTD_HOD",
    status: "Under MTD HOD Approval",
    bodyKey: "modificationWork_ApprovedByMTD_HOD",
  },
];

/** The signature stored at a stage of the given sheet. */
export const signatureAt = (sheet, stage) =>
  stage.path.split(".").reduce((value, key) => value?.[key], sheet)?.[0];

/** The stage a sheet is waiting at, or undefined once it has left the chain. */
export const currentStage = (sheet) =>
  APPROVAL_STAGES.find(
    (stage) => stage.status === sheet?.statusOfNewRequestOfCM,
  );

/**
 * Whether this person is the one the sheet is waiting on. The sheet itself
 * names the next approver, so that is what is asked rather than matching the
 * viewer's grade against the stage.
 */
export const isCurrentApprover = (sheet, userId) =>
  Boolean(userId) &&
  Boolean(currentStage(sheet)) &&
  String(sheet?.getDataForApprovalDashboard?.Id ?? "") === String(userId);

const TONE = {
  Accepted: "text-success",
  Rejected: "text-danger",
  Pending: "text-warning",
};

const when = (value) =>
  value ? moment(value).format("DD-MM-YYYY HH:mm") : "-";

/**
 * Where the sheet stands, stage by stage: who each stage is with, what they
 * decided and when. The stage the sheet is waiting at is marked, so a reader
 * can see at a glance whose desk it is on.
 */
const NewMachineApprovalTrack = ({ sheet, compact = false }) => {
  const waitingAt = currentStage(sheet);

  const rows = APPROVAL_STAGES.map((stage) => {
    const signature = signatureAt(sheet, stage);
    return {
      stage,
      name: signature?.tm_name,
      status: signature?.approvalStatus || "Pending",
      on: signature?.approvalDateAndTime,
      isWaiting: waitingAt?.status === stage.status,
    };
  });

  // Rejection is recorded once for the sheet, not per stage.
  const rejectedRemarks = []
    .concat(sheet?.rejectedRemarksOfRequestSheet ?? [])
    .filter(Boolean);

  if (compact)
    return (
      <div style={{ fontSize: 12, lineHeight: 1.4 }}>
        {rows.map(({ stage, name, status, isWaiting }) => (
          <div key={stage.status}>
            <b>{stage.label}:</b>{" "}
            <span className={TONE[status] ?? ""}>{status}</span>
            {name ? ` — ${name}` : ""}
            {isWaiting ? " ⏳" : ""}
          </div>
        ))}
      </div>
    );

  return (
    <div className="mt-3">
      <h6 className="mb-1">Approval tracking</h6>
      <table className="table table-sm table-bordered mb-1" style={{ fontSize: 13 }}>
        <thead className="table-light">
          <tr>
            <th>Stage</th>
            <th>On the sheet as</th>
            <th>Approver</th>
            <th>Status</th>
            <th>Date &amp; time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ stage, name, status, on, isWaiting }) => (
            <tr key={stage.status} className={isWaiting ? "table-warning" : ""}>
              <td>
                {stage.label}
                {isWaiting ? <b> (with them now)</b> : null}
              </td>
              <td>{stage.caption}</td>
              <td>{name ?? "-"}</td>
              <td className={TONE[status] ?? ""}>
                <b>{status}</b>
              </td>
              <td>{when(on)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rejectedRemarks.length > 0 && (
        <div className="alert alert-danger py-1 px-2 mb-0" style={{ fontSize: 13 }}>
          <b>Rejection remarks:</b>{" "}
          {rejectedRemarks.map((remark, index) => (
            <div key={index}>{remark}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewMachineApprovalTrack;
