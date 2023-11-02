import React from "react";

const DropdownElem = ({
  name,
  id,
  options,
  onChange,
  value,
  className,
  selectedMinor,
  approvalList,
  setValue
}) => {
  return (
    <div>
      <select
        name={name}
        id={id}
        onChange={(e) => setValue(name, e.target.value)}
        value={value}
        style={{ fontSize: "14px" }}
        className={
          className || "" || selectedMinor === "Yes"
            ? approvalList?.minorApprovalList?.includes(name)
              ? "d-inline"
              : "d-none"
            : approvalList?.majorApprovalList?.includes(name)
            ? "d-inline"
            : "d-none" | "d-none"
        }
      >
        <option selected disabled value="">
          Please select
        </option>
        {options?.map((obj) => (
          <option value={obj?._id}>{obj?.tm_name}</option>
        ))}
      </select>
    </div>
  );
};

export default DropdownElem;
