import React, { useReducer, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ReportTitleBar from "../Common/ReportTitleBar";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import { Box } from "@mui/material";
import MachineAgeGroupTable from "./MachineAgeGroupTable";
import YearlyContributionBarChart from "./YearlyContributionBarChart";
import StackedBarChart from "./StackedBarChart";
import CategoryDoughnutChart from "../TopMachineBreakdown/CategoryDoughnutChart";

const MachineAgeReport = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [groupData, setGroupData] = useState([
    { _id: "", group: 0, from: 0, to: 0 },
  ]);

  return (
    <>
      <Container fluid>
        <ReportTitleBar
          title="Machine Age"
          Toolbar={
            <ChartsToolbar
              baseUrlForFiltering={baseUrlForFiltering}
              reduceState={reduceState}
              reducerDispatch={reducerDispatch}
            />
          }
        />

        <Row className="mt-3 gx-3">
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <MachineAgeGroupTable
              {...reduceState}
              groupData={groupData}
              setGroupData={setGroupData}
            />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <YearlyContributionBarChart {...reduceState} />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <StackedBarChart {...reduceState} />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <CategoryDoughnutChart {...reduceState} groupData={groupData} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MachineAgeReport;
