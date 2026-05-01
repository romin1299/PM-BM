import React, { memo, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import CircleIcon from "@mui/icons-material/Circle";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

import WithFilters from "../../Component/Common/WithFilters";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import OtherTaskStatusConfiguration from "./OtherTaskStatusConfiguration";

import "./SpareOrderTracking.scss";

const taskStatusMappingKeys = [
  "rsSubmitted",
  "rsHODApproval",
  "rsPRSubmitByToolroom",
  "rsPRAssignToAllBuyers",
  "rsPOIssueToVendor",
  "rsPartReceive",
];

const colorsBasedOnTaskStatus = {
  assigned: "white",
  runningLate: "red",
  achieved: "green",
  delayedApproval: "yellow",
};

const ViewTD = memo(({ _id, navigate }) => (
  <td className="td-padding ">
    <div className="d-flex align-items-center justify-content-center">
      <RemoveRedEyeIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() =>
          navigate(`/spare/spareNewPartRequest/?_id=${_id}&action=view`)
        }
      />
    </div>
  </td>
));

const PRLinkTD = memo(() => (
  <td className="td-padding ">
    <div className="d-flex align-items-center justify-content-center">
      <OpenInNewIcon fontSize="small" className="button-style text-primary" />
    </div>
  </td>
));

const EditTD = memo(({ _id, navigate }) => (
  <td className="td-padding ">
    <div className="d-flex align-items-center justify-content-center">
      <DescriptionIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() => navigate(`/spare/spareNewPartRequest/?_id=${_id}`)}
      />
    </div>
  </td>
));

const RejectTD = memo(({ _id, onDelete }) => (
  <td className="td-padding ">
    <div className="d-flex align-items-center justify-content-center">
      <DeleteIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() => onDelete(_id)}
      />
    </div>
  </td>
));

const EditOtherTrackingFields = memo(
  ({ otherData, updateRow, handleModal }) => (
    <div className="d-flex align-items-center justify-content-center flex-column">
      <EditIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() =>
          handleModal({
            selectedRow: otherData,
            updateRow,
          })
        }
      />
    </div>
  ),
);

const TaskStatusMappingComponent = memo(
  ({
    otherData,
    navigate,
    handleDelete,
    removeRow,
    handleModal,
    updateRow,
  }) => (
    <>
      <ViewTD _id={otherData?._id} navigate={navigate} />
      <PRLinkTD />
      <EditTD _id={otherData?._id} navigate={navigate} />
      <RejectTD
        _id={otherData?._id}
        onDelete={(_id) => handleDelete(_id, removeRow)}
      />
      {taskStatusMappingKeys?.map((key = "") => (
        <td className="td-padding ">
          {otherData?.[key]?.taskStatus && (
            <div className="d-flex align-items-center justify-content-center flex-column">
              <CircleIcon
                fontSize="small"
                sx={{
                  display: "inline-flex",
                  border:
                    colorsBasedOnTaskStatus?.[otherData?.[key]?.taskStatus] ===
                    "white"
                      ? "1px solid grey"
                      : "none",
                  borderRadius: "50%",
                  color:
                    colorsBasedOnTaskStatus?.[otherData?.[key]?.taskStatus],
                }}
              />
              {otherData?.[key]?.timeStamp}
            </div>
          )}
        </td>
      ))}
      <td className="td-padding ">
        {otherData?.requestSheetStatus === "Completed" && (
          <EditOtherTrackingFields
            handleModal={handleModal}
            otherData={otherData}
            updateRow={updateRow}
          />
        )}
      </td>
    </>
  ),
);

const OrderTrackingDashboard = memo((props) => {
  const navigate = useNavigate();

  const handleDelete = useCallback(async (_id, removeRow) => {
    const { isError } = await axiosGetOrDelete({
      apiType: "delete",
      url: "/v1/spare/spareRequestSheet",
      axiosProps: {
        params: {
          _id,
        },
      },
    });
    if (!isError) return removeRow(_id);
  }, []);

  const [modelState, setModelState] = useState({
    show: false,
    selectedRow: {},
    updateRow: () => {},
  });

  const handleModal = useCallback(
    (propState) =>
      setModelState((prev) => ({
        show: !prev?.show,
        ...propState,
      })),
    [],
  );

  const otherParentProps = useMemo(
    () => ({ navigate, handleDelete, handleModal }),
    [navigate, handleDelete, handleModal],
  );

  return (
    <div className="container-fluid" style={{ overflow: "auto" }}>
      <SpareSheetCustomTable
        {...props}
        url="/v1/spare/spareOrderTacking/spareRequestSheet"
        otherHeaders={[
          "View",
          "PR Link",
          "Edit",
          "Reject",
          "Request Submitted",
          "Internal Approval",
          "PR Generation",
          "PR Approval",
          "PO Made",
          "Part Receipt",
          "Action",
        ]}
        OtherComp={TaskStatusMappingComponent}
        otherParentProps={otherParentProps}
      />

      {modelState?.show && (
        <OtherTaskStatusConfiguration
          {...modelState}
          handleModal={handleModal}
        />
      )}
    </div>
  );
});

const SpareOrderingDashboard = () => (
  <WithFilters
    title="Ordered Spare Part Tracking"
    PropComp={OrderTrackingDashboard}
  />
);

export default SpareOrderingDashboard;
