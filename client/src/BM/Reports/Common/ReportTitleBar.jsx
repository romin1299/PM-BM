import { Typography } from "@mui/material";
import React, { Children } from "react";
import { Col, Row } from "react-bootstrap";

const ReportTitleBar = ({ title, Toolbar }) => {
  // container cell style={{border:"none", overflow:"hidden"}}
  // box style={{ borderBottom: "3px solid #004b5b", padding: "1rem" }}

  return (
    <Row className="cell p-3 mt-3 gap-2 g-0 align-items-center">
      <Col className="d-flex align-items-center">
        <Typography
          noWrap
          variant="h4"
          component="h4"
          fontSize={25}
          fontWeight={600}
          sx={{ mr: 3 }}
        >
          {title}
        </Typography>
      </Col>

      {Toolbar && Toolbar}
    </Row>
  );
};

export default ReportTitleBar;
