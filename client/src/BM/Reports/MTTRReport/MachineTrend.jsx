import React, { useEffect, useReducer } from "react";
import LineChart from "../Common/LineChart";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";

import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import { Box } from "@mui/system";
import { Button, InputAdornment, TextField } from "@mui/material";

const MachineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
  documentLimitInTheGraph,
  setDocumentLimitInTheGraph,
}) => {
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

  const [loading, setLoading] = React.useState(true);

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

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMachineWiseMTTRTrendData = async () => {
    setLoading(true);

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

    setLoading(false);
  };

  useEffect(() => {
    if (selectedValue) {
      getMachineWiseMTTRTrendData();
    }
  }, [selectedValue, selectedYear, selectedMonth]);

  const getRequestSheetDataBasedOnSelectedMachine = async (data) => {
    console.log("form data:", data);

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
  );

  return (
    <Container fluid>
      <Row>
        <LineChart
          title="Machine Trend"
          loading={loading}
          dataset={reduceState?.MachineWiseMTTRTrend}
          setValue={setValue}
          clearErrors={clearErrors}
          AppendToolComponents={TopDataFilterInput}
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
            className="pt-1 d-flex align-items-center justify-content-end gap-2"
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
            downloadFileName={"MTTR trend"}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MachineTrend;
