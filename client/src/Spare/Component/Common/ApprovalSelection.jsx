import React from "react";
import { Row, Col } from "react-bootstrap";
import { useWatch } from "react-hook-form";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

/**
 * One step of an approval route, as a select.
 *
 * TL and HOSS are two slots fed from the same "TL/HOSS" user type, so the two
 * dropdowns list the same people: the requester may name the same person for
 * both or two different ones, exactly as the paper form has a box for each.
 *
 * The value is read from form state rather than left to the DOM: switching the
 * department replaces the option lists under the selects, and a value held only
 * by the DOM would be dropped when the matching option disappeared.
 */
const ApprovalUserSelect = ({ control, register, errors, fieldRef, users }) => {
  const fieldName = `${fieldRef?.approvalKey}.user._id`;
  const selectedUserId = useWatch({ control, name: fieldName });
  const hasNoUsers = !users?.length;

  return (
    <Col className="d-flex flex-column col-auto">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <small>{fieldRef?.displayName}</small>
        <select
          style={{ fontSize: "14px" }}
          {...register(fieldName, {
            required: hasNoUsers
              ? `No ${fieldRef?.displayName} is registered`
              : `Please select ${fieldRef?.displayName}`,
          })}
          value={selectedUserId ?? ""}
        >
          <option disabled value="">
            {hasNoUsers ? "No user registered" : "Please select"}
          </option>
          {users?.map((user) => (
            <option key={user?._id} value={user?._id}>
              {user?.tm_name}
            </option>
          ))}
        </select>
      </div>
      {hasNoUsers && (
        <p className="text-error mb-1">
          No {fieldRef?.displayName} is registered. Ask your admin to register
          one before submitting.
        </p>
      )}
      {!hasNoUsers && errors?.[fieldRef?.approvalKey]?.user?._id && (
        <p className="text-error mb-1">
          {errors?.[fieldRef?.approvalKey]?.user?._id?.message}
        </p>
      )}
    </Col>
  );
};

/**
 * The approval selection row, shared by the change and delete request forms.
 * The route is the same for both; only the endpoint that lists the users
 * differs, passed as `url`.
 */
const ApprovalSelection = ({
  url,
  department,
  register,
  control,
  errors,
}) => {
  const [{ data }] = useSafeGetRequest({
    url,
    axiosConfig: { params: { department } },
    referenceArrayForUseEffect: [department],
    initialState: {
      isLoading: true,
      isError: false,
      data: { allUsers: [] },
    },
  });

  return (
    <Row className="border d-flex align-items-center gap-2 p-2">
      <Col className="col-12">
        <small className="fw-bold">
          Approval route — {department} TL → HOSS → HOS → HOD → Tool Room
        </small>
      </Col>
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

export default ApprovalSelection;
