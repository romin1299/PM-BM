import React, { useCallback, useContext, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { Form } from "react-bootstrap";
import AddIcon from "@mui/icons-material/Add";

import RoutingContext from "../../../context/routing/RoutingContext";
import { isToolRoomUser } from "../../../Utils/userScope";
import SpareTitlebar from "../SpareTitlebar";
import SpareSheetCustomTable from "../SpareSheetCustomTable";
import SparePartSearchBar from "../SparePartSearchBar";
import ExportCSV from "../../Pages/SparePartIssuance/ExportCSV";
import { useTableColumnFilters } from "./useTableColumnFilters";

const STATUS_OPTIONS = ["All", "Pending", "Completed", "Rejected"];

/**
 * The dashboard shell shared by the change and delete request pages: search,
 * status filter, Excel-style column filters, CSV export, the New button, the
 * paged table, and the new/view/approval modals.
 *
 * The pages differ only in their row component, table headers (and their
 * filterable columns), form and approval popup, which are passed in.
 */
const SpareRequestDashboard = ({
  title,
  url,
  exportUrl,
  tableHeaders,
  columns = [],
  columnValuesUrl,
  RowComponent,
  FormComponent,
  ApprovalComponent,
  newButtonLabel = "New Request",
}) => {
  const loggedUser = useContext(RoutingContext) ?? {};

  const [filters, setFilters] = useState({ search: "", status: "All" });
  const [reloadCount, setReloadCount] = useState(0);
  const [modal, setModal] = useState(null);

  const {
    renderHeader: renderColumnHeader,
    filtersParam,
    activeCount: activeColumnFilters,
    clearAll: clearColumnFilters,
  } = useTableColumnFilters({ valuesUrl: columnValuesUrl, columns });

  const handleSelectOtherFilters = useCallback(
    (next) => setFilters((prev) => ({ ...prev, ...next })),
    [],
  );

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        ...filters,
        ...(filtersParam ? { filters: filtersParam } : {}),
      },
      referenceArrayForUseEffect: [
        filters.search,
        filters.status,
        filtersParam,
        reloadCount,
      ],
    }),
    [filters, filtersParam, reloadCount],
  );

  const otherParentProps = useMemo(
    () => ({
      loggedUserId: loggedUser?._id,
      onView: (row) => setModal({ mode: "VIEW", row }),
      onApprove: (row) => setModal({ mode: "APPROVAL", row }),
    }),
    [loggedUser?._id],
  );

  const closeModal = useCallback(() => setModal(null), []);
  const handleSaved = useCallback(() => {
    setReloadCount((count) => count + 1);
    setModal(null);
  }, []);

  return (
    <div className="p-2">
      <SpareTitlebar
        title={title}
        inlineToolbar
        Toolbar={
          <div className="d-flex gap-2 align-items-center">
            <SparePartSearchBar
              handleSelectOtherFilters={handleSelectOtherFilters}
            />

            <Form.Select
              size="sm"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              style={{ width: 130 }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>

            <ExportCSV
              url={exportUrl}
              axiosParams={apiReferencePropsBasedOnFilters?.params}
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

            <Button
              variant="contained"
              size="small"
              disableElevation
              startIcon={<AddIcon />}
              onClick={() => setModal({ mode: "NEW" })}
            >
              {newButtonLabel}
            </Button>
          </div>
        }
      />

      <SpareSheetCustomTable
        url={url}
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        rowKey={(row) => row?._id}
        tableHeaders={tableHeaders}
        renderHeader={renderColumnHeader}
        OtherComp={RowComponent}
        otherParentProps={otherParentProps}
      />

      {modal?.mode === "NEW" && (
        <FormComponent
          show
          onHide={closeModal}
          onSaved={handleSaved}
          isToolRoom={isToolRoomUser(loggedUser)}
          user={loggedUser}
        />
      )}

      {modal?.mode === "VIEW" && (
        <FormComponent
          show
          initialValues={modal.row}
          onHide={closeModal}
          user={loggedUser}
        />
      )}

      {modal?.mode === "APPROVAL" && (
        <ApprovalComponent
          show
          row={modal.row}
          onHide={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default SpareRequestDashboard;
