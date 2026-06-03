import React, { memo, useMemo, useState } from "react";
import { Modal, Table } from "react-bootstrap";
import Loading from "../../../components/Loading/Loading";
import WithFilters from "../../Component/Common/WithFilters";
import useSafeGetRequest from "../../../CustomHooks/useSafeGetRequest";

import SpareSheetCustomTable, {
  UptoMachineHeaders,
} from "../../Component/SpareSheetCustomTable";

const LogsMappingKeys = [
  "mtdHODApprovalIfBudgetIsNGApprovalLogs",
  "approvalOfMTD_TLApprovalLogs",
  "approvalOfMTD_HOSSApprovalLogs",
  "approvalOfPRD_TLApprovalLogs",
  "approvalOfMTD_HOSApprovalLogs",
  "approvalOfPRD_HOSApprovalLogs",
  "approvalOfMTD_HODApprovalLogs",
  "approvalOfPRD_HODApprovalLogs",
  "approvalOfTOOL_ROOMApprovalLogs",
];

const ModalApproveAndPendingUsersWiseCount = ({
  flagForTogglingFilter,
  selectedValue,
  selectedYear,
  modelProp,
}) => {
  const [{ isLoading, isError, data }] = useSafeGetRequest({
    url: "/v1/spare/spareRequestSheet/approveAndPendingCount",
    axiosConfig: {
      params: {
        flagForTogglingFilter,
        selectedValue,
        selectedYear,
      },
    },
    referenceArrayForUseEffect: [
      flagForTogglingFilter,
      selectedValue,
      selectedYear,
    ],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        tableData: [],
      },
    },
  });

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Display Accepted And Total Approval
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="container overflow-auto">
        <Table bordered hover className="m-0">
          <thead>
            <tr style={{ background: "#0fa3b1" }}>
              <th>User Type</th>
              <th>TM Name</th>
              <th style={{ textAlign: "center" }}>Approved / Pending</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <Loading />
            ) : (
              data?.tableData?.map((item, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td rowSpan={item?.userWithCount?.length + 1}>
                      {item?._id}
                    </td>
                  </tr>
                  {item?.userWithCount?.map((item1, index1) => (
                    <tr key={index1}>
                      <td>{item1?.tm_name}</td>
                      <td style={{ textAlign: "center" }}>
                        {item1?.approved} / {item1?.pending}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
};

const ApproveAndPendingUsersWiseCount = (prop) => {
  const [modalState, setModalState] = useState(false);
  const handelModalState = () => setModalState((modalState) => !modalState);

  return (
    <div className="d-flex justify-content-end">
      <button
        type="button"
        className="btn btn-primary"
        onClick={handelModalState}
      >
        Show Approved / Pending
      </button>

      {modalState && (
        <ModalApproveAndPendingUsersWiseCount
          {...prop}
          modelProp={{
            show: modalState,
            onHide: handelModalState,
          }}
        />
      )}
    </div>
  );
};

const ApprovalMappingComponent = memo(({ otherData }) => (
  <>
    <UptoMachineHeaders otherData={otherData} />
    {LogsMappingKeys?.map((key = "") => (
      <td className="td-padding">
        {otherData?.[key]?.map(
          ({
            _id = "",
            approvalStatus = "",
            user = {},
            approvalDateAndTime = "",
            rejectedRemarks = "",
          }) => (
            <p key={_id}>
              <b>{approvalStatus}</b>
              &nbsp;
              {user?.tm_name && `- ${user?.tm_name}`}
              &nbsp;
              {approvalDateAndTime && `- ${approvalDateAndTime}`}
              &nbsp;
              {rejectedRemarks && `- ${rejectedRemarks}`}
            </p>
          ),
        )}
      </td>
    ))}
  </>
));

const LogsComponent = (props) => {
  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: {
        flagForTogglingFilter: props?.flagForTogglingFilter,
        selectedValue: props?.selectedValue,
        selectedYear: props?.selectedYear,
      },
      referenceArrayForUseEffect: [
        props?.flagForTogglingFilter,
        props?.selectedValue,
        props?.selectedYear,
      ],
    }),
    [props?.flagForTogglingFilter, props?.selectedValue, props?.selectedYear],
  );

  return (
    <div className="container-fluid" style={{ overflow: "auto" }}>
      <ApproveAndPendingUsersWiseCount {...props} />
      <SpareSheetCustomTable
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
        tableHeaders={[
          "Request No",
          "Product",
          "Line",
          "Machine No",
          "Machine Name",
          "HOD NG Budget Approval",
          "MTD TL",
          "MTD HOSS",
          "PRD TL",
          "MTD HOS",
          "PRD HOS",
          "MTD HOD",
          "PRD HOD",
          "TOOL ROOM",
        ]}
        OtherComp={ApprovalMappingComponent}
        isPartWiseTable={false}
      />
    </div>
  );
};

const SpareApprovalLogs = () => {
  return <WithFilters title="Approval logs" PropComp={LogsComponent} />;
};

export default SpareApprovalLogs;
