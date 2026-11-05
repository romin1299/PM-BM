import React from "react";

import SpareRequestApprovalModal from "../../Component/Common/SpareRequestApprovalModal";

/**
 * A pending approver accepts or rejects the change request. The popup itself is
 * shared with the delete request; only the summary rows and the endpoint differ.
 */
const ChangeRequestApproval = ({ show, onHide, onSaved, row = {} }) => {
  const details = [
    { label: "Request No", value: row?.requestNo },
    { label: "Department", value: row?.requestFor },
    { label: "Category", value: row?.partsCategory },
    {
      label: "New Part",
      value: `${row?.newPart?.partName ?? ""} (${row?.newPart?.partNo ?? ""})`,
    },
    {
      label: "Old Part",
      value: `${row?.oldPart?.partName ?? ""} (${row?.oldPart?.partNo ?? ""})`,
    },
    { label: "Reason", value: row?.reason },
  ];

  return (
    <SpareRequestApprovalModal
      show={show}
      onHide={onHide}
      onSaved={onSaved}
      row={row}
      url="/v1/spare/changeRequest/approval"
      title="Change Request Approval"
      details={details}
    />
  );
};

export default ChangeRequestApproval;
