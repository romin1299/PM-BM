import React, { useMemo, useState, useCallback, memo } from "react";

import ContactMailIcon from "@mui/icons-material/ContactMail";
import AddTaskIcon from "@mui/icons-material/AddTask";

import WithFilters from "../../Component/Common/WithFilters";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import SpareSummery from "../SpareSheets/SpareSummery";
import OtherFiltersIssuance from "./OtherFiltersIssuance";
import ExportCSV from "./ExportCSV";
import SparePartsRequestForm, {
  ISSUED_FROM_OTHER,
} from "../../../BM/SparePartsRequest/SparePartsRequestForm";
import IssuanceSheetApproval from "./IssuanceSheetApproval";
import { useTableColumnFilters } from "../../Component/Common/useTableColumnFilters";

/** The table's filterable columns: header text and the row field behind it. */
const TABLE_COLUMNS = [
  { header: "Issued from", key: "issuedFrom" },
  { header: "Product", key: "cell.cell_name" },
  { header: "Line", key: "line.line_name" },
  { header: "Machine No", key: "machine.machine_code" },
  { header: "Master", key: "changeParts.whichParts" },
  { header: "Location", key: "changeParts.location" },
  { header: "Part name", key: "changeParts.partName" },
  { header: "Part model", key: "changeParts.partModel" },
  { header: "Maker", key: "changeParts.maker" },
  { header: "Temporary/ Permanent", key: "changeParts.temporaryOrPermanent" },
  { header: "Created By", key: "createdBy.tm_name" },
];

const TDWrapper = ({ children, otherDivClasses = "" }) => (
  <td className="td-padding ">
    <div
      className={`d-flex align-items-center justify-content-center ${otherDivClasses}`}
    >
      {children}
    </div>
  </td>
);

const RowMappingComponent = memo(
  ({ otherData, handleSparePartsModelState, updateRow }) => (
    <>
      <TDWrapper>{otherData?.issuedFrom}</TDWrapper>
      <TDWrapper>{otherData?.cell?.cell_name}</TDWrapper>
      <TDWrapper>{otherData?.line?.line_name}</TDWrapper>
      <TDWrapper>{otherData?.machine?.machine_code}</TDWrapper>
      {/* <TDWrapper>{otherData?.machine?.machine_name}</TDWrapper> */}
      <TDWrapper>{otherData?.changeParts?.whichParts}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.location}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.partName}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.partModel}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.maker}</TDWrapper>
      <TDWrapper>{otherData?.budgetDetails?.overAllAvailableQty}</TDWrapper>
      <TDWrapper>{otherData?.unitCost}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.quantityRequired}</TDWrapper>
      <TDWrapper>
        {otherData?.budgetDetails?.issuanceSheetRequired?.requiredBudget}
      </TDWrapper>
      <TDWrapper>{otherData?.changeParts?.temporaryOrPermanent}</TDWrapper>
      <TDWrapper>
        {otherData?.changeParts?.returnTargetDateIfTemporary?.inString}
      </TDWrapper>
      <TDWrapper>{otherData?.dayCount}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.closingStatusIfTemporary}</TDWrapper>
      <TDWrapper>{otherData?.changeParts?.issuanceApprovalStatus}</TDWrapper>
      <TDWrapper>{otherData?.createdBy?.tm_name}</TDWrapper>
      <TDWrapper otherDivClasses="gap-2">
        <ContactMailIcon
          fontSize="small"
          className="button-style defaultColor"
          onClick={() =>
            handleSparePartsModelState({
              _id: otherData?._id,
              updateRow,
              whichModal: "ISSUANCE_SHEET",
              selectedRow: otherData,
            })
          }
        />

        <AddTaskIcon
          fontSize="small"
          className="button-style text-primary"
          onClick={() =>
            handleSparePartsModelState({
              _id: otherData?._id,
              updateRow,
              whichModal: "APPROVAL",
              selectedRow: otherData,
            })
          }
        />
      </TDWrapper>
    </>
  ),
);

