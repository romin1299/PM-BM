import React, { useState } from "react";
import "./Popup.css";
import * as yup from "yup";

import TextField from "@material-ui/core/TextField";
import { useFormik } from "formik";

function NewUserRegistration() {
  const close = function () {
    formik.resetForm({
      values: "",
    });
    document.getElementById("main_div_reg").style.display = "none";
    document.querySelector(".App").style.pointerEvents = "auto";
  };

  const [message, setMessage] = useState();

  //input field validation with Yup
  const validationSchema = yup.object({
    tm_name: yup.string().required("Please enter TM name"),
    // tm_no: yup.string().required("Please enter employee number"),
    email: yup
      .string("Enter your email")
      .email("Enter a valid email")
      .required("Email is required"),
    tm_no: yup
      .number()
      .required("Please enter TM number")
      .typeError("You must specify a number")
      .positive()
      .integer(),
    // user_type: yup.string().required("Please select employee group"),
    joining_date: yup.string().required("Please select joining date"),

    // password: yup
    //   .string()
    //   .required("Please enter password")
    //   .matches(
    //     /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
    //     "Must Contain 8 Characters with Uppercase, Lowercase, Number and one special character"
    //   ),
    // confirmPassword: yup
    //   .string()
    //   .oneOf([yup.ref("password"), null], "Passwords must match")
    //   .required("Please confirm password"),
  });

  const refreshPage = () => {
    window.location.reload();
  };

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

  //creating new user
  const formik = useFormik({
    initialValues: {
      tm_no: "",
      tm_name: "",
      // user_type: "",
      email: "",
      joining_date: "",
      // tm_no:"",
      // password: "",
      // confirmPassword: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // console.log("function call or not ...");
      // console.log(values.joining_date);
      const res = await fetch("/newUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tm_no: values.tm_no,
          tm_name: values.tm_name,
          user_type: "Plant",
          joining_date: values.joining_date,
          // tm_no: values.tm_no,
          email: values.email,
          contact_no: values.contact_no,
          address: values.address,
          // password: values.password,
          // confirmPassword: values.confirmPassword,
          //token,
        }),
      });

      const data = res.json();
      // console.log(data);
      window.location.reload(true);
      if (res.status === 400 || res.status === 422 || !data) {
        setMessage("Invalid old password");

        document.getElementById("warnings").style.visibility = "visible";
      } else {
        // refreshPage()
        // window.alert("Password changed Successfully!!!");
        // navigate("/login", { replace: true });
        console.log("User added sucessfully...");
        refreshPage();
        newPasswordLink(values.email);
      }
    },
  });

  // const currencies = [
  //   {
  //     value: "Plant",
  //     label: "Plant",
  //   },
  //   {
  //     value: "Section",
  //     label: "Section",
  //   },
  //   {
  //     value: "Operator",
  //     label: "Operator",
  //   },
  // ];
  return (
    <>
      <div id="main_div_reg">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />

        <h4>New Plant User Registration</h4>
        <div>
          <h3 style={{ textAlign: "left", color: "#dc3545" }}>
            New User Registeration
          </h3>
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
                inputProps={{
                  maxLength: 5,
                }}
                error={formik.touched.tm_no && Boolean(formik.errors.tm_no)}
                helperText={formik.touched.tm_no && formik.errors.tm_no}
              />
            </div>
            <div className="pwd-container">
              <span>TM Group:</span>
              <div style={{ width: "100%", marginTop: "0.5rem" }}>
                <TextField
                  id="outlined-number"
                  name="user_type"
                  className="textField"
                  autoComplete="off"
                  value="Plant"
                  fullWidth
                  // onChange={formik.handleChange}
                  // label="Number"
                  type="text"
                />
              </div>
            </div>
            <div className="pwd-container">
              <span>Joining Date: </span>
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
            {/* <div className="pwd-container">
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
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  maxLength: 5,
                }}
                error={formik.touched.tm_no && Boolean(formik.errors.tm_no)}
                helperText={formik.touched.tm_no && formik.errors.tm_no}
              />
            </div> */}
            <div className="pwd-container">
              <span>Email: </span>
              <TextField
                id="outlined-number"
                name="email"
                className="textField"
                value={formik.values.email}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                fullWidth
                type="email"
                InputLabelProps={{
                  shrink: true,
                }}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </div>
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
            {/* <div className="pwd-container"> */}
            {/* <span>New password:</span>

              <TextField
                //   InputProps={{ disableUnderline: true }}

                id="Password"
                name="password"
                className="textField"
                autoComplete="off"
                // label="New Password"
                type={isRevealNewPwd ? "text" : "password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={
                  formik.touched.password && Boolean(formik.errors.password)
                }
                helperText={formik.touched.password && formik.errors.password}
              />
              <img
                className="eyeImg"
                alt=""
                title={isRevealNewPwd ? "Hide password" : "Show password"}
                src={isRevealNewPwd ? hidePwdImg : showPwdImg}
                onClick={() => setIsRevealNewPwd((prevState) => !prevState)}
              />
            </div> */}

            {/* Confirm password input container */}

            {/* <div className="pwd-container">
              <span>Confirm password:</span>

              <TextField
                //   InputProps={{ disableUnderline: true }}

                id="Password"
                name="confirmPassword"
                className="textField"
                // label="Confirm Password"
                type={isRevealConPwd ? "text" : "password"}
                value={formik.values.confirmPassword}
                autoComplete="off"
                onChange={formik.handleChange}
                error={
                  formik.touched.confirmPassword &&
                  Boolean(formik.errors.confirmPassword)
                }
                helperText={
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                }
              />
              <img
                className="eyeImg"
                alt=""
                title={isRevealConPwd ? "Hide password" : "Show password"}
                src={isRevealConPwd ? hidePwdImg : showPwdImg}
                onClick={() => setIsRevealConPwd((prevState) => !prevState)}
              /> */}
            {/* </div> */}

            <button type="submit" className="btn-reset">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default NewUserRegistration;
