import React from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";

import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../BM/Utils/TableUtils/MaterialTableProps";
import tableIcons from "../../components/MatrialTableIcon";
import DescriptionIcon from "@mui/icons-material/Description";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import MaterialTable from "@material-table/core";

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
  const navigate = useNavigate();

  const [{ isLoading, isError, data }] = useSafeGetRequest({
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
  });

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
      isLoading={isLoading}
      actions={requestSheetApprovalAction}
      icons={tableIcons}
      columns={approvalDashboardHeader}
      data={data?.tableData}
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
                } ${moment().format("DD-MM-YYYY")}`
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
                } ${moment().format("DD-MM-YYYY")}`
              ),
          },
        ],
      }}
      style={MaterialTableStyle}
      sx={MaterialTableSX}
    />
  );
};

export default SpareSheetTable;
