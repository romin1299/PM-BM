import React, { useCallback, useMemo, useReducer, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import { Button } from "@mui/material";

import YearAndMonthFilter, {
  initialState as yearAndMonthInitialState,
} from "../../Component/Common/YearAndMonthFilter";
import ChartsToolbar from "../../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState as hierarchyInitialState,
  reducer as hierarchyReducer,
} from "../../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";
import TopLimit from "../SpareKPI/SubComponent/TopLimit";
import { findOtherFilters } from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";
import { axiosGetOrDelete } from "../../Utils/axiosUtils";

const DEFAULT_TOP_LIMIT = 10;

/**
 * Picks the filters for one catalogue report and downloads it.
 *
 * Mirrors what the report's own dashboard card does on "Download": the same
 * request with the same parameters, handed to the same download handler. The
 * filter controls are the dashboards' own components, so a value chosen here
 * means exactly what it means there.
 */
const SpareReportDownloadDialog = ({ report, show, onHide }) => {
  const { filters = {} } = report ?? {};

  const [yearAndMonth, setYearAndMonth] = useState(() =>
    yearAndMonthInitialState(false),
  );
  const [hierarchyState, hierarchyDispatch] = useReducer(
    hierarchyReducer,
    hierarchyInitialState(),
  );
  const [limit, setLimit] = useState(DEFAULT_TOP_LIMIT);
  const [format, setFormat] = useState("csv");
  const [status, setStatus] = useState({ busy: false, message: "" });

  const handleSetParentLimit = useCallback((next) => setLimit(next), []);

  const hierarchyChosen = Boolean(hierarchyState?.selectedValue);
  const hierarchyMissing = Boolean(filters.hierarchy?.required) && !hierarchyChosen;

  /** The labels written into the file's "Filters" row, as the dashboards do. */
  const filterLabels = useMemo(() => {
    const labels = [yearAndMonth.selectedYear];
    if (filters.month && yearAndMonth.selectedMonth)
      labels.push(yearAndMonth.selectedMonth);
    if (filters.hierarchy)
      labels.push(
        ...findOtherFilters({
          reduceState: hierarchyState,
          flagForTogglingFilter: hierarchyState?.flagForTogglingFilter,
          selectedValue: hierarchyState?.selectedValue,
        }),
      );
    if (filters.topLimit) labels.push(`Top ${limit}`);
    return labels;
  }, [filters, yearAndMonth, hierarchyState, limit]);

  const handleDownload = useCallback(async () => {
    if (!report || hierarchyMissing) return;

    setStatus({ busy: true, message: "" });

    const params = {
      ...report.params,
      selectedYear: yearAndMonth.selectedYear,
      ...(filters.month && yearAndMonth.selectedMonth
        ? { selectedMonth: yearAndMonth.selectedMonth }
        : {}),
      ...(filters.hierarchy && hierarchyChosen
        ? {
            flagForTogglingFilter: hierarchyState.flagForTogglingFilter,
            selectedValue: hierarchyState.selectedValue,
          }
        : {}),
      ...(filters.topLimit ? { limit } : {}),
    };

    const response = await axiosGetOrDelete({
      url: report.url,
      axiosProps: { params },
    });

    if (response?.isError) {
      setStatus({ busy: false, message: "No data for the selected filters." });
      return;
    }

    const { selectedYear, selectedMonth } = yearAndMonth;
    report.download({
      format,
      fileName: report.title,
      csvOrPDfFileNamePostPix:
        filters.month && selectedMonth
          ? `${selectedMonth}_${selectedYear}`
          : selectedYear,
      header: report.header,
      filters: filterLabels,
      ...report.downloadProps,
      ...response,
    });

    setStatus({ busy: false, message: "" });
    onHide();
  }, [
    report,
    filters,
    format,
    limit,
    yearAndMonth,
    hierarchyState,
    hierarchyChosen,
    hierarchyMissing,
    filterLabels,
    onHide,
  ]);

  if (!report) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {report.title}
          <div className="text-muted" style={{ fontSize: 13 }}>
            {report.dashboard}
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="d-flex flex-column gap-3">
        <div>
          <small className="fw-bold">Period</small>
          <YearAndMonthFilter
            {...yearAndMonth}
            setYearAndMonth={setYearAndMonth}
            yearFiltration
            monthFiltration={Boolean(filters.month)}
            resetButtonFiltration={Boolean(filters.month)}
          />
        </div>

        {filters.hierarchy && (
          <div>
            <small className="fw-bold">
              Hierarchy{filters.hierarchy.required ? " (required)" : ""}
            </small>
            <div className="row g-0">
              <ChartsToolbar
                baseUrlForFiltering="/getFiltrationValue/plant-level-filtration"
                reduceState={hierarchyState}
                reducerDispatch={hierarchyDispatch}
                queryParams={{
                  showToast: "No",
                  moduleType: "Spare",
                  ...filters.hierarchy.queryParams,
                }}
                sectionFiltration={filters.hierarchy.sectionFiltration}
                subSectionFiltration={filters.hierarchy.subSectionFiltration}
                cellFiltration={filters.hierarchy.cellFiltration}
                lineFiltration={filters.hierarchy.lineFiltration}
              />
            </div>
          </div>
        )}

        {filters.topLimit && (
          <div>
            <small className="fw-bold">Ranking depth</small>
            <div className="row g-0">
              <TopLimit handleSetParentLimit={handleSetParentLimit} />
            </div>
          </div>
        )}

        <div>
          <small className="fw-bold">Format</small>
          <div className="d-flex gap-3">
            {["csv", "pdf"].map((value) => (
              <Form.Check
                key={value}
                inline
                type="radio"
                id={`spare-report-format-${value}`}
                name="spare-report-format"
                label={value.toUpperCase()}
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
              />
            ))}
          </div>
        </div>

        {status.message && (
          <small className="text-danger">{status.message}</small>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outlined" size="small" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          disableElevation
          className="bg-button"
          disabled={status.busy || hierarchyMissing}
          onClick={handleDownload}
        >
          {status.busy ? "Preparing…" : `Download ${format.toUpperCase()}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SpareReportDownloadDialog;
