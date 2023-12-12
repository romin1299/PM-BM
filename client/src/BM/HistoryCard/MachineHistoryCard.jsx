import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";

const MachineHistoryCard = ({ selectedRow, modelProp }) => {
  const [historyCardData, setHistoryCardData] = useState({
    bdTime: 0,
    bdCount: 0,
    mttrData: 0,
    mtbf: 0,
    bdHourTrend: [
      {
        label: "",
        data: [],
      },
    ],
  });

  const getApprovalLogDetails = async () => {
    try {
      const res = await fetch(
        `/getHistoryCard/${selectedRow?.machines?.[0]?._id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      const { message, bdTime, bdCount, mttrData, mtbf, bdHourTrend } =
        await res.json();
      if (res.status === 201) {
        setHistoryCardData(
            {
                bdTime: 0,
                bdCount: 0,
                mttrData: 0,
                mtbf: 0,
                bdHourTrend: [
                  {
                    label: "",
                    data: [],
                  },
                ],
            }
        )
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getApprovalLogDetails();
  }, []);

  return (
    <Modal
      {...modelProp}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Modal heading
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Centered Modal</h4>
        <p>
          Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
          dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
          consectetur ac, vestibulum at eros.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button>History</button>
      </Modal.Footer>
    </Modal>
  );
};

export default MachineHistoryCard;
