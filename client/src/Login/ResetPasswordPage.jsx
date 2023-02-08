import { React, useState } from "react";
// import "../SCSS/LoginPage.css";
import { Button } from "../modules/LoginModules";
import * as yup from "yup";
import { useFormik } from "formik";
import TextField from "@material-ui/core/TextField";
import { useNavigate, useParams, Link } from "react-router-dom";
import $ from "jquery";
import "./Login.scss";
import OSLLogo from "../images/OSL_Logo.png";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import CloseIcon from "@mui/icons-material/Close";
import Footer from "../components/Footer/Footer";

function ResetPasswordPage() {
  const [invalid, setInvalid] = useState("");
  const [success, setSuccess] = useState("");

  //input field validation with Yup
  const validationSchema = yup.object({
    email: yup
      .string()
      .required("Please Enter your email")
      .email("Email is invalid"),
  });

  function unSetMessageValue() {
    setInvalid("");
    setSuccess("");
  }
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // values.preventDefault();

      const res = await fetch("/resetPass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        setInvalid("Email address is not authorized !!!!");

        setTimeout(unSetMessageValue, 3000);
      } else {
        setSuccess("Password reset link sent to your email account");
        setTimeout(unSetMessageValue, 3000);
      }
    },
  });

  return (
    <>
      <div className="mains">
        <div className="containers">
          <div className="wrappers">
            <div style={{ textAlign: "left", paddingBottom: "1rem"}}>
              <a href="/" style={{ textDecoration: "none", color: "black" }}>
                <KeyboardBackspaceIcon style={{ marginRight: "0.2rem" }} />
                Back
              </a>
            </div>
            <div className="loginForm">
              <div className="headings">
                <h3
                  style={{ color: "#E71E25", fontWeight: "600" }}
                  className="text text-medium"
                >
                  Reset password
                </h3>
                <p style={{ textAlign: "left" }}>
                  Enter the email associated with your account and we will send
                  an email with instructions to reset your password
                </p>

                {invalid !== "" ? (
                  <p style={{ textAlign: "center", color: "red" }}>{invalid}</p>
                ) : success !== "" ? (
                  <p style={{ textAlign: "center", color: "green" }}>
                    {success}
                  </p>
                ) : (
                  ""
                )}
              </div>
              <form onSubmit={formik.handleSubmit}>
                <div id="warnings"></div>
                <div className="email-container">
                  <TextField
                    //   InputProps={{ disableUnderline: true }}
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </div>

                <p
                  id="success"
                  style={{ textAlign: "center", color: "green" }}
                ></p>

                <button type="submit" className="btn bg-button">
                  Send
                </button>
              </form>
            </div>
          </div>
          <div id="footer">
            <div>
              Powered By OSL <img className="osl_logo" src={OSLLogo} alt="" />
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}

export default ResetPasswordPage;
