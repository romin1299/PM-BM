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
import Footer from "../../../components/Footer/Footer";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

import NotFound from "../../Reports/ReportComponents/NotFound";

const BackupDataOfCheckSheet = () => {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const [refKey, setRefKey] = useState(0);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

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

      setLoadingAnimationState(<NotFound />);
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
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "6%",
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

  const backUpChecksheetDataForCSV = [
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

  const downloadPDFOfBackupData = () => {
    const doc = new jsPDF();
    let rows = [];
    tableData?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.line_names.line_name,
        item.machine_code,
        item.machine_name,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Backup Checksheet Data`, 15, 10);

    autoTable(doc, {
      head: [machineHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Backup_Checksheet_Data_${timeStamp()}`);
  };

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
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfBackupData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={backUpChecksheetDataForCSV}
          className="downloadCSV text-decoration-none"
          data={tableData}
          filename={`Backup_Checksheet_Data_${timeStamp()}`}
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
        ) : (
          <div
            className="container-fluid d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
          >
            {loadingAnimationState}
          </div>
        )}
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
};

export default BackupDataOfCheckSheet;
