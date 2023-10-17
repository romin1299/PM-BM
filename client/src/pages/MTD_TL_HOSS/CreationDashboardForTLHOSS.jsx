import {
  React,
  useEffect,
  useState,
  MaterialTable,
  tableIcons,
  NewUserRegistration,
  AddBoxIcon,
  useContext,
} from "../../modules/PageModules";

import qr from "qrcode";

import {
  newCell,
  deleteCell,
  updateCell,
  newLine,
  updateLine,
  deleteLine,
  updateMachine,
  deleteMachine,
} from "../../Integration/APIExports.js";

import { Row, Col } from "react-bootstrap";

import "../../SCSS/MaterialTable.scss";
import { RadioGroup } from "@mui/material";
import RoutingContext from "../../context/routing/RoutingContext";
import MachineAdd from "../../Popups/machineAdd";
import Footer from "../../components/Footer/Footer";
import QrCodeIcon from "@mui/icons-material/QrCode";
import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import ViewGeneratedQROfMachine from "../../Popups/ViewGeneratedQROfMachine";

const CreationDashboardForTLHOSS = () => {
  const [cell, setCell] = useState();
  const [line, setLine] = useState();

  const [machine, setMachine] = useState([]);

  const [lineList, setLineList] = useState("");

  const [refKey2, setRefKey2] = useState(0);
  const [refKey3, setRefKey3] = useState(0);

  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedRow, setSelectedRow] = useState();

  // console.log(lineList);
  const context = useContext(RoutingContext);

  const lineHeader = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "10%",
    },
    {
      title: "Line Id",
      field: "line_id",
      editable: "false",
      align: "center",
    },
    {
      title: "Line Name",
      field: "line_name",
      align: "center",
    },
    {
      title: "Line Sequence",
      field: "line_sequence",
      align: "center",
    },
  ];

  const lineHeaderForCSV = [
    {
      label: "Line Id",
      key: "line_id",
    },
    {
      label: "Line Name",
      key: "line_name",
    },
    {
      label: "Line Sequence",
      key: "line_sequence",
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

  const downloadPDFOfLineData = () => {
    const doc = new jsPDF();
    let rows = [];
    lineList?.lineInfo?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.line_id,
        item.line_name,
        item.line_sequence,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Line Data`, 15, 10);

    autoTable(doc, {
      head: [lineHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Line_Data_${timeStamp()}`);
  };

  const lineAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfLineData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={lineHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={lineList?.lineInfo}
          filename={`Line_Data_${timeStamp()}`}
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

  const machineHeader = [
    {
      title: "Sr No",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "6%",
    },
    {
      title: "Machine Code",
      field: "machine_code",
      editable: "false",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine Name",
      field: "machine_name",
      align: "center",
      width: "15%",
    },
    {
      title: "Machine Nick-Name",
      field: "machine_nickname",
      align: "center",
    },
    {
      title: "Machine Sequence",
      field: "machine_sequence",
      align: "center",
      width: "5%",
    },
    {
      title: "Proceed for PM ?",
      field: "isPM",
      align: "center",
      width: "5%",
      editComponent: ({ value, onChange }) => (
        <>
          <input
            type="radio"
            name="isPM"
            id="outlined-number"
            value="Yes"
            onChange={(e) => onChange(e.target.value)}
          />
          <span
            style={{
              paddingLeft: "0.5rem",
              fontWeight: "550",
              color: "black",
            }}
          >
            Yes
          </span>
          <br />
          <input
            type="radio"
            name="isPM"
            id="outlined-number"
            value="No"
            onChange={(e) => onChange(e.target.value)}
          />
          <span
            style={{
              paddingLeft: "0.5rem",
              fontWeight: "550",
              color: "black",
            }}
          >
            No
          </span>
        </>
      ),
    },
    {
      title: "Installation Date",
      field: "installation_date",
      // editable: "false",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="installation_date"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
    },
    {
      title: "Manufacturing Date",
      field: "manufacturingDate",
      // editable: "false",
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="manufacturingDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
    },
    {
      title: "Maker Name",
      field: "maker_name",
      align: "center",
    },
    {
      title: "Maker Sr.No.",
      field: "maker_sr_no",
      align: "center",
      width: "15%",
    },
  ];

  const machineHeaderForCSV = [
    {
      label: "Machine Code",
      key: "machine_code",
    },
    {
      label: "Machine Name",
      key: "machine_name",
    },
    {
      label: "Machine Nick-Name",
      key: "machine_nickname",
    },
    {
      label: "Machine Sequence",
      key: "machine_sequence",
    },
    {
      label: "Proceed for PM ?",
      key: "isPM",
    },
    {
      label: "Installation Date",
      key: "installation_date",
    },
    {
      label: "Manufacturing Date",
      key: "manufacturingDate",
    },
    {
      label: "Maker Name",
      key: "maker_name",
    },
    {
      label: "Maker Sr.No.",
      key: "maker_sr_no",
    },
  ];

  const downloadPDFOfMachineData = () => {
    const doc = new jsPDF();
    let rows = [];
    machine?.map((item, idx) => {
      let rowArrayOfTable = [
        ++idx,
        item.machine_code,
        item.machine_name,
        item.machine_nickname,
        item.machine_sequence,
        item.isPM,
        item.installation_date,
        item.manufacturingDate,
        item.maker_name,
        item.maker_sr_no,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Machine Data`, 15, 10);

    autoTable(doc, {
      head: [machineHeader?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Machine_Data_${timeStamp()}`);
  };

  const downloadQRCodeOfMachineData = async () => {
    const doc = new jsPDF();

    // Define the dimensions for the 4x3 table
    const startX = 5;
    const startY = 5;
    const cellWidth = 45;
    const cellHeight = 45;
    const spacing = 5;

    const startTextX = 14;
    const startTextY = 5;
    const textSpacing = 5;

    // Create an async function to generate a QR code
    const generateQRCode = async (data) => {
      return new Promise((resolve, reject) => {
        qr.toDataURL(
          data,
          { type: "image/jpeg", errorCorrectionLevel: "M" },
          (err, url) => {
            if (err) {
              reject(err);
            } else {
              resolve(url);
            }
          }
        );
      });
    };

    // Iterate through QR code data using forEach
    for (let index = 0; index < machine.length; index++) {
      console.log(machine?.length);

      const data = machine[index]?.machine_code;
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = startX + col * (cellWidth + spacing);
      const y = startY + row * (cellHeight + spacing);

      const textX = startTextX + col * (cellWidth + textSpacing);
      const textY = startTextY + row * (cellHeight + textSpacing);

      // if (index >= 24) {
      //   doc.addPage();
      // }
      // Generate the QR code as a data URL and add to the PDF
      const qrCodeDataURL = await generateQRCode(data);
      doc.text(data, textX, textY);
      doc.addImage(qrCodeDataURL, "JPEG", x, y, cellWidth, cellHeight);
    }
    if (machine?.length >= 24) {
      doc.addPage();
    }
    doc.save(`Machine_QR_${timeStamp()}`);
  };

  const postCellToGetLineList = async (selectedCell) => {
    setLine(undefined);
    setMachine([]);
    try {
      const res = await fetch("/postCellToGetLineList", {
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
        // console.log("Data post", data);

        setLineList(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postLineToGetMachineList = async (selectedLine) => {
    setMachine([]);
    try {
      const res = await fetch("/postLineToGetMachineList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);

        setMachine(data?.machineInfo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const refreshForMachineData = () => {
    // console.log("******");
    setRefKey3((refKey3) => refKey3 + 1);
  };
  useEffect(() => {
    if (cell) {
      postCellToGetLineList(cell);
    }
  }, [cell, refKey2]);

  useEffect(() => {
    if (line) {
      postLineToGetMachineList(line);
    }
  }, [line, refKey3]);

  const displayAndHide = () => {
    setShowQRCode((showQRCode) => !showQRCode);
  };

  const actionsForMachineTable = [
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () =>
        window.innerWidth > 1024 ? (
          <button className="btn-reset">Add Machine</button>
        ) : (
          <AddBoxIcon />
        ),

      tooltip: "Add Machine",
      isFreeAction: true,
      onClick: (event, rowData) => {
        document.getElementById("main_div_reg3").style.display = "block";
        document.getElementById("main_div_reg3").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
    },
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfMachineData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={machineHeaderForCSV}
          className="downloadCSV text-decoration-none"
          data={machine}
          filename={`Machine_Data_${timeStamp()}`}
          style={{ textDecoration: "none", color: "white" }}
        >
          {/* <FileDownloadIcon style={{ fontSize: "1.15rem" }} /> */}
          CSV
        </CSVLink>
      ),
      tooltip: "PDF",
      isFreeAction: true,
    },
    {
      icon: () => (
        <button className="border-0">
          <QrCodeIcon />
        </button>
      ),
      tooltip: "QR",
      isFreeAction: false,
      onClick: (event, selectedRow) => {
        // downloadPDFOfMachineData();
        setSelectedRow(selectedRow);
        displayAndHide();
      },
    },
    {
      icon: () => (
        <button className="border-0">
          <QrCodeIcon />
        </button>
      ),
      tooltip: "Download All QR",
      isFreeAction: true,
      onClick: (event, selectedRow) => {
        downloadQRCodeOfMachineData();
      },
    },
  ];

  // console.log(
  //   subSectionList !== ""
  //     ? subSectionList.sectionInfo.dashboardLevel === "Yes"
  //       ? `${subSectionList.subSectionArray} _____ subSectionList.subSectionArray`
  //       : `${context.subSection_data} ______context.subSection_data`
  //     : ""
  // );

  return (
    <>
      <ViewGeneratedQROfMachine
        showQRCode={showQRCode}
        displayAndHide={displayAndHide}
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
      />

      <div className="mainPage">
        <MachineAdd line={line} refreshForMachineData={refreshForMachineData} />
        <div className="pageCard">
          <div className="creationDashboard">
            <div className="selection_div">
              <Row>
                <Col sm>
                  <span>
                    <b>Cell/Product :</b>&nbsp;
                  </span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "50%", background: "white" }}
                    id="standard-select-currency"
                    name="plant"
                    className="textField"
                    select
                    fullWidth // label="Select"
                    autoComplete="off"
                    value={cell === undefined ? "" : cell}
                    onChange={(e) => {
                      setCell(e.target.value);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {context?.cell_data?.map((option) => {
                      return <option value={option}>{option}</option>;
                    })}
                  </select>
                </Col>
                <Col sm>
                  <span>
                    <b>Line :</b>&nbsp;
                  </span>
                  <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "50%", background: "white" }}
                    id="standard-select-currency"
                    name="plant"
                    className="textField"
                    select
                    fullWidth // label="Select"
                    autoComplete="off"
                    //   value={plant}

                    value={line === undefined ? "" : line}
                    onChange={(e) => {
                      setLine(e.target.value);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {lineList !== ""
                      ? lineList?.lineArray?.map((option) => {
                          return <option value={option}>{option}</option>;
                        })
                      : ""}
                  </select>
                </Col>
              </Row>
              {/* <div style={{ display: "flex", flexDirection: "column" }}>

              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>

              </div> */}
            </div>
            <div style={{ padding: "1rem" }}>
              {cell && line ? (
                machine !== "" ? (
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
                    actions={actionsForMachineTable}
                    icons={tableIcons}
                    columns={machineHeader}
                    data={machine}
                    // title="User Management"
                    // tableRef={this.tableRef.current.onQueryChange()}

                    editable={{
                      // onRowAdd: (newRow) =>
                      //   new Promise((resolve, reject) => {
                      //     const updatedRows = [
                      //       ...lineList.lineInfo,
                      //       { user_id: "", ...newRow },
                      //     ];

                      //     newLine(newRow, cell);
                      //     setTimeout(() => {
                      //       // setSectionList(updatedRows);
                      //       setRefKey3((refKey3) => refKey3 + 1);
                      //       resolve();
                      //     }, 500);
                      //     //refreshPage();
                      //   }),

                      onRowDelete: (selectedRow) =>
                        new Promise((resolve, reject) => {
                          // const index = selectedRow.tableData.id;
                          // console.log(index);
                          // const updatedRows = [...machine];
                          // updatedRows.splice(index, 1);

                          //call the delete user function and pass the user data
                          // deleteUserInfo(selectedRow);
                          deleteMachine(selectedRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey3((refKey3) => refKey3 + 1);
                            resolve();
                          }, 500);
                        }),

                      onRowUpdate: (updatedRow, oldRow) =>
                        new Promise((resolve, reject) => {
                          const index = oldRow.tableData.id;
                          const updatedRows = [...machine];
                          updatedRows[index] = updatedRow;
                          //call the update user function and pass the user data
                          // updateUserInfo(updatedRow);
                          updateMachine(updatedRow, oldRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey3((refKey3) => refKey3 + 1);
                            resolve();
                          }, 500);
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
                      // pageSize: 10,
                      // pageSizeOptions: false,
                      // paginationType: "stepped",
                      addRowPosition: "first",
                      headerStyle: {
                        position: "sticky",
                        top: "0",
                        fontWeight: "bold",
                      },

                      maxBodyHeight: "70vh",
                      // overflowY: "hidden",
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
                        fontWeight: "bold",
                      },
                    }}
                  />
                ) : (
                  ""
                )
              ) : cell ? (
                lineList !== "" ? (
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
                    actions={lineAction}
                    icons={tableIcons}
                    columns={lineHeader}
                    data={lineList?.lineInfo}
                    // title="User Management"
                    // tableRef={this.tableRef.current.onQueryChange()}

                    editable={{
                      onRowAdd: (newRow) =>
                        new Promise((resolve, reject) => {
                          const updatedRows = [
                            ...lineList?.lineInfo,
                            { user_id: "", ...newRow },
                          ];

                          newLine(newRow, cell);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey2((refKey2) => refKey2 + 1);
                            resolve();
                          }, 500);
                          //refreshPage();
                        }),

                      onRowDelete: (selectedRow) =>
                        new Promise((resolve, reject) => {
                          // const index = selectedRow.tableData.id;
                          // console.log(index);
                          // const updatedRows = [...lineList.lineInfo];
                          // updatedRows.splice(index, 1);

                          //call the delete user function and pass the user data
                          // deleteUserInfo(selectedRow);
                          deleteLine(selectedRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey2((refKey2) => refKey2 + 1);
                            resolve();
                          }, 500);
                        }),

                      onRowUpdate: (updatedRow, oldRow) =>
                        new Promise((resolve, reject) => {
                          const index = oldRow.tableData.id;
                          const updatedRows = [...lineList?.lineInfo];
                          updatedRows[index] = updatedRow;
                          //call the update user function and pass the user data
                          // updateUserInfo(updatedRow);
                          updateLine(updatedRow, oldRow);
                          setTimeout(() => {
                            // setSectionList(updatedRows);
                            setRefKey2((refKey2) => refKey2 + 1);
                            resolve();
                          }, 500);
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
                      // width: "70%",
                      maxBodyHeight: "70vh",
                      // overflowY: "hidden",
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
                        fontWeight: "bold",
                      },
                    }}
                  />
                ) : (
                  ""
                )
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default CreationDashboardForTLHOSS;
