import React, { useContext, useState, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";

import {
  Checkbox,
  Select,
  ListItemText,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
} from "@material-ui/core";

import { tmGrade, userType } from "../../../utils/users";

import RoutingContext from "../../../context/routing/RoutingContext";
import PlantDropdown from "./PlantDropdown";
import SectionDropdown from "./SectionDropdown";
import TMGradeDropdown from "./TMGradeDropdown";

const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const UserAdd = () => {
  const context = useContext(RoutingContext);
  const close = function () {
    formik.resetForm({
      values: "",
    });
    document.getElementById("main_div_reg1").style.display = "none";
    document.querySelector(".App").style.pointerEvents = "auto";
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const validationSchema = yup.object({
    tm_name: yup.string().required("Please enter TM name"),
    tm_department: yup.string().when([], {
      is: () => context.user_type === "Section-Admin",
      then: yup
        .string("Enter password")
        .required("Please select TM department"),
    }),
    tm_no: yup
      .number()
      .required("Please enter TM number")
      .typeError("You must specify a number")
      .positive()
      .integer(),

    user_type: yup.string().when({
      is: () =>
        context?.user_type === "TL/HOSS" ||
        context.user_type === "Section-Admin",
      then: yup.string().required("Please select TM group"),
    }),

    joining_date: yup.string().required("Please select joining date"),
  });

  const formik = useFormik({
    initialValues: {
      tm_name: "",
      tm_no: "",
      user_type: "",
      tm_grade: "",
      email: "",
      // operator_password: "",
      joining_date: "",
      plant: {
        _id: "",
      },
      plant_data: "",
      section_data: "",
      tm_department: "",
      subSection_data: "",
      cell_data: "",
      contact_no: "",
      address: "",
      isAuthorizedUserForUpdatingRequestSheetInAnyStatus: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/postUserAssign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_name: values.tm_name,
          tm_no: values.tm_no,
          isAuthorizedUserForUpdatingRequestSheetInAnyStatus:
            values?.isAuthorizedUserForUpdatingRequestSheetInAnyStatus,
          user_type: values.user_type
            ? values.user_type
            : context.user_type === "Admin"
            ? "Plant-Admin"
            : "Section-Admin",
          plant_data: values.plant_data
            ? values.plant_data
            : context.plant_data,
          section_data: values.section_data
            ? values.section_data
            : context.section_data,
          tm_grade:
            context.user_type === "Section-Admin" &&
            formik.values.tm_department === "PRD" &&
            formik.values.user_type === "Section-Admin"
              ? "HOS"
              : context?.user_type === "Plant-Admin"
              ? "HOS"
              : values.tm_grade,
          tm_department: values.tm_department
            ? values.tm_department
            : values.user_type === "Operator"
            ? "MTD"
            : context.user_type === "TL/HOSS" && values?.user_type === "TL/HOSS"
            ? "PRD"
            : values.tm_department,

          // subSection_data: subsections,
          // cell_data: cells,
          joining_date: values.joining_date,
          email: values.email,
          contact_no: values.contact_no,
          address: values.address,
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else if (res.status === 409) {
        window.alert("Employee number already exists !");
      } else {
        console.log("User added sucessfully...");
        refreshPage();
      }
    },
  });

  return (
    <>
      <div id="main_div_reg1">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />
        <div>
          <h3 style={{ textAlign: "left", color: "#dc3545" }}>Add User</h3>

          <form onSubmit={formik.handleSubmit}>
            <div className="pwd-container">
              <span>TM Name: </span>
              <TextField
                id="outlined-number"
                name="tm_name"
                className="textField"
                value={formik.values.tm_name}
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
                value={formik.values.tm_no}
                onChange={formik.handleChange}
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={formik.touched.tm_no && Boolean(formik.errors.tm_no)}
                helperText={formik.touched.tm_no && formik.errors.tm_no}
              />
            </div>
            <div className="pwd-container">
              <span>Want to authorized this user to update RequestSheet:</span>
              <div>
                <div>
                  <input
                    type="radio"
                    name="isAuthorizedUserForUpdatingRequestSheetInAnyStatus"
                    id="outlined-number"
                    value={"Yes"}
                    onChange={formik.handleChange}
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

                  <input
                    type="radio"
                    name="isAuthorizedUserForUpdatingRequestSheetInAnyStatus"
                    id="outlined-number"
                    value={"No"}
                    onChange={formik.handleChange}
                    defaultChecked
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
                </div>
              </div>
            </div>

            <TMGradeDropdown formik={formik}/>

            {context?.user_type === "Admin" ? (
              <PlantDropdown formik={formik} />
            ) : (
              <div className="pwd-container">
                <span>Plant: </span>
                <TextField
                  id="outlined-number"
                  name="tm_name"
                  className="textField"
                  value={context.plant_data}
                  autoComplete="off"
                  type="text"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </div>
            )}

            {["Admin", "Plant-Admin"]?.includes(context?.user_type) ? (
              formik.values?.plant?._id && (
                <SectionDropdown
                  formik={formik}
                  plant_names={formik.values?.plant?._id}
                />
              )
            ) : (
              <div className="pwd-container">
                <span>Section: </span>
                <TextField
                  id="outlined-number"
                  name="tm_name"
                  className="textField"
                  value={context.section_data}
                  autoComplete="off"
                  type="text"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
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
                onChange={formik.handleChange}
                autoComplete="off"
                fullWidth
                inputProps={{
                  maxLength: 10,
                }}
                type="text"
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
            <button type="submit" className="btn-success">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserAdd;
