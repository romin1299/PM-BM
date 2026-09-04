import React, { useMemo, useState, useCallback, memo } from "react";

import ContactMailIcon from "@mui/icons-material/ContactMail";
import AddTaskIcon from "@mui/icons-material/AddTask";

import WithFilters from "../../Component/Common/WithFilters";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import SpareSummery from "../SpareSheets/SpareSummery";
import OtherFiltersIssuance from "./OtherFiltersIssuance";
import ExportCSV from "./ExportCSV";
import SparePartsRequestForm from "../../../BM/SparePartsRequest/SparePartsRequestForm";
import IssuanceSheetApproval from "./IssuanceSheetApproval";

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

  const otherParentProps = useMemo(
    () => ({
      handleSparePartsModelState,
    }),
    [handleSparePartsModelState],
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
        otherSelectedFilters?.from,
        otherSelectedFilters?.to,
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
          url="/v1/spare/spareIssuanceSummaryCounters"
          titles={[
            "Total Requested Parts",
            "Temporary Parts",
            "Permanent Parts",
          ]}
        />
        <div className="d-flex gap-2 justify-content-end">
          <OtherFiltersIssuance
            {...otherSelectedFilters}
            handleSelectOtherFilters={handleSelectOtherFilters}
          />

          <ExportCSV
            axiosParams={apiReferencePropsBasedOnFilters?.params}
            url="/v1/spare/spareIssuanceSummary/export"
          />
        </div>
      </div>
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        url="/v1/spare/spareIssuanceSummary"
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
