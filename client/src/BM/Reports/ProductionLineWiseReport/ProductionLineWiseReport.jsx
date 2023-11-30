import React, { useEffect, useReducer } from "react";
import { Container, Row, Col } from "reactstrap";
import { useForm } from "react-hook-form";

import DailyBDTrendChart from "../DailyBreakdownTrend/DailyBDTrendChart";
import BDRequestSheetTable from "../Common/DailyBDRequestSheetTable";
import BDHoursVsCountComponent from "./BDHoursVsCountComponent";
import MTTRComponent from "./MTTRComponent";
import MTBFComponent from "./MTBFComponent";
import BDhours from "./BDhours";

const ProductionLineWiseReport = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({});

  const initialState = {
    cellData: [],

    selectedValue: "",
    flagForCellAndLineToggle: "based-on-cell",

    requestSheetData: [],

    message: "",
    isLoading: true,
    isError: false,
  };

  const ACTION = {
    GET_CELL_INFO: "get-cell-dropdown-data",
    GET_RS_DATA: "get-requestSheet-data-based-on-selected-date",
  };

  const reducer = (state, action) => {
    switch (action?.type) {
      case ACTION?.GET_CELL_INFO:
        return {
          ...state,
          isLoading: false,
          message: action?.message,
          cellData: action?.cellData,
          selectedValue: action?.selectedCell,
        };

      case ACTION?.GET_RS_DATA:
        return {
          ...state,
          requestSheetData: action?.requestSheetData,
        };

      // case ACTION?.SELECT_CELL:
      //   return {
      //     ...state,
      //     selectedCell: action?.selectedCell,
      //     selectedValue: action?.selectedCell,
      //     selectedLine: "",
      //   };

      // case ACTION?.SELECT_LINE:
      //   return {
      //     ...state,
      //     selectedLine: action?.selectedLine,
      //     selectedValue: action?.selectedLine,
      //   };

      // case ACTION?.SELECT_SUBSECTION:
      //   return {
      //     ...state,
      //     selectedSubSection: action?.selectedSubSection,
      //     selectedCell: "",
      //     selectedLine: "",
      //   };

      // case ACTION?.SELECT_CELL:
      //   return {
      //     ...state,
      //     selectedCell: action?.selectedCell,
      //     selectedLine: "",
      //   };

      // case ACTION?.SELECT_LINE:
      //   return {
      //     ...state,
      //     selectedLine: action?.selectedCell,
      //   };

      // case ACTION?.RESET_DROPDOWN_VALUE:
      //   return {
      //     ...state,
      //     selectedSubSection: "",
      //     selectedCell: "",
      //     selectedLine: "",
      //   };

      default:
        return state;
    }
  };

  const [reduceState, reducerDispatch] = useReducer(reducer, initialState);

  const getProductionLineWiseReportData = async () => {
    try {
      const res = await fetch("/getCellDropdownValueBasedOnDashboardLevel", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const { message, selectedCell, cellData } = await res.json();

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_CELL_INFO,
          cellData,
          selectedCell,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getProductionLineWiseReportData();
  }, []);

  const getRequestSheetDataBasedOnSelectedDate = async (data) => {
    try {
      const res = await fetch(
        `/getRequestSheetDataBasedOnSelectedDate/${reduceState?.flagForCellAndLineToggle}/632c41261d1becfedab325f9/${data?.selectedDate}`,
        // `/getMTTRGraphData/${reduceState?.flagForCellAndLineToggle}/${reduceState?.selectedValue}/${data?.selectedDate}`,
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
      <form
        onSubmit={handleSubmit(getRequestSheetDataBasedOnSelectedDate)}
        className="pt-1 d-flex align-items-center justify-content-end"
      >
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
        <Col>
          <DailyBDTrendChart
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <BDRequestSheetTable
            requestSheetData={reduceState?.requestSheetData}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <BDhours
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <MTTRComponent
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
        <Col>
          <MTBFComponent />
        </Col>
      </Row>
      <Row>
        <Col>
          <BDHoursVsCountComponent
            selectedValue={reduceState?.selectedValue}
            flagForCellAndLineToggle={reduceState?.flagForCellAndLineToggle}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ProductionLineWiseReport;
