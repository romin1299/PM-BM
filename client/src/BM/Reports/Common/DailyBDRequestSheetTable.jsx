import React from "react";

import MaterialTable from "@material-table/core";
import tableIcons from "../../../components/MatrialTableIcon";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  MaterialTableOptions,
  MaterialTableSX,
  MaterialTableStyle,
} from "../../Utils/TableUtils/MaterialTableProps";

const BDRequestSheetTable = ({
  requestSheetData,
  downloadFileName,
  loading = false,
  selectedYear,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // console.log("location:", location);

  const requestSheetHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
    },
    {
      title: "Section",
      field: "sectionName",
    },
    {
      title: "Request No",
      field: "requestSheetNoOfBM",
    },
    {
      title: "Product",
      field: "cell",
    },
    {
      title: "Line",
      field: "line",
    },
    {
      title: "Machine No",
      field: "machineNo",
    },
    {
      title: "Machine Name",
      field: "machineName",
    },
    {
      title: "Problem",
      field: "problem",
    },
    {
      title: "Date-Time",
      field: "problemOccurredDateAndTimeOfBM",
    },
    {
      title: "Loss Time",
      field: "loss_time",
    },
    {
      title: "Work Order Status",
      field: "work_order_status",
    },
    {
      title: "R.S Status",
      field: "requestSheetStatus",
    },
  ];

  const requestSheetActions = [
    (row) => ({
      icon: () => <VisibilityIcon className="text-primary" />,
      tooltip: "View",
      position: "row",
      onClick: (event, selectedRow) => {
        navigate(
          `/bm/view/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}/${selectedYear}`,
          {
            state: {
              prevPath: location?.pathname,
              prevPathSearch: location?.search,
            },
          }
        );
      },
    }),
  ];

  return (
    <>
      <MaterialTable
        localization={{
          header: {
            actions: "Actions",
          },
          pagination: {
            // labelRowsPerPage: "",
          },
          // toolbar: {
          //   exportCSVName: "Export some Excel format",
          //   exportPDFName: "Export as pdf!!"
          // }
        }}
        isLoading={loading}
        actions={requestSheetActions}
        icons={tableIcons}
        columns={requestSheetHeader}
        data={requestSheetData}
        // title="User Management"
        // tableRef={this.tableRef.current.onQueryChange()}

        editable={
          {
            // onRowAdd: (newRow) =>
            //   new Promise((resolve, reject) => {
            //     setTimeout(() => {
            //       resolve();
            //     }, 500);
            //     //refreshPage();
            //   }),
            // onRowDelete: (selectedRow) =>
            //   new Promise((resolve, reject) => {
            //     setTimeout(() => {
            //       resolve();
            //     }, 500);
            //   }),
            // onRowUpdate: (updatedRow, oldRow) =>
            //   new Promise(async (resolve, reject) => {
            //     resolve();
            //   }),
          }
        }
        options={{
          ...MaterialTableOptions,
          pageSize: 5,
          maxBodyHeight: "auto",
          exportMenu: [
            {
              label: "Export PDF",
              exportFunc: (cols, data) =>
                ExportPdf(
                  cols,
                  data,
                  `${downloadFileName} ${moment().format("DD-MM-YYYY")}`
                ),
            },
            {
              label: "Export CSV",
              exportFunc: (cols, data) =>
                ExportCsv(
                  cols,
                  data,
                  `${downloadFileName} ${moment().format("DD-MM-YYYY")}`
                ),
            },
          ],
        }}
        style={MaterialTableStyle}
        sx={MaterialTableSX}
      />
    </>
  );
};

export default BDRequestSheetTable;
