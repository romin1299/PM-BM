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
import LoadingAnimation from "../../Reports/ReportComponents/LoadingAnimation";

const BackupDataOfCheckSheet = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const [refKey, setRefKey] = useState(0);

  // console.log(context?.tm_department, context?.tm_grade, context?.user_type);
  const navigate = useNavigate();

  const getDeletedMachineCheckSheetData = async () => {
    try {
      const res = await fetch("/getDeletedMachineCheckSheetData", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data);
      setTableData(data.getDeletedDataOfCheckSheet);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBackUpData = async (selectedRow) => {
    try {
      const res = await fetch("/deleteBackUpData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRow,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("back-up data Deleted Successful");
        // console.log("hello");
        // refreshPage();
        // const dateAndTime = timeStamp();
        // const addMessage = `${selectedRow.user_name} user deleted`;
        // logData(dateAndTime, addMessage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDeletedMachineCheckSheetData();
  }, [refKey]);

  const machineHeader = [
    {
      title: "Serial no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
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

  const actions = [
    {
      icon: () => <button className="btn-primary1">View</button>,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        navigate("/backupTableData", {
          state: { selectedRowForViewForm: selectedRow },
        });
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
  ];

  // console.log(context);
  return (
    <>
      <div className="pageCard">
        {tableData?.length > 0 ? (
          <div className="creationDashboard">
            <h4 style={{ padding: "1rem 0 0 1rem" }}>Back-end Data</h4>

            <div style={{ padding: "1rem" }}>
              <MaterialTable
                localization={{
                  header: {
                    actions: "Actions",
                  },
                }}
                actions={actions}
                icons={tableIcons}
                columns={machineHeader}
                data={tableData}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}

                editable={
                  context?.tm_department === "MTD" &&
                  context?.tm_grade === "HOS" &&
                  context?.user_type === "Section-Admin"
                    ? {
                        onRowDelete: (selectedRow) =>
                          new Promise((resolve, reject) => {
                            // const index = selectedRow.tableData.id;
                            // console.log(index);
                            // const updatedRows = [...tableData];
                            // updatedRows.splice(index, 1);
                            //call the delete user function and pass the user data
                            // // deleteUserInfo(selectedRow);
                            deleteBackUpData(selectedRow);
                            setTimeout(() => {
                              setRefKey((refKey) => refKey + 1);
                              resolve();
                            }, 500);
                          }),
                      }
                    : ""
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
                    fontSize: "12px",
                    fontSize: "12px",
                  },
                  headerStyle: {
                    fontSize: "14px",
                    fontWeight: "bold",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className="container-fluid d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
          >
            <LoadingAnimation />
          </div>
        )}
      </div>
    </>
  );
};

export default BackupDataOfCheckSheet;
