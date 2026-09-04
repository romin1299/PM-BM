import React, { memo, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import CircleIcon from "@mui/icons-material/Circle";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

import { axiosGetOrDelete } from "../../Utils/axiosUtils";

import WithFilters from "../../Component/Common/WithFilters";
import SpareSheetCustomTable, {
  UptoMachineHeaders,
  PartDetailsHeaders,
} from "../../Component/SpareSheetCustomTable";
import OtherTaskStatusConfiguration from "./OtherTaskStatusConfiguration";
import OtherFilters from "./OtherFilters";
import SpareSummery from "../SpareSheets/SpareSummery";

import "./SpareOrderTracking.scss";

const taskStatusMappingKeys1 = [
  {
    key: "rsSubmitted",
    popupTitle: "",
  },
  {
    key: "rsHODApproval",
    popupTitle: "",
  },
  {
    key: "rsToolroomApproval",
    popupTitle: "",
  },
];

const taskStatusMappingKeys2 = [
  {
    key: "rsPRGeneration",
    popupTitle: "PR Generation",
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

const colorsBasedOnTaskStatus = {
  assigned: "white",
  runningLate: "red",
  achieved: "green",
  delayedApproval: "yellow",
};

const TDWrapper = ({ children }) => (
  <td className="td-padding ">
    <div className="d-flex align-items-center justify-content-center">
      {children}
    </div>
  </td>
);

const ViewTD = memo(({ _id, navigate }) => (
  <TDWrapper>
    <RemoveRedEyeIcon
      fontSize="small"
      className="button-style text-primary"
      onClick={() =>
        navigate(`/spare/spareNewPartRequest/?_id=${_id}&action=view`)
      }
    />
  </TDWrapper>
));

const PRLinkTD = memo(() => (
  <TDWrapper>
    <OpenInNewIcon fontSize="small" className="button-style text-primary" />
  </TDWrapper>
));

const EditTD = memo(({ _id, navigate }) => (
  <TDWrapper>
    <DescriptionIcon
      fontSize="small"
      className="button-style text-primary"
      onClick={() => navigate(`/spare/spareNewPartRequest/?_id=${_id}`)}
    />
  </TDWrapper>
));

const MasterTD = memo(
  ({
    canConfigureMaster,
    isToolRoomApproved,
    _id,
    partId,
    masterId,
    navigate,
  }) => {
    const handleClick = useCallback(() => {
      const queryParams = masterId
        ? `masterId=${masterId}`
        : `sheetId=${_id}&partId=${partId}`;
      return navigate(`/spare/spareMasterRegistration/?${queryParams}`);
    }, [navigate, _id, partId, masterId]);

    if (!canConfigureMaster) return <TDWrapper></TDWrapper>;
    else if (!isToolRoomApproved)
      return (
        <TDWrapper>
          <AppRegistrationIcon fontSize="small" className="text-muted" />
        </TDWrapper>
      );
    return (
      <TDWrapper>
        <AppRegistrationIcon
          fontSize="small"
          className="button-style text-primary"
          onClick={handleClick}
        />
      </TDWrapper>
    );
  },
);

const RejectTD = memo(({ _id, partId, onDelete }) => (
  <TDWrapper>
    <DeleteIcon
      fontSize="small"
      className="button-style text-primary"
      onClick={() => onDelete({ _id, partId })}
    />
  </TDWrapper>
));

const EditOtherTrackingFields = memo(
  ({ popupRef, otherData, updateRow, handleModal }) => (
    <div className="d-flex align-items-center justify-content-center flex-column">
      <EditIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() => {
          handleModal({
            popupRef,
            updateRow,
            axiosParams: {
              _id: otherData?._id,
              cellId: otherData?.cell?._id,
              batchId: otherData?.changeParts?.batchId,
              masterId: otherData?.changeParts?.masterId,
              partId: otherData?.changeParts?._id,
              maker: otherData?.changeParts?.maker,
              requestedField: popupRef?.key,
            },
          });
        }}
      />
    </div>
  ),
);

const SelectTD = memo(
  ({
    setObj,
    isSelected,
    handleToggleSelect,
    masterId,
    batchId,
    showOnlySelected,
  }) =>
    !masterId || batchId ? (
      <TDWrapper></TDWrapper>
    ) : (
      <TDWrapper>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!masterId}
          onChange={() => handleToggleSelect(setObj?.partId, setObj)}
        />
      </TDWrapper>
    ),
);

const TaskStatusTd = memo(
  ({
    mappingArray = [],
    otherData,
    mode,
    handleModal,
    updateRow,
    masterId,
    isEditableRow = false,
    isViewOnly = true,
  }) =>
    mappingArray?.map((item) => (
      <td className="td-padding " key={item?.key}>
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
                  colorsBasedOnTaskStatus?.[otherData?.[item?.key]?.taskStatus],
              }}
            />
            {otherData?.[item?.key]?.timeStamp}
            {mode === "Edit" &&
              otherData?.requestSheetStatus === "Completed" &&
              !isViewOnly &&
              masterId &&
              (otherData?.rsPRGeneration?.taskStatus || isEditableRow) && (
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
    )),
);

const TaskStatusMappingComponent = memo(
  ({
    otherData,
    navigate,
    handleDelete,
    removeRow,
    selectedRows,
    handleToggleSelect,
    showOnlySelected,
    isEditableRow = false,
    ...rest
  }) => (
    <>
      <TDWrapper>{otherData?.newOrReOrderRequest}</TDWrapper>
      <UptoMachineHeaders otherData={otherData} />
      <PartDetailsHeaders otherData={otherData} />
      <ViewTD _id={otherData?._id} navigate={navigate} />
      <PRLinkTD />
      <EditTD _id={otherData?._id} navigate={navigate} />
      <RejectTD
        _id={otherData?._id}
        partId={otherData?.changeParts?._id}
        onDelete={(props) => handleDelete(props, removeRow)}
      />
      <TaskStatusTd
        mappingArray={taskStatusMappingKeys1}
        otherData={otherData}
        isViewOnly={true}
        {...rest}
      />
      <MasterTD
        _id={otherData?._id}
        isToolRoomApproved={otherData?.rsToolroomApproval?.timeStamp}
        canConfigureMaster={otherData?.canConfigureMaster}
        partId={otherData?.changeParts?._id}
        masterId={otherData?.changeParts?.masterId}
        navigate={navigate}
      />
      {!showOnlySelected && (
        <SelectTD
          setObj={{
            partId: otherData?.changeParts?._id,
            cellId: otherData?.cell?._id,
            maker: otherData?.changeParts?.maker,
          }}
          batchId={otherData?.changeParts?.batchId}
          isSelected={selectedRows.has(otherData?.changeParts?._id)}
          handleToggleSelect={handleToggleSelect}
          masterId={otherData?.changeParts?.masterId}
        />
      )}

      <TaskStatusTd
        masterId={otherData?.changeParts?.masterId}
        mappingArray={taskStatusMappingKeys2}
        otherData={otherData}
        isEditableRow={isEditableRow}
        isViewOnly={false}
        {...rest}
      />
    </>
  ),
);

const OrderTrackingDashboard = memo((props) => {
  const navigate = useNavigate();

  const handleDelete = useCallback(async (params, removeRow) => {
    const { isError } = await axiosGetOrDelete({
      apiType: "delete",
      url: "/v1/spare/spareRequestSheet",
      axiosProps: {
        params,
      },
    });
    if (!isError) return removeRow(params);
  }, []);

  const [modelState, setModelState] = useState({
    show: false,
    popupRef: {
      key: "rsPRAssignToAllBuyers",
      popupTitle: "PR Assign",
    },
    axiosParams: {},
    updateRow: () => {},
  });

  const [otherSelectedFilters, setOtherSelectedFilters] = useState({
    pendingStage: "All",
    partRequestFor: "All",
    search: "",
  });

  const [mode, setMode] = useState("View");

  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedRows, setSelectedRows] = useState(() => new Map());

  const handleToggleSelect = useCallback((_id, setObj = {}) => {
    setSelectedRows((prev) => {
      const next = new Map(prev);
      if (next.has(_id)) {
        next.delete(_id);
      } else {
        next.set(_id, setObj);
      }
      return next;
    });
  }, []);

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
      selectedRows,
      handleToggleSelect,
      showOnlySelected,
      isEditableRow: selectedRows.size > 0 && showOnlySelected,
    }),
    [
      navigate,
      handleDelete,
      handleModal,
      mode,
      selectedRows,
      handleToggleSelect,
      showOnlySelected,
    ],
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

  const tableHeaders = useMemo(
    () => [
      "Order Type",
      "Request No",
      "Product",
      "Maker",
      "Line",
      "Machine No",
      // "Machine Name",
      "Part name",
      "Part model",
      "View",
      "PR Link",
      "Edit",
      "Reject",
      "Request Submitted",
      "Internal Approval",
      "Tool Room Approval",
      "Master",
      ...(showOnlySelected ? [] : ["Select to Continue"]),
      "PR Generation",
      "PR Approval",
      "PO Made",
      "Part Receipt",
      "Part Inspection",
      "MRN Issued",
      "MRN Approved",
    ],
    [showOnlySelected],
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
        tableHeaders={tableHeaders}
        OtherComp={TaskStatusMappingComponent}
        otherParentProps={otherParentProps}
        showOnlySelected={showOnlySelected}
        selectedRows={selectedRows}
      />

      {modelState?.show && (
        <OtherTaskStatusConfiguration
          {...modelState}
          selectedRows={selectedRows}
          handleModal={handleModal}
        />
      )}

      <div className="p-2 rounded-2 d-flex gap-2">
        <button
          disabled={selectedRows.size === 0}
          className="btn bg-success"
          onClick={() =>
            setShowOnlySelected((prev) => {
              if (prev) setMode("View");
              return !prev;
            })
          }
        >
          {showOnlySelected
            ? "Back to L1 sheet"
            : `Generate Batch wise L2 sheet`}
        </button>
      </div>
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
