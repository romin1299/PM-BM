import React, { useEffect, useState, useReducer } from "react";
import LineChart from "../Common/LineChart";
import { useForm } from "react-hook-form";
import { Container, Row, Col } from "react-bootstrap";

import BarChart from "./Chart/BarChart";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";

const MTBFMachineTrend = ({ selectedValue, flagForCellAndLineToggle }) => {
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

  const getMachineWiseMTBFTrendDataData = async () => {
    try {
      const res = await fetch(
        `/getMachineWiseMTBFTrendDataData/${flagForCellAndLineToggle}/632c41261d1becfedab325f9`,
        // `/getMachineWiseMTBFTrendDataData/${flagForCellAndLineToggle}/${selectedValue}`,
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
    getMachineWiseMTBFTrendDataData();
    if (selectedValue) {
    }
  }, [selectedValue]);

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

  return (
    <Container fluid>
      <Row>
        <BarChart
          title="Machine Trend"
          dataset={reduceState?.MachineWiseMTBFTrendData}
          setValue={setValue}
          clearErrors={clearErrors}
        />
      </Row>

      <form
        onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedMachine)}
        className="pt-1 d-flex align-items-center justify-content-end"
      >
        <Row>
          <Col>
            {errors?.["selectedMachine"] && (
              <p className="text-error">
                {errors?.["selectedMachine"]?.message}
              </p>
            )}
            {watch("selectedMachine.machine_code")}
          </Col>
        </Row>
        <Row>
          <Col>
            <input
              type="date"
              {...register("selectedDate", {
                required: "Please select date",
              })}
            />
            {errors?.["selectedDate"] && (
              <p className="text-error">{errors?.["selectedDate"]?.message}</p>
            )}
          </Col>
          <Col>
            <button type="submit" className="btn bg-button ">
              Go
            </button>
          </Col>
        </Row>
      </form>

      <Row>
        <BDRequestSheetTable requestSheetData={reduceState?.requestSheetData} />
      </Row>
    </Container>
  );
};

export default MTBFMachineTrend;
