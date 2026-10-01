import React from "react";
import { Row, Col } from "react-bootstrap";
import { useWatch } from "react-hook-form";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const MTDHODApproval = ({
  register = () => {},
  control,
  errors = () => {},
}) => {
  const [{ data }] = useSafeGetRequest({
    url: "/v1/spare/user",
    axiosConfig: {
      params: {
        tm_department: "MTD",
        tm_grade: "HOD",
      },
    },
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        users: [],
      },
    },
  });

  // Read from form state, so a value set before the list arrived — copying a
  // rejected sheet does exactly that — is still shown once it does.
  const selectedUserId = useWatch({
    control,
    name: "mtdHODApprovalIfBudgetIsNG.user._id",
  });

  return (
    <Col className="d-flex flex-column col-auto">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <small>MTD HOD</small>
        <select
          style={{ fontSize: "14px" }}
          className={"d-inline"}
          {...register("mtdHODApprovalIfBudgetIsNG.user._id", {
            required: "Please select MTD HOD",
          })}
          value={selectedUserId ?? ""}
        >
          <option disabled value="">
            Please select
          </option>
          {data?.users?.map((obj) => (
            <option key={obj?._id} value={obj?._id}>
              {obj?.tm_name}
            </option>
          ))}
        </select>
      </div>
      {errors?.mtdHODApprovalIfBudgetIsNG?.user?._id && (
        <p className="text-error mb-1">
          {errors?.mtdHODApprovalIfBudgetIsNG?.user?._id?.message}
        </p>
      )}
    </Col>
  );
};

const NGBudgetApprovalSelection = ({
  register = () => {},
  control,
  errors = () => {},
}) => {
  return (
    <Row className="border d-flex align-items-center gap-2">
      <MTDHODApproval register={register} control={control} errors={errors} />
      <Col className="d-flex flex-column col-auto">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <small>Remarks</small>
          <input
            type="text"
            className="w-75"
            style={{ fontSize: "14px" }}
            {...register(`ifBudgetIsNG.remarkByRequestGenerator`, {
              required: "Please enter the remarks",
            })}
          />
        </div>
        {errors?.ifBudgetIsNG?.remarkByRequestGenerator && (
          <p className="text-error mb-1">
            {errors?.ifBudgetIsNG?.remarkByRequestGenerator?.message}
          </p>
        )}
      </Col>
      <Col className="d-flex flex-column col-auto">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <small>NG budget document</small>
          <input
            type="file"
            className="w-75"
            style={{ fontSize: "13px" }}
            {...register(`ifBudgetIsNG.documentByRequestGenerator`, {
              required: "Please enter the remarks",
            })}
          />
        </div>
        {errors?.ifBudgetIsNG?.documentByRequestGenerator && (
          <p className="text-error mb-1">
            {errors?.ifBudgetIsNG?.documentByRequestGenerator?.message}
          </p>
        )}
      </Col>
    </Row>
  );
};

export default NGBudgetApprovalSelection;
