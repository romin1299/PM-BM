import React from "react";
import { Modal, Table } from "react-bootstrap";

const DisplayTotalAcceptedAndApproveOnApprovalLog = ({
  acceptedAndApproveTotalCount,
  modelProp,
}) => {
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
            {acceptedAndApproveTotalCount?.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td rowSpan={item?.data?.length + 1}>{item?.userType}</td>
                </tr>

                {item?.data?.map((item1, index) => (
                  <tr key={index}>
                    <>
                      <td>{item1?.userName}</td>
                      <td key={index} style={{ textAlign: "center" }}>
                        {item1?.countOfAccepted} / {item1?.countOfPending}
                      </td>
                    </>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
};

export default DisplayTotalAcceptedAndApproveOnApprovalLog;
