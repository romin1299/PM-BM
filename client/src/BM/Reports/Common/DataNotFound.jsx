import { Box, Typography } from "@mui/material";
import React from "react";

const DataNotFound = (props) => {
  const { sx, ...restProps } = props;
  return (
    <Box
      className="alert alert-secondary h-100"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        ...sx,
      }}
      {...restProps}
    >
      <Typography variant="h5" component="h5">
        No Data Found
      </Typography>
      <Typography variant="subtitle2" fontSize={12} gutterBottom>
        Try resetting filters
      </Typography>
    </Box>
  );
};

export default DataNotFound;
