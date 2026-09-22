import React from "react";
import { Typography } from "@mui/material";
import { Col, Row } from "react-bootstrap";

/**
 * Toolbar sits under the title by default, which suits the wide tab strips on
 * the budget dashboards; `inlineToolbar` puts a short toolbar — a button or two
 * — on the title's own row, right-aligned.
 */
const SpareTitlebar = ({ title, Toolbar, inlineToolbar = false }) => {
  return (
    <Row
      className={`cell p-2 rounded-2 mt-3 gap-2 g-0 ${
        inlineToolbar
          ? "flex-row align-items-center justify-content-between flex-nowrap"
          : "flex-column"
      }`}
    >
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
      {Toolbar && (
        <Col className={inlineToolbar ? "col-auto" : undefined}>{Toolbar}</Col>
      )}
    </Row>
  );
};

export default SpareTitlebar;
