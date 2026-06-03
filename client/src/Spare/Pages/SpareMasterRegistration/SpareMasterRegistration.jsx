import React, { useContext, useMemo } from "react";
import moment from "moment";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Row, Col, Form, Container, Table } from "react-bootstrap";

import RoutingContext from "../../../context/routing/RoutingContext";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";
import { partFor } from "../../Utils/dropdownUtils";

import "./SpareMasterRegistration.scss";

const url = "/v1/spare/master";

const rowWiseFields = [
  [
    {
      label: "Location",
      fieldName: "location",
      required: "Please enter location",
    },
    {
      label: "Unique ID",
      fieldName: "uniqueID",
      required: "Please enter unique ID",
    },
  ],
  [
    {
      label: "Part name",
      fieldName: "partName",
      required: "Please enter part name",
    },
    {
      label: "Unit",
      fieldName: "unit",
      required: "Please enter unit",
    },
  ],
  [
    {
      label: "Part model no.",
      fieldName: "partModel",
      required: "Please enter part model number",
    },
    {
      label: "Part group",
      fieldName: "partGroup",
      required: "Please enter part group",
    },
  ],
  [
    {
      label: "Maker",
      fieldName: "manufacture",
      required: "Please enter maker",
    },
    {
      label: "Register section",
      fieldName: "registerSection",
      required: "Please enter register section",
    },
  ],
  [
    {
      label: "Supplier",
      fieldName: "supplier",
      required: "Please enter supplier",
    },
    {
      label: "M/C no",
      fieldName: "machine.machine_code",
      required: false,
      disabled: true,
    },
  ],
  [
    {
      label: "Stock Qty",
      fieldName: "stockQty",
      required: "Please enter stock quantity",
      type: "number",
    },
    {
      label: "M/C name",
      fieldName: "machine.machine_name",
      required: false,
      disabled: true,
    },
  ],
  [
    {
      label: "Currency unit",
      fieldName: "currencyUnit",
      required: "Please enter currency unit",
    },
    {
      label: "Vendor group",
      fieldName: "vendorGroup",
      required: "Please enter vendor group",
    },
  ],
  [
    {
      label: "Min qty",
      fieldName: "minQuantity",
      required: "Please enter min quantity",
      type: "number",
    },
    {
      label: "Lead time",
      fieldName: "leadTime",
      required: "Please enter lead time",
      type: "number",
    },
  ],

  [
    {
      label: "Max qty",
      fieldName: "quantityRequired",
      required: "Please enter max quantity",
      type: "number",
    },
    {},
  ],
];

const SpareMasterRegistration = () => {
  const loggedUser = useContext(RoutingContext);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const params = useMemo(
    () => ({
      sheetId: searchParams.get("sheetId"),
      partId: searchParams.get("partId"),
    }),
    [searchParams],
  );

  const {
    register,
    handleSubmit,
    formState: { isLoading, errors, dirtyFields },
    watch,
  } = useForm({
    defaultValues: async () => {
      const { isError, isMasterExist, master } = await axiosGetOrDelete({
        url,
        axiosProps: {
          params,
        },
      });

      if (!isError)
        return {
          ...master,
          isMasterExist,
          dateTime: moment().format("YYYY-MM-DDTHH:mm"),
        };
      return {};
    },
  });

  const dirtyValues = (allValues) => {
    let newVal = {};
    Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
    return newVal;
  };

  const handleNavigation = () => navigate(-1);

  const handleNewMasterRequest = async (formValue, status) => {
    if (watch("isMasterExist") && Object.keys(dirtyFields).length === 0) return;

    let axiosParams = params;

    if (watch("isMasterExist")) {
      axiosParams = { _id: formValue?._id };
      formValue = dirtyValues(formValue);
    }

    formValue["status"] = status;

    const { isError } = await axiosPostOrPatch({
      url,
      apiType: watch("isMasterExist") ? "patch" : "post",
      axiosBody: formValue,
      axiosProps: {
        params: axiosParams,
      },
    });

    if (!isError) return handleNavigation();
  };

  if (isLoading) return <h4>Loading....</h4>;

  return (
    <div className="p-2">
      <Form className="smr-sheet" style={{ fontSize: "16px !important" }}>
        <Table className="m-0">
          <Container fluid>
            <Row className="border">
              <Col className="col-auto">
                <button
                  className="btn bg-button"
                  type="button"
                  onClick={handleNavigation}
                >
                  Back
                </button>
              </Col>
              <Col className="d-flex align-items-center justify-content-center">
                <h5>Tool Room Master Creation for New Parts</h5>
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                <div className="d-flex">
                  {partFor?.map((item) => (
                    <>
                      &nbsp;
                      <Form.Check
                        style={{ fontSize: "14px" }}
                        type="radio"
                        {...item}
                        {...register("whichParts", {
                          required: watch("isMasterExist")
                            ? false
                            : "Please select part use for",
                        })}
                      />
                    </>
                  ))}
                </div>
                {errors?.["whichParts"] && (
                  <p className="text-error mb-1">
                    {errors?.["whichParts"]?.message}
                  </p>
                )}
              </Col>
              <Col className="w-100 d-flex justify-content-between align-items-center size-14">
                <small>DateTime</small>
                <div className="w-75 d-flex flex-column">
                  <input
                    type="dateTime-local"
                    className="w-75"
                    {...register("dateTime", {
                      required: watch("isMasterExist")
                        ? false
                        : "Please enter date time",
                    })}
                  />

                  {errors?.["dateTime"] && (
                    <p className="text-error mb-1">
                      {errors?.["dateTime"]?.message}
                    </p>
                  )}
                </div>
              </Col>
            </Row>
            {rowWiseFields?.map((colWiseFields) => (
              <Row className="size-14">
                {colWiseFields?.map(
                  ({
                    label = "",
                    fieldName = "",
                    required = "",
                    disabled = false,
                    type = "text",
                  }) =>
                    label ? (
                      <Col className="w-100 d-flex justify-content-between pt-1">
                        <small>{label}</small>
                        <div className="w-75 d-flex flex-column">
                          <input
                            type={type}
                            className="w-75"
                            disabled={disabled}
                            {...register(fieldName, {
                              required: watch("isMasterExist")
                                ? false
                                : required,
                            })}
                          />
                          {errors?.[fieldName] && (
                            <p className="text-error mb-1">
                              {errors?.[fieldName]?.message}
                            </p>
                          )}
                        </div>
                      </Col>
                    ) : (
                      <Col className="w-100 d-flex justify-content-between pt-1"></Col>
                    ),
                )}
              </Row>
            ))}

            <Row className="border size-14">
              <Col className="d-flex col-auto gap-2 justify-content-between align-items-center">
                <small>TM name: </small>
                {watch("isMasterExist")
                  ? watch("createdBy.tm_name")
                  : loggedUser?.tm_name}
              </Col>
              <Col className="d-flex col-auto gap-2 justify-content-between align-items-center">
                <button
                  type="submit"
                  className="btn bg-warning"
                  onClick={handleSubmit((formValue) =>
                    handleNewMasterRequest(formValue, "requestSubmitted"),
                  )}
                >
                  Save Request
                </button>
                <button
                  type="submit"
                  className="btn bg-success"
                  onClick={handleSubmit((formValue) =>
                    handleNewMasterRequest(formValue, "masterCreated"),
                  )}
                >
                  Submit master
                </button>
              </Col>
            </Row>
          </Container>
        </Table>
      </Form>
    </div>
  );
};

export default SpareMasterRegistration;
