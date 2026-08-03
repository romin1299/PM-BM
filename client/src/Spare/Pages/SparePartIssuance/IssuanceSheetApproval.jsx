import React, { useMemo, useContext } from "react";
import { Row, Col, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";
import AcceptOrRejectIssuancePartApproval from "./AcceptOrRejectIssuancePartApproval";
import RoutingContext from "../../../context/routing/RoutingContext";

const url = "/v1/spare/spareIssuance/approval";

const stopSubmissionApproval = ["Rejected", "Completed"];

const ModalFooter = () => (
  <Modal.Footer>
    <button variant="primary" type="submit" className="btn bg-success">
      Submit
    </button>
  </Modal.Footer>
);

const SendApprovalComponent = ({
  modelProp,
  updateRow = null,
  params = {},
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isLoading, errors },
  } = useForm({
    defaultValues: {},
  });

  const handleSubmitApproval = async (formValue) => {
    const { isError, spareParts } = await axiosPostOrPatch({
      url,
      axiosBody: formValue,
      axiosProps: { params },
    });

    if (!isError) {
      updateRow(spareParts);
      modelProp.onHide();
      reset();
    }
  };

  const [{ data }] = useSafeGetRequest({
    url: "/v1/spare/approvalUsers",
    axiosConfig: {
      params: {
        approvalKey: "spareIssuanceDynamicApproval",
        department: params?.department,
      },
    },
    referenceArrayForUseEffect: [params?.department],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        allUsers: [],
      },
    },
  });

  if (isLoading) return <h4>Loading....</h4>;

  return (
    <form onSubmit={handleSubmit(handleSubmitApproval)}>
      <Modal.Body>
        {data?.allUsers?.map((item) => (
          <Row className="mt-1">
            <Col className="d-flex align-items-center justify-content-between">
              <small className="col-4">{item?.fieldRef?.displayName}</small>
              <select
                style={{ fontSize: "14px", width: "100%" }}
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
            </Col>
            {errors?.[item?.fieldRef?.approvalKey]?.user?._id && (
              <p className="text-error mb-1">
                {errors?.[item?.fieldRef?.approvalKey]?.user?._id?.message}
              </p>
            )}
          </Row>
        ))}
      </Modal.Body>
      <ModalFooter />
    </form>
  );
};

const ApproveOrRejectComponent = ({
  modelProp,
  // _id,
  updateRow,
  approvals,
  changeParts,
  params,
}) => {
  const loggedUser = useContext(RoutingContext);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isLoading, errors },
  } = useForm({
    defaultValues: {},
  });

  const handleSubmitApproval = async (formValue) => {
    const response = await axiosPostOrPatch({
      apiType: "patch",
      url,
      axiosBody: formValue,
      axiosProps: { params },
    });

    if (!response?.isError) {
      response?.isIssuanceCompleted &&
        updateRow &&
        updateRow(response?.tableData);
      modelProp.onHide();
      reset();
    }
  };

  if (isLoading) return <h4>Loading....</h4>;

  return (
    <form onSubmit={handleSubmit(handleSubmitApproval)}>
      <Modal.Body>
        {approvals?.map((item) => (
          <Row className="mt-1">
            <Col className="d-flex align-items-center justify-content-between">
              <small className="col-4">{item?.userType}</small>
              <small className="flex-grow-1 text-start">
                {item?.user?.tm_name} - {item?.approvalStatus}
                {item?.approvalDateAndTime && (
                  <>- {item?.approvalDateAndTime}</>
                )}
                {item?.rejectedRemarks && <>- {item?.rejectedRemarks}</>}
              </small>
            </Col>
          </Row>
        ))}
        <br />
        <Row className="mt-1">
          <Col className="d-flex align-items-center justify-content-between">
            <small className="col-4">Approval status</small>
            <small className="flex-grow-1 text-start">
              {changeParts?.issuanceApprovalStatus}
            </small>
          </Col>
        </Row>

        {changeParts?.pendingApprovalBy === loggedUser?._id && (
          <AcceptOrRejectIssuancePartApproval
            register={register}
            errors={errors}
            watch={watch}
          />
        )}
      </Modal.Body>
      {stopSubmissionApproval?.includes(
        changeParts?.issuanceApprovalStatus,
      ) ? null : (
        <ModalFooter />
      )}
    </form>
  );
};

const UnauthorizedUser = () => (
  <Modal.Body>
    <Row className="mt-1">
      <Col className="d-flex align-items-center justify-content-between">
        <small>Unauthorized to send for approval</small>
      </Col>
    </Row>
  </Modal.Body>
);

const IssuanceSheetApproval = ({
  modelProp,
  _id = null,
  updateRow = null,
  selectedRow,
}) => {
  const params = useMemo(
    () => ({
      _id,
      partId: selectedRow?.changeParts?._id,
      masterId: selectedRow?.changeParts?.masterId,
      department: "MTD",
      //   department: selectedRow?.requestedDepartment,
    }),
    [_id, selectedRow],
  );

  const [{ isLoading, isError, data }] = useSafeGetRequest({
    url,
    axiosConfig: { params },
    referenceArrayForUseEffect: [params],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        part: {
          _id: "",
          changeParts: {
            _id: "",
            issuanceApprovalStatus: "",
            pendingApprovalBy: "",
          },
          approvals: [],
          canSendForApproval: false,
        },
      },
    },
  });

  return (
    <Modal
      {...modelProp}
      aria-labelledby="contained-modal-title-vcenter"
      centered
      style={{ zIndex: 1070 }}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {selectedRow?.changeParts?.partModel} Part Approval
        </Modal.Title>
      </Modal.Header>

      {isLoading ? (
        <h4>Loading....</h4>
      ) : !isError && data?.part?.approvals?.length > 0 ? (
        <ApproveOrRejectComponent
          {...data?.part}
          updateRow={updateRow}
          params={params}
          modelProp={modelProp}
        />
      ) : data?.part?.canSendForApproval ? (
        <SendApprovalComponent
          modelProp={modelProp}
          updateRow={updateRow}
          params={params}
        />
      ) : (
        <UnauthorizedUser />
      )}
    </Modal>
  );
};

export default IssuanceSheetApproval;
