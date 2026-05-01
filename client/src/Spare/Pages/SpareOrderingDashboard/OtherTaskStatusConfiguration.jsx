import React, { memo } from "react";
import Modal from "react-bootstrap/Modal";
import { useForm } from "react-hook-form";

import CustomTextField from "../../Component/FormComponent/CustomTextField";
import { axiosGetOrDelete, axiosPostOrPatch } from "../../Utils/axiosUtils";

const url = "/v1/spare/spareRequestSheet/manualApprovalStatus";

const OtherTaskStatusConfiguration = memo(
  ({ show, selectedRow, updateRow, handleModal }) => {
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
            params: {
              _id: selectedRow?._id,
            },
          },
        });
        if (!isError) return spare;
        return {};
      },
    });

    const handleSubmitForm = async (formValue) => {
      const { isError, spare } = await axiosPostOrPatch({
        url,
        apiType: "patch",
        axiosBody: formValue,
        axiosProps: {
          params: {
            _id: selectedRow?._id,
          },
        },
      });

      if (!isError) {
        updateRow(spare);
        handleModal();
        reset();
      }
    };

    return (
      <>
        <Modal show={show} onHide={handleModal} animation={false} centered>
          <form onSubmit={handleSubmit(handleSubmitForm)}>
            <Modal.Header closeButton>
              <Modal.Title>Other approval configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <CustomTextField
                label="PR approval timestamp"
                fieldName="rsPRAssignToAllBuyersTimeStamp.inString"
                inputProps={{
                  type: "datetime-local",
                }}
                register={register}
                errors={errors}
              />
              <CustomTextField
                label="PR approval remarks"
                fieldName="rsPRAssignToAllBuyersRemarks"
                register={register}
                errors={errors}
              />

              <CustomTextField
                label="PO made timestamp"
                fieldName="rsPOIssueToVendorTimeStamp.inString"
                inputProps={{
                  type: "datetime-local",
                }}
                register={register}
                errors={errors}
              />
              <CustomTextField
                label="PO made remarks"
                fieldName="rsPOIssueToVendorRemarks"
                register={register}
                errors={errors}
              />

              <CustomTextField
                label="Part receipt timestamp"
                fieldName="rsPartReceiveTimeStamp.inString"
                inputProps={{
                  type: "datetime-local",
                }}
                register={register}
                errors={errors}
              />
              <CustomTextField
                label="Part receipt remarks"
                fieldName="rsPartReceiveRemarks"
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
