import React, { useCallback, useState, useEffect } from "react";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import currentMonth from "../pages/Dashboard/DashboardComponent/currentMonth";
import SafetyFormV2 from "../CM/Components/ReqestSheetOfCM/SafetyFormV2";
import { axiosGetOrDelete } from "../Spare/Utils/axiosUtils";
import useSafeGetRequest from "../CustomHooks/useSafeGetRequest";

const ExistingSafetyForm = ({ reset, params, otherFormSubmitParams }) => {
  const [selectedSafetyForm, setSelectedSafetyForm] = useState("");

  const [{ isLoading, data }] = useSafeGetRequest({
    url: "/pm/v1/safetyForm/list",
    axiosConfig: {
      params: { ...params, ...otherFormSubmitParams },
    },
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        formList: [],
      },
    },
    referenceArrayForUseEffect: [params, otherFormSubmitParams],
  });

  const getSafetyFormValue = useCallback(async () => {
    if (!selectedSafetyForm) return;
    if (selectedSafetyForm === "reset")
      return reset(
        {
          generalMaintainanceWork: null,
          complexWork: null,
          workInsideMachine: null,
          highPressure: null,
          workHandlingHeavyObj: null,
          workAtHeight: null,
          workHandlingFire: null,
          workInvolvingRiskOfOxygen: null,
          workUsingHighTemp: null,
          _id: "",
          financialYear: "",
          month: null,
          requestSheetRef: "",
          safetyFormFilledUpBy: "",
          workName: "",
          keyRisks: "",
          preventiveMeasures: "",
          finalSafetyAcceptance: false,
        },
        { keepDefaultValues: false },
      );
    const { isError, safetyForm } = await axiosGetOrDelete({
      url: "/pm/v1/safetyForm",
      axiosProps: {
        params: { _id: selectedSafetyForm },
      },
    });
    if (!isError) reset(safetyForm);
  }, [reset, selectedSafetyForm]);

  useEffect(() => {
    getSafetyFormValue();
  }, [selectedSafetyForm]);

  if (isLoading) return <h5>Loading...</h5>;

  return (
    <div className="p-2 border">
      <select
        name="doneByNoLossBD"
        id="doneByNoLossBD"
        onChange={(e) => {
          setSelectedSafetyForm(e.target.value);
        }}
        value={selectedSafetyForm}
      >
        <option value="" disabled>
          Please Select
        </option>
        <option value="reset">Reset</option>
        {data?.formList?.map((obj) => (
          <option value={obj?._id}>{obj?.workName}</option>
        ))}
      </select>
    </div>
  );
};

const SafetySubComponent = ({
  header,
  machineParentHierarchy,
  params,
  otherFormSubmitParams,
  handleEditableCheckPointState,
}) => {
  const [modelState, setModelState] = useState(false);
  const handleModelState = () => setModelState((modelState) => !modelState);

  return (
    <>
      {header} <br />{" "}
      <HealthAndSafetyIcon
        fontSize="small"
        onClick={handleModelState}
        sx={{
          "&:hover": {
            cursor: "pointer",
          },
        }}
      />
      {modelState && (
        <SafetyFormV2
          moduleType="pm"
          machineParentHierarchy={machineParentHierarchy}
          params={params}
          otherFormSubmitParams={otherFormSubmitParams}
          handleUpdateSheet={handleEditableCheckPointState}
          modelProp={{
            show: modelState,
            onHide: handleModelState,
          }}
          OtherComponent={ExistingSafetyForm}
        />
      )}
    </>
  );
};

const PMSafetyForm = (props) => {
  if (currentMonth !== props?.header) return props?.header;
  return <SafetySubComponent {...props} />;
};

export default PMSafetyForm;
