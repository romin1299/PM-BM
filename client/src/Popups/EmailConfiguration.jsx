import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import { showPwdImg, hidePwdImg } from "../modules/LoginModules";

function EmailConfiguration({ close }) {
  const [isRevealNewPwd, setIsRevealNewPwd] = useState(false);

  return (
    <>
      <div id="main_div_reg4">
        <span onClick={close} className="close">
          &times;
        </span>
        <br />
        <div>
          <form
          //   onSubmit={formik.handleSubmit}
          >
            <div className="pwd-container">
              <span>Email: </span>
              <TextField
                id="outlined-number"
                name="email"
                className="textField"
                // value={formik.values.email}
                // onChange={formik.handleChange}
                autoComplete="off"
                // label="Number"
                type="text"
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                // error={formik.touched.email && Boolean(formik.errors.email)}
                // helperText={formik.touched.email && formik.errors.email}
              />
            </div>
            <div className="pwd-container">
              <span>Password: </span>
              <TextField
                //   InputProps={{ disableUnderline: true }}
                fullWidth
                id="password"
                name="password"
                type={isRevealNewPwd ? "text" : "password"}
                // value={formik.values.password}
                // onChange={formik.handleChange}
                // error={
                //   formik.touched.password &&
                //   Boolean(formik.errors.password)
                // }
                // helperText={
                //   formik.touched.password && formik.errors.password
                // }
              />
              <img
                alt=""
                title={isRevealNewPwd ? "Hide password" : "Show password"}
                src={isRevealNewPwd ? hidePwdImg : showPwdImg}
                onClick={() => setIsRevealNewPwd((prevState) => !prevState)}
              />
            </div>

            <button type="submit" className="btn">
              Submit
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default EmailConfiguration;
