import React, { useContext, useReducer, useState } from "react";
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
import CategoryDoughnutChart from "./CategoryDoughnutChart";
import RoutingContext from "../../../context/routing/RoutingContext";
const MachineAgeReport = () => {
  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";
  const loggedUserDetails = useContext(RoutingContext);

  const [
    getDataForOtherComponentBasedOnMachineAgeGroupChange,
    setGetDataForOtherComponentBasedOnMachineAgeGroupChange,
  ] = useState(false);

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
              yearFiltration
              sectionFiltration
              subSectionFiltration
              cellFiltration
              lineFiltration
              machineFiltration
              resetButtonFiltration
            />
          }
        />

        <Row className="mt-3 gx-3">
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <MachineAgeGroupTable
              {...reduceState}
              groupData={groupData}
              setGroupData={setGroupData}
              setGetDataForOtherComponentBasedOnMachineAgeGroupChange={
                setGetDataForOtherComponentBasedOnMachineAgeGroupChange
              }
              notEditable={loggedUserDetails?.tm_no === Number("9999")}
            />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <YearlyContributionBarChart
              userDetails={loggedUserDetails}
              filterValues={reduceState}
              {...reduceState}
              getDataForOtherComponentBasedOnMachineAgeGroupChange={
                getDataForOtherComponentBasedOnMachineAgeGroupChange
              }
              setGetDataForOtherComponentBasedOnMachineAgeGroupChange={
                setGetDataForOtherComponentBasedOnMachineAgeGroupChange
              }
            />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <StackedBarChart
              userDetails={loggedUserDetails}
              filterValues={reduceState}
              {...reduceState}
              getDataForOtherComponentBasedOnMachineAgeGroupChange={
                getDataForOtherComponentBasedOnMachineAgeGroupChange
              }
            />
          </Col>
          <Col xxl={6} lg={6} md={12} className="mb-2">
            <CategoryDoughnutChart
              {...reduceState}
              groupData={groupData}
              getDataForOtherComponentBasedOnMachineAgeGroupChange={
                getDataForOtherComponentBasedOnMachineAgeGroupChange
              }
            />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default MachineAgeReport;
