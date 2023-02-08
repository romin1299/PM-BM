import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import RoutingContext from "../../context/routing/RoutingContext";
import { Row, Col, Container } from "react-bootstrap";
import TextField from "@material-ui/core/TextField";
import Footer from "../../components/Footer/Footer";

const SkipApprovalComponent = ({skipApprovalStatusData, functionToSetRefKey}) => {
  const context = useContext(RoutingContext);

  const formik = useFormik({
    initialValues: {
      request: "",
      rejected_remarks: "",
    },
    // validationSchema: validationSchema,
    onSubmit: async (values) => {
      // console.log("________");
      const res = await fetch("/approvedSkipMachinesBySectionAdmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: values.request,
          rejectedRemarksOfSkipPMMachines: values.rejected_remarks,
          skipApprovalStatusData
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else {
        console.log("Approved done...");
        functionToSetRefKey();
        // navigate("/approvalDashboard");

        // refreshPage();
        // if (values.email) {
        //   newPasswordLink(values.email);
        // }
      }
    },
  });

  return (
    <Col className="col-6 d-flex mt-2 p-3 border bg-white rounded">
      <form onSubmit={formik.handleSubmit}>
        <div className="row">
          <div className="row mb-3 mt-3">
            <span>
              Kindly approve skiped PM Machines. &nbsp;
              <input
                type="radio"
                name="request"
                id="outlined-number"
                value="Yes"
                onChange={formik.handleChange}
              />
              <span
                style={{
                  paddingLeft: "0.5rem",
                  fontWeight: "550",
                  color: "black",
                }}
              >
                Yes &nbsp;
              </span>
              <input
                type="radio"
                name="request"
                id="outlined-number"
                value="No"
                onChange={formik.handleChange}
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

          {formik.values.request === "No" ? (
            <div className="col-6">
              <span>Remarks: </span>
              <TextField
                // id="outlined-number"
                name="rejected_remarks"
                className="ApproveOrdRejectTextField"
                value={formik.values.rejected_remarks}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                fullWidth
                type="text"
              />
              <br />
              <p
                style={{
                  color: "#F44336",
                  fontWeight: "normal",
                  fontSize: "0.80rem",
                  float: "left",
                  paddingTop: "0.5rem",
                }}
              >
                {formik.touched.rejected_remarks &&
                  formik.errors.rejected_remarks}
              </p>
            </div>
          ) : (
            ""
          )}
          <div className="col-6 d-flex align-items-center">
            <button type="submit" className="btn-primary1">
              Submit
            </button>
          </div>
        </div>
      </form>
    </Col>
    
  );
};

export default SkipApprovalComponent;
