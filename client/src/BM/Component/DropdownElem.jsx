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
  displayOrNot,
  maintenanceType,
}) => {
  console.log("----0",
    maintenanceType,"****0", name)
  return (
    <div>
      <select
        style={{ fontSize: "14px" }}
        className={
          className ||
          "" ||
          (displayOrNot &&
            selectedMinor === "Yes" &&
            approvalList?.minorApprovalList?.includes(name.replace("_", " ")))
            ? "d-inline"
            : displayOrNot &&
              selectedMajor === "Yes" &&
              (maintenanceType === "BM" ||
                (name !== "MTD_HOD" && name !== "PRD_HOD")) &&
              approvalList?.majorApprovalList?.includes(name.replace("_", " "))
            ? "d-inline"
            : "d-none"
        }
        {...register(name)}
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
