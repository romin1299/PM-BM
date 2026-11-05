import React, { useState, memo, useCallback, useEffect, useMemo } from "react";
import { Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { partFor } from "../../Utils/dropdownUtils";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import MasterColumnFilter, {
  useMasterColumnFilters,
} from "../SpareMasterDashboard/MasterColumnFilter";

/**
 * The result columns a reader can filter Excel-style, keyed by the header text
 * to the row field the server filters on. The same column filter the Master
 * dashboard uses; the serial, Master, quantity and unit-cost columns are not
 * value-pickable, so they carry no funnel.
 */
const SEARCH_COLUMN_FILTERS = {
  Plant: "plantName",
  Location: "location",
  "Unique ID": "uniqueID",
  "Part no": "partNumber",
  "Part name": "partName",
  "Part model": "partModel",
  "Machine no": "machineCode",
  "Machine No": "machineCode",
  "Machine name": "machineName",
  "Machine Name": "machineName",
};

const COLUMN_VALUES_URL = "/v1/spare/spareSearch/columnValues";

const TaskStatusMappingComponent = memo(({ otherData, rowIndex }) => (
    <>
      <td className="td-padding ">{rowIndex}</td>
      <td className="td-padding ">{otherData?.plantName}</td>
      <td className="td-padding ">{otherData?.whichParts}</td>
      <td className="td-padding ">{otherData?.location}</td>
      <td className="td-padding ">{otherData?.uniqueID}</td>
      <td className="td-padding ">{otherData?.partNumber}</td>
      <td className="td-padding ">{otherData?.partName}</td>
      <td className="td-padding ">{otherData?.partModel}</td>
      <td className="td-padding ">{otherData?.machineCode}</td>
      <td className="td-padding ">{otherData?.machineName}</td>
      <td className="td-padding ">
        {otherData?.budgetDetails?.overAllAvailableQty}
      </td>
      <td className="td-padding ">{otherData?.unitCost}</td>
    </>
));

const tableHeaders = [
  "S.No",
  "Plant",
  "Master",
  "Location",
  "Unique ID",
  "Part no",
  "Part name",
  "Part model",
  "Machine no",
  "Machine name",
  "Quantity available",
  "Unit cost",
];

const SpareSearchButton = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = useForm({
    defaultValues: {
      whichParts: false,
      location: "",
      partName: "",
      partModel: "",
      machine_code: "",
    },
  });

  // The submitted search (the dirty form fields). The column filters are layered
  // on top of it without re-submitting the form.
  const [searchParams, setSearchParams] = useState(null);

  const { filters, setColumnFilter, clearAll, activeCount, filtersParam } =
    useMasterColumnFilters();

  /**
   * How many parts the search matched in all. The server counts it once, with
   * the first page; the table only ever holds the pages scrolled so far.
   */
  const [totalCount, setTotalCount] = useState(null);

  const handlePageLoaded = useCallback((response) => {
    if (response?.totalCount !== undefined) setTotalCount(response.totalCount);
  }, []);

  // A changed column filter restarts the list, so the server recounts it on the
  // next first page.
  useEffect(() => setTotalCount(null), [filtersParam]);

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  const handleSearchParts = async (formValue) => {
    if (Object.keys(dirtyFields).length === 0) return;
    formValue = dirtyValues(formValue);
    setTotalCount(null);
    // A fresh search is a different result set; start its column filters clean.
    clearAll();
    setSearchParams(formValue);
  };
  const handleClear = () => {
    reset();
    setTotalCount(null);
    clearAll();
    setSearchParams(null);
  };

  // The table (and the column-value dropdowns) search within the submitted
  // fields; the ticked filters ride alongside and reload the list when they
  // change.
  const apiReferencePropsBasedOnFilters = useMemo(() => {
    if (!searchParams) return { params: null, referenceArrayForUseEffect: [] };
    return {
      params: {
        ...searchParams,
        ...(filtersParam ? { filters: filtersParam } : {}),
      },
      referenceArrayForUseEffect: [JSON.stringify(searchParams), filtersParam ?? ""],
    };
  }, [searchParams, filtersParam]);

  const renderHeader = useCallback(
    (header) => {
      const column = SEARCH_COLUMN_FILTERS[header];
      if (!column) return header;
      return (
        <span className="d-inline-flex align-items-center gap-1">
          {header}
          <MasterColumnFilter
            column={column}
            label={header}
            valuesUrl={COLUMN_VALUES_URL}
            filtersParam={filtersParam}
            selectedValues={filters[column]}
            onApply={setColumnFilter}
            // So the values on offer are drawn from the current search only.
            extraParams={searchParams ?? undefined}
          />
        </span>
      );
    },
    [filters, filtersParam, setColumnFilter, searchParams],
  );

  return (
    <div>
      <h4 style={{ padding: "1rem 0 0 1rem" }}>Spare Part Search Button</h4>
      <form onSubmit={handleSubmit(handleSearchParts)}>
        <table className="m-1">
          <tr className="size-14">
            <td className="border p-1">
              <small>Master List</small>
            </td>
            <td className="border">
              <div className="d-flex p-1">
                {partFor?.map((item) => (
                  <>
                    &nbsp;
                    <Form.Check
                      style={{ fontSize: "14px" }}
                      type="radio"
                      {...item}
                      {...register("whichParts")}
                    />
                  </>
                ))}
              </div>
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Location</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("location")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Part name</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("partName")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>Part model</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("partModel")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1">
              <small>M/C no</small>
            </td>
            <td className="border p-1">
              <input type="text" {...register("machine_code")} />
            </td>
          </tr>

          <tr className="size-14">
            <td className="border p-1"></td>
            <td className="border p-1 d-flex flex-wrap gap-1">
              <button type="submit" className="btn bg-success">
                Search
              </button>
              <button
                type="button"
                className="btn bg-warning"
                onClick={handleClear}
              >
                Clear
              </button>
            </td>
          </tr>
        </table>
      </form>

      {apiReferencePropsBasedOnFilters?.params && (
        <>
          <div className="m-1 size-14 d-flex align-items-center gap-3">
            {totalCount !== null && (
              <small>
                <b>Total searched parts:</b> {totalCount}
              </small>
            )}
            {activeCount > 0 && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={clearAll}
              >
                Clear filters ({activeCount})
              </button>
            )}
          </div>
          <SpareSheetCustomTable
            apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
            url="/v1/spare/spareSearch"
            // Masters, not request-sheet parts, so the default row key does not
            // apply — without this every row was keyed undefined.
            rowKey={(row) => row?.masterId}
            onPageLoaded={handlePageLoaded}
            tableHeaders={tableHeaders}
            renderHeader={renderHeader}
            OtherComp={TaskStatusMappingComponent}
          />
        </>
      )}
    </div>
  );
};

export default SpareSearchButton;
