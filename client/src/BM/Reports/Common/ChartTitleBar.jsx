import { Divider, Typography } from "@mui/material";
import React, { Children } from "react";
import { Col, Row } from "react-bootstrap";

const ChartTitleBar = (props) => {
  const { title, Toolbar, titleProps, disableDivider, ...restProps } = props;

  return (
    <>
      <Row
        className="align-items-center  gap-2"
        style={{ marginBottom: "0.5rem" }}
      >
        <Col className="d-flex align-items-center">
          <Typography
            noWrap
            className="col"
            variant="h5"
            component="h5"
            fontSize={20}
            fontWeight={400}
            {...titleProps}
            {...restProps}
          >
            {title}
          </Typography>
        </Col>

        {Toolbar && Toolbar}
      </Row>

      {!disableDivider && <Divider sx={{ mb: 2, borderColor: "black" }} />}
    </>
  );
};

export default ChartTitleBar;
