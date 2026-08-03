import React from "react";
import { Row, Col } from "react-bootstrap";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

const RSDynamicApprovalSelection = ({ register, errors, partRequestFor }) => {
  const [{ data }] = useSafeGetRequest({
    url: "/v1/spare/approvalUsers",
    axiosConfig: {
      params: {
        department: partRequestFor,
        approvalKey: "spareSheetDynamicApproval",
      },
    },
    referenceArrayForUseEffect: [partRequestFor],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        allUsers: [],
      },
    },
  });

  return (
    <Row className="border d-flex align-items-center gap-2">
      {data?.allUsers?.map((item) => (
        <Col className="d-flex flex-column col-auto">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <small>{item?.fieldRef?.displayName}</small>
            <select
              style={{ fontSize: "14px" }}
              className={"d-inline"}
              {...register(`${item?.fieldRef?.approvalKey}.user._id`, {
                required: `Please select ${item?.fieldRef?.displayName}`,
              })}
            >
              <option selected disabled value="">
                Please select
              </option>
              {item?.users?.map((obj) => (
                <option value={obj?._id}>{obj?.tm_name}</option>
              ))}
            </select>
          </div>
          {errors?.[item?.fieldRef?.approvalKey]?.user?._id && (
            <p className="text-error mb-1">
              {errors?.[item?.fieldRef?.approvalKey]?.user?._id?.message}
            </p>
          )}
        </Col>
      ))}
    </Row>
  );
};

export default RSDynamicApprovalSelection;
