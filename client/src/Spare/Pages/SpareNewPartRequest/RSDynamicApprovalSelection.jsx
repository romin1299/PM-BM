import React from "react";
import { Row, Col } from "react-bootstrap";
import { useWatch } from "react-hook-form";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

/**
 * One slot of the approval chain.
 *
 * The select reads its value from form state rather than being left to the DOM.
 * Its options arrive from a request, and the department they are fetched for
 * can change under it — copying a rejected sheet sets the department and the
 * approvers in the same breath. An uncontrolled select would be handed a value
 * before the matching option existed, drop it when the list arrived, and then
 * show "Please select" while the form still held the user underneath.
 */
const ApprovalUserSelect = ({ control, register, errors, fieldRef, users }) => {
  const fieldName = `${fieldRef?.approvalKey}.user._id`;
  const selectedUserId = useWatch({ control, name: fieldName });

  return (
    <Col className="d-flex flex-column col-auto">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <small>{fieldRef?.displayName}</small>
        <select
          style={{ fontSize: "14px" }}
          className={"d-inline"}
          {...register(fieldName, {
            required: `Please select ${fieldRef?.displayName}`,
          })}
          value={selectedUserId ?? ""}
        >
          <option disabled value="">
            Please select
          </option>
          {users?.map((obj) => (
            <option key={obj?._id} value={obj?._id}>
              {obj?.tm_name}
            </option>
          ))}
        </select>
      </div>
      {errors?.[fieldRef?.approvalKey]?.user?._id && (
        <p className="text-error mb-1">
          {errors?.[fieldRef?.approvalKey]?.user?._id?.message}
        </p>
      )}
    </Col>
  );
};

const RSDynamicApprovalSelection = ({
  register,
  control,
  errors,
  partRequestFor,
}) => {
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
        <ApprovalUserSelect
          key={item?.fieldRef?.approvalKey}
          control={control}
          register={register}
          errors={errors}
          fieldRef={item?.fieldRef}
          users={item?.users}
        />
      ))}
    </Row>
  );
};

export default RSDynamicApprovalSelection;
