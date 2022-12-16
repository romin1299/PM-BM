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

const BackupDataOfCheckSheet = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
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

  useEffect(() => {
    getDeletedMachineCheckSheetData();
  }, []);

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
      icon: () => <button className="btn-primary">View</button>,
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

  return (
    <>
      <div className="pageCard">
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

              editable={{
               
                onRowDelete: (selectedRow) =>
                  new Promise((resolve, reject) => {
                    const index = selectedRow.tableData.id;
                    console.log(index);
                    const updatedRows = [...tableData];
                    updatedRows.splice(index, 1);
                    //call the delete user function and pass the user data
                    // // deleteUserInfo(selectedRow);
                    // deleteSection(selectedRow);
                    // setTimeout(() => {
                    //   setRefKey((refKey) => refKey + 1);
                    //   resolve();
                    // }, 500);
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

export default BackupDataOfCheckSheet;
