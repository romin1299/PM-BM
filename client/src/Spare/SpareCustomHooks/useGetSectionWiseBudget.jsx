import useSafeGetRequest from "../../CustomHooks/useSafeGetRequest";

/**
 * The budget a new request-sheet draws on, which is held per cell.
 *
 * On a new sheet the cell comes from the toolbar's own cell selection, not from
 * the "deepest selected value": the requester goes on to pick a line and a
 * machine (which the sheet records) and the budget must stay with the cell they
 * chose. An existing sheet already carries its cell.
 */
const useGetSectionWiseBudget = ({ selectedCell = "", existingSheetCell = "" }) => {
  const cellId = existingSheetCell || selectedCell || "";

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
