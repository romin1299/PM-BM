import React, { useState, useMemo, useCallback, memo } from "react";
import { Row, Col } from "react-bootstrap";
// import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import OtherTaskStatusConfiguration from "../SpareOrderingDashboard/OtherTaskStatusConfiguration";
import SpareTitlebar from "../../Component/SpareTitlebar";

const RowMappingComponent = memo(
  ({ otherData, popupRef, updateRow, handleModal }) => (
    <>
      <td className="td-padding">{otherData?.line?.line_name}</td>
      <td className="td-padding">{otherData?.machine?.machine_name}</td>
      <td className="td-padding">{otherData?.machine?.machine_code}</td>
      <td className="td-padding">{otherData?.location}</td>
      <td className="td-padding">{otherData?.partName}</td>
      <td className="td-padding">{otherData?.partModel}</td>
      <td className="td-padding">
        {otherData?.budgetDetails?.overAllAvailableQty}
      </td>
      <td className="td-padding">
        {otherData?.budgetDetails?.overAllCostInINR}
      </td>
      <td className="td-padding">{otherData?.[`${popupRef?.key}Remarks`]}</td>
      <td className="td-padding">
        <button
          className="bg-warning text-white border-0"
          type="button"
          onClick={() =>
            handleModal({
              updateRow,
              axiosParams: {
                _id: otherData?._id,
                requestFor: popupRef?.key,
              },
            })
          }
        >
          Edit
        </button>
      </td>
    </>
  ),
);

const ZeroOrDeadStockParts = ({
  title = "Zero Stock",
  selectedYear,
  selectedMonth,
  popupRef = {
    key: "reasonForZeroStock",
    popupTitle: "Reason For Zero Stock",
  },
}) => {
  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        selectedYear,
        selectedMonth,
        requestFor: popupRef?.key,
      },
      referenceArrayForUseEffect: [selectedYear, selectedMonth],
    }),
    [selectedYear, selectedMonth, popupRef],
  );

  const [modelState, setModelState] = useState({
    show: false,
    axiosParams: {},
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
    () => ({
      popupRef,
      handleModal,
    }),
    [handleModal, popupRef],
  );

  return (
    <Col md={12} lg={6}>
      <SpareTitlebar title={title} />
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        url={`/v1/spare/kpi/partList`}
        tableHeaders={[
          "Line name",
          "Mc name",
          "Mc number",
          "Location",
          "Part name",
          "Part modal",
          "Available Qty",
          "Total cost(in INR)",
          popupRef?.popupTitle,
          "Action",
        ]}
        OtherComp={RowMappingComponent}
        otherParentProps={otherParentProps}
        isNormalRowActions={true}
      />

      {modelState?.show && (
        <OtherTaskStatusConfiguration
          {...modelState}
          url={`/v1/spare/kpi/remarks`}
          popupRef={popupRef}
          isOnlyContainsRemark={true}
          handleModal={handleModal}
        />
      )}
    </Col>
  );
};

const StockLevelRow2 = (props) => {
  return (
    <Row className="mt-3 gx-3 p-1">
      <ZeroOrDeadStockParts {...props} />
      <ZeroOrDeadStockParts
        {...props}
        title="Dead Stock"
        popupRef={{
          key: "reasonForKeepingDeadStock",
          popupTitle: "Reason For Keeping",
        }}
      />
    </Row>
  );
};

export default StockLevelRow2;
