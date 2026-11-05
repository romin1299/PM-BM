import React, { memo } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FactCheckIcon from "@mui/icons-material/FactCheck";

import SpareRequestDashboard from "../../Component/Common/SpareRequestDashboard";
import ChangeRequestForm from "./ChangeRequestForm";
import ChangeRequestApproval from "./ChangeRequestApproval";

const url = "/v1/spare/changeRequest";

/**
 * The table's columns: header text and the row field behind it, which is also
 * the key the column filter and its values endpoint use.
 */
const TABLE_COLUMNS = [
  { header: "Request No", key: "requestNo" },
  { header: "Date", key: "requestDate" },
  { header: "Dept", key: "requestFor" },
  { header: "Category", key: "partsCategory" },
  { header: "New Part", key: "newPart.partName" },
  { header: "New Part No", key: "newPart.partNo" },
  { header: "Old Part", key: "oldPart.partName" },
  { header: "Old Part No", key: "oldPart.partNo" },
  { header: "New Line", key: "newPart.line.line_name" },
  { header: "New Machine", key: "newPart.machine.machine_code" },
  { header: "Old Line", key: "oldPart.line.line_name" },
  { header: "Old Machine", key: "oldPart.machine.machine_code" },
  { header: "Reason", key: "reason" },
  { header: "Status", key: "requestStatus" },
  { header: "Pending With", key: "pendingWith" },
  { header: "Action", key: null },
];

const TABLE_HEADERS = TABLE_COLUMNS.map((column) => column.header);

const statusTone = (status) => {
  if (status === "Completed") return "#2e7d32";
  if (status === "Rejected") return "#c62828";
  return "#b26a00";
};

/** Line text, reading the current shape and the earlier ones. */
const lineOf = (part, shared) => {
  if (part?.line?.line_name) return part.line.line_name;
  if (shared?.line_name) return shared.line_name;
  return typeof part?.line === "string" ? part.line : "";
};

/** "CODE - NAME" for a side's machine, reading the current and earlier shapes. */
const machineOf = (part, shared) =>
  [
    part?.machine?.machine_code || shared?.machine_code || part?.machineNo,
    part?.machine?.machine_name || shared?.machine_name || part?.machineName,
  ]
    .filter(Boolean)
    .join(" - ");

const ChangeRequestRow = memo(({ otherData, loggedUserId, onView, onApprove }) => {
  const canApprove =
    String(otherData?.pendingApprovalBy ?? "") === String(loggedUserId ?? "");

  return (
    <>
      <td className="td-padding">{otherData?.requestNo}</td>
      <td className="td-padding">{otherData?.requestDate}</td>
      <td className="td-padding">{otherData?.requestFor}</td>
      <td className="td-padding">{otherData?.partsCategory}</td>
      <td className="td-padding">{otherData?.newPart?.partName}</td>
      <td className="td-padding">{otherData?.newPart?.partNo}</td>
      <td className="td-padding">{otherData?.oldPart?.partName}</td>
      <td className="td-padding">{otherData?.oldPart?.partNo}</td>
      <td className="td-padding">
        {lineOf(otherData?.newPart, otherData?.line)}
      </td>
      <td className="td-padding">
        {machineOf(otherData?.newPart, otherData?.machine)}
      </td>
      <td className="td-padding">
        {lineOf(otherData?.oldPart, otherData?.line)}
      </td>
      <td className="td-padding">
        {machineOf(otherData?.oldPart, otherData?.machine)}
      </td>
      <td className="td-padding">{otherData?.reason}</td>
      <td className="td-padding">
        <span
          className="badge"
          style={{ background: statusTone(otherData?.requestStatus), color: "#fff" }}
        >
          {otherData?.requestStatus}
        </span>
      </td>
      <td className="td-padding">{otherData?.pendingWith || "-"}</td>
      <td className="td-padding">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <VisibilityIcon
            fontSize="small"
            className="button-style text-primary"
            onClick={() => onView(otherData)}
          />
          {canApprove && (
            <FactCheckIcon
              fontSize="small"
              className="button-style defaultColor"
              onClick={() => onApprove(otherData)}
            />
          )}
        </div>
      </td>
    </>
  );
});

const SpareChangeRequestDashboard = () => (
  <SpareRequestDashboard
    title="Change Request Dashboard"
    url={url}
    exportUrl={`${url}/export`}
    tableHeaders={TABLE_HEADERS}
    columns={TABLE_COLUMNS}
    columnValuesUrl={`${url}/columnValues`}
    RowComponent={ChangeRequestRow}
    FormComponent={ChangeRequestForm}
    ApprovalComponent={ChangeRequestApproval}
    newButtonLabel="New Change Request"
  />
);

export default SpareChangeRequestDashboard;
