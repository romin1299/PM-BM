import React, { useState, useMemo, useCallback, memo } from "react";
import { Row, Col } from "react-bootstrap";
// import ChartWrapper from "../SpareKPI/SubComponent/ChartComponents/ChartWrapper";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import OtherTaskStatusConfiguration from "../SpareOrderingDashboard/OtherTaskStatusConfiguration";
import SpareTitlebar from "../../Component/SpareTitlebar";
import ExportCSV from "../SparePartIssuance/ExportCSV";
import MasterColumnFilter, {
  useMasterColumnFilters,
} from "../SpareMasterDashboard/MasterColumnFilter";
import { ClearFiltersButton } from "../SpareMasterDashboard/SpareMasterDashboard";

const DEAD_STOCK_KEY = "reasonForKeepingDeadStock";

const url = "/v1/spare/kpi/partList";

/**
 * Header text and the field behind it, which is also the name the server
 * filters on. The reason column's header is the list's own title, so it is
 * resolved per list.
 */
const FILTERABLE_HEADERS = {
  "Line name": "lineName",
  "Mc name": "machineName",
  "Mc number": "machineCode",
  Location: "location",
  "Part name": "partName",
  "Part model": "partModel",
  "Available Qty": "availableQty",
  "Total cost(in INR)": "costInINR",
  "Last movement": "lastMovement",
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
        <td className="td-padding">{otherData?.lastMovement}</td>
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
  const { filters, setColumnFilter, clearAll, activeCount, filtersParam } =
    useMasterColumnFilters();

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        selectedYear,
        selectedMonth,
        requestFor: popupRef?.key,
        ...(filtersParam ? { filters: filtersParam } : {}),
      },
      referenceArrayForUseEffect: [selectedYear, selectedMonth, filtersParam],
    }),
    [selectedYear, selectedMonth, popupRef, filtersParam],
  );

  // Which of the two lists a column's values are asked for.
  const extraParams = useMemo(
    () => ({ requestFor: popupRef?.key }),
    [popupRef],
  );

  // A funnel beside each header the table can be filtered by.
  const renderHeader = useCallback(
    (header) => {
      const column =
        FILTERABLE_HEADERS[header] ??
        (header === popupRef?.popupTitle ? "remarks" : null);
      if (!column) return header;
      return (
        <span className="d-inline-flex align-items-center gap-1">
          {header}
          <MasterColumnFilter
            column={column}
            label={header}
            valuesUrl={`${url}/columnValues`}
            filtersParam={filtersParam}
            extraParams={extraParams}
            selectedValues={filters[column]}
            onApply={setColumnFilter}
          />
        </span>
      );
    },
    [popupRef, extraParams, filters, filtersParam, setColumnFilter],
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
          <div className="d-flex gap-2">
            <ClearFiltersButton activeCount={activeCount} clearAll={clearAll} />
            <ExportCSV
              url="/v1/spare/kpi/partList/export"
              axiosParams={apiReferencePropsBasedOnFilters.params}
            />
          </div>
        }
      />
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        url={url}
        renderHeader={renderHeader}
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
