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
import Footer from "../../../components/Footer/Footer";


const SixMonthApprovalDashboard = () => {
  //----------------------------------------------------------------
  const navigate = useNavigate();

  //----------------------------------------------------------------
  const [tableData, setTableData] = useState([]);

  const machineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
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
  ];

  const getSixMonthApprovalRequestData = async () => {
    try {
      const res = await fetch("/getSixMonthApprovalRequestData", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      //   console.log(data);
      setTableData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getSixMonthApprovalRequestData();
  }, []);

  const actions = [
    {
      icon: () => <button className="btn-reset">Implementation</button>,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {

        console.log(selectedRow)
        navigate("/checksheetFormApproval", {
          state: {
            selectedRowForViewForm: selectedRow,
            dashboardID: "FromSixMonthApprovalDashboard",
          },
        });
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },

    {
      icon: () => <button className="btn-primary1">View</button>,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        // console.log(selectedRow);

        navigate("/viewCheckSheet", {
          state: {
            selectedRowForViewForm: selectedRow,
            dashboardID: "FromSixMonthApprovalDashboard",
          },
        });
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
            Six-Month Approval Dashboard
          </h4>

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
                  fontSize: "14px",
                  fontWeight: "bold",
                },
              }}
            />
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default SixMonthApprovalDashboard;
