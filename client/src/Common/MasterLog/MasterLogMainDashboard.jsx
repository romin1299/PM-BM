import React, { useReducer, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box } from "@mui/material";

import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";

import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

const MasterLogMainDashboard = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const getMasterLog = async () => {
    try {
      const res = await fetch(
        `/common/masterLog/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedYear=${reduceState?.selectedYear}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message } = await res.json();

      if (res?.status === 201) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (reduceState?.selectedValue) getMasterLog();
  }, [reduceState?.selectedValue, reduceState?.selectedYear]);

  return (
    <Container fluid>
      <Box>
        <Row>
          <Col>
            <ReportTitleBar
              title="Master Log"
              Toolbar={
                <>
                  <ChartsToolbar
                    baseUrlForFiltering={baseUrlForFiltering}
                    reduceState={reduceState}
                    reducerDispatch={reducerDispatch}
                    monthFiltration
                  />
                </>
              }
            />
          </Col>
        </Row>
        <Row>
          <Col>MasterLogMainDashboard</Col>
        </Row>
      </Box>
    </Container>
  );
};

export default MasterLogMainDashboard;
