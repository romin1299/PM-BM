import React from "react";
import { useNavigate } from "react-router-dom";

const CustomHooksForBackNavigation = ({ className }) => {
  const navigate = useNavigate();

  return (
    <button
      className={className || "btn bg-button"}
      onClick={() => {
        navigate(-1);
      }}
    >
      Back
    </button>
  );
};

export default CustomHooksForBackNavigation;
