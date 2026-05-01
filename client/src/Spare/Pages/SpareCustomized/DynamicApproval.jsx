import { useForm } from "react-hook-form";
import { Box } from "@mui/system";
import { Row, Col } from "react-bootstrap";

import ChartTitleBar from "../../../BM/Reports/Common/ChartTitleBar";
import { SPARE_DYNAMIC_APPROVAL } from "../../../BM/Customized/CustomizedApproval/GlobalApprovalList";
import { axiosPostOrPatch, axiosGetOrDelete } from "../../Utils/axiosUtils";

const url = "/v1/spare/customization/dynamicApproval";

const DynamicApproval = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: async () => {
      const { isError, approvalObj } = await axiosGetOrDelete({
        url,
      });
      if (!isError) return approvalObj;
      return {};
    },
  });

  const handleSubmitDynamicApproval = async (formValue) => {
    const { isError, approvalObj } = await axiosPostOrPatch({
      url,
      apiType: "patch",
      axiosBody: formValue,
    });

    if (!isError) reset(approvalObj);
  };

  return (
    <form
      onSubmit={handleSubmit(handleSubmitDynamicApproval)}
      className="cell p-3 m-3"
    >
      <ChartTitleBar title="Approval selection" />

      <Row>
        {SPARE_DYNAMIC_APPROVAL?.map(({ tm_department, approvalList }) => (
          <Col className="cell m-2 p-2 col-auto">
            <h6 style={{ marginLeft: "0px" }}>
              {tm_department} approval selection
            </h6>
            {approvalList.map((item) => (
              <div className="mt-1">
                <input
                  type="checkbox"
                  value={item?.key}
                  id={`inline-checkbox-${item?.key}`}
                  {...register(`spareSheetDynamicApproval.${tm_department}`, {
                    required: "Please select approval list",
                  })}
                />{" "}
                &nbsp;
                <label>{item?.value}</label> <br />
              </div>
            ))}
            {errors?.spareSheetDynamicApproval?.[tm_department] && (
              <p className="text-error">
                {errors?.spareSheetDynamicApproval?.[tm_department]?.message}
              </p>
            )}
          </Col>
        ))}
      </Row>

      <Box className="m-2" sx={{ display: "flex", justifyContent: "start" }}>
        <button type="submit" className="btn bg-succ ">
          Submit Approval List
        </button>
      </Box>
    </form>
  );
};

export default DynamicApproval;
