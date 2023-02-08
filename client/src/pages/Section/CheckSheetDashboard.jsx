import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  useContext,
} from "../../modules/PageModules";
import { Navigate, useNavigate } from "react-router-dom";
import "../../SCSS/MaterialTable.scss";
import RoutingContext from "../../context/routing/RoutingContext";
import ChecksheetCreationDashboard from "./Checksheet/ChecksheetCreationDashboard";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ViewChecksheet from "./Checksheet/ViewChecksheet";
import { Row, Col, Container } from "react-bootstrap";
import EditIcon from "@mui/icons-material/Edit";
import YearDropDown from "../Dashboard/DashboardComponent/YearDropDown";
import currentYear from "../Dashboard/DashboardComponent/currentYear";
import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../Reports/ReportComponents/NotFound";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../components/Footer/Footer";

const CheckSheetDashboard = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const [lineData, setLineData] = useState([]);

  const [refKey, setRefKey] = useState(0);
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [allDataSectionWise, setAllDataSectionWise] = useState([]);
  const [selectedCell, setSelectedCell] = useState(
    localStorage.getItem("selectedCell")
  );
  const [lineDropdown, setLineDropdown] = useState([]);
  const [selectedLine, setSelectedLine] = useState(
    localStorage.getItem("selectedLine")
  );
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

  const postSectionToGetAllData = async (keyRef) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetAllData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setAllDataSectionWise(data);
        setLineData(data.lineData);
        setTableData(data.machineLastData);
        setLoadingAnimationState(<NotFound />);
        if (!keyRef) {
          postCellToGetLineList(selectedCell);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log(selectedCell);

  const postCellToGetLineList = async (selectedCell) => {
    setSelectedLine("");
    try {
      const res = await fetch("/postCellToGetLineListForReport", {
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
        setLineDropdown(data.lineInfo);
        setLoadingAnimationState(<NotFound />);
        if (selectedLine !== null) {
          postLineToGetMachineList(localStorage.getItem("selectedLine"));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postLineToGetMachineList = async (selectedLine) => {
    // console.log(selectedLine);
    try {
      const res = await fetch("/postLineToGetMachineListForReportDashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
          selectedYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        setTableData(data.machineInfo);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const notifyForDeleteChecksheet = () => {
    toast.success("CheckSheet deleted successfully", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  // console.log(tableData);
  const deleteCheckSheet = async (selectedRow) => {
    try {
      const res = await fetch("/deleteCheckSheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedRow,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || !data) {
        window.alert("Invalid");
      } else {
        setRefKey((refKey) => refKey + 1);
        notifyForDeleteChecksheet();
        console.log("Data Deleted Successful");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // console.log();
  useEffect(() => {
    if (context.section_data) {
      postSectionToGetAllData();
    }
  }, [selectedYear, refKey]);

  const machineHeader = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
      sorting: false,
    },
    {
      title: "Cell/Product",
      field: "line_names.cell_names.cell_name",
      align: "center",
      width: "15%",
    },
    {
      title: "Line",
      field: "line_names.line_name",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine Code",
      field: "machine_code",
      editable: "false",
      align: "center",
      width: "15%",
      sorting: false,
    },
    {
      title: "Machine Name",
      field: "machine_name",
      align: "center",
      width: "20%",
      sorting: false,
    },
  ];

  const actions =
    currentYear === selectedYear
      ? [
          (rowData) => {
            return {
              hidden:
                rowData.checkSheet_data != null
                  ? rowData.checkSheet_data.checksheet_status ===
                      "Implementation" ||
                    rowData.checkSheet_data.checksheet_status === "Planning"
                  : "",
              icon: () => (
                <button className="btn-reset1">
                  {rowData.checkSheet_data != null
                    ? rowData.checkSheet_data.checkSheet.length > 0
                      ? rowData.checkSheet_data.checkSheet.length < 1
                        ? "Preparation"
                        : rowData.checkSheet_data.assign_TL.length !==
                            rowData.checkSheet_data.approved_by_TL.length ||
                          rowData.checkSheet_data.assign_HOS.length !==
                            rowData.checkSheet_data.approved_by_HOS.length
                        ? "Preparation Under Approval"
                        : "Under-Preparation"
                      : "Preparation"
                    : "Preparation"}
                </button>
              ),
              // tooltip: <h1>I am a tooltip</h1>,
              onClick: (event, selectedRow) => {
                navigate("/checksheetCreationDashboard", {
                  state: { selectedRow: selectedRow, lineData: lineData },
                });
              },
              disabled: false, // Set disabled to false by default for all actions
              position: "row",
            };
          },
          (rowData) => {
            return {
              hidden:
                rowData.checkSheet_data != null
                  ? rowData.checkSheet_data.checksheet_status ===
                      "Preparation" ||
                    rowData.checkSheet_data.checksheet_status ===
                      "Implementation" ||
                    rowData.checkSheet_data.checksheet_status === undefined
                  : rowData.checkSheet_data === undefined ||
                    rowData.checkSheet_data === null,
              icon: () => (
                <button className="btn-warning">
                  {rowData.checkSheet_data != null
                    ? rowData.checkSheet_data.checkSheet.map((key) => {
                        if ("start_month" in key) {
                          if (
                            rowData?.checkSheet_data?.approved_by_PRD_TL
                              .length !=
                            rowData?.checkSheet_data?.assign_PRD_TL.length
                          ) {
                            return "Planning Under Approval";
                          } else {
                            return "Under-Planning";
                          }
                        } else {
                          return "Planning";
                        }
                      })[0]
                    : ""}
                </button>
              ),
              // tooltip: <h1>I am a tooltip</h1>,
              onClick: (event, selectedRow) => {
                navigate("/planningPhaseTable", {
                  state: { selectedRow: selectedRow },
                });
              },
              disabled: false, // Set disabled to false by default for all actions
              position: "row",
            };
          },
          {
            icon: () => <button className="btn-primary1">View</button>,
            // tooltip: <h1>I am a tooltip</h1>,
            onClick: (event, selectedRow) => {
              navigate("/viewCheckSheet", {
                state: { selectedRowForViewForm: selectedRow, dashboardID: "FromChecksheetDashboard", },
                
              });
            },
            disabled: false, // Set disabled to false by default for all actions
            position: "row",
          },
          (rowData) => {
            return {
              hidden:
                rowData.checkSheet_data === undefined ||
                rowData.checkSheet_data === null,
              icon: () => (
                <button className="btn-delete">
                  <DeleteForeverIcon className="svg-font" />
                </button>
              ),
              // tooltip: <h1>I am a tooltip</h1>,
              onClick: (event, selectedRow) => {
                deleteCheckSheet(selectedRow);
              },
              disabled: false, // Set disabled to false by default for all actions
              position: "row",
            };
          },
          (rowData) => {
            return {
              hidden:
                rowData.checkSheet_data != null
                  ? rowData.checkSheet_data.checksheet_status ===
                      "Preparation" ||
                    rowData.checkSheet_data.checksheet_status === "Planning" ||
                    rowData.checkSheet_data.checksheet_status === undefined
                  : rowData.checkSheet_data === undefined ||
                    rowData.checkSheet_data === null,
              icon: () => (
                <button className="btn-warning">
                  <EditIcon className="svg-font" />
                </button>
              ),
              // tooltip: <h1>I am a tooltip</h1>,
              onClick: (event, selectedRow) => {
                navigate("/checksheetCreationDashboard", {
                  state: { selectedRow: selectedRow, lineData: lineData },
                });
              },
              disabled: false, // Set disabled to false by default for all actions
              position: "row",
            };
          },
        ]
      : [
          {
            icon: () => <button className="btn-primary1">View</button>,
            // tooltip: <h1>I am a tooltip</h1>,
            onClick: (event, selectedRow) => {
              navigate("/viewCheckSheet", {
                state: { selectedRowForViewForm: selectedRow , dashboardID: "FromChecksheetDashboard",},
               
              });
            },
            disabled: false, // Set disabled to false by default for all actions
            position: "row",
          },
        ];

  useEffect(() => {
    setLoadingAnimationState(<LoadingAnimation />);
  }, [selectedYear]);

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />
      <div className="pageCard">
        <div className="creationDashboard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>Checksheet Dashboard</h4>

          <Container fluid>
            <Row>
              <Col className="col-lg-3 col-md-6 col-sm-12">
                <YearDropDown
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </Col>
              <Col className="col-lg-3 col-md-6 col-sm-12">
                <Row className="p-2 ">
                  <Col sm={12} lg={3}>
                    <span>
                      <b>Cell:</b>
                    </span>
                  </Col>
                  <Col>
                    <div>
                      <select
                        class="form-select form-select-sm"
                        aria-label=".form-select-sm example"
                        // style={{ width: "100%" }}
                        id="standard-select-currency"
                        name="selectedCell"
                        value={selectedCell}
                        className="textField"
                        onChange={(e) => {
                          localStorage.setItem("selectedCell", e.target.value);
                          // console.log(e.target.value);
                          setSelectedCell(e.target.value);
                          postCellToGetLineList(e.target.value);
                          setLoadingAnimationState(<LoadingAnimation />);
                        }}
                        // fullWidth
                        select // label="Select"
                        autoComplete="off"
                        variant="standard"
                      >
                        <option selected disabled value="">
                          Please select
                        </option>
                        {allDataSectionWise?.cellData?.map((option) => {
                          return (
                            <option value={option._id}>
                              {option.cell_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col className="col-lg-3 col-md-6 col-sm-12">
                <Row className="p-2 ">
                  <Col sm={12} lg={3}>
                    <span>
                      <b>Line:</b>
                    </span>
                  </Col>
                  <Col>
                    <div>
                      <select
                        class="form-select form-select-sm"
                        aria-label=".form-select-sm example"
                        // style={{ width: "100%" }}
                        id="standard-select-currency"
                        name="selectedPlant"
                        value={
                          selectedLine || localStorage.getItem("selectedLine")
                        }
                        className="textField"
                        onChange={(e) => {
                          localStorage.setItem("selectedLine", e.target.value);
                          setSelectedLine(e.target.value);
                          postLineToGetMachineList(e.target.value);
                          setLoadingAnimationState(<LoadingAnimation />);
                        }}
                        // fullWidth
                        select // label="Select"
                        autoComplete="off"
                        variant="standard"
                      >
                        <option selected disabled value="">
                          Please select
                        </option>
                        {lineDropdown?.map((option) => {
                          return (
                            <option value={option._id}>
                              {option.line_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col className="col-lg-3 col-md-6 col-sm-12">
                <button
                  class="btn-primary1 w-25 "
                  onClick={() => {
                    // localStorage.removeItem("selectedCell");
                    // localStorage.removeItem("selectedLine");
                    localStorage.clear();
                    // setSelectedCell();
                    // setSelectedLine();
                    
                    postSectionToGetAllData("Reset");
                    window.location.reload()
                  }}
                >
                  Reset
                </button>
              </Col>
            </Row>
          </Container>
          {tableData?.length > 0 ? (
            <div style={{ padding: "1rem" }}>
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
                actions={actions}
                icons={tableIcons}
                columns={machineHeader}
                data={tableData}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}

                editable={
                  {
                    // onRowAdd: (newRow) =>
                    //   new Promise((resolve, reject) => {
                    //     const updatedRows = [
                    //       ...tableData,
                    //       { user_id: "", ...newRow },
                    //     ];
                    //     // postNewPlantData(newRow);
                    //     // newSection(newRow, context.plant_data);
                    //     // setTimeout(() => {
                    //     //   // settableData(updatedRows);
                    //     //   setRefKey((refKey) => refKey + 1);
                    //     //   resolve();
                    //     // }, 500);
                    //     //refreshPage();
                    //   }),
                    // onRowDelete: (selectedRow) =>
                    //   new Promise((resolve, reject) => {
                    //     const index = selectedRow.tableData.id;
                    //     console.log(index);
                    //     const updatedRows = [...tableData];
                    //     updatedRows.splice(index, 1);
                    //     //call the delete user function and pass the user data
                    //     // // deleteUserInfo(selectedRow);
                    //     // deleteSection(selectedRow);
                    //     // setTimeout(() => {
                    //     //   setRefKey((refKey) => refKey + 1);
                    //     //   resolve();
                    //     // }, 500);
                    //   }),
                    // onRowUpdate: (updatedRow, oldRow) =>
                    //   new Promise((resolve, reject) => {
                    //     const index = oldRow.tableData.id;
                    //     const updatedRows = [...tableData];
                    //     updatedRows[index] = updatedRow;
                    //     //call the update user function and pass the user data
                    //     // updateUserInfo(updatedRow);
                    //     // updateSection(updatedRow, oldRow);
                    //     // setTimeout(() => {
                    //     //   setRefKey((refKey) => refKey + 1);
                    //     //   resolve();
                    //     // }, 500);
                    //     //refreshPage();
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
                  pageSizeOptions: false,
                  paginationType: "stepped",
                  addRowPosition: "first",
                  headerStyle: {
                    position: "sticky",
                    top: "0",
                    fontWeight: "bold",
                  },
                  // maxBodyHeight: "60vh",
                  overflowY: "hidden",
                  rowStyle: {
                    // fontStyle:'bold'

                    boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                    // color:"rgba(255,255,255,0.8)",
                    borderRadius: "5px",
                    border: "1px solid rgba(255,255,255)",
                    WebkitBackdropFilter: "blur( 2px )",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(5px)",
                    // fontSize: "12px",
                  },
                  headerStyle: {
                    fontSize: "14px",
                    fontWeight: "bold",
                  },
                }}
              />
            </div>
          ) : (
            <div
              className="container-fluid d-flex justify-content-center align-items-center p-5"
              // style={{ height: "100vh" }}
            >
              {loadingAnimationState}
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default CheckSheetDashboard;
