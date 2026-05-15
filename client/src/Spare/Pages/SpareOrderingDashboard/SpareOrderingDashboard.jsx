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
import OtherFilters from "./OtherFilters";
import SpareSummery from "../SpareSheets/SpareSummery";

import "./SpareOrderTracking.scss";

const taskStatusMappingKeys = [
  {
    key: "rsSubmitted",
    popupTitle: "",
  },
  {
    key: "rsHODApproval",
    popupTitle: "",
  },
  {
    key: "rsPRSubmitByToolroom",
    popupTitle: "",
  },
  {
    key: "rsPRAssignToAllBuyers",
    popupTitle: "PR Approval",
  },
  {
    key: "rsPOIssueToVendor",
    popupTitle: "PO Made",
  },
  {
    key: "rsPartReceive",
    popupTitle: "Part Receipt",
  },
  {
    key: "rsPartInspection",
    popupTitle: "Part Inspection",
  },
  {
    key: "rsMRNIssued",
    popupTitle: "MRN Issued",
  },
  {
    key: "rsMRNApproved",
    popupTitle: "MRN Approved",
  },
];

const partFields = [
  "rsPartReceive",
  "rsPartInspection",
  "rsMRNIssued",
  "rsMRNApproved",
];

const editableTaskStatus = new Set(
  taskStatusMappingKeys.slice(-6)?.map((task) => task.key),
);

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
  ({ popupRef, otherData, updateRow, handleModal }) => (
    <div className="d-flex align-items-center justify-content-center flex-column">
      <EditIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() => {
          let axiosParams = {
            _id: otherData?._id,
            requestedField: popupRef?.key,
          };

          if (partFields?.includes(popupRef?.key))
            axiosParams["partId"] = otherData?.changeParts?._id;

          handleModal({
            popupRef,
            selectedRow: otherData,
            updateRow,
            axiosParams,
          });
        }}
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
    mode,
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
      {taskStatusMappingKeys?.map((item) => (
        <td className="td-padding ">
          {otherData?.[item?.key]?.taskStatus && (
            <div className="d-flex align-items-center justify-content-center flex-column">
              <CircleIcon
                fontSize="small"
                sx={{
                  display: "inline-flex",
                  border:
                    colorsBasedOnTaskStatus?.[
                      otherData?.[item?.key]?.taskStatus
                    ] === "white"
                      ? "1px solid grey"
                      : "none",
                  borderRadius: "50%",
                  color:
                    colorsBasedOnTaskStatus?.[
                      otherData?.[item?.key]?.taskStatus
                    ],
                }}
              />
              {otherData?.[item?.key]?.timeStamp}
              {editableTaskStatus.has(item?.key) &&
                mode === "Edit" &&
                otherData?.requestSheetStatus === "Completed" && (
                  <EditOtherTrackingFields
                    handleModal={handleModal}
                    otherData={otherData}
                    updateRow={updateRow}
                    popupRef={item}
                  />
                )}
            </div>
          )}
        </td>
      ))}
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
    popupRef: {
      key: "rsPRAssignToAllBuyers",
      popupTitle: "PR Assign",
    },
    axiosParams: {},
    selectedRow: {},
    updateRow: () => {},
  });

  const [otherSelectedFilters, setOtherSelectedFilters] = useState({
    pendingStage: "All",
    partRequestFor: "All",
    search: "",
  });

  const [mode, setMode] = useState("View");

  const handleSelectOtherFilters = useCallback(
    (next) =>
      setOtherSelectedFilters((prev) => ({
        ...prev,
        ...next,
      })),
    [],
  );

  const handleModal = useCallback(
    (propState) =>
      setModelState((prev) => ({
        show: !prev?.show,
        ...propState,
      })),
    [],
  );

  const otherParentProps = useMemo(
    () => ({
      navigate,
      handleDelete,
      handleModal,
      mode,
    }),
    [navigate, handleDelete, handleModal, mode],
  );

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        flagForTogglingFilter: props?.flagForTogglingFilter,
        selectedValue: props?.selectedValue,
        selectedYear: props?.selectedYear,
        ...otherSelectedFilters,
      },
      referenceArrayForUseEffect: [
        props?.flagForTogglingFilter,
        props?.selectedValue,
        props?.selectedYear,
        otherSelectedFilters?.pendingStage,
        otherSelectedFilters?.partRequestFor,
        otherSelectedFilters?.search,
      ],
    }),
    [
      otherSelectedFilters,
      props?.flagForTogglingFilter,
      props?.selectedValue,
      props?.selectedYear,
    ],
  );

  return (
    <div style={{ overflow: "auto" }}>
      <div className="cell p-2 rounded-2 d-flex justify-content-between">
        <SpareSummery
          apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        />
        <OtherFilters
          {...otherSelectedFilters}
          mode={mode}
          setMode={setMode}
          handleSelectOtherFilters={handleSelectOtherFilters}
        />
      </div>
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
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
          "Part Inspection",
          "MRN Issued",
          "MRN Approved",
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
