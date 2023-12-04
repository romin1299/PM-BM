import React from "react";

const DropdownElem = ({
  name,
  options,
  className,
  selectedMinor,
  selectedMajor,
  approvalList,
  register,
  required,
  errors,
  displayOrNot
}) => {
  return (
    <div>
      <select
        style={{ fontSize: "14px" }}
        className={
          className ||
          "" ||
          (displayOrNot && selectedMinor === "Yes" &&
            approvalList?.minorApprovalList?.includes(name.replace("_", " ")))
            ? "d-inline"
            : displayOrNot && selectedMajor === "Yes" &&
              approvalList?.majorApprovalList?.includes(name.replace("_", " "))
            ? "d-inline"
            : "d-none"
        }
        {...register(name, 
          (required = { required })
          )}
      >
        <option selected disabled value="">
          Please select
        </option>
        {options?.map((obj, idx) => (
          <option value={idx}>{obj?.tm_name}</option>
        ))}
      </select>
      {errors?.[name] && (
        <p className="text-error">{`Please select ${name.replace(
          "_",
          " "
        )}`}</p>
      )}
    </div>
  );
};

export default DropdownElem;
