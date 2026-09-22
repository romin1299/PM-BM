import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import RoutingContext from "../../../context/routing/RoutingContext";
import SpareTitlebar from "../../Component/SpareTitlebar";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import ExportCSV from "../SparePartIssuance/ExportCSV";
import MasterColumnFilter, { useMasterColumnFilters } from "./MasterColumnFilter";

/**
 * The Spare Master catalogue.
 *
 * Deliberately has no filter bar. A master is a standing record of a part rather
 * than something belonging to a financial year or one place in the hierarchy, so
 * the whole catalogue is listed and the scrolling table pages through it. That
 * also keeps the page usable at ~18k parts, where loading every row up front cost
 * a 16 MB response.
 */

const url = "/v1/spare/master/dashboard";

/**
 * The table's columns: header text and the dashboard-row field behind it,
 * which is also the name the server filters on. Shared with the uploaded-master
 * dashboards, which list the same record shape. Drawings has no field: a list
 * of files is nothing to filter by.
 */
export const MASTER_COLUMNS = [
  { header: "Unique ID", key: "uniqueID" },
  { header: "Part No", key: "partNumber" },
  { header: "Part Name", key: "partName" },
  { header: "Part Model", key: "partModel" },
  { header: "Part Group", key: "partGroup" },
  { header: "Maker", key: "maker" },
  { header: "Supplier", key: "supplierName" },
  { header: "Unit", key: "unit" },
  { header: "Location", key: "location" },
  { header: "Register Section", key: "registerSection" },
  { header: "Machine No", key: "machineCode" },
  { header: "Machine Name", key: "machineName" },
  { header: "Other M/C Codes", key: "additionalMachineCodes" },
  { header: "Product", key: "cellName" },
  { header: "Line", key: "lineName" },
  { header: "Sub Section", key: "subSectionName" },
  { header: "Section", key: "sectionName" },
  { header: "Plant", key: "plantName" },
  { header: "Min Qty", key: "minQuantity" },
  { header: "Max Qty", key: "maxQuantity" },
  { header: "Order Point", key: "orderPoint" },
  { header: "Order Qty", key: "orderQty" },
  { header: "Lead Time", key: "leadTime" },
  { header: "Stock Qty", key: "stockQty" },
  { header: "Issued Qty", key: "issuedQty" },
  { header: "Available Qty", key: "availableQty" },
  { header: "Overall Cost (INR)", key: "overAllCostInINR" },
  { header: "Status", key: "status" },
  { header: "Drawings", key: null },
  { header: "Registered On", key: "registeredOn" },
];

export const tableHeaders = MASTER_COLUMNS.map((column) => column.header);

// The one column the table can be ordered by; the server pages in that order.
const SORT_COLUMN = "Unique ID";

/** Ascending / descending toggle for the Unique ID header. */
const SortToggle = ({ direction, onToggle }) => (
  <button
    type="button"
    className="btn btn-link p-0 text-white d-inline-flex align-items-center"
    title={direction === "desc" ? "Sorted descending - click for ascending" : "Sorted ascending - click for descending"}
    onClick={onToggle}
  >
    {direction === "desc" ? (
      <ArrowDownwardIcon sx={{ fontSize: 16 }} />
    ) : (
      <ArrowUpwardIcon sx={{ fontSize: 16 }} />
    )}
  </button>
);

/**
 * Everything a master dashboard needs to filter its columns Excel-style: the
 * filter state, the request param the table and export send, a `renderHeader`
 * that puts a funnel in each filterable header, and a reset of the title row
 * count whenever the filters change (the server recounts on the next first
 * page).
 */
export const useMasterDashboardFilters = ({ url, onFiltersChanged }) => {
  const { filters, setColumnFilter, clearAll, activeCount, filtersParam } =
    useMasterColumnFilters();
  const [sortDirection, setSortDirection] = useState("asc");

  const toggleSort = useCallback(
    () => setSortDirection((current) => (current === "asc" ? "desc" : "asc")),
    [],
  );

  useEffect(() => {
    if (onFiltersChanged) onFiltersChanged();
  }, [filtersParam, sortDirection, onFiltersChanged]);

  const renderHeader = useCallback(
    (header) => {
      const column = MASTER_COLUMNS.find((c) => c.header === header);
      if (!column?.key) return header;
      return (
        <span className="d-inline-flex align-items-center gap-1">
          {header}
          {header === SORT_COLUMN && (
            <SortToggle direction={sortDirection} onToggle={toggleSort} />
          )}
          <MasterColumnFilter
            column={column.key}
            label={header}
            valuesUrl={`${url}/columnValues`}
            filtersParam={filtersParam}
            selectedValues={filters[column.key]}
            onApply={setColumnFilter}
          />
        </span>
      );
    },
    [url, filters, filtersParam, setColumnFilter, sortDirection, toggleSort],
  );

  // What the table and the export send; `listKey` changes whenever they do.
  const params = useMemo(
    () => ({
      ...(filtersParam ? { filters: filtersParam } : {}),
      ...(sortDirection === "desc" ? { sort: "desc" } : {}),
    }),
    [filtersParam, sortDirection],
  );
  const listKey = `${sortDirection}|${filtersParam ?? ""}`;

  return { renderHeader, params, filtersParam, listKey, activeCount, clearAll };
};

