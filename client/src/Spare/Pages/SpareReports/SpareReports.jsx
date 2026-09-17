import React, { useCallback, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import SpareTitlebar from "../../Component/SpareTitlebar";
import SpareReportDownloadDialog from "./SpareReportDownloadDialog";
import {
  spareReportCatalogue,
  describeFilters,
} from "./spareReportCatalogue";

const TABLE_HEADERS = ["#", "Report", "Dashboard", "Filters", "Download"];

/**
 * Every downloadable chart in the Spare module, in one table.
 *
 * Each row is a catalogue entry; Download opens a dialog that asks only for the
 * filters that chart takes and then produces the same file the chart's own
 * dashboard card would. Users who just want the numbers no longer have to find
 * the right dashboard, set its filters, and hunt for the card.
 */
const SpareReports = () => {
  const [selected, setSelected] = useState(null);

  const handleClose = useCallback(() => setSelected(null), []);

  // Grouped by dashboard in catalogue order, so the table reads the way the
  // sidebar does.
  const rows = useMemo(() => spareReportCatalogue, []);

  return (
    <Container fluid>
      <SpareTitlebar title={`Spare Reports — ${rows.length} reports`} />

      <div className="cell spare-scroll-table mt-3">
        <table className="ar-table pmSheetApprovalTableCol">
          <thead>
            <tr className="bg-button">
              {TABLE_HEADERS.map((heading) => (
                <th
                  key={heading}
                  className="ar-table-thead-header5 td-padding text-white"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((report, index) => (
              <tr
                key={report.key}
                className="ar-table-thead-header4 tableRowColor"
              >
                <td className="td-padding">{index + 1}</td>
                <td className="td-padding">{report.title}</td>
                <td className="td-padding">{report.dashboard}</td>
                <td className="td-padding">
                  {describeFilters(report.filters).join(" · ")}
                </td>
                <td className="td-padding">
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    className="bg-button"
                    startIcon={<DownloadIcon fontSize="small" />}
                    onClick={() => setSelected(report)}
                  >
                    Download
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Keyed on the report so each opening starts from fresh filters. */}
      {selected && (
        <SpareReportDownloadDialog
          key={selected.key}
          report={selected}
          show
          onHide={handleClose}
        />
      )}
    </Container>
  );
};

export default SpareReports;
