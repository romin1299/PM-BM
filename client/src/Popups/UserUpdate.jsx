import React, { useContext, useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import RoutingContext from "../context/routing/RoutingContext";
import ContextAPI from "../context/ContextAPI/ContextAPI";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Checkbox,
  Select,
  ListItemText,
  MenuItem,
  OutlinedInput,
  InputLabel,
  FormControl,
} from "@material-ui/core";

const UserUpdate = ({ selectedRow }) => {
  const context = useContext(RoutingContext);
  const close = async () => {
    setGrade("");
    // setUsertype("");
    formik.resetForm({
      values: "",
    });

    document.getElementById("main_div_reg2").style.display = "none";
    document.querySelector(".App").style.pointerEvents = "auto";
  };
  const plantDropdown = useContext(ContextAPI);

  //for selected list of value
  const [grade, setGrade] = useState();

  const [plants, setplants] = useState();
  const [sections, setsections] = useState();
  const [subsections, setsubsections] = useState([]);
  const [cells, setcells] = useState([]);
  const [usertype, setUsertype] = useState();

  //for dropdown list
  const [sectionList, setSectionList] = useState([]);
  const [subSectionList, setSubSectionList] = useState([]);
  const [cellList, setCellList] = useState([]);

  const refreshPage = () => {
    window.location.reload();
  };
  const tmGrade = [
    {
      label: "HOS",
      value: "HOS",
    },
    {
      label: "HOD",
      value: "HOD",
    },
  ];

  // this function only run when the operator user added into the table
  const newPasswordLink = async (email) => {
    const res = await fetch("/resetPass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
      }),
    });

    const data = res.json();

    if (res.status === 400 || res.status === 422 || !data) {
      window.alert("Invalid email address !!!!");
    } else {
      //window.alert("Password reset link sent to your email account");
      console.log("Link send");
    }
  };

  const formik = useFormik({
    initialValues: {
      tm_name: "",
      tm_no: "",
      user_type: "",
      email: "",
      // operator_password: "",
      joining_date: "",
      plant_data: "",
      section_data: "",
      subSection_data: "",
      cell_data: "",
      contact_no: "",
      address: "",
    },
    // validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/updateAssignUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_name: values.tm_name ? values.tm_name : selectedRow.tm_name,
          tm_no: selectedRow.tm_no,
          user_type: usertype ? usertype : selectedRow.user_type,
          tm_grade: values.tm_grade ? values.tm_grade : selectedRow.tm_grade,
          tm_department: values.tm_department
            ? values.tm_department
            : values.user_type === "TL/HOSS"
            ? // ||
              //   selectedRow.user_type === "TL/HOSS"
              "PRD"
            : values.user_type === "Operator"
            ? // ||
              //   selectedRow.user_type === "TL/HOSS"
              "MTD"
            : selectedRow.tm_department,
          plant_data: values.plant_data
            ? values.plant_data
            : selectedRow.plant_data,
          section_data: values.section_data
            ? values.section_data
            : selectedRow.section_data,
          subSection_data:
            subsections.length > 0 ? subsections : selectedRow.subSection_data,
          cell_data: cells.length > 0 ? cells : selectedRow.cell_data,
          joining_date: values.joining_date
            ? values.joining_date
            : selectedRow.joining_date,
          email: values.email ? values.email : selectedRow.email,
          // operator_password: values.operator_password
          //   ? values.operator_password
          //   : selectedRow.operator_password,
          contact_no: values.contact_no
            ? values.contact_no
            : selectedRow.contact_no,
          address: values.address ? values.address : selectedRow.address,
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("User updated sucessfully...");
        refreshPage();
        // newPasswordLink(values.email);
      }
    },
  });

  //for selection of plant and based on plant section selection
  const postPlantToGetSectionListOfUserAssign = async (selectedPlant) => {
    try {
      const res = await fetch("/postPlantToGetSectionListOfUserAssign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plants: selectedPlant,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        setSectionList(data.sectionArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //for selection of section and based on section sub-section selection
  const postSectionToGetSubSectionListOfUserAssign = async (
    selectedSection
  ) => {
    try {
      const res = await fetch("/postSectionToGetSubSectionList", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: selectedSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        setSubSectionList(data.subSectionArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //for selection of sub-section and based on sub-section cell selection
  const postSubSectionToGetCellListOfUserAssign = async (
    selectedSubSection
  ) => {
    try {
      const res = await fetch("/postSubSectionToGetCellListOfUserAssign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subSection: selectedSubSection,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // window.alert(data.abcd);
        // console.log("Data post", data);
        setCellList(data.cellArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSubSectionToGetCellListOfUserAssign(subsections);
  }, [subsections]);

  useEffect(() => {
    if (
      context.user_type === "Section-Admin" ||
      context.user_type === "TL/HOSS"
    ) {
      // postPlantToGetSectionListOfUserAssign(context.plant_data);
      postSectionToGetSubSectionListOfUserAssign(context.section_data);
    }
    if (context.user_type === "Plant-Admin") {
      postPlantToGetSectionListOfUserAssign(context.plant_data);
    }
  }, []);

  const ITEM_HEIGHT = 30;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        // width: 250,
      },
    },
  };

  const userType = [
    {
      lable: "TL/HOSS",
      value: "TL/HOSS",
    },
    {
      lable: "Operator",
      value: "Operator",
    },
  ];

  // console.log(teamGroup);
  return (
    <>
      <div id="main_div_reg2">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />
        <div>
          <form onSubmit={formik.handleSubmit}>
            <div className="pwd-container">
              <span>TM Name: </span>
              <TextField
                id="outlined-number"
                name="tm_name"
                className="textField"
                value={formik.values.tm_name}
                placeholder={selectedRow.tm_name}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={formik.touched.tm_name && Boolean(formik.errors.tm_name)}
                helperText={formik.touched.tm_name && formik.errors.tm_name}
              />
            </div>
            <div className="pwd-container">
              <span>TM Number: </span>
              <TextField
                id="outlined-number"
                name="tm_no"
                className="textField"
                autoComplete="off"
                value={selectedRow.tm_no}
                // onChange={formik.handleChange}
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                // inputProps={{
                //   maxLength: 5,
                // }}
                error={formik.touched.tm_no && Boolean(formik.errors.tm_no)}
                helperText={formik.touched.tm_no && formik.errors.tm_no}
              />
            </div>

            {context.user_type === "Section-Admin" ? (
              // <div className="pwd-container">
              //   <span>User Type:</span>
              //   <div style={{ width: "100%", marginTop: "0.5rem" }}>
              //     <TextField
              //       id="outlined-number"
              //       name="user_type"
              //       className="textField"
              //       autoComplete="off"
              //       value={selectedRow.user_type}
              //       fullWidth
              //       // onChange={formik.handleChange}
              //       // label="Number"
              //       type="text"
              //     />
              //   </div>
              // </div>

              <div>
                <div className="pwd-container">
                  <span>User Type:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <TextField
                      id="outlined-number"
                      name="user_type"
                      className="textField"
                      autoComplete="off"
                      value={selectedRow.user_type}
                      fullWidth
                      // onChange={formik.handleChange}
                      // label="Number"
                      type="text"
                    />
                  </div>
                </div>
                <div className="pwd-container">
                  <span>TM Department:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <TextField
                      id="outlined-number"
                      className="textField"
                      autoComplete="off"
                      fullWidth
                      value={selectedRow.tm_department}
                      // onChange={formik.handleChange}
                      // label="Number"
                      type="text"
                      name="tm_department"
                    />
                  </div>
                </div>
              </div>
            ) : context.user_type === "TL/HOSS" &&
              context.tm_department === "MTD" ? (
              <div>
                <div className="pwd-container">
                  <span>User Type:</span>

                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                      }}
                    >
                      {`Previous User Type: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.user_type} `}</span>
                      {`Previous Department: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.tm_department} `}</span>
                    </p>
                    <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="user_type"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.user_type}
                      onChange={(e) => {
                        setUsertype(e.target.value);
                        formik.handleChange(e);
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {userType.map((option) => {
                        return (
                          <option value={option.label}>{option.value}</option>
                        );
                      })}
                    </select>
                    <div>
                      <p
                        style={{
                          color: "#F44336",
                          fontWeight: "normal",
                          fontSize: "0.80rem",
                          float: "left",
                          paddingTop: "0.5rem",
                        }}
                      >
                        {formik.touched.user_type && formik.errors.user_type}
                      </p>
                    </div>
                  </div>
                </div>

                {usertype === "TL/HOSS" ? (
                  <div className="pwd-container">
                    <span>TM Department:</span>
                    <div style={{ width: "100%", marginTop: "0.5rem" }}>
                      <TextField
                        id="outlined-number"
                        className="textField"
                        autoComplete="off"
                        fullWidth
                        // onChange={formik.handleChange}
                        // label="Number"
                        type="text"
                        name="tm_department"
                        value="PRD"
                      />
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            ) : (
              // <div className="pwd-container">
              //   <span>User Type:</span>
              //   <div style={{ width: "100%", marginTop: "0.5rem" }}>
              //     <p
              //       style={{
              //         textAlign: "left",
              //         color: "black",
              //         fontSize: "13px",
              //         fontWeight: "normal",
              //       }}
              //     >
              //       {`Previous User-Type: `}
              //       <span
              //         style={{ fontWeight: "bold" }}
              //       >{`${selectedRow.user_type} `}</span>
              //     </p>
              //     <select
              //       class="form-select form-select-sm"
              //       aria-label=".form-select-sm example"
              //       style={{ width: "100%" }}
              //       id="standard-select-currency"
              //       name="user_type"
              //       className="textField"
              //       fullWidth
              //       select // label="Select"
              //       autoComplete="off"
              //       value={formik.values.user_type}
              //       onChange={(e) => {
              //         setUsertype(e.target.value);
              //         formik.handleChange(e);
              //       }}
              //       variant="standard"
              //     >
              //       <option selected disabled value="">
              //         Please select
              //       </option>
              //       {userType.map((option) => {
              //         return (
              //           <option value={option.label}>{option.value}</option>
              //         );
              //       })}
              //     </select>
              //     <div>
              //       {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
              //     {formik.touched.emp_group && formik.errors.emp_group}
              //   </p> */}
              //     </div>
              //   </div>
              // </div>
              <div>
                <div className="pwd-container">
                  <span>User Type:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <TextField
                      id="outlined-number"
                      name="user_type"
                      className="textField"
                      autoComplete="off"
                      value={
                        selectedRow.user_type === "Plant-Admin"
                          ? "Plant-Admin"
                          : "Section-Admin"
                      }
                      fullWidth
                      // onChange={formik.handleChange}
                      // label="Number"
                      type="text"
                    />
                  </div>
                </div>
                <div className="pwd-container">
                  <span>TM Grade:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                      }}
                    >
                      {`Previous Grade: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.tm_grade} `}</span>
                      {`Previous Department: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.tm_department} `}</span>
                    </p>
                    <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="tm_grade"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.tm_grade}
                      onChange={(e) => {
                        setGrade(e.target.value);
                        formik.handleChange(e);
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {tmGrade.map((option) => {
                        return (
                          <option value={option.label}>{option.value}</option>
                        );
                      })}
                    </select>
                    <div>
                      {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
                  {formik.touched.emp_group && formik.errors.emp_group} 
                </p> */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {grade === "HOS" || grade === "HOD" ? (
              // || selectedRow.user_type === "TL/HOSS"
              <div className="pwd-container">
                <span>TM Department:</span>
                <div style={{ width: "100%", marginTop: "0.5rem" }}>
                  <p
                    style={{
                      textAlign: "left",
                      color: "black",
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                  >
                    {`Previous Department: `}
                    <span
                      style={{ fontWeight: "bold" }}
                    >{`${selectedRow.tm_department} `}</span>
                  </p>
                  <div>
                    <input
                      type="radio"
                      name="tm_department"
                      style={{ float: "left" }}
                      id="outlined-number"
                      value="PRD"
                      onChange={formik.handleChange}
                    />
                    <span
                      style={{
                        margin: "0 0 0.5rem 0.5rem",
                        fontWeight: "550",
                        color: "black",
                        float: "left",
                      }}
                    >
                      PRD
                    </span>

                    <input
                      type="radio"
                      name="tm_department"
                      style={{ float: "left" }}
                      id="outlined-number"
                      value="MTD"
                      onChange={formik.handleChange}
                    />
                    <span
                      style={{
                        margin: "0 0 0.5rem 0.5rem",
                        fontWeight: "550",
                        color: "black",
                        float: "left",
                      }}
                    >
                      MTD
                    </span>
                  </div>
                </div>
              </div>
            ) : undefined}

            {context.user_type === "Plant-Admin" ? (
              <div>
                <div className="pwd-container">
                  <span>Plant: </span>
                  <TextField
                    id="outlined-number"
                    name="tm_name"
                    className="textField"
                    value={context.plant_data}
                    // onChange={formik.handleChange}

                    autoComplete="off"
                    // label="Number"
                    type="text"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    // error={formik.touched.tm_name && Boolean(formik.errors.tm_name)}
                    // helperText={formik.touched.tm_name && formik.errors.tm_name}
                  />
                </div>
                <div className="pwd-container">
                  <span>Section:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                        margin: "0px !important",
                      }}
                    >
                      {`Previous Section: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.section_data} `}</span>
                    </p>
                    <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="section_data"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={
                        formik.values.section_data === undefined
                          ? ""
                          : formik.values.section_data
                      }
                      onChange={(e) => {
                        formik.handleChange(e);
                        postSectionToGetSubSectionListOfUserAssign(
                          e.target.value
                        );
                        formik.values.subSection_data = undefined;
                        formik.values.cell_data = undefined;
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {sectionList.map((option) => {
                        return <option value={option}>{option}</option>;
                      })}
                    </select>
                    <div>
                      {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
                    {formik.touched.emp_group && formik.errors.emp_group}
                  </p> */}
                    </div>
                  </div>
                </div>
              </div>
            ) : context.user_type === "Section-Admin" ||
              context.user_type === "TL/HOSS" ? (
              <div>
                <div className="pwd-container">
                  <span>Plant: </span>
                  <TextField
                    id="outlined-number"
                    name="tm_name"
                    className="textField"
                    value={context.plant_data}
                    // onChange={formik.handleChange}

                    autoComplete="off"
                    // label="Number"
                    type="text"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    // error={formik.touched.tm_name && Boolean(formik.errors.tm_name)}
                    // helperText={formik.touched.tm_name && formik.errors.tm_name}
                  />
                </div>
                <div className="pwd-container">
                  <span>Section: </span>
                  <TextField
                    id="outlined-number"
                    name="tm_name"
                    className="textField"
                    value={context.section_data}
                    // onChange={formik.handleChange}

                    autoComplete="off"
                    // label="Number"
                    type="text"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    // error={formik.touched.tm_name && Boolean(formik.errors.tm_name)}
                    // helperText={formik.touched.tm_name && formik.errors.tm_name}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="pwd-container">
                  <span>Plant:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                      }}
                    >
                      {`Previous Plant: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.plant_data} `}</span>
                    </p>
                    <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="plant_data"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={
                        formik.values.plant_data === undefined
                          ? ""
                          : formik.values.plant_data
                      }
                      onChange={(e) => {
                        // setplants(e.target.value);
                        formik.handleChange(e);
                        postPlantToGetSectionListOfUserAssign(e.target.value);
                        formik.values.section_data = undefined;
                        formik.values.subSection_data = undefined;
                        formik.values.cell_data = undefined;
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {plantDropdown.plantList.plantArray.map((option) => {
                        return <option value={option}>{option}</option>;
                      })}
                    </select>
                    <div>
                      {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
                  {formik.touched.emp_group && formik.errors.emp_group} 
                </p> */}
                    </div>
                  </div>
                </div>
                <div className="pwd-container">
                  <span>Section:</span>
                  <div style={{ width: "100%", marginTop: "0.5rem" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                        margin: "0px !important",
                      }}
                    >
                      {`Previous Section: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.section_data} `}</span>
                    </p>
                    <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="section_data"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={
                        formik.values.section_data === undefined
                          ? ""
                          : formik.values.section_data
                      }
                      onChange={(e) => {
                        formik.handleChange(e);
                        postSectionToGetSubSectionListOfUserAssign(
                          e.target.value
                        );
                        formik.values.subSection_data = undefined;
                        formik.values.cell_data = undefined;
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {sectionList.map((option) => {
                        return <option value={option}>{option}</option>;
                      })}
                    </select>
                    <div>
                      {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
                  {formik.touched.emp_group && formik.errors.emp_group}
                </p> */}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedRow.tm_grade === "HOD" ? (
              grade === "HOD" ? undefined : grade === "HOS" ? (
                <div className="pwd-container">
                  <span>Sub Section:</span>
                  <div style={{ width: "100%" }}>
                    <p
                      style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "13px",
                        fontWeight: "normal",
                      }}
                    >
                      {`Previous Sub-section: `}
                      <span
                        style={{ fontWeight: "bold" }}
                      >{`${selectedRow.subSection_data} `}</span>
                    </p>
                    {/* <select
                      class="form-select form-select-sm"
                      aria-label=".form-select-sm example"
                      style={{ width: "100%" }}
                      id="standard-select-currency"
                      name="subSection_data"
                      className="textField"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={
                        formik.values.subSection_data === undefined
                          ? ""
                          : formik.values.subSection_data
                      }
                      onChange={(e) => {
                        formik.handleChange(e);
                        postSubSectionToGetCellListOfUserAssign(e.target.value);
                        formik.values.cell_data = undefined;
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {subSectionList.map((option) => {
                        return <option value={option}>{option}</option>;
                      })}
                    </select> */}
                    <FormControl fullWidth>
                      <InputLabel id="demo-multiple-checkbox-label">
                        Please select
                      </InputLabel>
                      <Select
                        labelId="demo-multiple-checkbox-label"
                        id="demo-multiple-checkbox"
                        multiple
                        value={subsections}
                        fullWidth
                        // onChange={handleChange}
                        onChange={(e) => {
                          formik.handleChange(e);
                          setsubsections(e.target.value);
                          // postSubSectionToGetCellListOfUserAssign(e.target.value);
                          formik.values.cell_data = undefined;
                        }}
                        // input={<OutlinedInput label="Tag" />}
                        renderValue={(selected) => selected.join(", ")}
                        MenuProps={MenuProps}
                      >
                        {subSectionList.map((name) => (
                          <MenuItem key={name} value={name}>
                            <Checkbox
                              checked={subsections.indexOf(name) > -1}
                            />
                            <ListItemText primary={name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <div>
                      {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
                {formik.touched.emp_group && formik.errors.emp_group}
              </p> */}
                    </div>
                  </div>
                </div>
              ) : undefined
            ) : grade === "HOD" ? undefined : (
              <div className="pwd-container">
                <span>Sub Section:</span>
                <div style={{ width: "100%", marginTop: "0.5rem" }}>
                  <p
                    style={{
                      textAlign: "left",
                      color: "black",
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                  >
                    {`Previous Sub-section: `}
                    <span
                      style={{ fontWeight: "bold" }}
                    >{`${selectedRow.subSection_data} `}</span>
                  </p>
                  {/* <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="subSection_data"
                    className="textField"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={
                      formik.values.subSection_data === undefined
                        ? ""
                        : formik.values.subSection_data
                    }
                    onChange={(e) => {
                      formik.handleChange(e);
                      postSubSectionToGetCellListOfUserAssign(e.target.value);
                      formik.values.cell_data = undefined;
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {subSectionList.map((option) => {
                      return <option value={option}>{option}</option>;
                    })}
                  </select> */}
                  <FormControl fullWidth>
                    <InputLabel id="demo-multiple-checkbox-label">
                      Please select
                    </InputLabel>

                    <Select
                      labelId="demo-multiple-checkbox-label"
                      id="demo-multiple-checkbox"
                      multiple
                      value={subsections}
                      // fullWidth
                      label="Please"
                      // onChange={handleChange}
                      onChange={(e) => {
                        formik.handleChange(e);
                        setsubsections(e.target.value);
                        // postSubSectionToGetCellListOfUserAssign(e.target.value);
                        formik.values.cell_data = undefined;
                      }}
                      // input={<OutlinedInput label="Please select" />}
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {subSectionList.map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={subsections.indexOf(name) > -1} />
                          <ListItemText primary={name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <div>
                    {/* <p style={{ color: "#F44336", fontWeight: "400" }}>
              {formik.touched.emp_group && formik.errors.emp_group}
            </p> */}
                  </div>
                </div>
              </div>
            )}

            {grade === "HOS" ||
            grade === "HOD" ||
            context.user_type === "Admin" ||
            context.user_type === "Plant-Admin" ? undefined : (
              <div className="pwd-container">
                <span>Cell/Product:</span>
                <div style={{ width: "100%", marginTop: "0.5rem" }}>
                  <p
                    style={{
                      textAlign: "left",
                      color: "black",
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                  >
                    {`Previous Cell: `}
                    <span
                      style={{ fontWeight: "bold" }}
                    >{`${selectedRow.cell_data} `}</span>
                  </p>

                  {/* <select
                    class="form-select form-select-sm"
                    aria-label=".form-select-sm example"
                    style={{ width: "100%" }}
                    id="standard-select-currency"
                    name="cell_data"
                    className="textField"
                    fullWidth
                    select // label="Select"
                    autoComplete="off"
                    value={
                      formik.values.cell_data === undefined
                        ? ""
                        : formik.values.cell_data
                    }
                    onChange={(e) => {
                      formik.handleChange(e);
                    }}
                    variant="standard"
                  >
                    <option selected disabled value="">
                      Please select
                    </option>
                    {cellList.map((option) => {
                      return <option value={option}>{option}</option>;
                    })}
                  </select> */}
                  <FormControl fullWidth>
                    <InputLabel id="demo-multiple-checkbox-label">
                      Please select
                    </InputLabel>
                    <Select
                      labelId="demo-multiple-checkbox-label"
                      id="demo-multiple-checkbox"
                      multiple
                      value={cells}
                      fullWidth
                      // onChange={handleChange}
                      onChange={(e) => {
                        formik.handleChange(e);
                        setcells(e.target.value);
                      }}
                      // input={<OutlinedInput label="Tag" />}
                      renderValue={(selected) => selected.join(", ")}
                      MenuProps={MenuProps}
                    >
                      {cellList.map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={cells.indexOf(name) > -1} />
                          <ListItemText primary={name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* <div>
                    <p style={{ color: "#F44336", fontWeight: "400" }}>
                  {formik.touched.emp_group && formik.errors.emp_group}
                </p>
                  </div> */}
                </div>
              </div>
            )}
            <div className="pwd-container">
              <span>Joining Date: </span>
              <div style={{ width: "100%", marginTop: "0.5rem" }}>
                <p
                  style={{
                    textAlign: "left",
                    color: "black",
                    fontSize: "13px",
                    fontWeight: "normal",
                  }}
                >
                  {`Previous Date: `}
                  <span
                    style={{ fontWeight: "bold" }}
                  >{`${selectedRow.joining_date} `}</span>
                </p>
                <TextField
                  id="outlined-number"
                  name="joining_date"
                  className="textField"
                  value={formik.values.joining_date}
                  onChange={formik.handleChange}
                  autoComplete="off"
                  fullWidth
                  // label="Number"
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={
                    formik.touched.joining_date &&
                    Boolean(formik.errors.joining_date)
                  }
                  helperText={
                    formik.touched.joining_date && formik.errors.joining_date
                  }
                />
              </div>
            </div>

            {selectedRow.user_type === "Operator" ? undefined : (
              <div className="pwd-container">
                <span>Email: </span>
                <TextField
                  id="outlined-number"
                  name="email"
                  className="textField"
                  value={formik.values.email}
                  placeholder={selectedRow.email}
                  onChange={formik.handleChange}
                  autoComplete="off"
                  // label="Number"
                  fullWidth
                  type="email"
                  // InputLabelProps={{
                  //   shrink: true,
                  // }}
                  // error={formik.touched.email && Boolean(formik.errors.email)}
                  // helperText={formik.touched.email && formik.errors.email}
                />
              </div>
            )}
            <div className="pwd-container">
              <span>Contact No: </span>
              <TextField
                id="outlined-number"
                name="contact_no"
                className="textField"
                value={formik.values.contact_no}
                placeholder={selectedRow.contact_no}
                onChange={formik.handleChange}
                autoComplete="off"
                fullWidth
                // label="Number"
                inputProps={{
                  maxLength: 10,
                }}
                type="text"
                // InputLabelProps={{
                //   shrink: true,
                // }}
                // error={formik.touched.contact_no && Boolean(formik.errors.contact_no)}
                // helperText={formik.touched.contact_no && formik.errors.contact_no}
              />
            </div>
            <div className="pwd-container">
              <span>Address: </span>
              <TextField
                id="outlined-number"
                name="address"
                floatingLabelText="MultiLine and FloatingLabel"
                aria-label="minimum height"
                className="textField"
                value={formik.values.address}
                placeholder={selectedRow.address}
                onChange={formik.handleChange}
                autoComplete="off"
                fullWidth
                // label="Number"
                // type="text"
                multiline
                rows={2}
                // InputLabelProps={{
                //   shrink: true,
                // }}
                // error={formik.touched.address && Boolean(formik.errors.address)}
                // helperText={formik.touched.address && formik.errors.address}
              />
            </div>
            <button type="submit" className="btn-reset">
              Update
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserUpdate;
