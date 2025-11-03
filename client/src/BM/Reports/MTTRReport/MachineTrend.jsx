import React, { useEffect, useReducer } from "react";
import LineChart from "../Common/LineChart";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";

import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import { Box } from "@mui/system";
import { Button, InputAdornment, TextField } from "@mui/material";
import downloadFile from "../../../util";
import { ChartDownloadMenu } from "../Common/ChartTitleBar";
import findFilters from "../../../filterNames";

const MachineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  documentLimitInTheGraph,
  setDocumentLimitInTheGraph,
  filterValues,
  userDetails,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      selectedMachine: {
        _id: "",
        machine_code: "",
      },
      selectedToDate: "",
      selectedFromDate: "",
    },
  });

  const [chartLoading, setChartLoading] = React.useState(true);
  const [tableLoading, setTableLoading] = React.useState(false);

  const initialState = {
    MachineWiseMTTRTrend: {
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
          MachineWiseMTTRTrend: action?.MachineWiseMTTRTrend,
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

  const getMachineWiseMTTRTrendData = async () => {
    setChartLoading(true);

    try {
      const res = await fetch(
        // `/getMachineWiseMTTRTrendData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getMachineWiseMTTRTrendData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${documentLimitInTheGraph}`,
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
          MachineWiseMTTRTrend: data,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }

    setChartLoading(false);
  };

  const header = ["Labels", "Data"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [
      //   [
      //     reduceState.MachineWiseMTTRTrend?.labels.join("\n"),
      //     reduceState.MachineWiseMTTRTrend?.data.join("\n"),
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
              .concat(reduceState.MachineWiseMTTRTrend?.labels)
              ?.toString() + "\n",
          ],
          [
            ["Hours"]
              .concat(reduceState.MachineWiseMTTRTrend?.data)
              ?.toString() + "\n",
          ],
        ];
      } else {
        bodyData = [
          [
            reduceState.MachineWiseMTTRTrend?.labels.join("\n"),
            reduceState.MachineWiseMTTRTrend?.data.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }

      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `MTTR_MachineTrend_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  useEffect(() => {
    if (selectedValue) {
      getMachineWiseMTTRTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const getRequestSheetDataBasedOnSelectedMachine = async (data) => {
    setTableLoading(true);
    try {
      if (data?.selectedMachine?._id === "") {
        setTableLoading(false);

        return setError("selectedMachine", {
          type: "required",
          message: "Please select machine",
        });
      }
      const res = await fetch(
        `/getRequestSheetDataBasedOnSelectedMachine/${
          data?.selectedMachine?._id || data
        }/${data?.selectedToDate}/${data?.selectedFromDate}`,
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

    setTableLoading(false);
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
            onClick={getMachineWiseMTTRTrendData}
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

  useEffect(() => {
    if (
      watch("selectedMachine.machine_code") !== "" ||
      watch("selectedMachine.machine_code" !== undefined)
    ) {
      getRequestSheetDataBasedOnSelectedMachine(watch("selectedMachine._id"));
    }
  }, [watch("selectedMachine.machine_code")]);

  return (
    <Container fluid>
      <Row>
        <LineChart
          title="Machine Trend"
          loading={chartLoading}
          dataset={reduceState?.MachineWiseMTTRTrend}
          setValue={setValue}
          clearErrors={clearErrors}
          AppendToolComponents={TopDataFilterInput}
          onClickDownload={handleDownload}
        />
      </Row>

      <Row>
        <Col className="cell p-3">
          {/* <Box className="pt-1 d-flex align-items-center justify-content-end">
            {errors?.["selectedMachine"] && (
              <p className="text-error">
                {errors?.["selectedMachine"]?.message}
              </p>
            )}
            {watch("selectedMachine.machine_code")}

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <DatePicker
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  sx={{
                    width: "11rem",
                    "& .MuiOutlinedInput-input": { pt: "7px", pb: "7px" },
                  }}
                />

                <Button
                  disableElevation
                  className="bg-button"
                  variant="contained"
                  sx={{
                    minWidth: "30px",
                    // height: "37px"
                  }}
                  onClick={() => {
                    console.log(
                      "date:",
                      date,
                      watch("selectedMachine")
                    );
                  }}
                >
                  Go
                </Button>
              </Box>
            </LocalizationProvider>
          </Box> */}

          <form
            onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedMachine)}
            className="p-1 d-flex align-items-center justify-content-end gap-2"
          >
            {errors?.["selectedMachine"] && (
              <p className="text-error">
                {errors?.["selectedMachine"]?.message}
              </p>
            )}
            {watch("selectedMachine.machine_code")}

            <div>
              <span className="m-1">
                <b>From Date:</b>
              </span>
              <input
                type="date"
                {...register("selectedFromDate", {
                  required: "Please select date",
                })}
              />
              <br />
              {errors?.["selectedFromDate"] && (
                <p className="text-error">
                  {errors?.["selectedFromDate"]?.message}
                </p>
              )}
            </div>
            <div>
              <span className="m-1">
                <b>To Date:</b>
              </span>
              <input
                type="date"
                {...register("selectedToDate", {
                  required: "Please select date",
                })}
              />
              <br />
              {errors?.["selectedToDate"] && (
                <p className="text-error">
                  {errors?.["selectedToDate"]?.message}
                </p>
              )}
            </div>
            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              type="submit"
              sx={{
                ml: 1,
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
            >
              Go
            </Button>

            <Button
              size="small"
              disableElevation
              className="bg-button"
              variant="contained"
              sx={{
                ml: 1,
                minWidth: "30px",
                height: "30px",
                paddingInline: "10px",
              }}
              onClick={() => {
                reduceState.requestSheetData = [];
                reset();
              }}
            >
              Reset
            </Button>
          </form>

          <BDRequestSheetTable
            loading={tableLoading}
            requestSheetData={reduceState?.requestSheetData}
            downloadFileName={"MTTR trend"}
            selectedYear={selectedYear}
            flagForTogglingFilter={reduceState?.flagForTogglingFilter}
            selectedValue={reduceState?.selectedValue}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MachineTrend;
