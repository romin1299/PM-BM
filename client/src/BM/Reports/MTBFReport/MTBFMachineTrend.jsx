import React, { useEffect, useState, useReducer } from "react";
import LineChart from "../Common/LineChart";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";

import BarChart from "./Chart/BarChart";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import { Box, Button, InputAdornment, TextField } from "@mui/material";

const MTBFMachineTrend = ({
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  selectedMonth,
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

  const initialState = {
    MachineWiseMTBFTrendData: {
      machineId: [],
      labels: [],
      data: [],
    },

    requestSheetData: [],

    documentLimitInTheGraph: 20,

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET_MACHINE_MTTR: "get-machineWise-MTTR-data",
    GET_RS_DATA: "get-requestSheet-data-based-on-selectedMachine",
    HANDLE_SELECTED_MACHINE: "handle-selected-machine",
    HANDLE_CHANGE_LIMIT: "handle-change-of-document-limit",
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

      case ACTION?.HANDLE_CHANGE_LIMIT:
        return {
          ...state,
          documentLimitInTheGraph: action?.documentLimitInTheGraph,
        };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getMachineWiseMTBFTrendDataData = async () => {
    try {
      const res = await fetch(
        // `/getMachineWiseMTBFTrendDataData/${flagForTogglingFilter}/632c41261d1becfedab325f9`,
        `/getMachineWiseMTBFTrendDataData/${flagForTogglingFilter}/${selectedValue}/?selectedYear=${selectedYear}&&selectedMonth=${selectedMonth}&&documentLimitInTheGraph=${reduceState?.documentLimitInTheGraph}`,
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
    <Col  className="col-auto">
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
            reducerDispatch({
              type: ACTION.HANDLE_CHANGE_LIMIT,
              documentLimitInTheGraph: e.target.value,
            });
          }}
          value={reduceState?.documentLimitInTheGraph}
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
          dataset={reduceState?.MachineWiseMTBFTrendData}
          setValue={setValue}
          clearErrors={clearErrors}
          AppendToolComponents={TopDataFilterInput}
        />
      </Row>

      <Row>
        <Col className="cell p-3">
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
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MTBFMachineTrend;
