import { IconButton } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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

export const MuiNavigateBack = () => {
  const navigate = useNavigate();

  return (
    <IconButton
      onClick={() => {
        navigate(-1);
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};

export default CustomHooksForBackNavigation;
