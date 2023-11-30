import React from "react";

import MaterialTable from "@material-table/core";
import tableIcons from "../../../components/MatrialTableIcon";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DescriptionIcon from "@mui/icons-material/Description";
import { Container, Row, Col } from "react-bootstrap";

const BDRequestSheetTable = ({ requestSheetData }) => {
  const requestSheetHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
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
      title: "Date-time",
      field: "problemOccurredDateAndTimeOfBM",
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

  const requestSheetActions = [];

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
        }}
      />
    </>
  );
};

export default BDRequestSheetTable;
