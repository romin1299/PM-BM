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
    label: "HOD internal approval - Toolroom approval",
    fieldName: "HODApprovalToToolRoomApproval",
  },
  {
    label: "Toolroom approval - PR submitted by Toolroom to PPD",
    fieldName: "ToolroomApprovalToPRSubmittedByToolroomToPPD",
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
    label: "Local: PO issue to vendor - Part Receive",
    fieldName: "localPOIssueToVendorToPartReceive",
  },
  {
    label: "Imported: PO issue to vendor - Part Receive",
    fieldName: "importedPOIssueToVendorToPartReceive",
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

const OrderTrackingBackendData = ({ isToolRoom = false }) => {
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
      if (isError) return {};

      const leadTime = trackingObj?.leadTime ?? {};

      /**
       * A plant that has only ever configured the single pre-split value gets
       * it carried into both halves, so opening and saving this form cannot
       * re-time orders already in flight. 0 stays "not set", as the server
       * reads it.
       */
      const withLegacyValue = (value) =>
        Number(value) > 0
          ? value
          : (leadTime.POIssueToVendorToPartReceive ?? 0);

      return {
        ...trackingObj,
        leadTime: {
          ...leadTime,
          localPOIssueToVendorToPartReceive: withLegacyValue(
            leadTime.localPOIssueToVendorToPartReceive,
          ),
          importedPOIssueToVendorToPartReceive: withLegacyValue(
            leadTime.importedPOIssueToVendorToPartReceive,
          ),
        },
      };
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

      {isToolRoom && (
        <Box className="m-2" sx={{ display: "flex", justifyContent: "start" }}>
          <button type="submit" className="btn bg-succ ">
            Submit Lead time
          </button>
        </Box>
      )}
    </form>
  );
};

export default OrderTrackingBackendData;
