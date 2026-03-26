import React, { useState } from "react";
import MachineDataTableToolbar from "./SubComponents/MachineDataTableToolbar";

const MachineDataTable = () => {
  const [data, setData] = useState({});

  const [dropdownValues, setDropdownValues] = useState({
    section: {},
    product: {},
    line: {},
    machine: {},
  });

  const [selectedValues, setSelectedValues] = useState({
    section: null,
    product: null,
    line: null,
    machine: null,
  });

  return (
    <div>
      <MachineDataTableToolbar />
    </div>
  );
};

export default MachineDataTable;
