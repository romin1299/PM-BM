import React, { useState, useEffect, useContext } from "react";
import RoutingContext from "../../context/routing/RoutingContext";
import MaterialTable from "@material-table/core";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import FileDownload from "js-file-download";
import axios from "axios";
import { Row, Col } from "react-bootstrap";
import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";
import NotFound from "./ReportComponents/NotFound";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";

function OpenAbnormalityTracking() {
  const context = useContext(RoutingContext);
  const [tableData, setTableData] = useState([]);
  const [refKey1, setRefKey1] = useState(0);
  const [refKey2, setRefKey2] = useState(0);
  const [MTDTLandOperatorList, setMTDTLandOperatorList] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [lineDropdown, setLineDropdown] = useState([]);
  const [loadingAnimationState, setLoadingAnimationState] = useState(
    <LoadingAnimation />
  );

  const getDataForOpenAbnormalityTracking = async (selectedSection) => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/getDataForOpenAbnormalityTracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
          selectedLine,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post");
        console.log(data);
        setTableData(data?.onlyOpenAbnormalityWithAllMonths);
        setLineDropdown(data?.lineData);
        setLoadingAnimationState(<NotFound />);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const monthKeyArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let monthForCompareSystemMonth = monthKeyArray[new Date().getMonth()];
  const tableHeader = [
    {
      title: "Sr. no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
    },
    {
      title: "Line Name",
      field: "line_name",
      align: "center",
      width: "5%",
      editable: "false",
    },
    {
      title: "Machine Code",
      field: "machine_code",
      editable: "false",
      align: "center",
      width: "5%",
    },
    {
      title: "Machine Name",
      field: "machine_name",
      align: "center",
      width: "10%",
      editable: "false",
    },
    {
      title: "Schedule Month",
      field: "schedule_month",
      align: "center",
      width: "5%",
      editable: "false",
    },
    {
      title: "Checked By",
      // field: "checked_by",
      align: "center",
      width: "5%",
      render: (rowData) =>
        rowData.checked_by.length > 1
          ? rowData.checked_by.join(", ")
          : rowData.checked_by,
      editable: "false",
    },
    {
      title: "Abnormality Remarks",
      field: "abnormalityRemarks",
      align: "center",
      // width: "20%",
      editable: "false",
    },
    {
      title: "Target Date",
      field: "targetDate",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="targetDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
      render: (rowData) =>
        rowData.targetDate.length > 1
          ? rowData.targetDate.join(", ")
          : rowData.targetDate,
      // width: "20%",
    },
    {
      title: "Action Details",
      field: "remarksOnClose",
      align: "center",
      // width: "20%",
    },
    {
      title: "Done Date",
      field: "doneDate",
      align: "center",
      // width: "20%",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="doneDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
    },
    {
      title: "Done By",
      field: "doneBy",

      align: "center",
      editComponent: ({ value, onChange }) => (
        <select
          //   class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="monthList"
          fullWidth
          select // label="Select"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {MTDTLandOperatorList.map((option) => {
            return <option value={option.tm_name}>{option.tm_name}</option>;
          })}
        </select>
      ),
      width: "10%",
    },
  ];

  const abnormalityDataHeaderForCSV = [
    
    {
      label: "Line Name",
      key: "line_name",
      
    },
    {
      label: "Machine Code",
      key: "machine_code",
      
    },
    {
      label: "Machine Name",
      key: "machine_name",
      
    },
    {
      label: "Schedule Month",
      key: "schedule_month",
      
    },
    {
      label: "Checked By",
      key: "checked_by",
      
    },
    {
      label: "Abnormality Remarks",
      key: "abnormalityRemarks",
   
    },
    {
      label: "Target Date",
      key: "targetDate",
      
    },
    {
      label: "Action Details",
      key: "remarksOnClose",
      
    },
    {
      label: "Done Date",
      key: "doneDate",
      
    },
    {
      label: "Done By",
      key: "doneBy",

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
  
    const downloadPDFOfAbnormalityOpen = () => {
      const doc = new jsPDF();
      let rows = [];
      tableData?.map((item, idx) => {
        let rowArrayOfTable = [
          ++idx,
          item.line_name,
          item.machine_code,
          item.machine_name,
          item.schedule_month,
          item.checked_by,
          item.abnormalityRemarks,
          item.targetDate,
          item.remarksOnClose,
          item.doneDate,
          item.doneBy
        ];
        rows.push(rowArrayOfTable);
      });
      doc.text(`Abnormality Open Data`, 15, 10);
  
      autoTable(doc, {
        head: [tableHeader?.map((value) => value.title)],
        body: rows,
      });
      // doc.autoTable(columns, csvData);
      doc.save(`Abnormality_Open_Data_${timeStamp()}`);
    };

    console.log(tableData)

  const actions = [
    (rowdata) => {
      return {
        hidden:
          rowdata.PMuploadedImage === "" ||
          rowdata.PMuploadedImage === undefined,
        name: "download", // Added custom name property so we know which action to check for
        icon: () => (
          <button className="btn-reset">
            <SimCardDownloadIcon />
          </button>
        ),
        onClick: (event, selectedRow) => {
          downloadUploadedPdf(selectedRow.PMuploadedImage);
        },

        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },

    (rowdata) => {
      return {
        hidden:
          rowdata.remarksOnClose === undefined &&
          rowdata.doneDate === undefined &&
          rowdata.doneBy === undefined,
        name: "Close", // Added custom name property so we know which action to check for
        icon: () => <button className="btn-delete">Close</button>,
        onClick: (event, selectedRow) => {
          updateOpenPMToClose(selectedRow);
          setRefKey1((refKey1) => refKey1 + 1);
        },
        disabled: false, // Set disabled to false by default for all actions
        position: "row",
      };
    },
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfAbnormalityOpen();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={abnormalityDataHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={tableData}
          filename={`Abnormality_Open_Data_${timeStamp()}`}
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

  const downloadUploadedPdf = async (fileNameOfUploadedImage) => {
    try {
      let selectedFileName = fileNameOfUploadedImage;
      const res = await fetch("/postFileName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFileName,
        }),
      });
      const data = await res.json();

      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("FileName Posted");
        let fileName1 = selectedFileName.substring(14);
        // console.log(selectedFileName, "_________-", fileName1);
        axios({
          url: "/downloadFile",
          method: "GET",
          responseType: "blob",
        }).then((res) => {
          FileDownload(res.data, fileName1);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateOpenPMData = async (updateRow, oldRow) => {
    try {
      const res = await fetch("/updateOpenPMData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updateRow,
          oldRow,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || !data) {
        window.alert("Invalid");
      } else if (res.status === 422) {
        window.alert("Please fill all the details ");
      } else {
        console.log("Data Added Successful");

        // countCounter();
        // const dateAndTime = timeStamp();
        // const addMessage = `${newRow.user_name} added as a new user`;
        // logData(dateAndTime, addMessage); // send the log data to log management table
        // newPasswordLink(newRow); // to send email for new password
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateOpenPMToClose = async (selectedRow) => {
    try {
      const res = await fetch("/updateOpenPMToClose", {
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
      } else if (res.status === 422) {
        window.alert("Please fill all the details ");
      } else {
        console.log("Data Added Successful");

        // countCounter();
        // const dateAndTime = timeStamp();
        // const addMessage = `${newRow.user_name} added as a new user`;
        // logData(dateAndTime, addMessage); // send the log data to log management table
        // newPasswordLink(newRow); // to send email for new password
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getListForApproval = async () => {
    try {
      const res = await fetch("/getListForApproval", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      // console.log(data)
      setMTDTLandOperatorList(data.MTDTLandOperatorList);

      // setTableData(finalData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDataForOpenAbnormalityTracking(context.section_data);
  }, [context.section_data, refKey1, refKey2, selectedLine]);

  useEffect(() => {
    getListForApproval();
  }, []);

  return (
    <>
      <br />
      <div className="pageCard">
        <div className="creationDashboard">
          <h4 style={{ padding: "1rem 0 0 1rem" }}>
            Open Abnormality Tracking
          </h4>
          <Row className="mt-3">
            <Col lg={1} md={1} sm={1}>
              <span style={{ padding: "1rem 0 0 1rem" }}>Line:</span>
            </Col>
            <Col lg={3} md={3} sm={3}>
              <div>
                <select
                  class="form-select form-select-sm"
                  aria-label=".form-select-sm example"
                  // style={{ width: "100%" }}
                  id="standard-select-currency"
                  name="selectedPlant"
                  value={selectedLine}
                  className="textField"
                  onChange={(e) => {
                    setSelectedLine(e.target.value);
                    setLoadingAnimationState(<LoadingAnimation />);
                    // postLineToGetMachineList(e.target.value);
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
                      <option value={option._id}>{option.line_name}</option>
                    );
                  })}
                </select>
              </div>
            </Col>
          </Row>
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
                columns={tableHeader}
                data={tableData}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}

                editable={{
                  onRowUpdate: (updatedRow, oldRow) =>
                    new Promise((resolve, reject) => {
                      const index = oldRow.tableData.id;
                      const updatedRows = [...tableData];
                      updatedRows[index] = updatedRow;
                      //call the update user function and pass the user data
                      // updateUserInfo(updatedRow);

                      updateOpenPMData(updatedRow, oldRow);
                      setTimeout(() => {
                        setRefKey2((refKey2) => refKey2 + 1);
                        resolve();
                      }, 500);
                      //refreshPage();
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
                    // color: "red",
                    position: "sticky",
                    top: "0",
                    fontWeight: "bold",
                    // backgroundColor: "#E6232A",
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
                  headerStyle: {
                    fontSize: "14px",
                    fontWeight: "bold"
                  }
                }}
              />
            </div>
          ) : (
            <div className="container-fluid d-flex justify-content-center align-items-center p-5">
              {loadingAnimationState}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default OpenAbnormalityTracking;
