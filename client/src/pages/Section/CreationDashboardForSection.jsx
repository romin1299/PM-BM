import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  AddBoxIcon,
  useContext,
} from "../../modules/PageModules";

import {
  newCell,
  deleteCell,
  updateCell,
  newLine,
  updateLine,
  deleteLine,
  updateMachine,
  deleteMachine,
} from "../../Integration/APIExports.js";

import "../../SCSS/MaterialTable.scss";
import { RadioGroup } from "@mui/material";
import RoutingContext from "../../context/routing/RoutingContext";
import MachineAdd from "../../Popups/machineAdd";
import Footer from "../../components/Footer/Footer";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

const CreationDashboardForSection = () => {
  const [subSection, setSubSection] = useState();
  const [cell, setCell] = useState();
  const [line, setLine] = useState();
  const [machine, setMachine] = useState();

  const [subSectionList, setSubSectionList] = useState("");

  const [cellList, setCellList] = useState("");
  const [lineList, setLineList] = useState("");

  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);
  const [refKey3, setRefKey3] = useState(0);

  const context = useContext(RoutingContext);

  // console.log(context.subSection_data);
  //fetch all section head for showing or selecting in dropdown by common user

  // setRefKey(refKey + 1)
  // console.log(dashboardLevel);

  // Section

  const cellHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
    },
    {
      title: "Cell/Product Id",
      field: "cell_id",
      align: "center",
      editable: "false",
    },
    {
      title: "Cell/Product Name",
      field: "cell_name",
      align: "center",
    },
    {
      title: "Cell/Product Sequence",
      field: "cell_sequence",

      align: "center",
    },
  ];

  
  //get the date and time
  const timeStamp = () => {
    let date = new Date();
    let getTime = date
      .toLocaleTimeString("en-IN", {
        hour12: true,
      })
      .replace(/(.*)\D\d+/, "$1");
    const year = date.getFullYear(); // 2019
    const month = date.getMonth() + 1;
    const day = date.getDate(); // 23

    return `${day}/${month}/${year} - ${getTime}`;
  };


  const cellHeaderForCSV = [
    {
      label: "Cell/Product Id",
      key: "cell_id",
    },
    {
      label: "Cell/Product Name",
      key: "cell_name",
    },
    {
      label: "Cell/Product Sequence",
      key: "cell_sequence",
    },
  ];

  const downloadPDFOfCellData = () => {
    const doc = new jsPDF();
    let rows = [];
    cellList?.cellInfo?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.cell_id,
        item.cell_name,
        item.cell_sequence,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Cell Data`, 15, 10);

    autoTable(doc, {
      head: [cellHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Cell_Data_${timeStamp()}`);
  };

  const cellAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfCellData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={cellHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={cellList.cellInfo}
          filename={`Cell_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
    },
  ];

  const lineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
    },
    {
      title: "Line Id",
      field: "line_id",
      editable: "false",
      align: "center",
    },
    {
      title: "Line Name",
      field: "line_name",
      align: "center",
    },
    {
      title: "Line Sequence",
      field: "line_sequence",
      align: "center",
    },
  ];

  const lineHeaderForCSV = [
    {
      label: "Line Id",
      key: "line_id",
    },
    {
      label: "Line Name",
      key: "line_name",
    },
    {
      label: "Line Sequence",
      key: "line_sequence",
    },
  ];

  const downloadPDFOfLineData = () => {
    const doc = new jsPDF();
    let rows = [];
    lineList?.lineInfo?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.line_id,
        item.line_name,
        item.line_sequence,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Line Data`, 15, 10);

    autoTable(doc, {
      head: [lineHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Line_Data_${timeStamp()}`);
  };

  const lineAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfLineData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={lineHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={lineList?.lineInfo}
          filename={`Line_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
    },
  ];

  const machineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
    },
    {
      title: "Machine Code",
      field: "machine_code",
      editable: "false",
      align: "center",
    },
    {
      title: "Machine Name",
      field: "machine_name",
      align: "center",
    },
    {
      title: "Machine Nick-Name",
      field: "machine_nickname",
      align: "center",
    },
    {
      title: "Machine Sequence",
      field: "machine_sequence",
      align: "center",
    },
    {
      title: "Installation Date",
      field: "installation_date",
      editable: "false",
      align: "center",
    },
    {
      title: "Manufacturing Date",
      field: "manufacturingDate",
      editable: "false",
      align: "center",
    },
    {
      title: "Maker Name",
      field: "maker_name",
      align: "center",
    },
    {
      title: "Maker Sr.No.",
      field: "maker_sr_no",
      align: "center",
    },
  ];

  const postSectionToGetSubSectionList = async () => {
    setSubSection(undefined);
    setCell(undefined);
    // setLine(undefined);
    // setMachine(undefined);
    try {
      const res = await fetch("/postSectionToGetSubSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post");

        setSubSectionList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postSubSectionToGetCellList = async (selectedSubSection) => {
    setCell(undefined);
    // setLine(undefined);
    // setMachine(undefined);
    try {
      const res = await fetch("/postSubSectionToGetCellList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subSection: selectedSubSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post");

        setCellList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postCellToGetLineList = async (selectedCell) => {
    // setLine(undefined);
    // setMachine(undefined);
    try {
      const res = await fetch("/postCellToGetLineList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cell: selectedCell,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post", data);

        setLineList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const postLineToGetMachineList = async (selectedLine) => {
  //   setMachine(undefined);
  //   try {
  //     const res = await fetch("/postLineToGetMachineList", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         line: selectedLine,
  //       }),
  //     });
  //     const data = await res.json();

  //     if (res.status === 400 || res.status === 422 || !data) {
  //       console.log("Invalid");
  //     } else {
  //       // window.alert(data.abcd);
  //       console.log("Data post", data);

  //       setMachine(data.machineInfo);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const refreshForMachineData = () => {
  //   // console.log("******");
  //   setRefKey3((refKey3) => refKey3 + 1);
  // };

  useEffect(() => {
    postSectionToGetSubSectionList();
  }, [context.section_data]);

  useEffect(() => {
    if (subSection) {
      postSubSectionToGetCellList(subSection);
    }
  }, [subSection, refKey]);

  useEffect(() => {
    if (cell) {
      postCellToGetLineList(cell);
    }
  }, [cell, refKey2]);

  // useEffect(() => {
  //   if (line) {
  //     postLineToGetMachineList(line);
  //   }
  // }, [line, refKey3]);

  // const actionsForMachineTable = [
  //   {
  //     // icon: () => <button className="addbutton">Add</button>,
  //     icon: () =>
  //       window.innerWidth > 1024 ? (
  //         <button className="btn">Add Machine</button>
  //       ) : (
  //         <AddBoxIcon />
  //       ),

  //     tooltip: "Add Machine",
  //     isFreeAction: true,
  //     onClick: (event, rowData) => {
  //       document.getElementById("main_div_reg3").style.display = "block";
  //       document.getElementById("main_div_reg3").style.pointerEvents = "auto";
  //       document.querySelector(".App").style.pointerEvents = "none";
  //     },
  //   },
  // ];

  // console.log(
  //   subSectionList !== ""
  //     ? subSectionList.sectionInfo.dashboardLevel === "Yes"
  //       ? `${subSectionList.subSectionArray} _____ subSectionList.subSectionArray`
  //       : `${context.subSection_data} ______context.subSection_data`
  //     : ""
  // );

  return (
    <>
      <div className="mainPage">
        {/* <MachineAdd line={line} refreshForMachineData={refreshForMachineData} /> */}
        <div className="pageCard">
          <div className="creationDashboard">
            <div className="selection_div">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>Sub-section</span>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "15rem", background: "white" }}
                  id="standard-select-currency"
                  name="plant"
                  className="textField"
                  select
                  // fullWidth // label="Select"
                  autoComplete="off"
                  value={subSection === undefined ? "" : subSection}
                  onChange={(e) => {
                    setSubSection(e.target.value);
                  }}
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {subSectionList !== ""
                    ? (subSectionList.sectionInfo.dashboardLevel === "Yes"
                        ? subSectionList.subSectionArray
                        : context.subSection_data
                      ).map((option) => {
                        return <option value={option}>{option}</option>;
                      })
                    : ""}
                  {/* context.subSection_data */}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>Cell/Product</span>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "15rem", background: "white" }}
                  id="standard-select-currency"
                  name="plant"
                  className="textField"
                  select
                  // fullWidth // label="Select"
                  autoComplete="off"
                  value={cell === undefined ? "" : cell}
                  onChange={(e) => {
                    setCell(e.target.value);
                  }}
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {cellList !== ""
                    ? cellList.cellArray.map((option) => {
                        return <option value={option}>{option}</option>;
                      })
                    : ""}
                </select>
              </div>
              {/* <div style={{ display: "flex", flexDirection: "column" }}>
                <span>Line</span>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  style={{ width: "100%", background: "white" }}
                  id="standard-select-currency"
                  name="plant"
                  className="textField"
                  select
                  fullWidth // label="Select"
                  autoComplete="off"
                  //   value={plant}

                  value={line === undefined ? "" : line}
                  onChange={(e) => {
                    setLine(e.target.value);
                  }}
                  variant="standard"
                >
                  <option selected disabled value="">
                    Please select
                  </option>
                  {lineList !== ""
                    ? lineList.lineArray.map((option) => {
                        return <option value={option}>{option}</option>;
                      })
                    : ""}
                </select>
              </div> */}
            </div>
            <div style={{ padding: "1rem" }}>
              {
                // subSection && cell && line ? (
                //   machine !== "" ? (
                //     <MaterialTable
                //       localization={{
                //         header: {
                //           actions: "Actions",
                //         },
                //         // toolbar: {
                //         //   exportCSVName: "Export some Excel format",
                //         //   exportPDFName: "Export as pdf!!"
                //         // }
                //       }}
                //       actions={actionsForMachineTable}
                //       icons={tableIcons}
                //       columns={machineHeader}
                //       data={machine}
                //       // title="User Management"
                //       // tableRef={this.tableRef.current.onQueryChange()}

                //       editable={{
                //         // onRowAdd: (newRow) =>
                //         //   new Promise((resolve, reject) => {
                //         //     const updatedRows = [
                //         //       ...lineList.lineInfo,
                //         //       { user_id: "", ...newRow },
                //         //     ];

                //         //     newLine(newRow, cell);
                //         //     setTimeout(() => {
                //         //       // setSectionList(updatedRows);
                //         //       setRefKey3((refKey3) => refKey3 + 1);
                //         //       resolve();
                //         //     }, 500);
                //         //     //refreshPage();
                //         //   }),

                //         onRowDelete: (selectedRow) =>
                //           new Promise((resolve, reject) => {
                //             // const index = selectedRow.tableData.id;
                //             // console.log(index);
                //             // const updatedRows = [...machine];
                //             // updatedRows.splice(index, 1);

                //             //call the delete user function and pass the user data
                //             // deleteUserInfo(selectedRow);
                //             deleteMachine(selectedRow);
                //             setTimeout(() => {
                //               // setSectionList(updatedRows);
                //               setRefKey2((refKey3) => refKey3 + 1);
                //               resolve();
                //             }, 500);
                //           }),

                //         onRowUpdate: (updatedRow, oldRow) =>
                //           new Promise((resolve, reject) => {
                //             const index = oldRow.tableData.id;
                //             const updatedRows = [...machine];
                //             updatedRows[index] = updatedRow;
                //             //call the update user function and pass the user data
                //             // updateUserInfo(updatedRow);
                //             updateMachine(updatedRow, oldRow);
                //             setTimeout(() => {
                //               // setSectionList(updatedRows);
                //               setRefKey3((refKey3) => refKey3 + 1);
                //               resolve();
                //             }, 500);
                //           }),
                //       }}
                //       options={{
                //         showTitle: false,
                //         paging: false,
                //         sorting: true,
                //         search: true,
                //         filtering: false,
                //         exportButton: true,
                //         exportAllData: true,
                //         draggable: false,
                //         actionsColumnIndex: -1,
                //         // pageSize: 10,
                //         // pageSizeOptions: false,
                //         // paginationType: "stepped",
                //         addRowPosition: "first",
                //         headerStyle: {
                //           position: "sticky",
                //           top: "0",
                //           fontWeight: "bold",
                //         },

                //         maxBodyHeight: "70vh",
                //         // overflowY: "hidden",
                //         rowStyle: {
                //           // fontStyle:'bold'

                //           boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                //           // color:"rgba(255,255,255,0.8)",
                //           borderRadius: "5px",
                //           border: "1px solid rgba(255,255,255)",
                //           WebkitBackdropFilter: "blur( 2px )",
                //           background: "rgba(255,255,255,0.1)",
                //           backdropFilter: "blur(5px)",
                //         },
                //       }}
                //     />
                //   ) : (
                //     ""
                //   )
                // ) :
                subSection && cell ? (
                  lineList !== "" ? (
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
                      actions={lineAction}
                      icons={tableIcons}
                      columns={lineHeader}
                      data={lineList.lineInfo}
                      // title="User Management"
                      // tableRef={this.tableRef.current.onQueryChange()}

                      editable={{
                        onRowAdd: (newRow) =>
                          new Promise((resolve, reject) => {
                            const updatedRows = [
                              ...lineList.lineInfo,
                              { user_id: "", ...newRow },
                            ];

                            newLine(newRow, cell);
                            setTimeout(() => {
                              // setSectionList(updatedRows);
                              setRefKey2((refKey2) => refKey2 + 1);
                              resolve();
                            }, 500);
                            //refreshPage();
                          }),

                        onRowDelete: (selectedRow) =>
                          new Promise((resolve, reject) => {
                            // const index = selectedRow.tableData.id;
                            // console.log(index);
                            // const updatedRows = [...lineList.lineInfo];
                            // updatedRows.splice(index, 1);

                            //call the delete user function and pass the user data
                            // deleteUserInfo(selectedRow);
                            deleteLine(selectedRow);
                            setTimeout(() => {
                              // setSectionList(updatedRows);
                              setRefKey2((refKey2) => refKey2 + 1);
                              resolve();
                            }, 500);
                          }),

                        onRowUpdate: (updatedRow, oldRow) =>
                          new Promise((resolve, reject) => {
                            const index = oldRow.tableData.id;
                            const updatedRows = [...lineList.lineInfo];
                            updatedRows[index] = updatedRow;
                            //call the update user function and pass the user data
                            // updateUserInfo(updatedRow);
                            updateLine(updatedRow, oldRow);
                            setTimeout(() => {
                              // setSectionList(updatedRows);
                              setRefKey2((refKey2) => refKey2 + 1);
                              resolve();
                            }, 500);
                          }),
                      }}
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
                        pageSizeOptions: false,
                        paginationType: "stepped",
                        addRowPosition: "first",
                        headerStyle: {
                          position: "sticky",
                          top: "0",
                          fontWeight: "bold",
                        },
                        // width: "70%",
                        maxBodyHeight: "70vh",
                        // overflowY: "hidden",
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
                      }}
                    />
                  ) : (
                    ""
                  )
                ) : subSection ? (
                  cellList !== "" ? (
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
                      actions={cellAction}
                      icons={tableIcons}
                      columns={cellHeader}
                      data={cellList.cellInfo}
                      // title="User Management"
                      // tableRef={this.tableRef.current.onQueryChange()}

                      editable={{
                        onRowAdd: (newRow) =>
                          new Promise((resolve, reject) => {
                            const updatedRows = [
                              ...cellList.cellInfo,
                              { user_id: "", ...newRow },
                            ];

                            newCell(newRow, subSection);

                            setTimeout(() => {
                              // setSectionList(updatedRows);
                              setRefKey((refKey) => refKey + 1);
                              resolve();
                            }, 500);
                            //refreshPage();
                          }),

                        onRowDelete: (selectedRow) =>
                          new Promise((resolve, reject) => {
                            // const index = selectedRow.tableData.id;
                            // console.log(index);
                            // const updatedRows = [...cellList.cellInfo];
                            // updatedRows.splice(index, 1);

                            //call the delete user function and pass the user data
                            // deleteUserInfo(selectedRow);
                            deleteCell(selectedRow);
                            setTimeout(() => {
                              setRefKey((refKey) => refKey + 1);
                              resolve();
                            }, 500);
                          }),

                        onRowUpdate: (updatedRow, oldRow) =>
                          new Promise((resolve, reject) => {
                            const index = oldRow.tableData.id;
                            const updatedRows = [...cellList.cellInfo];
                            updatedRows[index] = updatedRow;
                            //call the update user function and pass the user data
                            updateCell(updatedRow, oldRow);
                            setTimeout(() => {
                              setRefKey((refKey) => refKey + 1);
                              resolve();
                            }, 500);
                          }),
                      }}
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
                        pageSizeOptions: false,
                        paginationType: "stepped",
                        addRowPosition: "first",
                        headerStyle: {
                          position: "sticky",
                          top: "0",
                          fontWeight: "bold",
                        },
                        maxBodyHeight: "70vh",
                        // overflowY: "hidden",
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
                  ) : (
                    ""
                  )
                ) : (
                  ""
                )
              }
            </div>
          </div>
        </div>
      </div>
         <br />
      <br />
      <br />
      <Footer/>
    </>
  );
};

export default CreationDashboardForSection;
