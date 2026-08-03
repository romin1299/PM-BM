import React from "react";
import { Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";

const SpareTitlebar = ({ title, Toolbar }) => {
  return (
    <Row className="cell p-2 rounded-2 mt-3 gap-2 g-0 flex-column">
      <Col className="d-flex align-items-center">
        <Typography
          noWrap
          variant="h5"
          component="h5"
          fontSize={20}
          fontWeight={600}
          sx={{ mr: 3 }}
        >
          {title}
        </Typography>
      </Col>
      {Toolbar && <Col>{Toolbar}</Col>}
    </Row>
  );
};

export default SpareTitlebar;
