import React, { useState, useReducer, useEffect, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Box, Button } from "@mui/material";

import ReportTitleBar from "../../BM/Reports/Common/ReportTitleBar";
import ChartsToolbar from "../../BM/Reports/ManHourReport/SubComponents/ChartsToolbar";
import {
  initialState,
  reducer,
} from "../../BM/Reports/ManHourReport/SubComponents/CommonFiltrationComponent";

import MasterLogTable from "./MasterLogTable";
import { useLocation } from "react-router-dom";
import { MuiNavigateBack } from "../ButtonComponents/CustomHooksForBackNavigation";
import { CSVLink } from "react-csv";

const MasterLogInnerComponent = () => {
  const [reduceState, reducerDispatch] = useReducer(
    reducer,
    initialState("Yes")
  );
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const [csvDataOfMasterLog, setCsvDataOfMasterLog] = useState([]);

  // Held steady across renders because it is the CSV's header list, and
  // rebuilding it would rebuild the CSV with it - see csvLink below.
  const columns = useMemo(
    () => [
    {
      label: "Month",
      key: "month",
    },
    {
      label: "Date",
      key: "date",
    },
    {
      label: "Cell",
      key: "cell",
    },
    {
      label: "Line",
      key: "line",
    },
    {
      label: "Machine",
      key: "machine_name",
    },
    {
      label: "Machine No",
      key: "machine_code",
    },
    {
      label: "Shift",
      key: "shift",
    },

    {
      label: "Category",
      key: "maintenanceType",
    },
    {
      label: "Time",
      key: "time",
    },
    {
      label: "Problem",
      key: "problem",
    },
    {
      label: "Cause Why1",
      key: "cause.why1",
    },
    {
      label: "Cause Why2",
      key: "cause.why2",
    },
    {
      label: "Cause Why3",
      key: "cause.why3",
    },
    {
      label: "Cause Why4",
      key: "cause.why4",
    },
    {
      label: "Cause Why5",
      key: "cause.why5",
    },
    {
      label: "Action",
      key: "action",
    },
    {
      label: "Counter Measure",
      key: "counterMeasure",
    },
    {
      label: "Problem Category",
      key: "category[0].subCategory",
    },
    {
      label: "Breakdown Category",
      key: "category[1].subCategory",
    },
    {
      label: "Is Action Temporary?",
      key: "actionTemporaryOrNot",
    },
    {
      label: "First Time/ Repeat",
      key:"firstTimeOrRepeat"
    },
    {
      label: "Done By",
      key: "doneBy",
    },
    {
      label: "Status",
      key: "status",
    },
    ],
    [],
  );

  /**
   * Built once per data change rather than once per render.
   *
   * react-csv serialises the whole table into a data: URI inside CSVLink's
   * own render - for the plant view that is 19,489 rows and 23 columns, redone
   * every time anything in this component re-rendered, including each filter
   * change in the toolbar beside it. Holding the element in a memo leaves the
   * download exactly as it was and does that work only when the rows change.
   */
  const csvLink = useMemo(
    () => (
      <CSVLink
        headers={columns}
        className="downloadCSV text-decoration-none"
        data={csvDataOfMasterLog ? csvDataOfMasterLog : []}
        filename={`Master_Log`}
        style={{ textDecoration: "none", color: "white" }}
      >
        CSV
      </CSVLink>
    ),
    [columns, csvDataOfMasterLog],
  );

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
                    yearFiltration
                    sectionFiltration
                    subSectionFiltration
                    cellFiltration
                    lineFiltration
                    machineFiltration
                    resetButtonFiltration
                    isWithLocalStorageForFiltration="Yes"
                  />
                  <div className="col-auto">{csvLink}</div>
                </>
              }
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <MasterLogTable
              {...reduceState}
              setCsvDataOfMasterLog={setCsvDataOfMasterLog}
            />
          </Col>
        </Row>
      </Box>
    </Container>
  );
};
const MasterLogMainDashboard = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  // for (const [key, value] of searchParams.entries()) {
  //   console.log(`${key}, ${value}`);
  // }
  // console.log(searchParams.get("machine"));

  if (search) {
    return (
      <Container fluid>
        <Box>
          <Row>
            <Col>
              <ReportTitleBar
                title="Master Log"
                PreTools={<MuiNavigateBack />}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <MasterLogTable
                flagForTogglingFilter="based-on-machine"
                selectedValue={searchParams.get("machine")}
                selectedYear={searchParams.get("selectedYear")}
                selectedMonth={searchParams.get("selectedMonth")}
              />
            </Col>
          </Row>
        </Box>
      </Container>
    );
  }
  return <MasterLogInnerComponent />;
};

export default MasterLogMainDashboard;
