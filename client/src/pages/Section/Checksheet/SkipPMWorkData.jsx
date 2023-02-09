import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  useContext,
} from "../../../modules/PageModules";
import { Navigate, useNavigate } from "react-router-dom";
import { useLocation } from "../../../modules/PageModules";
import "../../../SCSS/MaterialTable.scss";
import RoutingContext from "../../../context/routing/RoutingContext";
//   import ChecksheetCreationDashboard from "./Checksheet/ChecksheetCreationDashboard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WorkOnSkipPM from "../../../Popups/WorkOnSkipPM";
import Footer from "../../../components/Footer/Footer";

const SkipPMWorkData = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();
  const selectedMachineSkipData = useLocation();
  console.log(selectedMachineSkipData.state.selectedRowForSkipData);
  const [refKey, setRefKey] = useState(0);

  const functionToSetRefKey = () => {
    setRefKey((refKey) => refKey + 1);
  };
  const [workOnSkipPM, setWorkOnSkipPM] = useState("");

  // const getApprovalRequestData = async () => {
  //   try {
  //     const res = await fetch("/getApprovalRequestData", {
  //       method: "GET",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //     });

  //     const data = await res.json();
  //     console.log(data);
  //     setTableData(data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   getApprovalRequestData();
  // }, []);

  const machineHeader = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
      align: "center",
    },
    {
      title: "Schedule Month",
      field: "schedule_month",
      align: "center",
    },
    {
      title: "Inspection Item",
      // editable: false,
      field: "inspection_parent_name",
      filtering: false,
      align: "center",
      validate: (row) => (row.inspection_parent_name || "").length !== 0,
      // render: (data) => {
      //     return `${data.inspection_parent_name} ${data.inspection_child_name}`;
      //   },
    },
    // {
    //   title: "Inspection Item Child",
    //   // editable: false,
    //   field: "inspection_child_name",
    //   filtering: false,
    //   align: "center",
    //   // render: (data) => {
    //   //     return `${data.inspection_parent_name} ${data.inspection_child_name}`;
    //   //   },
    // },
    {
      title: "Inspection Point",
      field: "inspection_point",
      filtering: false,
      align: "center",
      validate: (row) => (row.inspection_point || "").length !== 0,
    },
    {
      title: "Judgement Criteria",
      field: "judgement_criteria",
      align: "center",
      validate: (row) => (row.judgement_criteria || "").length !== 0,
    },
    {
      title: "Action",
      field: "action",
      align: "center",
      width: "10%",
      validate: (row) => (row.action || "").length !== 0,
    },
    {
      title: "Cycle",
      field: "cycle",
      align: "center",
      width: "5%",
      validate: (row) => (row.cycle || "").length !== 0,
    },
  ];

  const close = () => {
    setWorkOnSkipPM("");
  };

  const actions = [
    // (rowData) => {
    //   return {
    //     hidden:
    //       rowData.checkSheet_data != null
    //         ? rowData.checkSheet_data.checksheet_status === "Implementation" ||
    //           rowData.checkSheet_data.checksheet_status === "Planning"
    //         : "",

    //     icon: () => <button className="btn-reset">Preparation</button>,
    //     // tooltip: <h1>I am a tooltip</h1>,
    //     onClick: (event, selectedRow) => {
    //       navigate("/checksheetCreationDashboardForMTDTLandHOS", {
    //         state: { selectedRow: selectedRow },
    //       });
    //     },
    //     disabled: false, // Set disabled to false by default for all actions
    //     position: "row",
    //   };
    // },

    // (rowData) => {
    //   return {
    //     hidden:
    //       rowData.checksheet_status === "Preparation" ||
    //       rowData.checksheet_status === "Implementation" ||
    //       rowData.checksheet_status === undefined,
    //     icon: () => <button className="btn">Planning</button>,
    //     // tooltip: <h1>I am a tooltip</h1>,
    //     onClick: (event, selectedRow) => {
    //       navigate("/planningPhaseTable", {
    //         state: { selectedRow: selectedRow },
    //       });
    //     },
    //     disabled: false, // Set disabled to false by default for all actions
    //     position: "row",
    //   };
    // },
    {
      icon: () => <button className="btn-primary1">Edit</button>,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        setWorkOnSkipPM(
          <WorkOnSkipPM
            close={close}
            selectedRow={selectedRow}
            functionToSetRefKey={functionToSetRefKey}
            machineId={
              selectedMachineSkipData?.state?.selectedRowForSkipData?.machine_id
            }
          />
        );
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
  ];

  const fetchSelectedMachineSkipWorkPMTableData = async () => {
    try {
      const res = await fetch("/fetchSelectedMachineSkipWorkPMTableData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId:
            selectedMachineSkipData.state.selectedRowForSkipData.machine_code,
          schedule_month:
            selectedMachineSkipData.state.selectedRowForSkipData.schedule_month,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        setTableData(data.selectedMachineSkipData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSelectedMachineSkipWorkPMTableData();
  }, [refKey]);

  return (
    <>
      {workOnSkipPM}
      <div className="pageCard">
        <button
          onClick={() => navigate("/pmMonthlyReport")}
          style={{
            border: "none",
            background: "white",
            borderRadius: 5,
          }}
          className="mb-2 mt-2"
        >
          <ArrowBackIcon />
        </button>
        <div class="row g-3">
          <div class="col-4">
            <div class="p-3 border bg-white rounded">
              <span style={{ fontWeight: "bold" }}>
                Line Name:{" "}
                {selectedMachineSkipData.state.selectedRowForSkipData.line_name}
              </span>
            </div>
          </div>
          <div class="col-4">
            <div class="p-3 border bg-white rounded">
              <span style={{ fontWeight: "bold" }}>
                Machine Name:{" "}
                {
                  selectedMachineSkipData.state.selectedRowForSkipData
                    .machine_name
                }
              </span>
            </div>
          </div>
          <div class="col-4">
            <div class="p-3 border bg-white rounded">
              <span style={{ fontWeight: "bold" }}>
                Machine No:{" "}
                {
                  selectedMachineSkipData.state.selectedRowForSkipData
                    .machine_code
                }
              </span>
            </div>
          </div>
        </div>
        <div className="creationDashboard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>Skip PM Work Data</h4>

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
                  // fontSize: "12px",
                },
                headerStyle: {
                  fontSize: "13px",
                  fontWeight: "bold",
                },
              }}
            />
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

export default SkipPMWorkData;
