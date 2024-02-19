import React, { useEffect, useState, useReducer } from "react";
import LineChart from "../Common/LineChart";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";

import BarChart from "./Chart/BarChart";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import downloadFile from "../../../util";
import { ChartDownloadMenu } from "../Common/ChartTitleBar";
import findFilters from "../../../filterNames";

const MTBFMachineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  documentLimitInTheGraph,
  setDocumentLimitInTheGraph,
  filterValues,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      selectedMachine: {
        _id: "",
        machine_code: "",
      },
      selectedDate: "",
    },
  });

  const initialState = {
    MachineWiseMTBFTrendData: {
      machineId: [],
      labels: [],
      data: [],
    },

    requestSheetData: [],

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET_MACHINE_MTTR: "get-machineWise-MTTR-data",
    GET_RS_DATA: "get-requestSheet-data-based-on-selectedMachine",
    HANDLE_SELECTED_MACHINE: "handle-selected-machine",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET_MACHINE_MTTR:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          MachineWiseMTBFTrendData: action?.MachineWiseMTBFTrendData,
        };

      case ACTION?.GET_RS_DATA:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          requestSheetData: action?.requestSheetData,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

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

  const getMachineWiseMTBFTrendDataData = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/getMachineWiseMTBFTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, data } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_MACHINE_MTTR,
          MachineWiseMTBFTrendData: data,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const header = ["Labels", "Data"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [
      //     reduceState.MachineWiseMTBFTrendData?.labels,
      //     reduceState.MachineWiseMTBFTrendData?.data,
      //   ],
      // ];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems]?.toString() + "\n",
          ["\n"],
          [
            ["Line Names"]
              .concat(reduceState.MachineWiseMTBFTrendData?.labels)
              ?.toString() + "\n",
          ],
          [
            ["Hours"]
              .concat(reduceState.MachineWiseMTBFTrendData?.data)
              ?.toString() + "\n",
          ],
        ];
      } else {
        bodyData = [
          [
            reduceState.MachineWiseMTBFTrendData?.labels.join("\n"),
            reduceState.MachineWiseMTBFTrendData?.data.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTBF_MachineTrend_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMachineWiseMTBFTrendDataData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const getRequestSheetDataBasedOnSelectedMachine = async (data) => {
    try {
      if (data?.selectedMachine?._id === "") {
        return setError("selectedMachine", {
          type: "required",
          message: "Please select machine",
        });
      }
      const res = await fetch(
        `/getRequestSheetDataBasedOnSelectedMachine/${data?.selectedMachine?._id}/${data?.selectedDate}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const { message, requestSheetData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_RS_DATA,
          requestSheetData,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const TopDataFilterInput = (
    <>
      <Col className="col-auto">
        <Box
          component="form"
          sx={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          {/* <p style={{ fontSize: "1rem" }}>Top:</p> */}
          <TextField
            type="number"
            id="outlined-basic"
            // sx={{ width: "80px" }}
            variant="outlined"
            sx={{
              // width: "12ch",
              width: "6rem",
              pl: 0,
              "& .MuiOutlinedInput-root": { pl: 0 },
              "& .MuiOutlinedInput-input": { pt: "6px", pb: "6px" },
            }}
            InputProps={{
              sx: { fontSize: 14 },
              startAdornment: (
                <InputAdornment position="start">TOP</InputAdornment>
              ),
            }}
            size="small"
            onChange={(e) => {
              setDocumentLimitInTheGraph(e.target.value);
            }}
            value={documentLimitInTheGraph}
          />
          <Button
            // size="small"
            disableElevation
            className="bg-button"
            variant="contained"
            sx={{
              minWidth: "30px",
              height: "32px",
              paddingInline: "10px",
            }}
            onClick={getMachineWiseMTBFTrendDataData}
          >
            Go
          </Button>
        </Box>
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
  );

  return (
    <Container fluid>
      <Row>
        {/* <Col>
          Top : &nbsp;
          <input
            type="number"
            value={reduceState?.documentLimitInTheGraph}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_CHANGE_LIMIT,
                documentLimitInTheGraph: e.target.value,
              });
            }}
          />
          &nbsp;
          <button
            className="btn bg-button"
            onClick={getMachineWiseMTBFTrendDataData}
          >
            Go
          </button>
        </Col> */}
        <BarChart
          title="Machine Trend"
          loading={loading}
          dataset={reduceState?.MachineWiseMTBFTrendData}
          setValue={setValue}
          clearErrors={clearErrors}
          AppendToolComponents={TopDataFilterInput}
          onClickDownload={handleDownload}
        />
      </Row>

      <Row>
        <Col className="cell p-3">
          <form
            onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedMachine)}
            className="mb-2 pt-1 d-flex align-items-center justify-content-end gap-2"
          >
            {errors?.["selectedMachine"] && (
              <p className="text-error">
                {errors?.["selectedMachine"]?.message}
              </p>
            )}
            {watch("selectedMachine.machine_code")}

            <input
              type="date"
              {...register("selectedDate", {
                required: "Please select date",
              })}
            />
            {errors?.["selectedDate"] && (
              <p className="text-error">{errors?.["selectedDate"]?.message}</p>
            )}

            {/* <button type="submit" className="btn bg-button ">
              Go
            </button> */}

            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              type="submit"
              sx={{
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
            >
              Go
            </Button>
          </form>

          <BDRequestSheetTable
            requestSheetData={reduceState?.requestSheetData}
            downloadFileName={"MTBF Report"}
            selectedYear={selectedYear}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MTBFMachineTrend;
