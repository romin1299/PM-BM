import React from "react";
import { Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";

const BMTitlebar = ({ title, Toolbar }) => {
  return (
    <Row className="cell p-2 mt-3 gap-2 g-0">
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

export default BMTitlebar;

{
  /* <div className="container-fluid">
  <BMTitlebar title="Plant Dashboard" />
</div> */
}
