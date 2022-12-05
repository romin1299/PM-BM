import { React, useState } from "react";
// import "../SCSS/LoginPage.css";
import { showPwdImg, hidePwdImg } from "../modules/LoginModules";
import * as yup from "yup";
import { useFormik } from "formik";
import TextField from "@material-ui/core/TextField";
import { useNavigate, useParams } from "react-router-dom";
import $ from "jquery";
import "../Login/Login.scss";
import OSLLogo from "../images/OSL_Logo.png";

function UpdatePassword() {
  const [isRevealOldPwd, setIsRevealOldPwd] = useState(false);
  const [isRevealNewPwd, setIsRevealNewPwd] = useState(false);
  const [isRevealConPwd, setIsRevealConPwd] = useState(false);

  const [invalid, setInvalid] = useState("");
  // const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  //input field validation with Yup
  const validationSchema = yup.object({
    oldPassword: yup.string().required("Please Enter your old password"),
    newPassword: yup.string().required("Please Enter your new password"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword"), null], "Passwords must match")
      .required("Please Enter your confirm new password"),
  });

  function unSetMessageValue() {
    setInvalid("");
    // setSuccess("");
  }
  const formik = useFormik({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      //e.preventDefault();
      // console.log(values);
      const res = await fetch("/updatePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = res.json();

      if (res.status === 400 || res.status === 422 || !data) {
        // window.alert("Invalid old password");

        setInvalid("Invalid old password");
        setTimeout(unSetMessageValue, 3000);
      } else {
        navigate("/", { replace: true });
        window.location.reload();
        // refreshPage()
        // window.alert("Password changed Successfully!!!");
      }
    },
  });

  return (
    <>
      <div className="mains">
        <div className="containers">
          <div className="wrappers">
            {/* <div style={{ textAlign: "left", marginLeft: "0.5rem" }}>
                <a href="" style={{ textDecoration: "none", color: "black" }}>
                  <KeyboardBackspaceIcon style={{ marginRight: "0.2rem" }} />
                  Back
                </a>
              </div> */}
            {/* <img className="ecilLogoLoginPage" alt="" src={ecilLogo} /> */}
            <div className="loginForm">
              <h4>Create new password</h4>
              <p>Your new password must be different then the previous one.</p>

              {invalid !== "" ? (
                <p style={{ textAlign: "center", color: "red" }}>{invalid}</p>
              ) : (
                ""
              )}
              <form onSubmit={formik.handleSubmit}>
                {/* New Password input container */}

                <div className="pwd-container1">
                  <TextField
                    //   InputProps={{ disableUnderline: true }}
                    fullWidth
                    id="oldPassword"
                    name="oldPassword"
                    label="Old Password"
                    type={isRevealOldPwd ? "text" : "password"}
                    value={formik.values.oldPassword}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.oldPassword &&
                      Boolean(formik.errors.oldPassword)
                    }
                    helperText={
                      formik.touched.oldPassword && formik.errors.oldPassword
                    }
                  />
                  <img
                    alt=""
                    title={isRevealOldPwd ? "Hide password" : "Show password"}
                    src={isRevealOldPwd ? hidePwdImg : showPwdImg}
                    onClick={() => setIsRevealOldPwd((prevState) => !prevState)}
                  />
                </div>
                <div className="pwd-container1">
                  <TextField
                    //   InputProps={{ disableUnderline: true }}
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    type={isRevealNewPwd ? "text" : "password"}
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.newPassword &&
                      Boolean(formik.errors.newPassword)
                    }
                    helperText={
                      formik.touched.newPassword && formik.errors.newPassword
                    }
                  />
                  <img
                    alt=""
                    title={isRevealNewPwd ? "Hide password" : "Show password"}
                    src={isRevealNewPwd ? hidePwdImg : showPwdImg}
                    onClick={() => setIsRevealNewPwd((prevState) => !prevState)}
                  />
                </div>

                {/* Confirm password input container */}

                <div className="pwd-container1">
                  <TextField
                    //   InputProps={{ disableUnderline: true }}
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type={isRevealConPwd ? "text" : "password"}
                    value={formik.values.confirmPassword}
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
                    alt=""
                    title={isRevealConPwd ? "Hide password" : "Show password"}
                    src={isRevealConPwd ? hidePwdImg : showPwdImg}
                    onClick={() => setIsRevealConPwd((prevState) => !prevState)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{ marginTop: "1rem" }}
                >
                  Update Password
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
    </>
  );
}

export default UpdatePassword;
