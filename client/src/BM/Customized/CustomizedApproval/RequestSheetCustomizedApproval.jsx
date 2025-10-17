import React, { useEffect, useContext, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM } from "./GlobalApprovalList";
import { useForm } from "react-hook-form";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import { ToastContainer } from "react-toastify";
import RoutingContext from "../../../context/routing/RoutingContext";
import { Box } from "@mui/system";
import { Divider, Typography } from "@mui/material";
import ChartTitleBar from "../../Reports/Common/ChartTitleBar";

const RequestSheetCustomizedApproval = ({notEditable}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({});

  const context = useContext(RoutingContext);
  console.log("For update----");


  const dynamicApprovalFlowOfRequestSheetOfBM = async (approvalList) => {
    try {
      const res = await fetch(`/addDynamicApprovalListOfBM`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvalListOfMinorAndMajor: approvalList,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        SuccessToast(data?.message);
      } else {
        WarningToast(data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCustomizedDataOfBM = async () => {
    try {
      const res = await fetch(`/displayPlant/${context?.plant_data}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      setValue(
        "minorApprovalList",
        data?.approvalListOfMinorAndMajor?.minorApprovalList
      );
      setValue(
        "majorApprovalList",
        data?.approvalListOfMinorAndMajor?.majorApprovalList
      );
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getCustomizedDataOfBM();
  }, []);

  return (
    <div className="cell p-3">
      {/* <ToastContainer /> */}
      <div>
        <form onSubmit={handleSubmit(dynamicApprovalFlowOfRequestSheetOfBM)}>
          {/* <Row className="m-1">
            <Col className="cell m-2"> */}

          {/* <h4>Approval selection </h4> */}
          <ChartTitleBar title="Approval selection" />

          <Row>
            <Col className="cell m-2 p-2">
              <h6 style={{ marginLeft: "0px" }}>
                Minor BD Approval Selection (
                <span className="text-success">{"<"} 2 Hrs.</span>)
              </h6>
              {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
                return (
                  <>
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        name={obj?.value}
                        value={obj?.value}
                        id={`inline-checkbox-${obj?.key}`}
                        {...register("minorApprovalList", {
                          required: "Please select approval list",
                        })}
                        disabled={notEditable}
                      />{" "}
                      &nbsp;
                      <label>{obj?.value}</label> <br />
                    </div>
                  </>
                );
              })}
              {errors?.["minorApprovalList"] && (
                <p>{errors?.["minorApprovalList"]?.message}</p>
              )}
            </Col>
            <Col className="cell m-2 p-2">
              <h6 style={{ marginLeft: "0px" }}>
                Major BD Approval Selection (
                <span className="text-danger">{">"} 2 Hrs.</span>)
              </h6>
              {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
                return (
                  <>
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        name={obj?.value}
                        value={obj?.value}
                        id={`inline-checkbox-${obj?.key}`}
                        {...register("majorApprovalList", {
                          required: "Please select approval list",
                        })}
                        disabled={notEditable}
                      />{" "}
                      &nbsp;
                      <label>{obj?.value}</label> <br />
                    </div>
                  </>
                );
              })}
              {errors?.["majorApprovalList"] && (
                <p>{errors?.["majorApprovalList"]?.message}</p>
              )}
            </Col>
          </Row>

          <Box
            className="m-2"
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <button type="submit" className="btn bg-succ " disabled={notEditable}>
              Submit Approval List
            </button>
          </Box>
          {/* </Col>
          </Row> */}
        </form>
      </div>
    </div>
  );
};

export default RequestSheetCustomizedApproval;
