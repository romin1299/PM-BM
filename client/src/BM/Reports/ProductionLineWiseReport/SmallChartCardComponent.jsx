import { Box, Divider, Typography } from "@mui/material";
import React, { Children } from "react";
import { Col, Row } from "react-bootstrap";

const SmallChartCardComponent = ({ title, children }) => {
  return (
    <Box
      className="cell p-3"
      //    sx={{ borderRadius: "4px" }}
    >
      <Typography
        className="col"
        variant="h6"
        component="h6"
        fontSize={20}
        fontWeight={400}
      >
        {title}
      </Typography>

      <Divider sx={{ mb: 1, borderColor: "black" }} />

      {children}
    </Box>
  );
};

export default SmallChartCardComponent;
