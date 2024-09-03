import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  useContext,
} from "../../../modules/PageModules";
import { Navigate, useNavigate } from "react-router-dom";
import "../../../SCSS/MaterialTable.scss";
import RoutingContext from "../../../context/routing/RoutingContext";
//   import ChecksheetCreationDashboard from "./Checksheet/ChecksheetCreationDashboard";
import Footer from "../../../components/Footer/Footer";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../../Reports/ReportComponents/NotFound";

const PlanningApprovalDashboard = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();

  const [refKeyForAnimation, setRefKeyForAnimation] = useState(
    <LoadingAnimation />
  );

  const getApprovalRequestDataForPlanningPhase = async () => {
    try {
      const res = await fetch("/getApprovalRequestDataForPlanningPhase", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data);
      setTableData(data);

      setRefKeyForAnimation(<NotFound />);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getApprovalRequestDataForPlanningPhase();
  }, []);

  const machineHeader = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "6%",
    },
    {
      title: "Cell Name",
      field: "line_names.cell_names.cell_name",
      align: "center",
    },
    {
      title: "Line Name",
      field: "line_names.line_name",
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

    // {
    //   title: "Machine Nick-Name",
    //   field: "machine_nickname",
    //   align: "center",
    // },
    // {
    //   title: "Machine Sequence",
    //   field: "machine_sequence",
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

  const planningApprovalDataOfCSV = [
    {
      label: "Cell Name",
      key: "line_names.cell_names.cell_name",
    },
    {
      label: "Line Name",
      key: "line_names.line_name",
    },
    {
      label: "Machine Code",
      key: "machine_code",
    },
    {
      label: "Machine Name",
      key: "machine_name",
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

  const downloadPDFForPlanningApprovalData = () => {
    const doc = new jsPDF();
    let rows = [];
    tableData?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.line_names.cell_names.cell_name,
        item.line_names.line_name,
        item.machine_code,
        item.machine_name,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Implementation Approval Data`, 15, 10);

    autoTable(doc, {
      head: [machineHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Planning_Approval_Data_${timeStamp()}`);
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
      icon: () => <button className="btn-primary1">View</button>,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        // if (
        //   context.tm_department === "MTD" &&
        //   selectedRow?.checkSheet_data?.checksheet_status === "Preparation"
        // ) {
        //   navigate("/viewCheckSheet", {
        //     state: {
        //       selectedRowForViewForm: selectedRow,
        //       dashboardID: "FromPlanningApprovalDashboard",
        //     },
        //   });
        // } else {
        navigate("/pm/checksheetFormApproval", {
          state: {
            selectedRowForViewForm: selectedRow,
            dashboardID: "FromPlanningApprovalDashboard",
            selectedYear: selectedRow?.checkSheet_data?.current_year,
          },
        });
        // }
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
  ];

  return (
    <>
      <div className="pageCard">
        <div className="creationDashboard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>
            Planning Approval Dashboard
          </h4>

          <div style={{ padding: "1rem" }}>
            {tableData?.length > 0 ? (
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
                    fontSize: "14px",
                    fontWeight: "bold",
                  },
                }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center m-2">
                {refKeyForAnimation}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PlanningApprovalDashboard;
