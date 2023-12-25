import React, { useReducer } from "react";
import { Container, Row, Col } from "react-bootstrap";
import BMTitlebar from "../../Component/BMTitlebar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";

import {
  reducer,
  initialState,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";

import TopMachineBDComponent from "./TopMachineBDComponent";
import BDCategoryAndFactor from "./BDCategoryAndFactor";
import MachineWiseMTTRAndMTBF from "./MachineWiseMTTRAndMTBF";

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
              machineFiltration
            />
          }
        />

        <Row>
          <Col>
            <TopMachineBDComponent
              selectedValue={reduceState?.selectedValue}
              flagForTogglingFilter={reduceState?.flagForTogglingFilter}
              selectedYear={reduceState?.selectedYear}
              selectedMonth={reduceState?.selectedMonth}
            />
          </Col>
        </Row>

        {reduceState?.flagForTogglingFilter === "based-on-machine" && (
          <Row className="cell mt-3 g-2">
            <Col xxl={6} lg={6} md={6} className="d-flex">
              <BDCategoryAndFactor
                selectedValue={reduceState?.selectedValue}
                flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                selectedYear={reduceState?.selectedYear}
                selectedMonth={reduceState?.selectedMonth}
              />
            </Col>
            <Col xxl={3} lg={6} md={6}>
              <MachineWiseMTTRAndMTBF
                chartFor="MTTR"
                selectedValue={reduceState?.selectedValue}
                flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                selectedYear={reduceState?.selectedYear}
              />
            </Col>
            <Col xxl={3} lg={6} md={6}>
              <MachineWiseMTTRAndMTBF
                chartFor="MTBF"
                selectedValue={reduceState?.selectedValue}
                flagForTogglingFilter={reduceState?.flagForTogglingFilter}
                selectedYear={reduceState?.selectedYear}
              />
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
};

export default TopMachineBD;
