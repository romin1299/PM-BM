import React, { useState } from "react";
import PartList from "./PartList";
import { useForm } from "react-hook-form";

const WrapperForPartList = ({isEditable}) => {
  const { clearErrors } = useForm();    
  const [parts, setParts] = useState([]);

  return (
    <div>
      <PartList
        parts={parts}
        setParts={setParts}
        isEditable={isEditable}
        clearErrors={clearErrors}
      />
    </div>
  );
};

export default WrapperForPartList;
