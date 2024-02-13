import React, { useReducer, useState, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";
import PlantLineContribution from "./PlantLineContribution";
import SectionLineContribution from "./SectionLineContribution";
import { Box, Paper, Typography } from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import YearMonthDropdown from "./YearMonthDropdown";
import RoutingContext from "../../../context/routing/RoutingContext";

import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import ReportTitleBar from "../Common/ReportTitleBar";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";

const LineContributionMain = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const loggedUserDetails = useContext(RoutingContext);

 

  return (
    <Container fluid style={{ paddingBottom: "3rem" }}>
      <Box>
        <ReportTitleBar
          title="Line Contribution BD"
          Toolbar={
            <>
              <YearMonthDropdown
                {...reduceState}
                reducerDispatch={reducerDispatch}
              />

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.LINE_CONTRIBUTION, reduceState);
                  }}
                />
              </Col>
            </>
          }
        />

        <Row className="mt-3">
          <Col lg={12}>
            <PlantLineContribution
              userDetails={loggedUserDetails}
              reduceState={reduceState}
              {...reduceState}
            />
          </Col>

          <Col lg={12}>
            <SectionLineContribution
              userDetails={loggedUserDetails}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          </Col>
        </Row>
      </Box>
    </Container>
    // <Container fluid>
    //     <Box className="cell p-3 mt-3">
    //         <Row>
    //             <Col className="d-flex align-items-center">
    //                 <Typography variant="h4" component="h4">
    //                     Line Contribution BD
    //                 </Typography>
    //             </Col>

    //             <ChartsToolbar />
    //         </Row>
    //         <Row className='mb-5'>

    //         <Col lg={12} md={12} sm={12}>
    //             <PlantLineContribution />
    //         </Col>
    //         <Col lg={12} md={12} sm={12}>
    //             <SectionLineContribution />
    //         </Col>
    //     </Row>
    //     </Box>

    // </Container>
  );
};

export default LineContributionMain;
