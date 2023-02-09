import React, { useState, useEffect, useContext } from "react";
import * as yup from "yup";

import TextField from "@material-ui/core/TextField";
import TextareaAutosize from "@mui/base/TextareaAutosize";

import { useFormik } from "formik";
import { Container, Row, Col } from "react-bootstrap";

import RoutingContext from "../../context/routing/RoutingContext";
import currentYear from "../Dashboard/DashboardComponent/currentYear";
import Footer from "../../components/Footer/Footer";

function OperatorDataEntry() {
  const context = useContext(RoutingContext);

  const [lineData, setLineData] = useState([]);
  const [allMachineDataBasedOnLine, setAllMachineDataBasedOnLine] = useState(
    []
  );

  const typeDropdownList = ["BM", "Corrective", "Predictive", "Kaizen"];

  const postSectionToGetAllDataForMainDashboard = async () => {
    // setSubSection(undefined);
    try {
      const res = await fetch("/postSectionToGetLineData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: context.section_data,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log(data);
        setLineData(data?.lineData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    postSectionToGetAllDataForMainDashboard();
  }, []);

  const postLineToGetAllMachineData = async (selectedLine) => {
    formik.setFieldValue("selectedMachine", "");

    try {
      const res = await fetch("/postLineToGetMachineListForReportDashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
          selectedYear: currentYear,
        }),
      });
      const data = await res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Invalid");
      } else {
        // console.log("Data post", data);
        setAllMachineDataBasedOnLine(data?.machineInfo);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //input field validation with Yup
  const validationSchema = yup.object({
    selectedType: yup.string().required("Please select"),
    date: yup.string().required("Please enter date"),
    selectedLine: yup.string().required("Please select Line"),
    selectedMachine: yup.string().required("Please select Machine"),
    part_name: yup.string().required("Please enter Part Name"),
    part_no: yup.string().required("Please enter Part No"),
    cost: yup.string().required("Please enter cost"),
    abnormalityRemarks: yup
      .string()
      .required("Please enter Abnormality Remarks"),
    sparePurpose: yup.string().required("Please enter Spare Purpose"),
  });

  

  //creating new user
  const formik = useFormik({
    initialValues: {
      selectedType: "",
      date: "",
      selectedLine: "",
      selectedMachine: "",
      part_name: "",
      part_no: "",
      cost: "",
      abnormalityRemarks: "",
      sparePurpose: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/newOperatorDataEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedType: values.selectedType,
          date: values.date,
          selectedMachine: allMachineDataBasedOnLine?.[values.selectedMachine],
          usedBy: context?.tm_name,
          part_name: values.part_name,
          part_no: values.part_no,
          cost: values.cost,
          abnormalityRemarks: values.abnormalityRemarks,
          sparePurpose: values.sparePurpose,
        }),
      });


      const data = res.json();
      // console.log(data);
      window.location.reload(true);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Error");
      } else {
        console.log("Machine extraSpareDetails updated successfully");
        window.location.reload();
      }
    },
  });

  // console.log(
  //   allMachineDataBasedOnLine?.[formik?.values?.selectedMachine]?.machine_code
  // );
  // let finalDate = new Date(formik.values.date);
  // console.log(finalDate, finalDate?.getMonth());
  return (
    <>
      <div className="p-3">
        <Container
          fluid
          className="p-3 bg-light"
          style={{ borderRadius: "10px" }}
        >
          <h4 className="d-flex justify-content-center align-items-center">
            Operator Data Entry
          </h4>
          <div>
            <form onSubmit={formik.handleSubmit}>
              <Container>
                <Row className="pt-3">
                  <Col sm={6} md={12} lg={6}>
                    <div>Select:</div>
                    <select
                      // class="form-select form-select-sm"
                      // aria-label=".form-select-sm example"
                      style={{ borderRadius: "5px" }}
                      // id="standard-select-currency"
                      id="outlined-number"
                      name="selectedType"
                      className="textField mt-1"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.selectedType}
                      onChange={formik.handleChange}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {typeDropdownList.map((option) => {
                        return <option value={option}>{option}</option>;
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
                        {formik.touched.selectedType &&
                          formik.errors.selectedType}
                      </p>
                    </div>
                  </Col>
                  <Col sm={6} md={12} lg={6}>
                    <div>Date:</div>
                    <TextField
                      id="outlined-number"
                      name="date"
                      className="textField"
                      value={formik.values.date}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="date"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      // error={formik.touched.date && Boolean(formik.errors.date)}
                      // helperText={formik.touched.date && formik.errors.date}
                    />
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
                        {formik.touched.date && formik.errors.date}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6}  md={12} lg={6}>
                    <div>Line:</div>
                    <select
                      // class="form-select form-select-sm"
                      // aria-label=".form-select-sm example"
                      style={{ borderRadius: "5px" }}
                      // id="standard-select-currency"
                      id="outlined-number"
                      name="selectedLine"
                      className="textField mt-1"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.selectedLine}
                      onChange={(e) => {
                        formik.handleChange(e);
                        postLineToGetAllMachineData(e.target.value);
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {lineData?.map((option) => {
                        return (
                          <option value={option?._id}>
                            {option?.line_name}
                          </option>
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
                        {formik.touched.selectedLine &&
                          formik.errors.selectedLine}
                      </p>
                    </div>
                  </Col>

                  <Col>
                    <div>Used By:</div>
                    <TextField
                      id="outlined-number"
                      className="textField"
                      value={context?.tm_name}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} sm={6} md={12} lg={6}>
                    <div>Machine:</div>
                    <select
                      // class="form-select form-select-sm"
                      // aria-label=".form-select-sm example"
                      style={{ borderRadius: "5px" }}
                      // id="standard-select-currency"
                      id="outlined-number"
                      name="selectedMachine"
                      className="textField mt-1"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.selectedMachine}
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
                      variant="standard"
                    >
                      <option selected disabled value="">
                        Please select
                      </option>
                      {allMachineDataBasedOnLine?.map((option, index) => {
                        return (
                          <option value={index}>{option?.machine_name}</option>
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
                        {formik.touched.selectedMachine &&
                          formik.errors.selectedMachine}
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div>Machine No:</div>
                    <TextField
                      id="outlined-number"
                      name="machine_no"
                      className="textField"
                      value={
                        allMachineDataBasedOnLine?.[
                          formik?.values?.selectedMachine
                        ]?.machine_code || ""
                      }
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      // error={
                      //   formik.touched.machine_no &&
                      //   Boolean(formik.errors.machine_no)
                      // }
                      // helperText={
                      //   formik.touched.machine_no && formik.errors.machine_no
                      // }
                    />
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
                        {formik.touched.machine_no && formik.errors.machine_no}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} sm={6} md={12} lg={6}>
                    <div>Part Name:</div>
                    <TextField
                      id="outlined-number"
                      name="part_name"
                      className="textField"
                      value={formik.values.part_name}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      // error={
                      //   formik.touched.part_name &&
                      //   Boolean(formik.errors.part_name)
                      // }
                      // helperText={
                      //   formik.touched.part_name && formik.errors.part_name
                      // }
                    />
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
                        {formik.touched.part_name && formik.errors.part_name}
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div>Part No:</div>
                    <TextField
                      id="outlined-number"
                      name="part_no"
                      className="textField"
                      value={formik.values.part_no}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      // error={
                      //   formik.touched.part_no &&
                      //   Boolean(formik.errors.part_no)
                      // }
                      // helperText={
                      //   formik.touched.part_no && formik.errors.part_no
                      // }
                    />
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
                        {formik.touched.part_no && formik.errors.part_no}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} sm={6} md={12} lg={6}>
                    <div>Cost(INR):</div>
                    <TextField
                      id="outlined-number"
                      name="cost"
                      className="textField"
                      value={formik.values.cost}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="Number"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      // error={
                      //   formik.touched.cost &&
                      //   Boolean(formik.errors.cost)
                      // }
                      // helperText={
                      //   formik.touched.cost && formik.errors.cost
                      // }
                    />
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
                        {formik.touched.cost && formik.errors.cost}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6} sm={6} md={12} lg={6}>
                    <div>Abnormality Remarks:</div>
                    <TextareaAutosize
                      id="outlined-number"
                      name="abnormalityRemarks"
                      className="textField"
                      value={formik.values.abnormalityRemarks}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
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
                        {formik.touched.abnormalityRemarks &&
                          formik.errors.abnormalityRemarks}
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div>Spare Purpose:</div>
                    <TextareaAutosize
                      id="outlined-number"
                      name="sparePurpose"
                      className="textField"
                      value={formik.values.sparePurpose}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
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
                        {formik.touched.sparePurpose &&
                          formik.errors.sparePurpose}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row className="pt-3">
                  <Col>
                    <button type="submit" className="btn-primary1 mt-2">
                      Submit
                    </button>
                  </Col>
                </Row>
              </Container>
            </form>
          </div>
        </Container>
      <br />
      <br />
      <br />

        <Footer/>
      </div>
    </>
  );
}

export default OperatorDataEntry;
