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
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const ChecksheetCreationDashboard = ({}) => {
  const [tableData, setTableData] = useState([]);
  const [lineArray, setLineArray] = useState([]);
  const [revisionContentTableData, setRevisionContentTableData] = useState([]);

  const [yearOfCheckSheet, setYearOfCheckSheet] = useState();

  const context = useContext(RoutingContext);

  const [machineData, setMachineData] = useState([]);

  const [line, setLine] = useState();
  const [machineArray, setMachineArray] = useState();
  const [selectedMachine, setselectedMachine] = useState();

  const [copiedPreparationData, setCopiedPreparationData] = useState([]);

  const [selectedRow, setSelectedRow] = useState([]);
  const [refKey, setRefKey] = useState(0);
  const [refKey2, setRefKey2] = useState(0);
  // const [countOfRevisionContent, setCountOfRevisionContent] = useState(0);

  const navigate = useNavigate();

  const selectedMachineData = useLocation();
  // console.log(selectedMachineData.state);
  // console.log(tableData);

  const getLineArrayFromState = () => {
    let line_name_array = [];
    selectedMachineData.state.lineData
      ? selectedMachineData.state.lineData.map((name) => {
          line_name_array.push(`${name.line_id}-${name.line_name}`);
        })
      : (line_name_array = "");
    setLineArray(line_name_array);
  };
  //frequency
  const cycle = [
    {
      label: "1/1M",
      value: "1/1M",
    },
    {
      label: "1/2M",
      value: "1/2M",
    },
    {
      label: "1/3M",
      value: "1/3M",
    },
    {
      label: "1/4M",
      value: "1/4M",
    },
    {
      label: "1/6M",
      value: "1/6M",
    },
    {
      label: "1/Y",
      value: "1/Y",
    },
  ];

  //category
  const category = [
    {
      label: "B:Breakdown",
      value: "B",
    },
    {
      label: "S:Safety",
      value: "S",
    },
    {
      label: "Q:Quality",
      value: "Q",
    },
    {
      label: "P:Pollution",
      value: "P",
    },
  ];

  const actions = [
    {
      // icon: () => <button className="addbutton">Add</button>,
      icon: () =>
        window.innerWidth > 1024 ? (
          <button className="btn">Add</button>
        ) : (
          <AddBoxIcon />
        ),

      tooltip: "Add User",
      isFreeAction: true,
      onClick: (event, rowData) => {
        document.getElementById("main_div_reg1").style.display = "block";
        document.getElementById("main_div_reg1").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
    },

    {
      icon: () => <ModeEditIcon />,
      // tooltip: <h1>I am a tooltip</h1>,
      onClick: (event, selectedRow) => {
        setSelectedRow(selectedRow);
        // console.log(employeePassword)
        document.getElementById("main_div_reg2").style.display = "block";
        document.getElementById("main_div_reg2").style.pointerEvents = "auto";
        document.querySelector(".App").style.pointerEvents = "none";
      },
      disabled: false, // Set disabled to false by default for all actions
      position: "row",
    },
  ];

  const columns = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
      align: "center",
    },
    {
      title: "C",
      field: "category",
      filtering: false,
      align: "center",
      editComponent: ({ value, onChange }) => (
        <select
          //   class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="category"
          fullWidth
          select // label="Select"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {category.map((option) => {
            return <option value={option.value}>{option.label}</option>;
          })}
        </select>
      ),
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
    // {
    //   title: "Inspection Item Child",
    //   // editable: false,
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
      editComponent: ({ value, onChange }) => (
        <select
          //   class="form-select form-select-sm"
          aria-label=".form-select-sm example"
          id="standard-select-currency"
          name="cycle"
          fullWidth
          select // label="Select"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          variant="standard"
        >
          <option selected disabled value="">
            Please select
          </option>
          {cycle.map((option) => {
            return <option value={option.value}>{option.label}</option>;
          })}
        </select>
      ),
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

  const revisedColumns = [
    {
      title: "SR. NO.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      width: "5%",
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

  const fetchSelectedMachineChecksheetTableData = async () => {
    try {
      const res = await fetch("/fetchSelectedMachineChecksheetTableData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: selectedMachineData.state.selectedRow.machine_code,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        setTableData(data.getSelectedMachineChecksheet);
        setMachineData(data.machineData);
        setYearOfCheckSheet(data.yearOfCheckSheet);
        setRevisionContentTableData(
          data?.machineData[0]?.checkSheet_data?.revisionContentData
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addNewChecksheetData = async (selectedRow) => {
    try {
      const res = await fetch("/addNewChecksheetData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedRow.category,
          inspection_parent_name: selectedRow.inspection_parent_name,
          // inspection_child_name: selectedRow.inspection_child_name ? selectedRow.inspection_child_name :"",
          inspection_point: selectedRow.inspection_point,
          judgement_criteria: selectedRow.judgement_criteria,
          action: selectedRow.action,
          cycle: selectedRow.cycle,
          line,
          personInCharge: selectedRow.personInCharge,
          PM_time: selectedRow.PM_time,
          machineId: selectedMachineData.state.selectedRow.machine_code,
          isAdded:
            machineData[0]?.checkSheet_data?.checksheet_status ===
            "Implementation"
              ? true
              : false,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("checksheet data added Successful");
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

  const notifyForUpdateCycle = () => {
    toast.info("Please change start month of cycle in Planning Phase !", {
      position: "top-center",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  //update the data of the user using user id
  const updateSelectedMachineChecksheetTableRowData = async (
    updatedRow,
    oldRow
  ) => {
    try {
      const res = await fetch("/updateSelectedMachineChecksheetTableRowData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowData: updatedRow,
          oldRow,
          machineId: selectedMachineData.state.selectedRow.machine_code,
          yearOfCheckSheet,
          isEdited:
            machineData[0]?.checkSheet_data?.checksheet_status ===
            "Implementation"
              ? true
              : false,
        }),
      });

      const data = await res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else if (res.status === 409) {
        console.log("user already exists");
        // refreshPage();
      } else {
        console.log("Data Updated Successful");
        if (data?.flagForCycleChange === true) {
          notifyForUpdateCycle();
        }
        // refreshPage();
        // const dateAndTime = timeStamp();
        // const addMessage = `${updatedRow.user_name} user updated`;
        // logData(dateAndTime, addMessage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //delete the data of the user using user id
  const deleteSelectedMachineChecksheetTableRowData = async (selectedRow) => {
    // console.log(tm_no);
    try {
      const res = await fetch("/deleteSelectedMachineChecksheetTableRowData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowData: selectedRow,
          machineId: selectedMachineData.state.selectedRow.machine_code,
          yearOfCheckSheet,
          isDeleted:
            machineData[0]?.checkSheet_data?.checksheet_status ===
            "Implementation"
              ? true
              : false,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid");
      } else {
        console.log("Checksheet Row Deleted Successful");
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

  const postLineToGetMachineList = async (selectedLine, selectedRequest) => {
    setMachineArray(undefined);
    try {
      const res = await fetch("/postLineToGetMachineList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
          selectedRequest,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);

        setMachineArray(data.machineInfoWithChecksheet);
      }
    } catch (error) {
      console.log(error);
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

  const formik = useFormik({
    initialValues: {
      lineName: "",
      machineName: "",
      request: "",
    },
    // validationSchema: validationSchema1,
    onSubmit: async (values) => {
      // console.log(values.request);
      const res = await fetch("/postMachineToGetChacksheetPreparationData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedMachine,
          copyPreparationDataToSelectedMachine:
            selectedMachineData.state.selectedRow.machine_code,
          request: values.request,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("Send machine data sucessfully...");
        setCopiedPreparationData(
          data.newUpdatedPreparationDataOfSelectedmachine
        );
        setRefKey((refKey) => refKey + 1);
        // window.location.reload();
        // navigate("/checkSheetDashboard");
        // if (values.email) {
        //   newPasswordLink(values.email);
        // }
      }
    },
  });

  useEffect(() => {
    fetchSelectedMachineChecksheetTableData();
  }, [refKey]);

  useEffect(() => {
    getLineArrayFromState();
  }, []);

  // useEffect(() => {
  //   if (line) {
  //     postLineToGetMachineList(line);
  //   }
  // }, [line]);
  //for year not started yet
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
    if (
      machineData[0]?.checkSheet_data?.checksheet_status === "Implementation"
    ) {
      if (machineData[0]?.checkSheet_data?.flagForRevisionContent === true) {
        if (
          machineData[0]?.checkSheet_data?.flagForRevisionContent === true &&
          machineData[0]?.checkSheet_data
            ?.flagForNewRevisionContentDataAdded === true
        ) {
          navigate("/checkSheetForm", {
            state: {
              selectedRowForViewForm: machineData[0],
              displyingApprovalFormate:
                machineData[0]?.checkSheet_data
                  ?.flagForNewRevisionContentDataAdded,
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
        navigate("/checkSheetForm", {
          state: {
            selectedRowForViewForm: machineData[0],
            displyingApprovalFormate:
              machineData[0]?.checkSheet_data
                ?.flagForNewRevisionContentDataAdded,
          },
        });
      }
    } else {
      navigate("/checkSheetForm", {
        state: {
          selectedRowForViewForm: machineData[0],
        },
      });
    }
  };

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
            onClick={() =>
              context.user_type === "Section-Admin"
                ? navigate("/approvalDashboard")
                : navigate("/checkSheetDashboard")
            }
            style={{
              border: "none",
              background: "white",
              borderRadius: 5,
            }}
            className="mb-2"
          >
            <ArrowBackIcon />
          </button>
          {tableData === undefined ? (
            <div class="row g-3">
              <div class="col-lg-2 col-md-12 col-sm-12">
                <div class="p-3 border bg-white rounded">
                  <span style={{ fontWeight: "bold" }}>
                    Line Name:{" "}
                    {selectedMachineData.state.selectedRow.line_names.line_name}
                  </span>
                </div>
              </div>
              <div class="col-lg-3 col-md-12 col-sm-12">
                <div class="p-3 border bg-white rounded">
                  <span style={{ fontWeight: "bold" }}>
                    Machine Name:{" "}
                    {selectedMachineData.state.selectedRow.machine_name}
                  </span>
                </div>
              </div>
              <div class="col-lg-2 col-md-12 col-sm-12">
                <div class="p-3 border bg-white rounded">
                  <span style={{ fontWeight: "bold" }}>
                    Machine No:{" "}
                    {selectedMachineData.state.selectedRow.machine_code}
                  </span>
                </div>
              </div>

              <div class="col-lg-5 col-md-12 col-sm-12">
                <div class="p-3 border bg-white rounded">
                  <div>
                    <span style={{ fontWeight: "bold" }}>
                      Do you want to copy checksheet preparation data ?
                    </span>
                    <br />
                    <form onSubmit={formik.handleSubmit}>
                      {line ? (
                        <div className="row">
                          {" "}
                          <span>
                            <input
                              type="radio"
                              name="request"
                              id="outlined-number"
                              value="already_created"
                              onChange={(e) => {
                                formik.handleChange(e);
                                postLineToGetMachineList(line, e.target.value);
                              }}
                            />
                            <span
                              style={{
                                paddingLeft: "0.5rem",
                                fontWeight: "550",
                                color: "black",
                              }}
                            >
                              Already Created &nbsp;
                            </span>
                            <input
                              type="radio"
                              name="request"
                              id="outlined-number"
                              value="deleted"
                              onChange={(e) => {
                                formik.handleChange(e);
                                postLineToGetMachineList(line, e.target.value);
                              }}
                            />
                            <span
                              style={{
                                paddingLeft: "0.5rem",
                                fontWeight: "550",
                                color: "black",
                              }}
                            >
                              Deleted
                            </span>
                            <p
                              style={{
                                color: "#F44336",
                                fontWeight: "normal",
                                fontSize: "0.80rem",
                                float: "right",
                                marginRight: "12rem",
                                // paddingTop: "0.5rem",
                              }}
                            >
                              {formik.touched.request && formik.errors.request}
                            </p>
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                      <Row>
                        <Col sm>
                          <span>Line List :</span>
                          <div style={{ marginTop: "0.5rem" }}>
                            <select
                              // class="form-select form-select-sm"
                              // aria-label=".form-select-sm example"
                              // style={{ width: "100%" }}
                              id="standard-select-currency"
                              name="lineName"
                              // className="textField"
                              // fullWidth
                              select // label="Select"
                              autoComplete="off"
                              value={line === undefined ? "" : line}
                              onChange={(e) => {
                                setLine(e.target.value);
                              }}
                              variant="standard"
                            >
                              <option selected disabled value="">
                                Please select
                              </option>
                              {lineArray.map((index) => {
                                return <option value={index}>{index}</option>;
                              })}
                            </select>
                          </div>
                        </Col>
                        <Col sm>
                          {formik.values.request !== "" ? (
                            formik.values.request === "already_created" ? (
                              <div>
                                <span>Machine List :</span>
                                <div style={{ marginTop: "0.5rem" }}>
                                  <select
                                    // class="form-select form-select-sm"
                                    // aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="machineName"
                                    // className="textField"
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    value={
                                      selectedMachine === undefined
                                        ? ""
                                        : selectedMachine
                                    }
                                    onChange={(e) => {
                                      setselectedMachine(e.target.value);
                                    }}
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>

                                    {machineArray != undefined
                                      ? machineArray.map((option) => {
                                          return (
                                            <option value={option.machine_code}>
                                              {option.machine_code}-
                                              {option.machine_name}
                                            </option>
                                          );
                                        })
                                      : ""}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span>Machine List of deleted:</span>
                                <div style={{ marginTop: "0.5rem" }}>
                                  <select
                                    // class="form-select form-select-sm"
                                    // aria-label=".form-select-sm example"
                                    // style={{ width: "100%" }}
                                    id="standard-select-currency"
                                    name="machineName"
                                    // className="textField"
                                    // fullWidth
                                    select // label="Select"
                                    autoComplete="off"
                                    value={
                                      selectedMachine === undefined
                                        ? ""
                                        : selectedMachine
                                    }
                                    onChange={(e) => {
                                      setselectedMachine(e.target.value);
                                    }}
                                    variant="standard"
                                  >
                                    <option selected disabled value="">
                                      Please select
                                    </option>

                                    {machineArray != undefined
                                      ? machineArray.map((option) => {
                                          return (
                                            <option value={option.machine_code}>
                                              {option.machine_code}-
                                              {option.machine_name}
                                            </option>
                                          );
                                        })
                                      : ""}
                                  </select>
                                </div>
                              </div>
                            )
                          ) : (
                            ""
                          )}
                        </Col>
                        <Col sm className="mt-2">
                          {" "}
                          <button className="btn-reset" type="submit">
                            Submit
                          </button>
                        </Col>
                      </Row>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          <h4 style={{ padding: "1rem 0 0 1rem" }}>Checksheet Data</h4>
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
              icons={tableIcons}
              columns={columns}
              data={tableData?.sort(compareCycle)}
              // title="User Management"
              // tableRef={this.tableRef.current.onQueryChange()}

              editable={{
                isDeleteHidden: (rowData) => rowData?.isDeleted,
                isEditHidden: (rowData) => rowData?.isDeleted,
                onRowAdd: (newRow) =>
                  new Promise((resolve, reject) => {
                    // const updatedRows = [tableData, { user_id: "", ...newRow }];
                    // console.log(newRow);
                    // console.log("Checking ");
                    addNewChecksheetData(newRow);

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
                    deleteSelectedMachineChecksheetTableRowData(selectedRow);

                    setTimeout(() => {
                      setRefKey((refKey) => refKey + 1);
                      // setTableData(updatedRows);
                      resolve();
                    }, 500);
                  }),

                onRowUpdate: (updatedRow, oldRow) =>
                  new Promise((resolve, reject) => {
                    //call the update user function and pass the user data
                    updateSelectedMachineChecksheetTableRowData(
                      updatedRow,
                      oldRow
                    );
                    setTimeout(() => {
                      setRefKey((refKey) => refKey + 1);
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
                  // textDecoration: rowData?.isDeleted ? "line-through solid red 15%" : "none"
                }),
              }}
            />
            <div className="col-4 mt-2" style={{ float: "right" }}>
              <button
                className="btn-primary"
                onClick={showChecksheet}
                style={{ float: "right" }}
              >
                View & Send for Approval
              </button>
            </div>
          </div>
        </div>
        {machineData[0]?.checkSheet_data?.checksheet_status ===
        "Implementation" ? (
          <div className="row m-3 p-3 border bg-white rounded">
            <div>
              <MaterialTable
                style={{ boxShadow: "none"}}
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

                    // boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.1 )",
                    // color:"rgba(255,255,255,0.8)",
                    borderRadius: "5px",
                    border: "1px solid black",
                    // WebkitBackdropFilter: "blur( 2px )",
                    background: "rgba(255,255,255,0.1)",
                    // backdropFilter: "blur(5px)",
                  },
                  cellStyle: {
                    border: "1px solid black",
                  },
                  headerStyle: {
                    border: "1px solid black",
                    fontWeight: "bold",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default ChecksheetCreationDashboard;
