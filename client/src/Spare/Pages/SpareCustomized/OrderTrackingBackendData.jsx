import { useForm } from "react-hook-form";
import { Box } from "@mui/system";

import ChartTitleBar from "../../../BM/Reports/Common/ChartTitleBar";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";

const url = "/v1/spare/customization/leadTime";
const leadTimeFieldsWithLabel = [
  {
    label: "Order request submitted - HOD internal approval",
    fieldName: "orderRSSubmittedToHODApproval",
  },
  {
    label: "HOD internal approval - PR submitted by Toolroom to PPD",
    fieldName: "HODApprovalToPRSubmittedByToolroomToPPD",
  },
  {
    label:
      "PR submitted by Toolroom to PPD -  PR assign to all buyers after all HOD approval",
    fieldName: "PRSubmittedByToolroomToPPDToPRAssignToAllBuyers",
  },
  {
    label:
      "PR assign to all buyers after all HOD approval - PO issue to vendor",
    fieldName: "PRAssignToAllBuyersToPOIssueToVendor",
  },
  {
    label: "PO issue to vendor - Part Receive",
    fieldName: "POIssueToVendorToPartReceive",
  },
  {
    label: "Part receive - Part inspection",
    fieldName: "partReceiveToPartInspection",
  },
  {
    label: "Part inspection - MRN Issued",
    fieldName: "partInspectionToMRNIssued",
  },
  {
    label: "MRN Issued - MRN Approved",
    fieldName: "MRNIssuedToMRNApproved",
  },
];

const OrderTrackingBackendData = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: async () => {
      const { isError, trackingObj } = await axiosGetOrDelete({
        url,
      });
      if (!isError) return trackingObj;
      return {};
    },
  });

  const handleSubmitLeadTimeConfiguration = async (formValue) => {
    const { isError, trackingObj } = await axiosPostOrPatch({
      url,
      apiType: "patch",
      axiosBody: formValue,
    });

    if (!isError) reset(trackingObj);
  };

  return (
    <form
      onSubmit={handleSubmit(handleSubmitLeadTimeConfiguration)}
      className="cell p-3 m-3"
    >
      <ChartTitleBar title="Lead time addition" />

      {leadTimeFieldsWithLabel?.map(({ label = "", fieldName = "" }) => (
        <>
          <div className="d-flex justify-content-between p-1">
            <small>{label}</small>
            <input
              type="number"
              {...register(`leadTime.${fieldName}`, {
                required: "Please enter this lead time",
              })}
            />
          </div>
          {errors?.leadTime?.[fieldName] && (
            <p className="text-error">
              {errors?.leadTime?.[fieldName]?.message}
            </p>
          )}
        </>
      ))}

      <Box className="m-2" sx={{ display: "flex", justifyContent: "start" }}>
        <button type="submit" className="btn bg-succ ">
          Submit Lead time
        </button>
      </Box>
    </form>
  );
};

export default OrderTrackingBackendData;
