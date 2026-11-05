import React from "react";

const STEP_TONE = {
  Accepted: "#2e7d32",
  Rejected: "#c62828",
  Pending: "#b26a00",
};

/**
 * The approval track shown in a request's read-only view: every stage of the
 * route with its approver, decision and remarks, and the step it is currently
 * waiting on highlighted.
 *
 * Shared by the change, delete and repaired-part views so the three read the
 * same way. A record loaded outside the app (an Excel-uploaded repaired part)
 * simply has no chain and says so.
 */
const SpareApprovalTrack = ({
  approvals = [],
  currentApprovalIndex = 0,
  requestStatus,
}) => {
  const isOpen =
    requestStatus !== "Completed" && requestStatus !== "Rejected";

  return (
    <div className="border p-2 mt-2">
      <small className="fw-bold d-block mb-2">Approval track</small>
      <table className="w-100">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Approver</th>
            <th>Status</th>
            <th>Acted on</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((step, index) => {
            const current = isOpen && index === currentApprovalIndex;
            return (
              <tr
                key={step?.key ?? index}
                style={
                  current
                    ? { background: "#fff8e1", fontWeight: 600 }
                    : undefined
                }
              >
                <td>
                  <small>{step?.userType}</small>
                </td>
                <td>
                  <small>{step?.user?.tm_name || "-"}</small>
                </td>
                <td>
                  <small
                    style={{ color: STEP_TONE[step?.approvalStatus] ?? "" }}
                  >
                    {step?.approvalStatus}
                  </small>
                </td>
                <td>
                  <small>{step?.approvalDateAndTime || "-"}</small>
                </td>
                <td>
                  <small>{step?.rejectedRemarks || "-"}</small>
                </td>
              </tr>
            );
          })}
          {!approvals.length && (
            <tr>
              <td colSpan={5}>
                <small className="text-muted">No approval chain.</small>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SpareApprovalTrack;
