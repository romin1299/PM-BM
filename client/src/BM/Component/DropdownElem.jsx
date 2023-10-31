import React from "react";

const DropdownElem = ({ name, id, options, onChange, value }) => {
  // console.log(value);
  return (
    <div>
      <select
        name={name}
        id={id}
        onChange={(e) => onChange(e.target.value, id)}
        value={value}
        style={{ fontSize: "14px" }}
      >
        {options?.map((serviceElement) => (
          <option value={serviceElement?.key} key={serviceElement?.key}>
            {serviceElement?.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownElem;