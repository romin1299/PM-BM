import { useMemo } from "react";
import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";

const useGetSectionWiseBudget = ({
  flagForTogglingFilter = "",
  selectedValue = "",
  existingSheetCell = "",
}) => {
  const cellId = useMemo(() => {
    if (existingSheetCell) return existingSheetCell;
    else if (flagForTogglingFilter === "based-on-cell") return selectedValue;
  }, [flagForTogglingFilter, selectedValue, existingSheetCell]);

  const [{ data }] = useSafeGetRequest({
    url: "/v1/spare/budget/forNewPartRequest",
    conditionToAvoidUnnecessaryAPICall: Boolean(cellId),
    axiosConfig: {
      params: {
        selectedValue: cellId,
      },
    },
    referenceArrayForUseEffect: [cellId],
    initialState: {
      isLoading: true,
      isError: false,
      data: {
        budget: {
          _id: "",
          sectionWiseCurrentMonthBudget: 0,
        },
      },
    },
  });

  return data?.budget;
};

export default useGetSectionWiseBudget;
