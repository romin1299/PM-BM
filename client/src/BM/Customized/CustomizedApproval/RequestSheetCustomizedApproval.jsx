import React, { useEffect, useContext, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM } from "./GlobalApprovalList";
import { useForm } from "react-hook-form";
import { SuccessToast, WarningToast } from "../../Component/ShowTostify";
import { ToastContainer } from "react-toastify";
import RoutingContext from "../../../context/routing/RoutingContext";
import { Box } from "@mui/system";

const RequestSheetCustomizedApproval = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({});

  const context = useContext(RoutingContext);

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
      <ToastContainer />
      <div>
        <form onSubmit={handleSubmit(dynamicApprovalFlowOfRequestSheetOfBM)}>
          {/* <Row className="m-1">
            <Col className="cell m-2"> */}
          <h4>Approval selection </h4>
          <Row>
            <Col className="cell m-2">
              <p>Minor BD Approval Selection</p>
              {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
                return (
                  <>
                    <input
                      type="checkbox"
                      name={obj?.value}
                      value={obj?.value}
                      id={`inline-checkbox-${obj?.key}`}
                      {...register("minorApprovalList", {
                        required: "Please select approval list",
                      })}
                    />{" "}
                    &nbsp;
                    <label>{obj?.value}</label> <br />
                  </>
                );
              })}
              {errors?.["minorApprovalList"] && (
                <p>{errors?.["minorApprovalList"]?.message}</p>
              )}
            </Col>
            <Col className="cell m-2">
              <p>Major BD Approval Selection</p>
              {APPROVAL_LIST_OF_MINOR_MAJOR_OF_BM.map((obj, idx) => {
                return (
                  <>
                    <input
                      type="checkbox"
                      name={obj?.value}
                      value={obj?.value}
                      id={`inline-checkbox-${obj?.key}`}
                      {...register("majorApprovalList", {
                        required: "Please select approval list",
                      })}
                    />{" "}
                    &nbsp;
                    <label>{obj?.value}</label> <br />
                  </>
                );
              })}
              {errors?.["majorApprovalList"] && (
                <p>{errors?.["majorApprovalList"]?.message}</p>
              )}
            </Col>
          </Row>

          <Box sx={{ display: "flex", justifyContent:"center" }}>
            <button type="submit" className="btn bg-button ">
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
