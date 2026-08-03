import React, { useCallback } from "react";
import { Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";

const url = `/v1/spare/kpi/machineCost`;

const MachineCost = ({ machineCost, setResponseData = null }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      machineCost,
    },
  });

  const handleSubmitForm = useCallback(
    async (formValue) => {
      const response = await axiosPostOrPatch({
        url,
        axiosBody: formValue,
        apiType: machineCost ? "patch" : "post",
      });

      if (!response?.isError)
        setResponseData({ machineCost: response?.machineCost });
    },
    [machineCost, setResponseData],
  );

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)}>
      <Row>
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
