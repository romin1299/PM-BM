import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { Row, Col, Container, Form } from "react-bootstrap";
import axios from "axios";

const ExistinngMachineReqSheetForOperator = ({ cmSelectedSheetForView }) => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      dummyText1: "",
      dummyText2: "",
      dummyText3: "",
      options: "No",
      mtdHOS: "",
      mtdHOSS: "",
    },
  });
  console.log(cmSelectedSheetForView);
  const showMTDHOSS = watch("options") === "Yes";

  const [MTDHOSList, setMTDHOSList] = useState([]);
  const [MTDTLList, setMTDTLList] = useState([]);

  const getApprovalListOfCM = async () => {
    try {
      const response = await axios.get(
        `/getMachineDetailsOnScanningRequest/?machine_code=${cmSelectedSheetForView?.machine?.machine_code}&current_year=${cmSelectedSheetForView?.preAggregationTimeStampOfRequestSheet?.current_year}`
      );
      console.log(response);
      setMTDHOSList(response?.data?.requestSheetApprovalList?.mtdHOS);
      setMTDTLList(response?.data?.requestSheetApprovalList?.mtdTL);
      console.log(MTDHOSList, MTDTLList);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getApprovalListOfCM();
  }, []);

  const onSubmit = async (requestSheetDataOfCM) => {
    try {
      const formData = new FormData();
      const { ...otherFields } = requestSheetDataOfCM;
      for (
        let i = 0;
        i < requestSheetDataOfCM?.attachedFilesByAssignedUser?.length;
        i++
      ) {
        formData.append(
          "attachedFilesByAssignedUser",
          requestSheetDataOfCM?.attachedFilesByAssignedUser[i]
        );
      }
      // console.log(otherFields)

      formData.append(
        "otherData",
        JSON.stringify({
          ...otherFields,
          assignApprovalListOfTL: {
            id: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?._id,
            name: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?.tm_name,
            email: MTDTLList?.[requestSheetDataOfCM?.mtdTL]?.email,
          },
          assignApprovalListOfHOS: {
            id: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?._id,
            name: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?.tm_name,
            email: MTDHOSList?.[requestSheetDataOfCM?.mtdHOS]?.email,
          },
        })
      );

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.patch(
        `/sendApprovalForRequestSheetOfCM/${cmSelectedSheetForView?._id}/${cmSelectedSheetForView?.machine?.machine_code}`,
        formData,
        config
      );

      console.log(response);
      if (response.status === 200) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Row className="m-0 border d-flex align-items-center">
          <Col lg={5}>
            <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
              <b>Dummy 1: </b>
            </p>
          </Col>

          <Col lg={7}>
            <div className="d-block align-items-center">
              {" "}
              <input
                type="text"
                id="id"
                className="m-1 mb-2"
                style={{ width: "350px" }}
                {...register("dummyText1", {
                  required: "Please enter activity",
                })}
              />
            </div>
            {/* {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM && (
              <p className="text-error">
                {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM?.message}
              </p>
            )} */}
          </Col>
          <Col lg={5}>
            <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
              <b>Dummy 1: </b>
            </p>
          </Col>

          <Col lg={7}>
            <div className="d-block align-items-center">
              {" "}
              <input
                type="text"
                id="id"
                className="m-1 mb-2"
                style={{ width: "350px" }}
                {...register("dummyText2", {
                  required: "Please enter activity",
                })}
              />
            </div>

            {/* {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM && (
              <p className="text-error">
                {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM?.message}
              </p>
            )} */}
          </Col>
          <Col lg={5}>
            <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
              <b>Dummy 1: </b>
            </p>
          </Col>
          <Col lg={7}>
            <div className="d-block align-items-center">
              {" "}
              <input
                type="file"
                id="id"
                className="m-1 mb-2"
                style={{ width: "350px" }}
                {...register("attachedFilesByAssignedUser", {
                  required: "Please enter activity",
                })}
              />
            </div>

            {/* {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM && (
              <p className="text-error">
                {errors?.cmBasicDataFilledByMTD_TL?.activityOfCM?.message}
              </p>
            )} */}
          </Col>
          <Col className="border p-2">
            <small className="mb-0 d-flex align-items-center justify-content-start">
              <b>MTD HOS Permission</b>&nbsp;&nbsp;&nbsp;
            </small>
          </Col>
          <Col className="border d-flex align-items-center">
            <Form>
              {["radio"].map((type) => (
                <div key={`inline-${type}`} className="d-block">
                  <Form.Check
                    flex
                    label="Yes"
                    name="group1"
                    type={type}
                    id={`inline-${type}-1`}
                    value="Yes"
                    {...register("isPermissionOfHOSS", {
                      required: "Please select MTD HOSS Permission",
                    })}
                  />
                  <Form.Check
                    flex
                    label="No"
                    name="group1"
                    type={type}
                    id={`inline-${type}-2`}
                    value="No"
                    {...register("isPermissionOfHOSS", {
                      required: "Please select  MTD HOSS Permission",
                    })}
                  />
                </div>
              ))}
              {/* {errors?.["qualityRelated"] && (
                        <p className="text-error">
                          {errors?.["qualityRelated"]?.message}
                        </p>
                      )} */}
            </Form>
          </Col>
        </Row>
        <Row className="m-0 border d-flex align-items-center">
          <Col lg={5}>
            <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
              <b>Select MTD TL/HOSS: </b>
            </p>
          </Col>
          <Col md={3}>
            <FormControl fullWidth>
              <InputLabel size="small">Select MTD HOSS</InputLabel>
              <Select
                {...register("mtdTL")}
                size="small"
                label="Select MTD TL/HOSS"
              >
                {MTDTLList?.map((obj, idx) => (
                  <MenuItem value={idx}>{obj?.tm_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Col>
          {watch("isPermissionOfHOSS") === "Yes" && (
            <>
              <Col lg={5} className="mt-3">
                <p className="mb-0 pt-1" style={{ fontSize: "12px" }}>
                  <b>Select MTD TL/HOSS: </b>
                </p>
              </Col>
              <Col md={3} className="mt-3">
                <FormControl fullWidth>
                  <InputLabel size="small">Select MTD HOS</InputLabel>
                  <Select
                    {...register("mtdHOS")}
                    label="Select MTD HOS"
                    size="small"
                  >
                    {MTDHOSList?.map((obj, idx) => (
                      <MenuItem value={idx}>{obj?.tm_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Col>
            </>
          )}
        </Row>

        <Row className="m-0 border  d-flex align-items-center justify-content-center">
          <Col lg={12} className="d-flex justify-content-center">
            <Button type="submit" variant="contained" color="primary">
              Send For Approval
            </Button>
          </Col>
        </Row>
      </form>
    </>
  );
};

export default ExistinngMachineReqSheetForOperator;
