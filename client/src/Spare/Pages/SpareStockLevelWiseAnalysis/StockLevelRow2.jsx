import React, { useState, useMemo, useCallback, memo } from "react";
import { Row, Col } from "react-bootstrap";
// import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import OtherTaskStatusConfiguration from "../SpareOrderingDashboard/OtherTaskStatusConfiguration";
import SpareTitlebar from "../../Component/SpareTitlebar";
import ExportCSV from "../SparePartIssuance/ExportCSV";

const DEAD_STOCK_KEY = "reasonForKeepingDeadStock";

/** The date the dead-stock rule was judged on, with what it was. */
const lastMovementText = ({ lastMovementDate, hasBeenIssued }) => {
  if (!lastMovementDate) return "-";
  const date = new Date(lastMovementDate).toLocaleDateString("en-GB");
  return hasBeenIssued ? `Issued ${date}` : `In stock since ${date}`;
};

const RowMappingComponent = memo(
  ({ otherData, rowIndex, popupRef, updateRow, handleModal }) => (
    <>
      <td className="td-padding">{rowIndex}</td>
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
      {popupRef?.key === DEAD_STOCK_KEY && (
        <td className="td-padding">{lastMovementText(otherData ?? {})}</td>
      )}
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
      <SpareTitlebar
        title={title}
        inlineToolbar
        // Same filters as the table, so the file holds exactly what is shown.
        Toolbar={
          <ExportCSV
            url="/v1/spare/kpi/partList/export"
            axiosParams={apiReferencePropsBasedOnFilters.params}
          />
        }
      />
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        url={`/v1/spare/kpi/partList`}
        tableHeaders={[
          "S.No",
          "Line name",
          "Mc name",
          "Mc number",
          "Location",
          "Part name",
          "Part model",
          "Available Qty",
          "Total cost(in INR)",
          ...(popupRef?.key === DEAD_STOCK_KEY ? ["Last movement"] : []),
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
          key: DEAD_STOCK_KEY,
          popupTitle: "Reason For Keeping",
        }}
      />
    </Row>
  );
};

export default StockLevelRow2;
