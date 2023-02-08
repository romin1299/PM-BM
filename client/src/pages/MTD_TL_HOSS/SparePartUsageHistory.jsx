import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import TextField from "@material-ui/core/TextField";
import MaterialTable from "@material-table/core";
import YearDropDown from "../Dashboard/DashboardComponent/YearDropDown";
import DeleteIcon from "@mui/icons-material/Delete";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoadingAnimation from "../Reports/ReportComponents/LoadingAnimation";
import NotFound from "../Reports/ReportComponents/NotFound";

import RoutingContext from "../../context/routing/RoutingContext";
import { fetchFinancialYears } from "../../Integration/APIExports";
import Footer from "../../components/Footer/Footer";

import {
  postSectionToGetAllDataForMainDashboard,
  postLineToGetAllMachineData,
} from "../../Integration/APIExports";

import currentYear from "../Dashboard/DashboardComponent/currentYear";

const SparePartUsageHistory = () => {
  const context = useContext(RoutingContext);
  const typeDropdownList = ["PM", "BM", "Corrective", "Predictive", "Kaizen"];
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
  const [tableDataOfSpareDetails, setTableDataOfSpareDetails] = useState([]);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [allLineData, setAllLineData] = useState([]);
  const [allMachineDataBasedOnLine, setAllMachineDataBasedOnLine] = useState(
    []
  );

  const [selectedMonth, setSelectedMonth] = useState();
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedLine, setSelectedLine] = useState();
  const [selectedMachine, setSelectedMachine] = useState();

  const [stateForAnimationAndNotFound, setStateForAnimationAndNotFound] =
    useState(<LoadingAnimation />);

  // selectedMachine = index of machine from allMachineDataBasedOnLine dropdown
  // actual machine data = allMachineDataBasedOnLine?.[selectedMachine]

  // console.log(allMachineDataBasedOnLine);

  let tableColumn = [
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
      title: "Part No.",
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

  if (context?.user_type === "Section-Admin") {
    tableColumn.push({ title: "Action", editable: "false", align: "center" });
  } else if (
    context?.user_type !== "Operator" &&
    context?.tm_department !== "PRD"
  ) {
    tableColumn.push({ title: "Action", editable: "false", align: "center" });
  }

  const [financialYear, setFinancialYear] = useState();

  let current_year =
    new Date().getMonth() <= 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  useEffect(() => {
    // fetchFinancialYears()
    fetchFinancialYears().then((result) =>
      setFinancialYear(result.financialYears)
    );
  }, []);

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard(
      context?.section_data,
      selectedYear
    ).then((result) => {
      setAllLineData(result?.lineData);
      setTableDataOfSpareDetails(result?.allSpareDetailsWithCategories);
      setStateForAnimationAndNotFound(<NotFound />);
    });
  }, [context?.section_data, selectedYear]);

  // console.log(allMachineDataBasedOnLine?.[selectedMachine]);

  const financialYearWiseMonthKeyArray = [
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

  const notifyForDeletedCategoryPoint = (rowValue) => {
    toast.success(`Sr no. ${rowValue?.sr_no} is Deleted`, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

    postSectionToGetAllDataForMainDashboard(
      context?.section_data,
      selectedYear
    ).then((result) => {
      setAllLineData(result?.lineData);
      setTableDataOfSpareDetails(result?.allSpareDetailsWithCategories);
      setStateForAnimationAndNotFound(<NotFound />);
    });
  };

  const deleteCategoryPoint = async (rowValue) => {
    // console.log(rowValue);

    try {
      const res = await fetch("/deleteCategoryPoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rowValue,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        console.log("Data post");
        notifyForDeletedCategoryPoint(rowValue);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const styleForDeleteButton = {
    backgroundColor: "transparent",
    border: "none",
    textDecoration: "underline",
  };

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />
      <Container fluid className="pt-3 sparePartUsageHistory">
        <Row className="m-3 cell p-3 gy-2">
          <Col sm={12} md={6} lg={2}>
            <span><b>Year:</b></span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              id="standard-select-currency"
              name="selectedPlant"
              className="textField w-75"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              // fullWidth
              select // label="Select"
              autoComplete="off"
              variant="standard"
            >
              <option selected disabled value="">
                Please select
              </option>
              {financialYear?.map((option) => {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </Col>

          <Col sm={12} md={6} lg={2}>
            <span><b>Category:</b></span>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedType"
              className="textField w-50"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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

          <Col sm={12} md={6} lg={2}>
            <span><b>Month:</b></span>
            <select
              class="form-select form-select-sm"
              aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              id="standard-select-currency"
              name="selectedPlant"
              className="textField w-50"
    w-75           value={selectedMonth}
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

          <Col sm={12} md={6} lg={2}>
            <span><b>Line:</b></span>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedLine"
              className="textField w-50"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={selectedLine}
              onChange={(e) => {
                // formik.handleChange(e);
                setSelectedMachine();
                setSelectedLine(e.target.value);
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

          <Col sm={12} md={6} lg={2}>
            <span><b>Machine:</b></span>
            <select
              // class="form-select form-select-sm"
              // aria-label=".form-select-sm example"
              style={{ borderRadius: "5px" }}
              // id="standard-select-currency"
              id="outlined-number"
              name="selectedMachine"
              className="textField w-50"
              fullWidth
              select // label="Select"
              autoComplete="off"
              value={
                // allMachineDataBasedOnLine?.[selectedMachine]?.machine_name || ""
                selectedMachine
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
                return (
                  <option value={option?._id}>{option?.machine_name}</option>
                );
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

          <Col sm={12} md={6} lg={2}>
            <button
              class="btn-primary1 w-50 "
              onClick={() => {
                setSelectedMonth();
                setSelectedCategory();
                setSelectedLine();
                setSelectedMachine();
              }}
            >
              Reset
            </button>
          </Col>
        </Row>

        <Row className="m-3">
          {tableDataOfSpareDetails?.length > 0 ? (
            <div className="container-fluid" style={{ overflow: "auto" }}>
              <h4 style={{ padding: "1rem 0 0 0" }}>Spare Usage History</h4>

              <table className="ar-table PMSheetApprovalOfImplementationPhaseTableCol container-fluid">
                <thead className="mt-5">
                  <tr>
                    {tableColumn.map((tColumn) => (
                      <th
                        className={"ar-table-thead-header5 td-padding"}
                        // colSpan={
                        //   tColumn.header === "Preparation"
                        //     ? 3
                        //     : tColumn.header === "Planning"
                        //     ? 2
                        //     : 0
                        // }
                      >
                        {tColumn.title}
                        {/* {tColumn.header === "Machine Code" ||
                    tColumn.header === "Machine Name" ? (
                      <span
                        onClick={() => sortData(tColumn.sortKey)}
                        style={{ cursor: "pointer" }}
                      >
                        &nbsp;
                        <SortIcon />
                      </span>
                    ) : (
                      ""
                    )} */}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableDataOfSpareDetails?.map((index, i) =>
                    (selectedCategory
                      ? index?.type === selectedCategory
                      : true) &&
                    (selectedMonth
                      ? index?.schedule_month === selectedMonth
                      : true) &&
                    (selectedLine
                      ? index?.line_names._id === selectedLine
                      : true) &&
                    (selectedMachine
                      ? index?.machineId === selectedMachine
                      : true) ? (
                      <tr className="ar-table-thead-header4 tableRowColor">
                        {/* {console.log(index)} */}
                        <td className="td-padding">{index?.sr_no}</td>
                        <td className="td-padding">
                          {index?.completionDateOfInspection}
                        </td>

                        <td className="td-padding">
                          {index?.line_names?.line_name}
                        </td>
                        <td className="td-padding">{index?.machine_name}</td>
                        <td className="td-padding">{index?.machine_code}</td>

                        <td className="td-padding">{index?.type}</td>

                        <td className="td-padding">{index?.partName}</td>
                        <td className="td-padding">{index?.partNo}</td>
                        <td className="td-padding">
                          {index?.inspectionCompletionBy}
                        </td>

                        <td className="td-padding">{index?.cost}</td>
                        <td className="td-padding">
                          {index?.spareParts ? "Yes" : "No"}
                        </td>
                        <td className="td-padding">{index?.spareParts}</td>
                        {/* <td className="td-padding">{index?.schedule_month}</td>  */}

                        {context?.user_type === "Section-Admin" ? (
                          index?.type !== "PM" ? (
                            <button
                              style={styleForDeleteButton}
                              onClick={() => deleteCategoryPoint(index)}
                            >
                              <td className="td-padding">
                                <DeleteIcon />
                              </td>
                            </button>
                          ) : (
                            <td className="td-padding"></td>
                          )
                        ) : context?.user_type !== "Operator" &&
                          context?.tm_department !== "PRD" ? (
                          index?.type !== "PM" ? (
                            <td className="td-padding">
                              <button
                                style={styleForDeleteButton}
                                onClick={() => deleteCategoryPoint(index)}
                              >
                                <DeleteIcon />
                              </button>
                            </td>
                          ) : (
                            <td className="td-padding"></td>
                          )
                        ) : (
                          ""
                        )}
                      </tr>
                    ) : (
                      ""
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="container-fluid d-flex justify-content-center align-items-center"
              style={{ height: "100vh" }}
            >
              {stateForAnimationAndNotFound}
              {/* <LoadingAnimation /> */}
            </div>
          )}
        </Row>
      </Container>
      <Footer/>
    </>
  );
};

export default SparePartUsageHistory;
