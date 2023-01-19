import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import TextField from "@material-ui/core/TextField";
import MaterialTable from "@material-table/core";

import RoutingContext from "../../context/routing/RoutingContext";

import {
  postSectionToGetAllDataForMainDashboard,
  postLineToGetAllMachineData,
} from "../../Integration/APIExports";

import currentYear from "../Dashboard/DashboardComponent/currentYear";

const SparePartUsageHistory = () => {
  const context = useContext(RoutingContext);
  const typeDropdownList = ["BM", "Corrective", "Predictive", "Kaizen"];
  const monthKeyArray = [
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  const [selectedMonth, setSelectedMonth] = useState();

  const [allLineData, setAllLineData] = useState([]);
  const [allMachineDataBasedOnLine, setAllMachineDataBasedOnLine] = useState(
    []
  );

  // selectedMachine = index of machine from allMachineDataBasedOnLine dropdown
  // actual machine data = allMachineDataBasedOnLine?.[selectedMachine]
  const [selectedMachine, setSelectedMachine] = useState();

  // console.log(allMachineDataBasedOnLine);

  const [tableData, setTableData] = useState([]);

  const tableColumn = [
    {
      title: "Sr. no",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      align: "center",
      width: "5%",
    },
    {
      title: "Date",
      editable: "false",
      align: "center",
    },
    {
      title: "Line",
      // field: "line_names.line_name",
      //   render: (rowData) => rowData?.line_names.line_name,
      editable: "false",
      align: "center",
    },
    {
      title: "Machine",
      field: "machine_name",
      align: "center",
    },
    {
      title: "Machine No.",
      field: "machine_code",
      align: "center",
    },

    {
      title: "Category",
      editable: "false",
      align: "center",
    },

    {
      title: "Part Name",
      editable: "false",
      align: "center",
    },

    {
      title: "Used By",
      editable: "false",
      align: "center",
    },

    {
      title: "Cost",
      editable: "false",
      align: "center",
    },

    {
      title: "Abnormality",
      editable: "false",
      align: "center",
    },

    {
      title: "SparePart",
      editable: "false",
      align: "center",
    },
  ];

  const actions = [
    // {
    //   // icon: () => <button className="addbutton">Add</button>,
    //   icon: () => <button className="btn">Add</button>,
    //   tooltip: "Add User",
    //   isFreeAction: true,
    //   onClick: (event, rowData) => {
    //     setOperatorDataEntryPopup(
    //       <OperatorDataEntry closePopup={closePopup} />
    //     );
    //     document.querySelector(".sparePartUsageHistory").style.pointerEvents = "none";
    //   },
    // },
  ];

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard(context?.section_data).then(
      (result) => setAllLineData(result?.lineData)
    );
  }, [context?.section_data]);

  console.log(allMachineDataBasedOnLine?.[selectedMachine]);

  return (
    <>
      <Container fluid className="pt-3 sparePartUsageHistory">
        <Row className="m-3 cell p-3">
          <Col>
            <div>Category:</div>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ border: "2px solid gray", borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedType"
              className="textField mt-1"
              fullWidth
              select // label="Select"
              autoComplete="off"
              // value={formik.values.selectedType}
              // onChange={formik.handleChange}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {typeDropdownList.map((option) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
            {/* <div>
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.selectedType && formik.errors.selectedType}
              </p>
            </div> */}
          </Col>

          <Col>
            <div>Month:</div>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ border: "2px solid gray", borderRadius: "5px" }}
              id="standard-select-currency"
              name="selectedPlant"
              className="textField"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {monthKeyArray?.map((option) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>

          <Col>
            <div>Line:</div>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ border: "2px solid gray", borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedLine"
              className="textField mt-1"
              fullWidth
              select // label="Select"
              autoComplete="off"
              // value={formik.values.selectedLine}
              onChange={(e) => {
                // formik.handleChange(e);
                setSelectedMachine();
                postLineToGetAllMachineData(e.target.value, currentYear).then(
                  (result) => setAllMachineDataBasedOnLine(result?.machineInfo)
                );
              }}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {allLineData?.map((option) => {
                return <option value={option?._id}>{option?.line_name}</option>;
              })}
            </select>
            {/* <div>
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.selectedLine && formik.errors.selectedLine}
              </p>
            </div> */}
          </Col>

          <Col>
            <div>Machine:</div>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ border: "2px solid gray", borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedMachine"
              className="textField mt-1"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={
                allMachineDataBasedOnLine?.[selectedMachine]?.machine_name || ""
              }
              onChange={(e) => {
                setSelectedMachine(e.target.value);
              }}
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {allMachineDataBasedOnLine?.map((option, index) => {
                return <option value={index}>{option?.machine_name}</option>;
              })}
            </select>
            {/* <div>
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.selectedMachine &&
                  formik.errors.selectedMachine}
              </p>
            </div> */}
          </Col>
        </Row>
        <Row className="m-3">
          <MaterialTable
            localization={
              {
                // toolbar: {
                //   exportCSVName: "Export some Excel format",
                //   exportPDFName: "Export as pdf!!"
                // }
              }
            }
            actions={actions}
            //   icons={tableIcons}
            columns={tableColumn}
            data={tableData}
            title="Spare Part Usage History"
            // tableRef={this.tableRef.current.onQueryChange()}

            editable={
              {
                // isDeleteHidden: (rowData) => rowData.user_type === 0,
                // onRowUpdate: (updatedRow, oldRow) =>
                //   new Promise((resolve, reject) => {
                //     const index = oldRow.tableData.id;
                //     const updatedRows = [...tableData];
                //     updatedRows[index] = updatedRow;
                //     //call the update user function and pass the user data
                //     updateUserInfo(updatedRow);
                //     setTimeout(() => {
                //       setTableData(updatedRows);
                //       resolve();
                //     }, 500);
                //     //refreshPage();
                //   }),
              }
            }
            options={{
              showTitle: true,
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
              tableLayout: {
                border: "2px solid black",
              },
              maxBodyHeight: "40vh",
              rowStyle: {
                // fontStyle:'bold'

                // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                // color:"rgba(255,255,255,0.8)",
                borderRadius: "5px",
                border: "2px solid black",
                WebkitBackdropFilter: "blur( 2px )",
                background: "rgba(255,255,255,0.1)",
                // backdropFilter: "blur(5px)",
              },
              cellStyle: {
                border: "2px solid black",
              },
              headerStyle: {
                border: "1px solid black",
              },
            }}
          />
        </Row>
      </Container>
    </>
  );
};

export default SparePartUsageHistory;
