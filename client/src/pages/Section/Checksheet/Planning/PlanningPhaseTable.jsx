import React from "react";
import {
  tableIcons,
  MaterialTable,
  useState,
  useEffect,
  useLocation,
} from "../../../../modules/PageModules";
import { updateSelectedMachineCheckSheetTableRowData } from "../../../../Integration/APIExports";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Navigate, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import { CSVLink, CSVDownload } from "react-csv";
import { jsPDF } from "jspdf";
// require('jspdf-autotable');
import autoTable from "jspdf-autotable";
import Footer from "../../../../components/Footer/Footer";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

function PlanningPhaseTable() {
  const [tableData, setTableData] = useState([]);
  const selectedMachineData = useLocation();
  const [sendPlanningApproval, setSendPlanningApproval] = useState(0);
  const [refKey, setRefKey] = useState(0);
  const [machineData, setMachineData] = useState([]);
  const [yearOfCheckSheet, setYearOfCheckSheet] = useState();

  const [planningApprovalShow, setPlanningApprovalShow] = useState(0);
  const [revisionContentTableData, setRevisionContentTableData] = useState([]);

  const navigate = useNavigate();

  const notifyForRevisionContent = () => {
    toast.error(
      "Please fill all revision content which you (ADD/UPDATE/DELETE) !",
      {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
      }
    );
  };

  const showChecksheet = () => {
    if (machineData[0]?.checkSheet_data?.revisionContentData?.length > 0) {
      if (machineData[0]?.checkSheet_data?.flagForRevisionContent === true) {
        if (
          machineData[0]?.checkSheet_data?.flagForRevisionContent === true &&
          machineData[0]?.checkSheet_data
            ?.flagForNewRevisionContentDataAdded === true
        ) {
          navigate("/pm/checkSheetForm", {
            state: {
              selectedRowForViewForm: machineData[0],
              planningApprovalShow: planningApprovalShow,
              selectedYear: machineData[0]?.checkSheet_data?.current_year,
            },
          });
        } else if (
          machineData[0]?.checkSheet_data?.flagForRevisionContent === true &&
          (machineData[0]?.checkSheet_data
            ?.flagForNewRevisionContentDataAdded === false ||
            machineData[0]?.checkSheet_data
              ?.flagForNewRevisionContentDataAdded === undefined)
        ) {
          notifyForRevisionContent();
        }
      } else {
        navigate("/pm/checkSheetForm", {
          state: {
            selectedRowForViewForm: machineData[0],
            planningApprovalShow: planningApprovalShow,
            selectedYear: machineData[0]?.checkSheet_data?.current_year,
          },
        });
      }
    } else {
      navigate("/pm/checkSheetForm", {
        state: {
          selectedRowForViewForm: machineData[0],
          planningApprovalShow: planningApprovalShow,
          selectedYear: machineData[0]?.checkSheet_data?.current_year,
        },
      });
    }
  };

  const addRevisionContent = async (selectedRow) => {
    try {
      const res = await fetch("/addRevisionContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRow,
          machineAllData: selectedMachineData.state.selectedRow,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Revision data added Successful");
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

  const deleteRevisionContentData = async (selectedRow) => {
    // console.log(tm_no);
    try {
      const res = await fetch("/deleteRevisionContentData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowData: selectedRow,
          machineId: selectedMachineData.state.selectedRow.machine_code,
          yearOfCheckSheet,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Revision Content Row Deleted Successful");
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

  const fetchSelectedMachineCheckSheetTableData = async () => {
    try {
      const res = await fetch("/fetchSelectedMachineChecksheetTableData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: selectedMachineData.state.selectedRow.machine_code,
          yearOfCheckSheet: selectedMachineData.state.selectedRow?.checkSheet_data?.current_year
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data.getSelectedMachineChecksheet);
        setTableData(data.getSelectedMachineChecksheet);
        setMachineData(data.machineData);
        setYearOfCheckSheet(data.yearOfCheckSheet);
        setRevisionContentTableData(
          data?.machineData[0]?.checkSheet_data?.revisionContentData
        );
        // checkFieldExistsInPlanningPhase(data.getSelectedMachineChecksheet);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSelectedMachineCheckSheetTableData();
  }, [refKey]);

  useEffect(() => {
    if (tableData.length > 0) checkFieldExistsInPlanningPhase(tableData);
  }, [tableData]);

  let count = 0;
  const checkFieldExistsInPlanningPhase = (table1) => {
    table1.map((key) => {
      if ("start_month" in key) {
        count = count + 1;
      }
      setSendPlanningApproval(count);
    });

    if (sendPlanningApproval === tableData.length) {
      setPlanningApprovalShow(1);
    } else {
      setPlanningApprovalShow(0);
    }
  };
  // console.log(sendPlanningApproval);

  const monthList = [
    {
      label: "Apr",
      value: "0",
    },
    {
      label: "May",
      value: "1",
    },
    {
      label: "Jun",
      value: "2",
    },
    {
      label: "Jul",
      value: "3",
    },
    {
      label: "Aug",
      value: "4",
    },
    {
      label: "Sep",
      value: "5",
    },
    {
      label: "Oct",
      value: "6",
    },
    {
      label: "Nov",
      value: "7",
    },
    {
      label: "Dec",
      value: "8",
    },
    {
      label: "Jan",
      value: "9",
    },
    {
      label: "Feb",
      value: "10",
    },
    {
      label: "Mar",
      value: "11",
    },
  ];

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
      editable: false,
    },
    {
      title: "Inspection Item",
      editable: false,
      field: "inspection_parent_name",
      filtering: false,
      align: "center",
      width: "10%",
      // render: (data) => {
      //     return `${data.inspection_parent_name} ${data.inspection_child_name}`;
      //   },
    },
    // {
    //   title: "Inspection Item Child",
    //   editable: false,
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
      editable: false,
      align: "center",
      width: "10%",
    },
    {
      title: "Judgement Criteria",
      field: "judgement_criteria",
      editable: false,
      align: "center",
    },
    {
      title: "Action",
      field: "action",
      align: "center",
      editable: false,
      width: "10%",
    },
    {
      title: "Cycle",
      field: "cycle",
      align: "center",
      editable: false,
      width: "5%",
    },
    {
      title: "Person In Charge",
      field: "personInCharge",
      align: "center",
      editable: false,
      width: "5%",
    },
    {
      title: "PM Time",
      field: "PM_time",
      align: "center",
      editable: false,
      width: "5%",
    },
    {
      title: "Start Month",
      field: "start_month",
      render: (rowData) => {
        return monthList.map((index) => {
          if (rowData.start_month === index.value) {
            // console.log(rowData.start_month);
            return index.label;
          }
        });
      },
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
          {monthList.map((option) => {
            return <option value={option.value}>{option.label}</option>;
          })}
        </select>
      ),
      width: "5%",
    },
    {
      title: "Remarks Compulsory",
      field: "remarksCompulsoryOrNot",
      align: "center",
      width: "5%",
      editable: false,
      editComponent: ({ value, onChange }) => {
        const isChecked = value === "Yes";

        const handleCheckboxChange = (e) => {
          const newValue = e.target.checked ? "Yes" : "No";
          onChange(newValue);
        };

        return (
          <FormControlLabel
            control={
              <Checkbox
                onChange={handleCheckboxChange}
                inputProps={{ "aria-label": "controlled" }}
                checked={isChecked}
              />
            }
            label="Yes"
          />
        );
      },
    },
  ];

  const planningPhaseDataForCSV = [
    {
      label: "C",
      key: "category",
    },
    {
      label: "Inspection Item",
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
      label: "PM Time",
      key: "PM_time",
    },
    {
      label: "Start Month",
      key: "start_month",
    },
  ];

  const revisedColumns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "7%",
      align: "center",
    },
    {
      title: "Revision contents",
      field: "revisionContent",
      filtering: false,
      align: "center",
      validate: (row) => (row.revisionContent || "").length !== 0,
    },
    {
      title: "Date",
      field: "revisionContentDate",
      filtering: false,
      align: "center",
      editComponent: ({ value, onChange }) => (
        <input
          type="date"
          //   className="col-6"
          name="revisionContentDate"
          onChange={(e) => onChange(e.target.value)}
        />
      ),
      validate: (row) => (row.revisionContentDate || "").length !== 0,
    },
    {
      title: "Revised by",
      field: "revisedBy",
      filtering: false,
      align: "center",
      editable: "false",
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

  const downloadPDFOfPlanningData = () => {
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
        item.PM_time,
        item.start_month,
      ];
      rows.push(rowArrayOfTable);
    });
    doc.text(`Planning Data`, 15, 10);

    autoTable(doc, {
      head: [columns?.map((value) => value.title)],
      body: rows,
    });
    // doc.autoTable(columns, csvData);
    doc.save(`Planning_Phase_Data_${timeStamp()}`);
  };

  const planningPhaseDataAction = [
    {
      icon: () => <button className="downloadPDF">PDF</button>,
      tooltip: "PDF",
      isFreeAction: true,
      onClick: (event) => {
        downloadPDFOfPlanningData();
      },
    },

    {
      icon: () => (
        <CSVLink
          headers={planningPhaseDataForCSV}
          className="downloadCSV text-decoration-none"
          data={tableData}
          filename={`Planning_Phase_Data_${timeStamp()}`}
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

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />

      <div style={{ margin: "0.5rem" }}>
        <div className="pageCard">
          <button
            onClick={() => navigate("/pm/checkSheetDashboard")}
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
              <div class="p-3 border bg-white rounded">
                <span style={{ fontWeight: "bold" }}>
                  Line Name:{" "}
                  {selectedMachineData.state.selectedRow.line_names.line_name}
                </span>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3 border bg-white rounded">
                <span style={{ fontWeight: "bold" }}>
                  Machine Name:{" "}
                  {selectedMachineData.state.selectedRow.machine_name}
                </span>
              </div>
            </div>
            <div class="col-4">
              <div class="p-3 border bg-white rounded">
                <span style={{ fontWeight: "bold" }}>
                  Machine No:{" "}
                  {selectedMachineData.state.selectedRow.machine_code}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: "1rem" }}>
            <MaterialTable
              localization={
                {
                  // toolbar: {
                  //   exportCSVName: "Export some Excel format",
                  //   exportPDFName: "Export as pdf!!"
                  // }
                }
              }
              actions={planningPhaseDataAction}
              icons={tableIcons}
              columns={columns}
              data={tableData?.sort(compareCycle)}
              // title="User Management"
              // tableRef={this.tableRef.current.onQueryChange()}

              editable={{
                isDeleteHidden: (rowData) => rowData?.isDeleted,
                isEditHidden: (rowData) => rowData?.isDeleted,
                // isDeleteHidden: (rowData) => rowData.user_type === 0,
                // onRowAdd: (newRow) =>
                //   new Promise((resolve, reject) => {
                //     // const updatedRows = [tableData, { user_id: "", ...newRow }];
                //     console.log(newRow);
                //     console.log("Checking ");
                //     // addNewChecksheetData(newRow);

                //     // setTimeout(() => {
                //     //   // setTableData(updatedRows);
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
                //     // deleteSelectedMachineChecksheetTableRowData(selectedRow);

                //     // setTimeout(() => {
                //     //   setTableData(updatedRows);
                //     //   resolve();
                //     // }, 500);
                //   }),

                onRowUpdate: (updatedRow, oldRow) =>
                  new Promise((resolve, reject) => {
                    const index = oldRow.tableData.id;
                    const updatedRows = [...tableData];
                    updatedRows[index] = updatedRow;
                    updateSelectedMachineCheckSheetTableRowData(
                      oldRow,
                      updatedRow,
                      selectedMachineData.state.selectedRow.machine_code,
                      yearOfCheckSheet
                    );
                    setTimeout(() => {
                      setRefKey((refKey) => refKey + 1);
                      setTableData(updatedRows);
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
                  position: "sticky",
                  top: "0",
                  fontWeight: "bold",
                },
                maxBodyHeight: "70vh",
                rowStyle: (rowData) => ({
                  boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                  // color:"rgba(255,255,255,0.8)",
                  borderRadius: "5px",
                  border: "1px solid rgba(255,255,255)",
                  WebkitBackdropFilter: "blur( 2px )",
                  background: rowData?.isDeleted
                    ? "#f7b1bf"
                    : "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(5px)",
                  // fontSize: "12px",
                  // textDecoration: rowData?.isDeleted ? "line-through solid red 15%" : "none"
                }),
                headerStyle: {
                  fontSize: "13px",
                  fontWeight: "bold",
                },
              }}
            />
            <div className="col-4 mt-2" style={{ float: "right" }}>
              <button
                className="btn-primary1"
                onClick={showChecksheet}
                style={{ float: "right" }}
              >
                View & Send for Approval
              </button>
            </div>
          </div>
        </div>
        {machineData[0]?.checkSheet_data?.revisionContentData?.length > 0 ? (
          <div className="row m-3 p-3 border bg-white rounded">
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
                icons={tableIcons}
                columns={revisedColumns}
                data={revisionContentTableData}
                // title="User Management"
                // tableRef={this.tableRef.current.onQueryChange()}

                editable={{
                  // isDeleteHidden: (rowData) => rowData.user_type === 0,
                  onRowAdd: (newRow) =>
                    new Promise((resolve, reject) => {
                      // const updatedRows = [tableData, { user_id: "", ...newRow }];

                      addRevisionContent(newRow);

                      setTimeout(() => {
                        // setTableData(updatedRows);
                        setRefKey((refKey) => refKey + 1);
                        resolve();
                      }, 500);
                      //refreshPage();
                    }),

                  onRowDelete: (selectedRow) =>
                    new Promise((resolve, reject) => {
                      //call the delete user function and pass the user data
                      deleteRevisionContentData(selectedRow);

                      setTimeout(() => {
                        setRefKey((refKey) => refKey + 1);
                        // setTableData(updatedRows);
                        resolve();
                      }, 500);
                    }),

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
        ) : (
          ""
        )}
      </div>
      <br />
      <br />
      <br />
      <Footer />
    </>
  );
}

export default PlanningPhaseTable;
