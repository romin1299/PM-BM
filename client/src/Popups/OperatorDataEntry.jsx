import React, { useState } from "react";
import "./Popup.css";
import * as yup from "yup";

import TextField from "@material-ui/core/TextField";
import TextareaAutosize from "@mui/base/TextareaAutosize";

import { useFormik } from "formik";
import { Container, Row, Col } from "react-bootstrap";

function OperatorDataEntry() {
  const typeDropdownList = ["BM", "Corrective", "Predictive", "Kaizen"];
  const close = function () {
    formik.resetForm({
      values: "",
    });
  };

  //input field validation with Yup
  const validationSchema = yup.object({
    selectedType: yup.string().required("Please select"),
    date: yup.string().required("Please enter date"),
    selectedLine: yup.string().required("Please select Line"),
    selectedMachine: yup.string().required("Please select Machine"),
    usedBy: yup.string().required("Please select TM"),
    part_name: yup.string().required("Please enter Part Name"),
    part_no: yup.string().required("Please enter Part No"),
    cost: yup.string().required("Please enter cost"),
  });

  //creating new user
  const formik = useFormik({
    initialValues: {
      selectedType: "",
      date: "",
      selectedLine: "",
      selectedMachine: "",
      usedBy: "",
      part_name: "",
      part_no: "",
      cost: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/newOperatorDataEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedType: values.selectedType,
          date: values.date,
          selectedLine: values.selectedLine,
          selectedMachine: values.selectedMachine,
          usedBy: values.usedBy,
          part_name: values.part_name,
          part_no: values.part_no,
          cost: values.cost,
        }),
      });

      const data = res.json();
      // console.log(data);
      window.location.reload(true);
      if (res.status === 400 || res.status === 422 || !data) {
        console.log("Error");
      } else {
        console.log("User added sucessfully...");
      }
    },
  });

  return (
    <>
      <div className="p-3">
        <Container
          // fluid
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
                  <Col sm={6}>
                    <div>Select:</div>
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
                      value={formik.values.selectedType}
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
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
                  <Col>
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
                  <Col sm={6}>
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
                      value={formik.values.selectedLine}
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
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
                        {formik.touched.selectedLine &&
                          formik.errors.selectedLine}
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div>Used By:</div>
                    <select
                      // class="form-select form-select-sm"
                      // aria-label=".form-select-sm example"
                      style={{ border: "2px solid gray", borderRadius: "5px" }}
                      // id="standard-select-currency"
                      id="outlined-number"
                      name="usedBy"
                      className="textField mt-1"
                      fullWidth
                      select // label="Select"
                      autoComplete="off"
                      value={formik.values.usedBy}
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
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
                        {formik.touched.usedBy && formik.errors.usedBy}
                      </p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col sm={6}>
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
                      value={formik.values.selectedMachine}
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
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
                      value={formik.values.machine_no}
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
                  <Col sm={6}>
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
                  <Col sm={6}>
                    <div>Cost(INR):</div>
                    <TextField
                      id="outlined-number"
                      name="cost"
                      className="textField"
                      value={formik.values.cost}
                      onChange={formik.handleChange}
                      autoComplete="off"
                      // label="Number"
                      type="text"
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
                  <Col sm={6}>
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
                    <button type="submit" className="btn">
                      Submit
                    </button>
                  </Col>
                </Row>
              </Container>
            </form>
          </div>
        </Container>
      </div>
    </>
  );
}

export default OperatorDataEntry;
