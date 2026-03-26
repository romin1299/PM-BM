import React, { useReducer, useContext } from "react";
import { Container, Row, Col } from "react-bootstrap";

import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import MTTRTrend from "./MTTRTrend";
import TMProgress from "./TMProgress";
import ReportTitleBar from "../Common/ReportTitleBar";
import {
  ACTION,
  initialState,
  reducer,
} from "../ManHourReport/SubComponents/CommonFiltrationComponent";
import TmMttrSkillScore from "./TmMttrSkillScore";
import Checkbox from "@mui/material/Checkbox";
import DownloadMenu from "../ManHourReport/SubComponents/DownloadMenu";
import { EXPORT_REPORT, exportPPTX } from "../../Utils/ExportPPTX/exportPPTX";
import TmMttrSkillScoreCrud from "./TMMttrSkillScoreCrud";
import axios from "axios";
import downloadFile from "../../../util";
import RoutingContext from "../../../context/routing/RoutingContext";
import findFilters from "../../../filterNames";

const TMMTRMain = () => {
  const [loading, setLoading] = React.useState(true);

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState());
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  // const [mbdIncluded, setMbdIncluded] = React.useState(false);
  const [tmId, setTmId] = React.useState("");
  const [timeFilter, setTimeFilter] = React.useState(2);
  const timeFilterRef = React.useRef(null);
  const userDetails = useContext(RoutingContext);

  // const handleChange = (event) => {
  //   setMbdIncluded(event.target.checked);
  // };

  // const MBDCheckBox = (
  //   <Col className="col-auto justify-content-center align-items-center d-flex">
  //     <FormControlLabel
  //       control={
  //         <Checkbox
  //           sx={{
  //             color: "#004b5b",
  //             "&.MuiCheckbox-root": { p: "4px", mr: "4px", ml: "10px" },
  //             "&.Mui-checked": { color: "#004b5b" },
  //           }}
  //           checked={mbdIncluded}
  //           onChange={handleChange}
  //         />
  //       }
  //       label="Include MBD"
  //     />
  //   </Col>
  // );

  const TimeFilterInput = (
    <Col className="col-auto">
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {/* <p style={{ fontSize: "1rem" }}>Time:</p> */}
        <Typography variant="body1" fontSize={16}>
          Time:
        </Typography>
        <TextField
          type="number"
          id="outlined-basic"
          // sx={{ width: "80px" }}
          variant="outlined"
          sx={{
            // width: "12ch",
            width: "6rem",
            pl: 0,
            "&.MuiFormControl-root": { bgcolor: "#c9c6c65c" },
            "& .MuiInputBase-input": { bgcolor: "white" },
            "& .MuiTypography-root": { m: 0, fontSize: 14 },
            "& .MuiOutlinedInput-input": { p: "6px 8px" },
          }}
          InputProps={{
            sx: { fontSize: 14 },
            endAdornment: <InputAdornment position="end">Hr</InputAdornment>,
          }}
          inputRef={timeFilterRef}
          size="small"
          // onChange={(e) => {
          //   setTimeFilter(e.target.value);
          // }}
          // value={timeFilter}
          defaultValue={2}
        />
        <Button
          // size="small"
          disableElevation
          type="submit"
          className="bg-button"
          variant="contained"
          sx={{
            minWidth: "30px",
            height: "32px",
            paddingInline: "10px",
          }}
          onClick={() => {
            // console.log("timeFilterRef.current:", timeFilterRef.current.value);
            setTimeFilter(timeFilterRef.current.value);
          }}
        >
          Go
        </Button>
      </Box>
    </Col>
  );

  const [userWiseData, setUserWiseData] = React.useState({
    tm_names: [],
    data: [],
    pieChartData: [
      {
        tm_name: "",
        tm_no: 0,
        score: 0,
      },
    ],
  });

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    reduceState?.flagForTogglingFilter,
    reduceState,
    reduceState?.selectedValue
  );

  let arrayItems;
  let filterHeaders;

  if (userDetails.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      userDetails?.section_data.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

  const fetchChartData = async () => {
    setLoading(true);

    // console.log("timeFilter:", timeFilter);
    const url = `/mttrTrend/tmMTTRSkill/${reduceState?.flagForTogglingFilter}/${reduceState?.selectedValue}/?selectedSection=${reduceState?.selectedSection}&&selectedSubSection=${reduceState?.selectedSubSection}`;

    const params = {
      selectedYear: reduceState?.selectedYear,
      time: timeFilter,
      // includeMBD: mbdIncluded ? "include-mbd" : "",
    };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });

      setUserWiseData(res?.data?.data);
    } catch (error) {
      console.log("error:", error);
    }

    setLoading(false);
  };

  const header = ["TM Names", "Hours"];
  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[userWiseData?.tm_names, userWiseData?.data]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems] + "\n",
          ["\n"],
          [["TM Names"].concat(userWiseData?.tm_names)?.toString() + "\n"],
          [["Hours"].concat(userWiseData?.data)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [userWiseData?.tm_names.join("\n"), userWiseData?.data.join("\n")],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `TM_MTTR_${reduceState?.selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  React.useEffect(() => {
    if (reduceState?.selectedValue) fetchChartData();
  }, [reduceState?.selectedValue, reduceState?.selectedYear, timeFilter]);

  return (
    <Container fluid>
      <Box>
        <ReportTitleBar
          title="TM MTTR Skill"
          Toolbar={
            <>
              <ChartsToolbar
                baseUrlForFiltering={baseUrlForFiltering}
                reduceState={reduceState}
                reducerDispatch={reducerDispatch}
                yearFiltration
                sectionFiltration
                subSectionFiltration
                cellFiltration
                lineFiltration
                resetButtonFiltration
              />

              <Col className="col-auto">
                <DownloadMenu
                  handleDownloadPPTX={() => {
                    exportPPTX(EXPORT_REPORT.TM_MTTR_SKILL, {
                      ...reduceState,
                      timeFilter,
                      tmId,
                    });
                  }}
                />
              </Col>

              {/* {MBDCheckBox} */}
              {TimeFilterInput}
            </>
          }
        />

        <Row className="mt-3">
          <Col md={12} lg={6}>
            <MTTRTrend
              {...userWiseData}
              loading={loading}
              onClickDownload={handleDownload}
            />
          </Col>

          <Col md={12} lg={6}>
            <TMProgress
              {...reduceState}
              timeFilter={timeFilter}
              tmId={tmId}
              setTmId={setTmId}
              userDetails={userDetails}
              reduceState={reduceState}
            />
          </Col>

          <Col md={12} style={{ marginTop: "1rem" }}>
            <TmMttrSkillScore
              {...reduceState}
              loading={loading}
              pieChartData={userWiseData?.pieChartData}
            />
          </Col>

          {/* <Col
            md={12}
            style={{ marginTop: "1rem", paddingBottom: "4rem" }}
          ></Col> */}
        </Row>
      </Box>
    </Container>
  );
};

export default TMMTRMain;
