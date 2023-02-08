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

import { Row, Col } from 'react-bootstrap'

import "../../SCSS/MaterialTable.scss";
import { RadioGroup } from "@mui/material";
import RoutingContext from "../../context/routing/RoutingContext";
import MachineAdd from "../../Popups/machineAdd";

const CreationDashboardForTLHOSS = () => {
  const [cell, setCell] = useState();
  const [line, setLine] = useState();

  const [machine, setMachine] = useState();

  const [lineList, setLineList] = useState("");

  const [refKey2, setRefKey2] = useState(0);
  const [refKey3, setRefKey3] = useState(0);

  // console.log(lineList);
  const context = useContext(RoutingContext);

  const lineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "10%",
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

  const machineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%"
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
      width: "5%"
    },
    {
      title: "Installation Date",
      field: "installation_date",
      // editable: "false",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="installation_date"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
    },
    {
      title: "Manufacturing Date",
      field: "manufacturingDate",
      // editable: "false",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="manufacturingDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
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

  const postCellToGetLineList = async (selectedCell) => {
    setLine(undefined);
    setMachine(undefined);
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

  const postLineToGetMachineList = async (selectedLine) => {
    setMachine(undefined);
    try {
      const res = await fetch("/postLineToGetMachineList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        console.log("Data post", data);

        setMachine(data.machineInfo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const refreshForMachineData = () => {
    // console.log("******");
    setRefKey3((refKey3) => refKey3 + 1);
  };
  useEffect(() => {
    if (cell) {
      postCellToGetLineList(cell);
    }
  }, [cell, refKey2]);

  useEffect(() => {
    if (line) {
      postLineToGetMachineList(line);
    }
  }, [line, refKey3]);

  const actionsForMachineTable = [
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () =>
        window.innerWidth > 1024 ? (
          <button className="btn-reset">Add Machine</button>
        ) : (
          <AddBoxIcon />
        ),

      tooltip: "Add Machine",
      isFreeAction: true,
      onClick: (event, rowData) => {
        document.getElementById("main_div_reg3").style.display = "block";
        document.getElementById("main_div_reg3").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
    },
  ];

  // console.log(
  //   subSectionList !== ""
  //     ? subSectionList.sectionInfo.dashboardLevel === "Yes"
  //       ? `${subSectionList.subSectionArray} _____ subSectionList.subSectionArray`
  //       : `${context.subSection_data} ______context.subSection_data`
  //     : ""
  // );

  // console.log(context);
  return (
    <>
      <div className="mainPage">
        <MachineAdd line={line} refreshForMachineData={refreshForMachineData} />
        <div className="pageCard">
          <div className="creationDashboard">
            <div className="selection_div">
              <Row>
                <Col sm >
                  <span><b>Cell/Product :</b>&nbsp;</span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "50%", background: "white" }}
                    id="standard-select-currency"
                    name="plant"
                    className="textField"
                    select
                    fullWidth // label="Select"
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
                    {context?.cell_data?.map((option) => {
                      return <option value={option}>{option}</option>;
                    })}
                  </select>
                </Col>
                <Col sm>
                  <span><b>Line :</b>&nbsp;</span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "50%", background: "white" }}
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
                </Col>
                
              </Row>
              {/* <div style={{ display: "flex", flexDirection: "column" }}>

              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>

              </div> */}
            </div>
            <div style={{ padding: "1rem" }}>
              {cell && line ? (
                machine !== "" ? (
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
                    actions={actionsForMachineTable}
                    icons={tableIcons}
                    columns={machineHeader}
                    data={machine}
                    // title="User Management"
                    // tableRef={this.tableRef.current.onQueryChange()}

                    editable={{
                      // onRowAdd: (newRow) =>
                      //   new Promise((resolve, reject) => {
                      //     const updatedRows = [
                      //       ...lineList.lineInfo,
                      //       { user_id: "", ...newRow },
                      //     ];

                      //     newLine(newRow, cell);
                      //     setTimeout(() => {
                      //       // setSectionList(updatedRows);
                      //       setRefKey3((refKey3) => refKey3 + 1);
                      //       resolve();
                      //     }, 500);
                      //     //refreshPage();
                      //   }),

                      onRowDelete: (selectedRow) =>
                        new Promise((resolve, reject) => {
                          // const index = selectedRow.tableData.id;
                          // console.log(index);
                          // const updatedRows = [...machine];
                          // updatedRows.splice(index, 1);

                          //call the delete user function and pass the user data
                          // deleteUserInfo(selectedRow);
                          deleteMachine(selectedRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey3((refKey3) => refKey3 + 1);
                            resolve();
                          }, 500);
                        }),

                      onRowUpdate: (updatedRow, oldRow) =>
                        new Promise((resolve, reject) => {
                          const index = oldRow.tableData.id;
                          const updatedRows = [...machine];
                          updatedRows[index] = updatedRow;
                          //call the update user function and pass the user data
                          // updateUserInfo(updatedRow);
                          updateMachine(updatedRow, oldRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey3((refKey3) => refKey3 + 1);
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
                      // pageSize: 10,
                      // pageSizeOptions: false,
                      // paginationType: "stepped",
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
              ) : cell ? (
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
                    // actions={actions}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreationDashboardForTLHOSS;
