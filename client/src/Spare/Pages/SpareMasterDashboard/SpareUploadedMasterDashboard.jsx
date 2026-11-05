import { memo, useCallback, useContext, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import RoutingContext from "../../../context/routing/RoutingContext";
import SpareTitlebar from "../../Component/SpareTitlebar";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import SpareRequestApprovalModal from "../../Component/Common/SpareRequestApprovalModal";
import ExportCSV from "../SparePartIssuance/ExportCSV";
import SpareMasterImportPanel from "./SpareMasterImportPanel";
import RepairedQualityConfirmationForm from "./RepairedQualityConfirmationForm";
import RepairedQualityConfirmationView from "./RepairedQualityConfirmationView";
import { isToolRoomUser } from "../../../Utils/userScope";
import {
  MasterRow,
  tableHeaders,
  editHeader,
  useMasterDashboardFilters,
  ClearFiltersButton,
} from "./SpareMasterDashboard";

/**
 * A master catalogue the Tool Room loads from Excel: Recycle Parts or Repaired
 * Parts. The same record shape and table as the stock-in master, but its own
 * collection, its own dashboard, and an upload panel instead of a backend
 * script. `masterType` is the route segment the server keys the catalogue on,
 * and travels with the Tool Room's edit link so the registration form saves
 * back to the same catalogue.
 *
 * The Repaired catalogue additionally accepts the "Repaired Part Quality
 * Confirmation Sheet" (FO/MTD/05/09/00): each submission becomes a record in
 * this table and carries the MTD approval chain. The Status and Approval
 * columns are only shown here.
 */
const MASTER_TITLES = {
  recycle: "Recycle Parts Master",
  repaired: "Repaired Parts Master",
};

const SpareUploadedMasterDashboard = memo(({ masterType }) => {
  const navigate = useNavigate();
  const loggedUser = useContext(RoutingContext) ?? {};
  const canUpload = isToolRoomUser(loggedUser);
  const canEdit = canUpload;
  const isRepaired = masterType === "repaired";

  const url = `/v1/spare/master/${masterType}/dashboard`;
  const importUrl = `/v1/spare/master/${masterType}/import`;

  const [totalMasters, setTotalMasters] = useState(null);
  // Bumped after a committed import so the table reloads from page one.
  const [listVersion, setListVersion] = useState(0);
  const [showQualityForm, setShowQualityForm] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [approvalRow, setApprovalRow] = useState(null);

  const handlePageLoaded = useCallback(({ totalCount }) => {
    if (totalCount !== undefined) setTotalMasters(totalCount);
  }, []);

  const reloadTable = useCallback(() => {
    setTotalMasters(null);
    setListVersion((version) => version + 1);
  }, []);

  const handleImported = useCallback(() => reloadTable(), [reloadTable]);

  const handleQualitySaved = useCallback(() => {
    setShowQualityForm(false);
    reloadTable();
  }, [reloadTable]);

  const handleApprovalSaved = useCallback(() => {
    setApprovalRow(null);
    reloadTable();
  }, [reloadTable]);

  const resetTotal = useCallback(() => setTotalMasters(null), []);
  const { renderHeader, params, listKey, activeCount, clearAll } =
    useMasterDashboardFilters({ url, onFiltersChanged: resetTotal });

  const title = useMemo(() => {
    const base = MASTER_TITLES[masterType] ?? "Master Dashboard";
    return totalMasters === null
      ? base
      : `${base} — ${totalMasters.toLocaleString("en-IN")} masters`;
  }, [masterType, totalMasters]);

  const otherParentProps = useMemo(
    () => ({
      navigate,
      canEdit,
      masterType,
      loggedUser,
      showStatus: isRepaired,
      showPendingWith: isRepaired,
      repairedActions: isRepaired,
      onView: isRepaired ? (row) => setViewRow(row) : undefined,
      onApprove: isRepaired ? (row) => setApprovalRow(row) : undefined,
    }),
    [navigate, canEdit, masterType, isRepaired, loggedUser],
  );

  const headers = useMemo(
    () => [
      ...tableHeaders,
      ...(isRepaired ? ["Status", "Pending With", "Action"] : []),
      ...(!isRepaired && canEdit ? [editHeader] : []),
    ],
    [canEdit, isRepaired],
  );

  const approvalDetails = useMemo(() => {
    if (!approvalRow) return [];
    return [
      { label: "Unique ID", value: approvalRow.uniqueID },
      { label: "Part No", value: approvalRow.partNumber },
      { label: "Part Name", value: approvalRow.partName },
      { label: "Manufacturer", value: approvalRow.maker },
      { label: "Issue / Problem", value: approvalRow.issueProblem },
      { label: "Repaired Item", value: approvalRow.repairedItem },
      { label: "Repaired By", value: approvalRow.repairedBy },
      { label: "Quality Confirmed By", value: approvalRow.qualityConfirmedBy },
      { label: "Status", value: approvalRow.requestStatus },
    ];
  }, [approvalRow]);

  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params,
      referenceArrayForUseEffect: [masterType, listVersion, listKey],
    }),
    [params, masterType, listVersion, listKey],
  );

  return (
    <Container fluid>
      <SpareTitlebar
        title={title}
        inlineToolbar
        Toolbar={
          <div className="d-flex gap-2 align-items-center">
            <ClearFiltersButton activeCount={activeCount} clearAll={clearAll} />
            <ExportCSV url={`${url}/export`} axiosParams={params} />
            {isRepaired && canUpload && (
              <Button
                variant="contained"
                size="small"
                disableElevation
                startIcon={<AddIcon />}
                onClick={() => setShowQualityForm(true)}
              >
                New Quality Confirmation
              </Button>
            )}
          </div>
        }
      />

      {canUpload && (
        <SpareMasterImportPanel url={importUrl} onImported={handleImported} />
      )}

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

      {isRepaired && (
        <RepairedQualityConfirmationForm
          show={showQualityForm}
          onHide={() => setShowQualityForm(false)}
          onSaved={handleQualitySaved}
          isToolRoom={canUpload}
          user={loggedUser}
        />
      )}

      {isRepaired && (
        <RepairedQualityConfirmationView
          show={Boolean(viewRow)}
          row={viewRow ?? {}}
          onHide={() => setViewRow(null)}
        />
      )}

      {isRepaired && (
        <SpareRequestApprovalModal
          show={Boolean(approvalRow)}
          row={approvalRow ?? {}}
          onHide={() => setApprovalRow(null)}
          onSaved={handleApprovalSaved}
          url="/v1/spare/master/repaired/qualityConfirmation/approval"
          title="Repaired Part Quality Confirmation Approval"
          details={approvalDetails}
        />
      )}
    </Container>
  );
});

export default SpareUploadedMasterDashboard;
