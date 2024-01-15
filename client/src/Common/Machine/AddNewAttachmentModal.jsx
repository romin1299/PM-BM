import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";

const AddNewAttachmentModal = ({
  handleShowAddNewAttachmentModal,
  closeModal,
  machine_code,
  pageDetails,
  setAttachmentDetails,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({});

  const handleClose = () => {
    reset();
    closeModal();
  };

  const handleAddNewAttachment = async (data) => {
    try {
      const formData = new FormData();

      for (let i = 0; i < data?.attached_files.length; i++) {
        formData.append("attached_files", data?.attached_files[i]);
      }

      const res = await fetch(
        `/addNewAttachment/${pageDetails?.schemaVar}/?machine_code=${machine_code}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const { message, attachmentDetails } = await res.json();

      if (res.status === 201) {
        setAttachmentDetails(attachmentDetails);
      }

      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal
      show={handleShowAddNewAttachmentModal}
      onHide={handleClose}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Upload Document
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>Select Multiple files</h5>
        <Form onSubmit={handleSubmit(handleAddNewAttachment)}>
          <Form.Group controlId="formFileMultiple" className="mb-3">
            <Form.Control
              type="file"
              multiple
              {...register("attached_files", {
                required: "Please select at-least one file",
              })}
            />
            {errors?.attached_files && (
              <p className="text-error">{errors?.attached_files?.message}</p>
            )}
          </Form.Group>
          <Button type="submit">submit</Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddNewAttachmentModal;
