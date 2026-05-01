import moment from "moment";
import { useNavigate } from "react-router-dom";

import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../BM/Utils/TableUtils/MaterialTableProps";
import tableIcons from "../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import MaterialTable from "@material-table/core";
import WithLoadingAndError from "./Common/WithLoadingAndError";

const TableComponent = ({
  tableData,
  tableProps = {
    exportMenu: {
      exportFileNamePrefix: "Approval List of Request-Sheet",
    },
  },
}) => {
  const navigate = useNavigate();

  const approvalDashboardHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: false,
      width: "5%",
    },
    {
      title: "Request No",
      field: "requestSheetNo",
    },
    {
      title: "Product",
      field: "cell.cell_name",
    },
    {
      title: "Line",
      field: "line.line_name",
    },
    {
      title: "Machine No",
      field: "machine.machine_code",
    },
    {
      title: "Machine Name",
      field: "machine.machine_name",
    },
    {
      title: "RS Status",
      field: "requestSheetStatus",
    },
    {
      title: "Budget Status",
      field: "budget.budgetStatus",
    },
  ];

  const requestSheetApprovalAction = [
    {
      icon: () => <DescriptionIcon className="text-primary" />,
      tooltip: "Update Action",
      position: "row",
      //   hidden: loggedUserDetails?.tm_no === "9999",
      onClick: (event, selectedRow) => {
        navigate(`/spare/spareNewPartRequest/?_id=${selectedRow?._id}`);
      },
    },
  ];

  return (
    <MaterialTable
      localization={{
        header: {
          actions: "Actions",
        },
      }}
      // isLoading={isLoading}
      actions={requestSheetApprovalAction}
      icons={tableIcons}
      columns={approvalDashboardHeader}
      data={tableData}
      editable={{}}
      options={{
        ...MaterialTableOptions,
        pageSize: 50,
        exportMenu: [
          {
            label: "Export PDF",
            exportFunc: (cols, data) =>
              ExportPdf(
                cols,
                data,
                `${
                  tableProps?.exportMenu?.exportFileNamePrefix
                } ${moment().format("DD-MM-YYYY")}`,
              ),
          },
          {
            label: "Export CSV",
            exportFunc: (cols, data) =>
              ExportCsv(
                cols,
                data,
                `${
                  tableProps?.exportMenu?.exportFileNamePrefix
                } ${moment().format("DD-MM-YYYY")}`,
              ),
          },
        ],
      }}
      style={MaterialTableStyle}
      sx={MaterialTableSX}
    />
  );
};

const SpareSheetTable = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  url = `/v1/spare/spareRequestSheet/approval`,
  tableProps = {
    exportMenu: {
      exportFileNamePrefix: "Approval List of Request-Sheet",
    },
  },
}) => {
  return (
    <WithLoadingAndError
      requestProps={{
        url,
        axiosConfig: {
          params: {
            flagForTogglingFilter,
            selectedValue,
            selectedYear,
          },
        },
        referenceArrayForUseEffect: [
          flagForTogglingFilter,
          selectedValue,
          selectedYear,
        ],
        initialState: {
          isLoading: true,
          isError: false,
          data: {
            tableData: [],
          },
        },
      }}
      PropComponent={(prop) => (
        <TableComponent {...prop} tableProps={tableProps} />
      )}
    />
  );
};

export default SpareSheetTable;
