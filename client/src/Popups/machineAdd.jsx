import React, { useContext, useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import RoutingContext from "../context/routing/RoutingContext";
import ContextAPI from "../context/ContextAPI/ContextAPI";
import { useFormik } from "formik";
import * as yup from "yup";

const MachineAdd = ({ line, refreshForMachineData }) => {
  const [invalid, setInvalid] = useState("");

  const close = function () {
    formik.resetForm({
      values: "",
    });
    document.getElementById("main_div_reg3").style.display = "none";
    document.querySelector(".App").style.pointerEvents = "auto";
  };

  const reset = function () {
    formik.resetForm({
      values: "",
    });
  };
  const refreshPage = () => {
    window.location.reload();
  };

  function unSetMessageValue() {
    setInvalid("");
  }
  const validationSchema = yup.object({
    machine_name: yup.string().required("Please enter machine name"),
    machine_nickname: yup.string().required("Please enter machine nick-name"),
    isPM: yup.string().required("Please select one"),
    machine_sequence: yup
      .number()
      .required("Please enter machine sequence")
      .typeError("You must specify a number")
      .positive()
      .integer(),
    machine_code: yup.string().required("Please enter machine code"),
    // user_type: yup.string().required("Please select TM group"),
    installation_date: yup.string().required("Please select installation date"),
    manufacturingDate: yup
      .string()
      .required("Please select manufacturing date"),
    maker_name: yup.string().required("Please enter maker name"),
    maker_sr_no: yup.string().required("Please enter maker sr. no."),
  });

  const formik = useFormik({
    initialValues: {
      machine_code: "",
      machine_name: "",
      isPM: "",
      machine_nickname: "",
      machine_sequence: "",
      installation_date: "",
      maker_name: "",
      maker_sr_no: "",
      manufacturingDate: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log(values);
      const res = await fetch("/addNewMachine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_code: values.machine_code,
          machine_name: values.machine_name,
          isPM: values.isPM,
          machine_nickname: values.machine_nickname,
          machine_sequence: values.machine_sequence,
          installation_date: values.installation_date,
          maker_name: values.maker_name,
          maker_sr_no: values.maker_sr_no,
          manufacturingDate: values.manufacturingDate,
          line,
        }),
      });
      const data = res.json();
      // console.log(data);
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Invalid credentials !");
      } else if (res.status === 409) {
        setInvalid("Machine code already exists!");
        setTimeout(unSetMessageValue, 3000);
      } else {
        console.log("Machine added sucessfully...");
        refreshForMachineData();
        setTimeout(() => {
          close();
        }, 500);
      }
    },
  });
  return (
    <>
      <div id="main_div_reg3">
        <span onClick={close} className="close">
          &times;
        </span>
        {invalid !== "" ? (
          <p style={{ textAlign: "center", color: "red" }}>{invalid}</p>
        ) : (
          ""
        )}
        <div>
          <h3 style={{ textAlign: "left", color:"#dc3545"}}>Add Machine</h3>
          <form onSubmit={formik.handleSubmit}>
            <div className="pwd-container">
              <span>Machine Code: </span>
              <TextField
                id="outlined-number"
                name="machine_code"
                className="textField"
                value={formik.values.machine_code}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.machine_code &&
                  Boolean(formik.errors.machine_code)
                }
                helperText={
                  formik.touched.machine_code && formik.errors.machine_code
                }
              />
            </div>
            <div className="pwd-container">
              <span>Machine Name: </span>
              <TextField
                id="outlined-number"
                name="machine_name"
                className="textField"
                value={formik.values.machine_name}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.machine_name &&
                  Boolean(formik.errors.machine_name)
                }
                helperText={
                  formik.touched.machine_name && formik.errors.machine_name
                }
              />
            </div>
            <div className="pwd-container">
              <span>Machine Nick-Name: </span>
              <TextField
                id="outlined-number"
                name="machine_nickname"
                className="textField"
                value={formik.values.machine_nickname}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.machine_nickname &&
                  Boolean(formik.errors.machine_nickname)
                }
                helperText={
                  formik.touched.machine_nickname &&
                  formik.errors.machine_nickname
                }
              />
            </div>
            <div className="pwd-container">
              <span>Machine Sequence: </span>
              <TextField
                id="outlined-number"
                name="machine_sequence"
                className="textField"
                value={formik.values.machine_sequence}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.machine_sequence &&
                  Boolean(formik.errors.machine_sequence)
                }
                helperText={
                  formik.touched.machine_sequence &&
                  formik.errors.machine_sequence
                }
              />
            </div>
            <div className="pwd-container">
              <span> Proceed for PM ?</span>

              <div style={{ float: "left" }}>
                <input
                  type="radio"
                  name="isPM"
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
                  Yes
                </span>

                <input
                  type="radio"
                  name="isPM"
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
              </div>
              <div>
                <p
                  style={{
                    color: "#F44336",
                    fontWeight: "normal",
                    fontSize: "0.90rem",
                  }}
                >
                  {formik.touched.isPM && formik.errors.isPM}
                </p>
              </div>
            </div>

            <div className="pwd-container">
              <span>Installation Date: </span>
              <TextField
                id="outlined-number"
                name="installation_date"
                className="textField"
                value={formik.values.installation_date}
                onChange={formik.handleChange}
                autoComplete="off"
                fullWidth
                // label="Number"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.installation_date &&
                  Boolean(formik.errors.installation_date)
                }
                helperText={
                  formik.touched.installation_date &&
                  formik.errors.installation_date
                }
              />
            </div>
            <div className="pwd-container">
              <span>Manufacturing Date: </span>
              <TextField
                id="outlined-number"
                name="manufacturingDate"
                className="textField"
                value={formik.values.manufacturingDate}
                onChange={formik.handleChange}
                autoComplete="off"
                fullWidth
                // label="Number"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.manufacturingDate &&
                  Boolean(formik.errors.manufacturingDate)
                }
                helperText={
                  formik.touched.manufacturingDate &&
                  formik.errors.manufacturingDate
                }
              />
            </div>
            <div className="pwd-container">
              <span>Maker Name: </span>
              <TextField
                id="outlined-number"
                name="maker_name"
                className="textField"
                value={formik.values.maker_name}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.maker_name && Boolean(formik.errors.maker_name)
                }
                helperText={
                  formik.touched.maker_name && formik.errors.maker_name
                }
              />
            </div>
            <div className="pwd-container">
              <span>Maker Sr.No.: </span>
              <TextField
                id="outlined-number"
                name="maker_sr_no"
                className="textField"
                value={formik.values.maker_sr_no}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.maker_sr_no &&
                  Boolean(formik.errors.maker_sr_no)
                }
                helperText={
                  formik.touched.maker_sr_no && formik.errors.maker_sr_no
                }
              />
            </div>
            <div class="row g-2">
              <div class="col-sm col-md-12 col-lg-6 pl-0">
                <button type="submit" className="btn-reset">
                  Submit
                </button>
              </div>
              <div class="col-sm col-md-12 col-lg-6 pl-0 ">
                <button
                  type="button"
                  className="btn-primary1"
                  onClick={reset}
                //   style={{ marginRight: "5rem" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
        <br />
      </div>
    </>
  );
};

export default MachineAdd;
