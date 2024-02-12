import React, { useEffect, useState, useReducer, useContext } from "react";

import { Container, Row, Col } from "reactstrap";

import BDHoursVsCountChart from "./Charts/BDHoursVsCountChart";
import FilterComponent from "./FilterComponent";
import { Box, Divider, Typography } from "@mui/material";

import { MonthDropdown } from "../ManHourReport/SubComponents/LineSelectionDropdown";
import { FilterMenu } from "../MTTRReport/SubComponents/FilterMenu";
import { DynamicFiltersMenu } from "./DynamicFiltersMenu";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import Loading from "../../../components/Loading/Loading";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";
import RoutingContext from "../../../context/routing/RoutingContext";

const BDHoursVsCountComponent = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  filterValues,
  userDetails,
  // selectedMonth,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = useState();
  const loggedUserDetails = useContext(RoutingContext);
  const initialState = {
    labels: [],

    BDhours: [
      {
        groupId: "",
        sumOfBDhours: [],
      },
    ],

    BDCount: [
      {
        groupId: "",
        count: [],
      },
    ],

    totalBDCount: [
      {
        groupId: "",
        count: [],
      },
    ],

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET: "get-BDHours-vs-count-report-data",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET:
        let obj = {};
        if (action?.purpose === "hours-filter") {
          obj = {
            BDhours: action?.BDHoursVsCountData?.BDhours,
          };
        } else if (action?.purpose === "count-filter") {
          obj = {
            BDCount: action?.BDHoursVsCountData?.BDCount,
          };
        } else {
          obj = {
            totalBDCount: action?.BDHoursVsCountData?.BDCount,
            BDhours: action?.BDHoursVsCountData?.BDhours,
            BDCount: [
              {
                groupId: "",
                count: [],
              },
            ],
          };
        }
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          labels: action?.labels,
          ...obj,
        };

      default:
        return state;
    }
  };

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    flagForTogglingFilter,
    filterValues,
    selectedValue
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

 

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getBDhoursVsCountReportData = async ({ purpose, data }) => {
    setLoading(true);

    try {
      const res = await fetch(
        // `/getBDhoursVsCountDataFunction/${purpose}/${flagForTogglingFilter}/63317dbe1d1becfedab337e4/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        `/getBDhoursVsCountDataFunction/${purpose}/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const { message, labels, BDHoursVsCountData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET,
          message,
          labels,
          BDHoursVsCountData,
          purpose,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Machines", "Hour Groups", "Hours", "Count Groups", "Count"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [
      //     reduceState.BDHoursVsCountData?.labels,
      //     reduceState.BDHoursVsCountData?.data,
      //   ],
      // ];

      let bodyData = [];
      let filterData = [];


      if (fileType === "csv") {
        bodyData = [
          // ["Filters", ...filterHeaders]?.toString() + "\n",
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          ["Machines", "", ...reduceState?.labels]?.toString() + "\n",

          [
            ["Hour Groups" + "\n"],
            reduceState?.BDhours.map(
              (lab) => [lab.groupId, lab.sumOfBDhours]?.toString() + "\n"
            ),
          ],

          ["\n"],

          [
            ["Count Groups" + "\n"],
            reduceState?.BDCount.map(
              (lab) => [lab.groupId, lab.count]?.toString() + "\n"
            ),
          ],
          ["\n"],
          [
            ["Total Count" + "\n"],
            reduceState?.totalBDCount.map(
              (lab) => [lab.groupId, lab.count]?.toString() + "\n"
            ),
          ],
        ];
      } else {
        bodyData = [
          // "BDHours",
          [
            reduceState?.labels.join("\n"),
            reduceState?.BDhours.map((lab) => lab.groupId).join("\n"),
            reduceState?.BDhours.map((data) => data.sumOfBDhours).join("\n"),
            reduceState?.BDCount.map((lab) => lab.groupId).join("\n"),
            reduceState?.BDCount.map((data) => data.count).join("\n"),
          ],
        ];
      }

      downloadFile(
        undefined,
        bodyData,
        fileType,
        header,
        `Bd_Hours_Vs_Count_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  // console.log(reduceState);

  useEffect(() => {
    if (selectedValue) {
      getBDhoursVsCountReportData({
        purpose: "by-default",
        data: {},
      });
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="BD Hours Vs Count"
        Toolbar={
          <>
            <Col className="col-auto d-flex gap-2">
              {/* <DynamicFiltersMenu
              getBDhoursVsCountReportData={getBDhoursVsCountReportData}
              selectedValue={selectedValue}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            /> */}
              <MonthDropdown
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            </Col>

            <div className="col-auto">
              <ChartDownloadMenu
                handleDownloadCSV={() => {
                  handleDownload("csv");
                }}
                handleDownloadPDF={() => {
                  handleDownload("pdf");
                }}
              />
            </div>
          </>
        }
      />

      <FilterComponent
        getBDhoursVsCountReportData={getBDhoursVsCountReportData}
        selectedValue={selectedValue}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
      {loading ? (
        <Loading height={300} sx={{ mt: 2 }} />
      ) : (
        <BDHoursVsCountChart
          totalBDCount={reduceState?.totalBDCount}
          BDCount={reduceState?.BDCount}
          BDhours={reduceState?.BDhours}
          labels={reduceState?.labels}
        />
      )}
    </Box>
  );
};

export default BDHoursVsCountComponent;
