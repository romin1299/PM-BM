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

const CheckSheetDashboard = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const [lineData, setLineData] = useState([]);

  const [refKey, setRefKey] = useState(0);
  const navigate = useNavigate();

  let current_year =
    new Date().getMonth() <= 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  console.log(current_year);

  const keyArrayForYear = ["2021-2022", "2022-2023", "2023-2024", "2024-2025"];

  const [selectedYear, setSelectedYear] = useState(current_year);

  // console.log(context.section_data);
  const postSectionToGetAllData = async (selectedSection) => {
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
        // window.alert(data.abcd);
        // console.log("Data post");
        // console.log(data);
        setLineData(data.lineData);
        setTableData(data.machineLastData);
      }
    } catch (error) {
      console.log(error);
    }
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
  }, [refKey, context.section_data, selectedYear]);

  const machineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
      sorting: false,
    },
    {
      title: "Cell Name",
      field: "line_names.cell_names.cell_name",
      align: "center",
      width: "15%",
    },
    {
      title: "Line Name",
      field: "line_names.line_name",
      align: "center",
      width: "20%",
    },
    {
      title: "Machine Code",
      field: "machine_code",
      editable: "false",
      align: "center",
      width: "20%",
      sorting: false,
    },
    {
      title: "Machine Name",
      field: "machine_name",
      align: "center",
      width: "20%",
      sorting: false,
    },
    // {
    //     title: "Machine Seq",
    //     field: "machine_sequence",
    //     editable: "false",
    //     align: "center",
    //   },

    // {
    //   title: "Cell Seq",
    //   field: "line_names.cell_names.cell_sequence",
    //   align: "center",
    // },

    // {
    //   title: "Line Seq",
    //   field: "line_names.line_sequence",
    //   align: "center",
    // },

    // {
    //   title: "Installation Date",
    //   field: "installation_date",
    //   editable: "false",
    //   align: "center",
    // },
    // {
    //   title: "Manufacturing Date",
    //   field: "manufacturingDate",
    //   editable: "false",
    //   align: "center",
    // },
    // {
    //   title: "Maker Name",
    //   field: "maker_name",
    //   align: "center",
    // },
    // {
    //   title: "Maker Sr.No.",
    //   field: "maker_sr_no",
    //   align: "center",
    // },

    // {
    //   title: "Maker Sr.No.",
    //   render: (client) => {
    //     return `${client.machine_code} ${client.machine_name}`;
    //   },
    //   align: "center",
    // },
  ];

  const actions =
    current_year === selectedYear
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
                <button className="btn-reset">
                  {rowData.checkSheet_data != null
                    ? rowData.checkSheet_data.checkSheet.length > 0
                      ? rowData.checkSheet_data.checkSheet.length < 1
                        ? "Preparation"
                        : rowData.checkSheet_data.assign_TL.length > 0 ||
                          rowData.checkSheet_data.assign_HOS.length > 0
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
                  : rowData.checkSheet_data === undefined,
              icon: () => (
                <button className="btn-warning">
                  {rowData.checkSheet_data != null
                    ? rowData.checkSheet_data.checkSheet.map((key) => {
                        if ("start_month" in key) {
                          if (
                            rowData.checkSheet_data.assign_PRD_TL.length > 0
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
            icon: () => <button className="btn-primary">View</button>,
            // tooltip: <h1>I am a tooltip</h1>,
            onClick: (event, selectedRow) => {
              navigate("/viewCheckSheet", {
                state: { selectedRowForViewForm: selectedRow },
              });
            },
            disabled: false, // Set disabled to false by default for all actions
            position: "row",
          },
          {
            icon: () => (
              <button className="btn-delete">
                <DeleteForeverIcon />
              </button>
            ),
            // tooltip: <h1>I am a tooltip</h1>,
            onClick: (event, selectedRow) => {
              deleteCheckSheet(selectedRow);
            },
            disabled: false, // Set disabled to false by default for all actions
            position: "row",
          },
        ]
      : [
          {
            icon: () => <button className="btn-primary">View</button>,
            // tooltip: <h1>I am a tooltip</h1>,
            onClick: (event, selectedRow) => {
              navigate("/viewCheckSheet", {
                state: { selectedRowForViewForm: selectedRow },
              });
            },
            disabled: false, // Set disabled to false by default for all actions
            position: "row",
          },
        ];

  // console.log(tableData);

  return (
    <>
      <div className="pageCard">
        <div className="creationDashboard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>Checksheet Dashboard</h4>

          <Container fluid>
            <Row className="pt-2 ">
              <Col sm={12} lg={3}>
                <span>Year:</span>
              </Col>
              <Col sm={12} lg={3}>
                <div>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="selectedPlant"
                    value={selectedYear}
                    className="textField"
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                    }}
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {keyArrayForYear?.map((option) => {
                      return <option value={option}>{option}</option>;
                    })}
                  </select>
                </div>
              </Col>
            </Row>
          </Container>
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
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckSheetDashboard;
