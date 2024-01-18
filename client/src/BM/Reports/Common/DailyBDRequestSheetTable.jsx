import React from "react";

import MaterialTable from "@material-table/core";
import tableIcons from "../../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Container, Row, Col } from "react-bootstrap";
import { ExportCsv, ExportPdf } from "@material-table/exporters";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";

const BDRequestSheetTable = ({
  requestSheetData,
  downloadFileName,
  loading = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // console.log("location:", location);

  const requestSheetHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%"
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
      field: "loss_time"
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
          `/bm/view/request-sheet/${selectedRow?.machineNo}/${selectedRow?._id}`,
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
          showTitle: false,
          paging: false,
          sorting: true,
          search: true,
          filtering: false,
          exportButton: true,
          exportAllData: true,
          draggable: false,
          actionsColumnIndex: -1,
          pageSize: 10,
          // pageSizeOptions: false,  //commented because showing warning in console: invalid prop
          paginationType: "stepped",
          addRowPosition: "first",
          headerStyle: {
            position: "sticky",
            top: "0",
            fontWeight: "bold",
          },
          maxBodyHeight: "70vh",
          rowStyle: {
            // fontStyle:'bold'

            boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
            // color:"rgba(255,255,255,0.8)",
            borderRadius: "5px",
            border: "1px solid rgba(255,255,255)",
            WebkitBackdropFilter: "blur( 2px )",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(5px)",
          },
          headerStyle: {
            fontSize: "14px",
            fontWeight: "bold",
          },
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
      />
    </>
  );
};

export default BDRequestSheetTable;
