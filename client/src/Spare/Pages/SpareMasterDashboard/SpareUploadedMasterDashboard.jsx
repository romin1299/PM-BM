import { memo, useCallback, useContext, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import RoutingContext from "../../../context/routing/RoutingContext";
import SpareTitlebar from "../../Component/SpareTitlebar";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import ExportCSV from "../SparePartIssuance/ExportCSV";
import SpareMasterImportPanel from "./SpareMasterImportPanel";
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
 */
const MASTER_TITLES = {
  recycle: "Recycle Parts Master",
  repaired: "Repaired Parts Master",
};

const SpareUploadedMasterDashboard = memo(({ masterType }) => {
  const navigate = useNavigate();
  const { toolRoomPerson } = useContext(RoutingContext) ?? {};
  const canUpload = toolRoomPerson === "Yes";
  const canEdit = canUpload;

  const url = `/v1/spare/master/${masterType}/dashboard`;
  const importUrl = `/v1/spare/master/${masterType}/import`;

  const [totalMasters, setTotalMasters] = useState(null);
  // Bumped after a committed import so the table reloads from page one.
  const [listVersion, setListVersion] = useState(0);

  const handlePageLoaded = useCallback(({ totalCount }) => {
    if (totalCount !== undefined) setTotalMasters(totalCount);
  }, []);

  const handleImported = useCallback(() => {
    setTotalMasters(null);
    setListVersion((version) => version + 1);
  }, []);

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
    () => ({ navigate, canEdit, masterType }),
    [navigate, canEdit, masterType],
  );

  const headers = useMemo(
    () => (canEdit ? [...tableHeaders, editHeader] : tableHeaders),
    [canEdit],
  );

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
          <div className="d-flex gap-2">
            <ClearFiltersButton activeCount={activeCount} clearAll={clearAll} />
            <ExportCSV url={`${url}/export`} axiosParams={params} />
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
    </Container>
  );
});

export default SpareUploadedMasterDashboard;
