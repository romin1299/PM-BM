import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";

import BMTitlebar from "../../Component/BMTitlebar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  reducer,
  initialState,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

import TopMachineBDChart from "./TopMachineBDChart";

const TopMachineBD = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  return (
    <>
      <Container fluid>
        <BMTitlebar
          title="Top Machine Breakdown"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          }
        />

        <Row>
          <Col>
            <TopMachineBDChart />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default TopMachineBD;
