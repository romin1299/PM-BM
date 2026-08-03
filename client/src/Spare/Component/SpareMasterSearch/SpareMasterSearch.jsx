import React, { useState, useMemo, memo } from "react";
import SparePartSearchBar from "../SparePartSearchBar";
import SpareSheetCustomTable from "../SpareSheetCustomTable";

const RowMappingComponent = memo(({ otherData, append }) => (
  <>
    <td className="td-padding">{otherData?.plantName}</td>
    <td className="td-padding">{otherData?.whichParts}</td>
    <td className="td-padding">{otherData?.location}</td>
    <td className="td-padding">{otherData?.uniqueID}</td>
    <td className="td-padding">{otherData?.partName}</td>
    <td className="td-padding">{otherData?.partModel}</td>
    <td className="td-padding">{otherData?.maker}</td>
    <td className="td-padding">
      {otherData?.budgetDetails?.overAllAvailableQty}
    </td>
    <td className="td-padding">{otherData?.unitCost}</td>
    <td className="td-padding">
      <button
        className="bg-warning text-white border-0"
        type="button"
        onClick={() => append(otherData)}
      >
        Add
      </button>
    </td>
  </>
));

const SpareMasterSearch = ({ append }) => {
  const [search, setSearch] = useState("");

  const handleSelectOtherFilters = (propFilter) =>
    setSearch(propFilter?.search);

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: { search },
      referenceArrayForUseEffect: [search],
    }),
    [search],
  );

  const otherParentProps = useMemo(() => ({ append }), [append]);

  return (
    <div className="d-flex flex-column">
      <div className="ms-auto">
        <SparePartSearchBar
          handleSelectOtherFilters={handleSelectOtherFilters}
        />
      </div>
      {search && (
        <SpareSheetCustomTable
          apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
          url="/v1/spare/masterList"
          tableHeaders={[
            "Plant",
            "Master",
            "Location",
            "UniqueID",
            "Part name",
            "Part modal",
            "Maker",
            "Available Qty",
            "Unit cost",
            "Action",
          ]}
          OtherComp={RowMappingComponent}
          otherParentProps={otherParentProps}
        />
      )}
    </div>
  );
};

export default SpareMasterSearch;
