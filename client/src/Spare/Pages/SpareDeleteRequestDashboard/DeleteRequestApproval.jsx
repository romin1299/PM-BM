import React from "react";

import SpareRequestApprovalModal from "../../Component/Common/SpareRequestApprovalModal";

/**
 * A pending approver accepts or rejects the delete request. The popup itself is
 * shared with the change request; only the summary rows and endpoint differ.
 */
const DeleteRequestApproval = ({ show, onHide, onSaved, row = {} }) => {
  const details = [
    { label: "Request No", value: row?.requestNo },
    { label: "Department", value: row?.requestFor },
    { label: "Part", value: row?.partName },
    { label: "Part No", value: row?.partNo },
    { label: "Maker", value: row?.maker },
    { label: "Price", value: row?.price },
    { label: "Qty", value: row?.qty },
    { label: "Reason", value: row?.reason },
  ];

  return (
    <SpareRequestApprovalModal
      show={show}
      onHide={onHide}
      onSaved={onSaved}
      row={row}
      url="/v1/spare/deleteRequest/approval"
      title="Delete Request Approval"
      details={details}
    />
  );
};

export default DeleteRequestApproval;
