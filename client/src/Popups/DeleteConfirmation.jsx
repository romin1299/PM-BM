import React from "react";
import { Modal, Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";

function DeleteConfirmation({
  showCheckSheet,
  displayAndHide,
  selectedRow,
  functionToSetRefKey,
}) {
  const notifyForDeleteChecksheet = () => {
    toast.success("CheckSheet deleted successfully", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  };

  // console.log(tableData);
  const deleteCheckSheet = async () => {
    try {
      const res = await fetch("/deleteCheckSheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedRow,
        }),
      });

      const data = await res.json();

      if (res.status === 400 || !data) {
        window.alert("Invalid");
      } else {
        functionToSetRefKey();
        displayAndHide();
        notifyForDeleteChecksheet();
        console.log("Data Deleted Successful");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <ToastContainer style={{ width: "30rem" }} />

      <Modal show={showCheckSheet}>
        <Modal.Header>
          <Modal.Title>Delete Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-danger">
            Are you sure you want to delete the CheckSheet ?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-reset" onClick={() => displayAndHide()}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteCheckSheet}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default DeleteConfirmation;
