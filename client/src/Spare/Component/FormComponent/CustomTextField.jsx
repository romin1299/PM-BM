import React from "react";
import { TextField } from "@material-ui/core";

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
}) => (
  <>
    <div className="pwd-container">
      <span className="fieldTitle">{label}: </span>
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
    {errors?.[fieldName] && (
      <p className="text-error mb-1">{errors?.[fieldName]?.message}</p>
    )}
  </>
);

export default CustomTextField;
