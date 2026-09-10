import { memo, useCallback, useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

import SpareTitlebar from "../../Component/SpareTitlebar";
import SpareSheetCustomTable from "../../Component/SpareSheetCustomTable";
import ExportCSV from "../SparePartIssuance/ExportCSV";

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

const tableHeaders = [
  "Unique ID",
  "Part No",
  "Part Name",
  "Part Model",
  "Part Group",
  "Maker",
  "Supplier",
  "Unit",
  "Location",
  "Register Section",
  "Machine No",
  "Machine Name",
  "Other M/C Codes",
  "Product",
  "Line",
  "Sub Section",
  "Section",
  "Plant",
  "Min Qty",
  "Max Qty",
  "Order Point",
  "Order Qty",
  "Lead Time",
  "Stock Qty",
  "Issued Qty",
  "Available Qty",
  "Overall Cost (INR)",
  "Status",
  "Registered On",
  "Action",
];

const numberOrBlank = (value) =>
  value === null || value === undefined ? "" : value;

const inrFormat = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const MasterRow = memo(({ otherData, navigate }) => (
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
    <td className="td-padding">{otherData?.registeredOn}</td>
    <td className="td-padding">
      <AppRegistrationIcon
        fontSize="small"
        className="button-style text-primary"
        onClick={() =>
          navigate(`/spare/spareMasterRegistration/?masterId=${otherData?._id}`)
        }
      />
    </td>
  </>
));

const SpareMasterDashboard = () => {
  const navigate = useNavigate();
  const [totalMasters, setTotalMasters] = useState(null);

  /**
   * The row count arrives with the first page, so it costs no extra request. Only
   * that page carries it — the total does not change while scrolling.
   */
  const handlePageLoaded = useCallback(({ totalCount }) => {
    if (totalCount !== undefined) setTotalMasters(totalCount);
  }, []);

  const title = useMemo(
    () =>
      totalMasters === null
        ? "Master Dashboard"
        : `Master Dashboard — ${totalMasters.toLocaleString("en-IN")} masters`,
    [totalMasters],
  );

  const otherParentProps = useMemo(() => ({ navigate }), [navigate]);

  return (
    <Container fluid>
      <SpareTitlebar
        title={title}
        Toolbar={
          <ExportCSV url={`${url}/export`} axiosParams={{}} />
        }
      />

      <SpareSheetCustomTable
        url={url}
        tableHeaders={tableHeaders}
        OtherComp={MasterRow}
        otherParentProps={otherParentProps}
        rowKey={(row) => row?._id}
        onPageLoaded={handlePageLoaded}
      />
    </Container>
  );
};

export default SpareMasterDashboard;
