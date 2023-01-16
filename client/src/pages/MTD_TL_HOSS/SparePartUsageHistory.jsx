import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import TextField from "@material-ui/core/TextField";
import MaterialTable from "@material-table/core";

import OperatorDataEntry from "../../Popups/OperatorDataEntry";

const SparePartUsageHistory = () => {
  const [tableData, setTableData] = useState([]);

  const tableColumn = [
    {
      title: "Sr. no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
    },
    {
      title: "Date",
      editable: "false",
      align: "center",
    },
    {
      title: "Line",
      // field: "line_names.line_name",
      //   render: (rowData) => rowData?.line_names.line_name,
      editable: "false",
      align: "center",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
    },

    {
      title: "Category",
      editable: "false",
      align: "center",
    },

    {
      title: "Part Name",
      editable: "false",
      align: "center",
    },

    {
      title: "Used By",
      editable: "false",
      align: "center",
    },

    {
      title: "Cost",
      editable: "false",
      align: "center",
    },

    {
      title: "Abnormality",
      editable: "false",
      align: "center",
    },

    {
      title: "SparePart",
      editable: "false",
      align: "center",
    },
  ];

  const actions = [
    // {
    //   // icon: () => <button className="addbutton">Add</button>,
    //   icon: () => <button className="btn">Add</button>,
    //   tooltip: "Add User",
    //   isFreeAction: true,
    //   onClick: (event, rowData) => {
    //     setOperatorDataEntryPopup(
    //       <OperatorDataEntry closePopup={closePopup} />
    //     );
    //     document.querySelector(".sparePartUsageHistory").style.pointerEvents = "none";
    //   },
    // },
  ];

  return (
    <>
      <Container fluid className="pt-5 sparePartUsageHistory">
        <MaterialTable
          localization={
            {
              // toolbar: {
              //   exportCSVName: "Export some Excel format",
              //   exportPDFName: "Export as pdf!!"
              // }
            }
          }
          actions={actions}
          //   icons={tableIcons}
          columns={tableColumn}
          data={tableData}
          title="Spare Part Usage History"
          // tableRef={this.tableRef.current.onQueryChange()}

          editable={
            {
              // isDeleteHidden: (rowData) => rowData.user_type === 0,
              // onRowUpdate: (updatedRow, oldRow) =>
              //   new Promise((resolve, reject) => {
              //     const index = oldRow.tableData.id;
              //     const updatedRows = [...tableData];
              //     updatedRows[index] = updatedRow;
              //     //call the update user function and pass the user data
              //     updateUserInfo(updatedRow);
              //     setTimeout(() => {
              //       setTableData(updatedRows);
              //       resolve();
              //     }, 500);
              //     //refreshPage();
              //   }),
            }
          }
          options={{
            showTitle: true,
            paging: false,
            sorting: true,
            search: true,
            filtering: false,
            exportButton: true,
            exportAllData: true,
            draggable: false,
            actionsColumnIndex: -1,
            pageSize: 10,
            pageSizeOptions: false,
            paginationType: "stepped",
            addRowPosition: "first",
            headerStyle: {
              position: "sticky",
              top: "0",
              fontWeight: "bold",
            },
            tableLayout: {
              border: "2px solid black",
            },
            maxBodyHeight: "40vh",
            rowStyle: {
              // fontStyle:'bold'

              // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
              // color:"rgba(255,255,255,0.8)",
              borderRadius: "5px",
              border: "2px solid black",
              WebkitBackdropFilter: "blur( 2px )",
              background: "rgba(255,255,255,0.1)",
              // backdropFilter: "blur(5px)",
            },
            cellStyle: {
              border: "2px solid black",
            },
            headerStyle: {
              border: "1px solid black",
            },
          }}
        />
      </Container>
    </>
  );
};

export default SparePartUsageHistory;
