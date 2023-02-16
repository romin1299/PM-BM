import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import { showPwdImg, hidePwdImg } from "../modules/LoginModules";
import { useFormik } from "formik";
import * as yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EmailConfiguration({ close }) {

  const [emailConfigurationData, setEmailConfigurationData] = useState([]);
  const [refKey2, setRefKey2] = useState(0);


  const validationSchema = yup.object({
    server_ip: yup.string().required("Please enter server IP"),
    email_port: yup
      .number()
      .integer()
      .required("Please enter port")
      .typeError("Please enter only number"),
    email: yup.string().required("Please enter email id"),
  });

  const notifyForEmailConfiguration = () => {
    toast.success("Email Configuration Add/Update Successfully !", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  const formik = useFormik({
    initialValues: {
      server_ip: "",
      email_port: "",
      email: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("/postEmailConfiguration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values,
        }),
      });
      const data = await res.json();
      if (res.status === 400 || res.status === 422 || !data) {
        window.alert("Email configuraion not added !");
      } else {
        console.log("Email configuration added...");
        notifyForEmailConfiguration()
        // close();

      }
    },
  });

  const fetchEmailConfigurationData = async () => {
    try {
      const res = await fetch("/fetchEmailConfigurationData", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      setRefKey2((refKey2) => refKey2 + 1);
      setEmailConfigurationData(data)
      
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchEmailConfigurationData();
  }, [refKey2]);

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />

      <div id="main_div_reg4">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />
        <div>
          <div>
            <h5 style={{ textAlign: "left", color: "#dc3545" }}>
              Email Configuration
            </h5>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <div className="pwd-container">
              <span>Enter Server-IP: </span>
              <TextField
                id="outlined-number"
                name="server_ip"
                className="textField"
                // value={formik.values.server_ip}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                placeholder={emailConfigurationData?.serverIP}
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.server_ip && Boolean(formik.errors.server_ip)
                }
                helperText={formik.touched.server_ip && formik.errors.server_ip}
              />
            </div>
            <div className="pwd-container">
              <span>Enter Port: </span>
              <TextField
                id="outlined-number"
                name="email_port"
                className="textField"
                // value={formik.values.email_port}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                placeholder={emailConfigurationData?.emailPort}
                type="text"
                inputMode="numeric"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={
                  formik.touched.email_port && Boolean(formik.errors.email_port)
                }
                helperText={
                  formik.touched.email_port && formik.errors.email_port
                }
              />
            </div>
            <div className="pwd-container">
              <span>From Email Address: </span>
              <TextField
                id="outlined-number"
                name="email"
                className="textField"
                // value={formik.values.email}
                onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                placeholder={emailConfigurationData?.fromEmailId}
                type="email"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </div>

            <button type="submit" className="btn-reset">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default EmailConfiguration;
