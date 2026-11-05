import React, { memo } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FactCheckIcon from "@mui/icons-material/FactCheck";

import SpareRequestDashboard from "../../Component/Common/SpareRequestDashboard";
import DeleteRequestForm from "./DeleteRequestForm";
import DeleteRequestApproval from "./DeleteRequestApproval";

const url = "/v1/spare/deleteRequest";

/**
 * The table's columns: header text and the row field behind it, which is also
 * the key the column filter and its values endpoint use.
 */
const TABLE_COLUMNS = [
  { header: "Request No", key: "requestNo" },
  { header: "Date", key: "requestDate" },
  { header: "Dept", key: "requestFor" },
  { header: "Part", key: "partName" },
  { header: "Part No", key: "partNo" },
  { header: "Maker", key: "maker" },
  { header: "Price", key: "price" },
  { header: "Qty", key: "qty" },
  { header: "Line", key: "line.line_name" },
  { header: "Machine", key: "machine.machine_code" },
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

const machineOf = (machine) =>
  [machine?.machine_code, machine?.machine_name].filter(Boolean).join(" - ");

const DeleteRequestRow = memo(({ otherData, loggedUserId, onView, onApprove }) => {
  const canApprove =
    String(otherData?.pendingApprovalBy ?? "") === String(loggedUserId ?? "");

  return (
    <>
      <td className="td-padding">{otherData?.requestNo}</td>
      <td className="td-padding">{otherData?.requestDate}</td>
      <td className="td-padding">{otherData?.requestFor}</td>
      <td className="td-padding">{otherData?.partName}</td>
      <td className="td-padding">{otherData?.partNo}</td>
      <td className="td-padding">{otherData?.maker}</td>
      <td className="td-padding">{otherData?.price}</td>
      <td className="td-padding">{otherData?.qty}</td>
      <td className="td-padding">{otherData?.line?.line_name}</td>
      <td className="td-padding">{machineOf(otherData?.machine)}</td>
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

const SpareDeleteRequestDashboard = () => (
  <SpareRequestDashboard
    title="Delete Request Dashboard"
    url={url}
    exportUrl={`${url}/export`}
    tableHeaders={TABLE_HEADERS}
    columns={TABLE_COLUMNS}
    columnValuesUrl={`${url}/columnValues`}
    RowComponent={DeleteRequestRow}
    FormComponent={DeleteRequestForm}
    ApprovalComponent={DeleteRequestApproval}
    newButtonLabel="New Delete Request"
  />
);

export default SpareDeleteRequestDashboard;
