import React, { useCallback, useContext, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Row, Col, Form, Container, Table } from "react-bootstrap";

import SpareMastCostTable from "./SpareMastCostTable";
import RoutingContext from "../../../context/routing/RoutingContext";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";
import { partFor } from "../../Utils/dropdownUtils";
import SearchableScrollDropdown from "../../Component/SearchableScrollDropdown";

import "./SpareMasterRegistration.scss";

const url = "/v1/spare/master";
const filterOptions = ["maker", "supplierName", "unit", "partGroup"];

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
      label: "Register section",
      fieldName: "registerSection",
      required: "Please enter register section",
    },
  ],
  [
    {
      label: "Part model no.",
      fieldName: "partModel",
      required: "Please enter part model number",
    },
    {
      label: "Vendor group",
      fieldName: "vendorGroup",
      required: "Please enter vendor group",
    },
  ],
  [
    {
      label: "Maker",
      fieldName: "maker",
      required: "Please enter maker",
      isDynamic: true,
      requestedFor: filterOptions[0],
    },
    {
      label: "Unit",
      fieldName: "unit",
      required: "Please enter unit",
      isDynamic: true,
      requestedFor: filterOptions[2],
    },
  ],
  [
    {
      label: "Supplier name",
      fieldName: "supplierName",
      required: "Please enter supplier",
      isDynamic: true,
      requestedFor: filterOptions[1],
    },

    {
      label: "Part group",
      fieldName: "partGroup",
      required: "Please enter part group",
      isDynamic: true,
      requestedFor: filterOptions[3],
    },
  ],
  [
    {
      label: "Lead time",
      fieldName: "leadTime",
      required: "Please enter lead time",
      type: "number",
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
      label: "Min qty",
      fieldName: "minQuantity",
      required: "Please enter min quantity",
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
      label: "Max qty",
      fieldName: "maxQuantity",
      required: "Please enter max quantity",
      type: "number",
    },
    {
      label: "Over all available qty",
      fieldName: "budgetDetails.overAllAvailableQty",
      type: "number",
      required: false,
      disabled: true,
    },
  ],
  [
    {},
    {
      label: "Over all cost in INR",
      fieldName: "budgetDetails.overAllCostInINR",
      type: "number",
      required: false,
      disabled: true,
    },
  ],
];

export const DropdownComponent = ({
  control,
  label = "Maker",
  fieldName = "maker",
  required = "Maker is required",
  requestedFor = filterOptions[0],
}) => (
  <Controller
    name={fieldName}
    control={control}
    rules={{ required }}
    render={({ field, fieldState: { error } }) => (
      <SearchableScrollDropdown
        label={field.value ? field.value : label}
        value={field.value}
        onChange={(newValue) =>
          field.onChange(newValue?.[requestedFor] ?? null)
        }
        extraParams={{
          requestedFor,
        }}
        error={!!error}
        helperText={error?.message}
      />
    )}
  />
);

const SpareMasterRegistration = () => {
  const loggedUser = useContext(RoutingContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useMemo(
    () =>
      searchParams.get("masterId")
        ? {
            _id: searchParams.get("masterId"),
          }
        : {
            sheetId: searchParams.get("sheetId"),
            partId: searchParams.get("partId"),
          },
    [searchParams],
  );

  const [costDetails, setCostDetails] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isLoading, errors, dirtyFields },
    watch,
  } = useForm({
    defaultValues: async () => {
      const { isError, master } = await axiosGetOrDelete({
        url,
        axiosProps: { params },
      });

      if (!isError) {
        setCostDetails(master?.costDetails);
        delete master.costDetails;
        return master;
      }
      return {};
    },
  });

  const dirtyValues = useCallback(
    (allValues) => {
      let newVal = {};
      Object.keys(dirtyFields).map((key) => (newVal[key] = allValues[key]));
      return newVal;
    },
    [dirtyFields],
  );

  const handleNavigation = () => navigate(-1);

  const handleNewMasterRequest = async (formValue, status) => {
    if (params?._id && Object.keys(dirtyFields).length === 0) return;

    let axiosParams = params;

    if (params?._id) {
      axiosParams = { _id: formValue?._id };
      formValue = dirtyValues(formValue);
    }

    formValue["status"] = status;

    const { isError } = await axiosPostOrPatch({
      url,
      apiType: params?._id ? "patch" : "post",
      axiosBody: formValue,
      axiosProps: { params: axiosParams },
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
                          required: params?._id
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
                    {...register("dateTime.inString", {
                      required: params?._id ? false : "Please enter date time",
                    })}
                  />
                  {errors?.dateTime?.inString && (
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
                    type = "text",
                    disabled = false,
                    isDynamic = false,
                    requestedFor = "",
                  }) =>
                    label ? (
                      <Col className="w-100 d-flex justify-content-between pt-1">
                        <small>{label}</small>
                        <div className="w-75 d-flex flex-column">
                          {isDynamic ? (
                            <DropdownComponent
                              control={control}
                              label={label}
                              fieldName={fieldName}
                              required={required}
                              requestedFor={requestedFor}
                            />
                          ) : (
                            <>
                              <input
                                type={type}
                                className="w-75"
                                disabled={disabled}
                                {...register(fieldName, {
                                  required: params?._id ? false : required,
                                })}
                              />
                              {errors?.[fieldName] && (
                                <p className="text-error mb-1">
                                  {errors?.[fieldName]?.message}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </Col>
                    ) : (
                      <Col className="w-100 d-flex justify-content-between pt-1"></Col>
                    ),
                )}
              </Row>
            ))}
            <Row className="border size-14 m-2">
              <SpareMastCostTable costDetails={costDetails} />
            </Row>
            <Row className="border size-14">
              <Col className="d-flex col-auto gap-2 justify-content-between align-items-center">
                <small>TM name: </small>
                {params?._id ? watch("createdBy.tm_name") : loggedUser?.tm_name}
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
