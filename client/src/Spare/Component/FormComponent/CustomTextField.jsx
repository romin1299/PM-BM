import React from "react";
import { TextField } from "@material-ui/core";
import { get } from "react-hook-form";

const CustomTextField = ({
  label = "TM Name",
  fieldName = "tm_name",
  inputProps = {
    type: "text",
  },
  register,
  registerProp = {
    required: false,
  },
  errors = {},
  otherClasses = "",
}) => {
  const error = get(errors, fieldName);
  return (
    <>
      <div className={`pwd-container ${otherClasses}`}>
        <span className="fieldTitle">{label}: </span>
        <div className="d-flex align-self-center justify-content-center w-100">
          <TextField
            id="outlined-number"
            className="textField"
            autoComplete="off"
            fullWidth
            {...inputProps}
            InputLabelProps={{
              shrink: true,
            }}
            {...register(fieldName, registerProp)}
          />
        </div>
      </div>
      {error && <p className="text-error mb-1">{error?.message}</p>}
    </>
  );
};

export default CustomTextField;
