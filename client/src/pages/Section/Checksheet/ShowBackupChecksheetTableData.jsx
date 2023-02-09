import {
  React,
  useState,
  useEffect,
  MaterialTable,
  tableIcons,
  AddBoxIcon,
  useContext,
} from "../../../modules/PageModules";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { useLocation } from "../../../modules/PageModules";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useFormik } from "formik";
import { Navigate, useNavigate } from "react-router-dom";
import RoutingContext from "../../../context/routing/RoutingContext";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Footer from "../../../components/Footer/Footer";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";


const ShowBackupChecksheetTableData = ({ }) => {
  const [tableData, setTableData] = useState([]);

  const context = useContext(RoutingContext);

  const selectedMachineData = useLocation();
  const navigate = useNavigate();


  const columns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "7%",
      align: "center",
    },
    {
      title: "C",
      field: "category",
      filtering: false,
      align: "center",
      width: "5%",
      validate: (row) => (row.category || "").length !== 0,
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
    {
      title: "Person In Charge",
      field: "personInCharge",
      align: "center",
      width: "5%",
      validate: (row) => (row.personInCharge || "").length !== 0,
    },
    {
      title: "PM Time (min)",
      field: "PM_time",
      align: "center",
      width: "5%",
      type: "numeric",
      validate: (row) => (row.PM_time || "").length !== 0,
    },
  ];

  useEffect(() => {
    setTableData(selectedMachineData.state.selectedRowForViewForm.checkSheet_data[0].checkSheet)
  }, []);

  function compareCycle(a, b) {
    // converting to uppercase to have case-insensitive comparison
    const name1 = a.cycle.toUpperCase();
    const name2 = b.cycle.toUpperCase();

    let comparison = 0;

    if (name1 > name2) {
      comparison = 1;
    } else if (name1 < name2) {
      comparison = -1;
    }
    return comparison;
  }

  const showBackupChecksheetTableDataOfCSV = [

    {
      label: "C",
      field: "category",

    },
    {
      label: "Inspection Item",
      // editable: false,
      key: "inspection_parent_name",

    },
    {
      label: "Inspection Point",
      key: "inspection_point",
    },
    {
      label: "Judgement Criteria",
      key: "judgement_criteria",
    },
    {
      label: "Action",
      key: "action",
    },
    {
      label: "Cycle",
      key: "cycle",
    },
    {
      label: "Person In Charge",
      key: "personInCharge",
    },
    {
      label: "PM Time (min)",
      key: "PM_time",
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

  const downloadPDFForShowBackupChecksheetTableData = () => {
    const doc = new jsPDF();
    let rows = [];
    tableData?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.category,
        item.inspection_parent_name,
        item.inspection_point,
        item.judgement_criteria,
        item.action,
        item.cycle,
        item.personInCharge,
        item.PM_time

      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Backup Checksheet Inception Data`, 15, 10);

    autoTable(doc, {
      head: [columns?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Backup_Checksheet_Inception_Data_${timeStamp()}`);
  };

  const showBackupChecksheetTableAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFForShowBackupChecksheetTableData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={showBackupChecksheetTableDataOfCSV}
          className="downloadCSV text-decoration-none"
          data={tableData ? tableData : []}
          filename={`Backup_Checksheet_Inception_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
    },
  ]

  return (
    <>
      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">

          <button
            onClick={() => navigate('/backupDataOfCheckSheet')}
            style={{
              border: "none",
              background: "white",
              borderRadius: 5,
            }}
            className="mb-2"
          >
            <ArrowBackIcon />
          </button>


          <div class="row g-3">
            <div class="col-4">
              <div class="p-2 border bg-white rounded">
                <span >
                  <b>Line Name:{" "}</b>
                  {selectedMachineData.state.selectedRowForViewForm.line_names.line_name}
                </span>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 border bg-white rounded">
                <span >
                  <b>Machine Name:{" "}</b>
                  {selectedMachineData.state.selectedRowForViewForm.machine_name}
                </span>
              </div>
            </div>
            <div class="col-4">
              <div class="p-2 border bg-white rounded">
                <span >
                  <b>Machine No:{" "}</b>
                  {selectedMachineData.state.selectedRowForViewForm.machine_code}
                </span>
              </div>
            </div>
          </div>

          <h4 style={{ padding: "1rem 0 0 0" }}>Checksheet Data</h4>
          <div>
            <MaterialTable
              localization={
                {
                  // toolbar: {
                  //   exportCSVName: "Export some Excel format",
                  //   exportPDFName: "Export as pdf!!"
                  // }
                }
              }
              actions={showBackupChecksheetTableAction}
              icons={tableIcons}
              columns={columns}
              data={tableData?.sort(compareCycle)}
              // title="User Management"
              // tableRef={this.tableRef.current.onQueryChange()}

              editable={
                {
                  // isDeleteHidden: (rowData) => rowData.user_type === 0,
                  // onRowAdd: (newRow) =>
                  //   new Promise((resolve, reject) => {
                  //     // const updatedRows = [tableData, { user_id: "", ...newRow }];
                  //     console.log(newRow);
                  //     console.log("Checking ");
                  //     addNewChecksheetData(newRow);
                  //     setTimeout(() => {
                  //       // setTableData(updatedRows);
                  //       setRefKey((refKey) => refKey + 1);
                  //       resolve();
                  //     }, 500);
                  //     //refreshPage();
                  //   }),
                  // onRowDelete: (selectedRow) =>
                  //   new Promise((resolve, reject) => {
                  //     //call the delete user function and pass the user data
                  //     deleteSelectedMachineChecksheetTableRowData(selectedRow);
                  //     setTimeout(() => {
                  //       setRefKey((refKey) => refKey + 1);
                  //       // setTableData(updatedRows);
                  //       resolve();
                  //     }, 500);
                  //   }),
                  // onRowUpdate: (updatedRow, oldRow) =>
                  //   new Promise((resolve, reject) => {
                  //     //call the update user function and pass the user data
                  //     updateSelectedMachineChecksheetTableRowData(updatedRow);
                  //     setTimeout(() => {
                  //       setRefKey((refKey) => refKey + 1);
                  //       resolve();
                  //     }, 500);
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
                  fontWeight: "bold"
                }
              }}
            />

          </div>
        </div>
      </div>
      <br />
      <br />
      <br />

      <Footer />
    </>
  );
};

export default ShowBackupChecksheetTableData;