/** "Clear filters" for the title bar, shown only while something is filtered. */
export const ClearFiltersButton = ({ activeCount, clearAll }) =>
  activeCount ? (
    <button type="button" className="btn btn-outline-secondary" onClick={clearAll}>
      Clear filters ({activeCount})
    </button>
  ) : null;

// Only Tool Room may open a master for editing, so only they get the column.
export const editHeader = "Action";

const numberOrBlank = (value) =>
  value === null || value === undefined ? "" : value;

const inrFormat = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const MasterRow = memo(({ otherData, navigate, canEdit, masterType }) => (
  <>
    <td className="td-padding">{otherData?.uniqueID}</td>
    <td className="td-padding">{otherData?.partNumber}</td>
    <td className="td-padding">{otherData?.partName}</td>
    <td className="td-padding">{otherData?.partModel}</td>
    <td className="td-padding">{otherData?.partGroup}</td>
    <td className="td-padding">{otherData?.maker}</td>
    <td className="td-padding">{otherData?.supplierName}</td>
    <td className="td-padding">{otherData?.unit}</td>
    <td className="td-padding">{otherData?.location}</td>
    <td className="td-padding">{otherData?.registerSection}</td>
    <td className="td-padding">{otherData?.machineCode}</td>
    <td className="td-padding">{otherData?.machineName}</td>
    <td className="td-padding">
      {otherData?.additionalMachineCodes?.join(", ")}
    </td>
    <td className="td-padding">{otherData?.cellName}</td>
    <td className="td-padding">{otherData?.lineName}</td>
    <td className="td-padding">{otherData?.subSectionName}</td>
    <td className="td-padding">{otherData?.sectionName}</td>
    <td className="td-padding">{otherData?.plantName}</td>
    <td className="td-padding">{numberOrBlank(otherData?.minQuantity)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.maxQuantity)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.orderPoint)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.orderQty)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.leadTime)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.stockQty)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.issuedQty)}</td>
    <td className="td-padding">{numberOrBlank(otherData?.availableQty)}</td>
    <td className="td-padding">{inrFormat(otherData?.overAllCostInINR)}</td>
    <td className="td-padding">{otherData?.status}</td>
    <td className="td-padding">
      {/* Numbered so several drawings read as separate items. */}
      {otherData?.drawingAttach?.length > 0 && (
        <ol className="m-0 ps-3">
          {otherData.drawingAttach.map((file, index) => (
            <li key={file?.filename ?? index}>
              <a
                target="_blank"
                rel="noreferrer"
                href={`${process.env.REACT_APP_BASE_URL}/v1/spare/${file?.filename}`}
              >
                {file?.originalname}
              </a>
            </li>
          ))}
        </ol>
      )}
    </td>
    <td className="td-padding">{otherData?.registeredOn}</td>
    {canEdit && (
      <td className="td-padding">
        <AppRegistrationIcon
          fontSize="small"
          className="button-style text-primary"
          onClick={() =>
            navigate(
              `/spare/spareMasterRegistration/?masterId=${otherData?._id}${
                masterType ? `&masterType=${masterType}` : ""
              }`,
            )
          }
        />
      </td>
    )}
  </>
));

const SpareMasterDashboard = () => {
  const navigate = useNavigate();
  const { toolRoomPerson } = useContext(RoutingContext) ?? {};
  const canEdit = toolRoomPerson === "Yes";
  const [totalMasters, setTotalMasters] = useState(null);

  /**
   * The row count arrives with the first page, so it costs no extra request. Only
   * that page carries it — the total does not change while scrolling.
   */
  const handlePageLoaded = useCallback(({ totalCount }) => {
    if (totalCount !== undefined) setTotalMasters(totalCount);
  }, []);

  const resetTotal = useCallback(() => setTotalMasters(null), []);
  const { renderHeader, params, listKey, activeCount, clearAll } =
    useMasterDashboardFilters({ url, onFiltersChanged: resetTotal });

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({ params, referenceArrayForUseEffect: [listKey] }),
    [params, listKey],
  );

  const title = useMemo(
    () =>
      totalMasters === null
        ? "Master Dashboard"
        : `Master Dashboard — ${totalMasters.toLocaleString("en-IN")} masters`,
    [totalMasters],
  );

  const otherParentProps = useMemo(
    () => ({ navigate, canEdit }),
    [navigate, canEdit],
  );

  const headers = useMemo(
    () => (canEdit ? [...tableHeaders, editHeader] : tableHeaders),
    [canEdit],
  );

  return (
    <Container fluid>
      <SpareTitlebar
        title={title}
        inlineToolbar
        Toolbar={
          <div className="d-flex gap-2">
            <ClearFiltersButton activeCount={activeCount} clearAll={clearAll} />
            <ExportCSV url={`${url}/export`} axiosParams={params} />
          </div>
        }
      />

      <SpareSheetCustomTable
        url={url}
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        tableHeaders={headers}
        renderHeader={renderHeader}
        OtherComp={MasterRow}
        otherParentProps={otherParentProps}
        rowKey={(row) => row?._id}
        onPageLoaded={handlePageLoaded}
      />
    </Container>
  );
};

export default SpareMasterDashboard;