const SpareIssuanceSummaryTable = memo((props) => {
  const [otherSelectedFilters, setOtherSelectedFilters] = useState({
    from: "",
    to: "",
    search: "",
  });

  const handleSelectOtherFilters = useCallback(
    (next) =>
      setOtherSelectedFilters((prev) => ({
        ...prev,
        ...next,
      })),
    [],
  );

  const [sparePartsRequestModal, setSparePartsRequestModal] = useState({
    whichModal: "ISSUANCE_SHEET",
    show: false,
    _id: null,
    selectedRow: {},
    updateRow: () => {},
  });

  const handleSparePartsModelState = useCallback(
    (propState) =>
      setSparePartsRequestModal((sparePartsRequestModal) => ({
        show: !sparePartsRequestModal?.show,
        ...propState,
      })),
    [],
  );

  // Bumped when a new sheet is saved, so the list and counters reload.
  const [reloadCount, setReloadCount] = useState(0);
  const handleOtherIssueSaved = useCallback(
    () => setReloadCount((count) => count + 1),
    [],
  );

  const otherParentProps = useMemo(
    () => ({
      handleSparePartsModelState,
    }),
    [handleSparePartsModelState],
  );

  const {
    renderHeader: renderColumnHeader,
    filtersParam,
    activeCount: activeColumnFilters,
    clearAll: clearColumnFilters,
  } = useTableColumnFilters({
    valuesUrl: "/v1/spare/spareIssuanceSummary/columnValues",
    columns: TABLE_COLUMNS,
  });

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        flagForTogglingFilter: props?.flagForTogglingFilter,
        selectedValue: props?.selectedValue,
        selectedYear: props?.selectedYear,
        ...otherSelectedFilters,
        ...(filtersParam ? { filters: filtersParam } : {}),
      },
      referenceArrayForUseEffect: [
        props?.flagForTogglingFilter,
        props?.selectedValue,
        props?.selectedYear,
        otherSelectedFilters?.from,
        otherSelectedFilters?.to,
        otherSelectedFilters?.search,
        filtersParam,
        reloadCount,
      ],
    }),
    [
      reloadCount,
      otherSelectedFilters,
      filtersParam,
      props?.flagForTogglingFilter,
      props?.selectedValue,
      props?.selectedYear,
    ],
  );

  return (
    <div style={{ overflow: "auto" }}>
      <div className="cell p-2 rounded-2 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <SpareSummery
            apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
            url="/v1/spare/spareIssuanceSummaryCounters"
            titles={[
              "Total Requested Parts",
              "Temporary Parts",
              "Permanent Parts",
            ]}
          />
          {/* Beside the summary cards (the last one is Permanent Parts). */}
          <button
            type="button"
            className="btn bg-button ms-3"
            onClick={() =>
              handleSparePartsModelState({
                whichModal: "OTHER_ISSUE",
                _id: null,
                selectedRow: {},
                updateRow: () => {},
              })
            }
          >
            Issue Other
          </button>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <OtherFiltersIssuance
            {...otherSelectedFilters}
            handleSelectOtherFilters={handleSelectOtherFilters}
          />

          {activeColumnFilters > 0 && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={clearColumnFilters}
            >
              Clear filters ({activeColumnFilters})
            </button>
          )}

          <ExportCSV
            axiosParams={apiReferencePropsBasedOnFilters?.params}
            url="/v1/spare/spareIssuanceSummary/export"
          />
        </div>
      </div>
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        url="/v1/spare/spareIssuanceSummary"
        renderHeader={renderColumnHeader}
        tableHeaders={[
          "Issued from",
          "Product",
          "Line",
          "Machine No",
          // "Machine Name",
          "Master",
          "Location",
          "Part name",
          "Part model",
          "Maker",
          "Quantity available",
          "Unit cost",
          "Quantity required",
          "Budget required in INR",
          "Temporary/ Permanent",
          "Return target date",
          "Day count",
          "Closing status",
          "Approval status",
          "Created By",
          "Action",
        ]}
        OtherComp={RowMappingComponent}
        otherParentProps={otherParentProps}
      />

      {sparePartsRequestModal?.show && (
        <>
          {sparePartsRequestModal?.whichModal === "ISSUANCE_SHEET" && (
            <SparePartsRequestForm
              {...sparePartsRequestModal}
              modelProp={{
                show: sparePartsRequestModal?.show,
                onHide: handleSparePartsModelState,
              }}
            />
          )}
          {sparePartsRequestModal?.whichModal === "OTHER_ISSUE" && (
            <SparePartsRequestForm
              issuedFrom={ISSUED_FROM_OTHER}
              onSaved={handleOtherIssueSaved}
              modelProp={{
                show: sparePartsRequestModal?.show,
                onHide: handleSparePartsModelState,
              }}
            />
          )}
          {sparePartsRequestModal?.whichModal === "APPROVAL" && (
            <IssuanceSheetApproval
              {...sparePartsRequestModal}
              modelProp={{
                show: sparePartsRequestModal?.show,
                onHide: handleSparePartsModelState,
              }}
            />
          )}
        </>
      )}
    </div>
  );
});

const SparePartIssuance = () => {
  return (
    <div>
      <WithFilters
        title="Spare Issuance Summary"
        PropComp={SpareIssuanceSummaryTable}
      />
    </div>
  );
};

export default SparePartIssuance;
