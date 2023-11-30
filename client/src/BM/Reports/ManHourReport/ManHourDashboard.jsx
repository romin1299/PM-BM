import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import ManHourTrend from "./ManHourTrend";
import { Box, Paper, Typography } from "@mui/material";
import LineTrend from "./LineTrend";
import TMLoad from "./TMLoad";
import ChartToPPTExample from "./ChartJsExample";
import ChartsToolbar from "./SubComponents/ChartsToolbar";

const ManHourDashboard = () => {
  return (
    <Container fluid>
      <Box className="cell p-3 mt-3">
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              Man-Hour Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <ChartToPPTExample />
          </Col>

          <Col md={12} lg={6}>
            <ManHourTrend />
          </Col>

          <Col md={12} lg={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
            <LineTrend />
          </Col>

          <Col md={12} lg={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
            <TMLoad />
          </Col>
        </Row>
      </Box>
      {/* <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 1, pl: 2 }}>
        <Row>
          <Col className="d-flex align-items-center">
            <Typography variant="h4" component="h4">
              Man-Hour Report
            </Typography>
          </Col>

          <ChartsToolbar />
        </Row>
      </Paper>

      <Row className="mt-3">
        <Col md={6}>
          <ChartToPPTExample />
        </Col>

        <Col md={6}>
          <ManHourTrend />
        </Col>

        <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
          <LineTrend />
        </Col>

        <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
          <TMLoad />
        </Col>
      </Row> */}
    </Container>


    // <Container fluid>
    //   <Box className="cell p-3 mt-3">
    //     <Row>
    //       <Col className="d-flex align-items-center">
    //         <Typography variant="h4" component="h4">
    //           Man-Hour Report
    //         </Typography>
    //       </Col>

    //       <ChartsToolbar />
    //     </Row>

    //     <Row className="mt-3">
    //       <Col md={6}>
    //         <ChartToPPTExample />
    //       </Col>

    //       <Col md={6}>
    //         <ManHourTrend />
    //       </Col>

    //       <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //         <LineTrend />
    //       </Col>

    //       <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //         <TMLoad />
    //       </Col>
    //     </Row>
    //   </Box>
    //   {/* <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 1, pl: 2 }}>
    //     <Row>
    //       <Col className="d-flex align-items-center">
    //         <Typography variant="h4" component="h4">
    //           Man-Hour Report
    //         </Typography>
    //       </Col>

    //       <ChartsToolbar />
    //     </Row>
    //   </Paper>

    //   <Row className="mt-3">
    //     <Col md={6}>
    //       <ChartToPPTExample />
    //     </Col>

    //     <Col md={6}>
    //       <ManHourTrend />
    //     </Col>

    //     <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //       <LineTrend />
    //     </Col>

    //     <Col md={6} style={{ marginTop: "1.25rem", paddingBottom: "4rem" }}>
    //       <TMLoad />
    //     </Col>
    //   </Row> */}
    // </Container>
  );
};

export default ManHourDashboard;
