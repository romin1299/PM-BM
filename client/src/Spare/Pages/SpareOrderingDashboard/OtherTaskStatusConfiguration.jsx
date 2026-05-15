import React, { memo } from "react";
import Modal from "react-bootstrap/Modal";
import { useForm } from "react-hook-form";

import CustomTextField from "../../Component/FormComponent/CustomTextField";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";

const url = "/v1/spare/spareRequestSheet/manualApprovalStatus";

const OtherTaskStatusConfiguration = memo(
  ({ show, popupRef, axiosParams, selectedRow, updateRow, handleModal }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm({
      defaultValues: async () => {
        const { isError, spare } = await axiosGetOrDelete({
          url,
          axiosProps: {
            params: axiosParams,
          },
        });
        if (!isError) return spare;
        return {};
      },
    });

    const handleSubmitForm = async (formValue) => {
      const { isError, spareParts } = await axiosPostOrPatch({
        url,
        apiType: "patch",
        axiosBody: formValue,
        axiosProps: {
          params: axiosParams,
        },
      });

      if (!isError) {
        updateRow(spareParts);
        handleModal();
        reset();
      }
    };

    return (
      <>
        <Modal show={show} onHide={handleModal} animation={false} centered>
          <form onSubmit={handleSubmit(handleSubmitForm)}>
            <Modal.Header closeButton>
              <Modal.Title>{popupRef?.popupTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <CustomTextField
                label={`PR ${popupRef?.popupTitle} timestamp`}
                fieldName={`${popupRef?.key}TimeStamp.inString`}
                inputProps={{
                  type: "datetime-local",
                }}
                register={register}
                errors={errors}
              />
              <CustomTextField
                label={`${popupRef?.popupTitle} remarks`}
                fieldName={`${popupRef?.key}Remarks`}
                register={register}
                errors={errors}
              />
            </Modal.Body>
            <Modal.Footer>
              <button
                variant="primary"
                type="submit"
                className="btn bg-success"
              >
                Submit
              </button>
            </Modal.Footer>
          </form>
        </Modal>
      </>
    );
  },
);

export default OtherTaskStatusConfiguration;
