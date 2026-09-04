import React, { useCallback } from "react";
import { Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../../Utils/axiosUtils";

const url = `/v1/spare/kpi/machineCost`;

const MachineCost = () => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: async () => {
      const { isError, machineCostDetails } = await axiosGetOrDelete({
        url: "/v1/spare/kpi/machineCost",
      });
      if (!isError) return machineCostDetails;
      return {};
    },
  });

  const handleSubmitForm = useCallback(async (formValue) => {
    await axiosPostOrPatch({
      url,
      axiosBody: formValue,
      apiType: watch("_id") ? "patch" : "post",
    });
  }, []);

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="col-auto">
      <Row>
        <Col className="col-auto">Machine cost:</Col>
        <Col className="col-auto">
          <input
            type="number"
            {...register("machineCost", {
              required: "Machine cost is required",
            })}
          />
          {errors?.["machineCost"] && (
            <p className="text-error mb-1">
              {errors?.["machineCost"]?.message}
            </p>
          )}
        </Col>
        <Col className="col-auto d-flex align-items-center justify-content-center">
          <button className="bg-success text-white border-0" type="submit">
            Submit
          </button>
        </Col>
      </Row>
    </form>
  );
};

export default MachineCost;
