export const initialState = {
  selectedValue: "",
  flagForTogglingFilter: "",

  selectedValueForLineAnTMLoadGraph: "",
  togglingFilterFlagForLineAnTMLoadGraph: "",

  selectedSection: "",
  sections: [],

  selectedSubSection: "",
  subSections: [],

  selectedCell: "",
  cells: [],

  selectedLine: "",
  lines: [],

  selectedYear:
    new Date().getMonth() < 3
      ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
      : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  selectedMonth: "",

  message: "",
  isLoading: true,
  isError: false,
};

export const ACTION = {
  GET_DATA: "get-data",
  GET_DATA_BASED_ON_SECTION: "get-data-based-on-section-selection",
  GET_DATA_BASED_ON_SUBSECTION: "get-data-based-on-subSection-selection",
  GET_DATA_BASED_ON_CELL: "get-data-based-on-cell-selection",
  HANDLE_SELECT_SECTION: "handle-selected-section",
  HANDLE_SELECT_SUBSECTION: "handle-selected-subSection",
  HANDLE_SELECT_CELL: "handle-selected-cell",
  HANDLE_SELECT_LINE: "handle-selected-line",
  HANDLE_SELECT_YEAR: "handle-selected-year",
  HANDLE_SELECT_MONTH: "handle-selected-month",
};

export const getFiltrationValue = async ({ url }) => {
  console.count("fun call.........");
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();

    return { res, data };
  } catch (error) {
    console.log(error);
  }
};

export const reducer = (state, action) => {
  switch (action?.type) {
    case ACTION?.GET_DATA:
      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedValueForLineAnTMLoadGraph: action?.selectedValue,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedSection: action?.selectedSection,
        sections: action?.sections,
        selectedSubSection: action?.selectedSubSection,
        subSections: action?.subSections,
        selectedCell: action?.selectedCell,
        cells: action?.cells,
      };

    case ACTION?.GET_DATA_BASED_ON_SECTION:
      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedValueForLineAnTMLoadGraph: action?.selectedValue,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedSubSection: action?.selectedSubSection,
        subSections: action?.subSections,
        selectedCell: action?.selectedCell,
        cells: action?.cells,
        selectedLine: action?.selectedLine,
        lines: action?.lines,
      };

    case ACTION?.GET_DATA_BASED_ON_SUBSECTION:
      return {
        ...state,
        isLoading: false,
        message: action?.message,

        cells: action?.cells,
        selectedLine: action?.selectedLine,
        lines: action?.lines,
      };

    case ACTION?.GET_DATA_BASED_ON_CELL:
      return {
        ...state,
        isLoading: false,
        message: action?.message,

        lines: action?.lines,
      };

    case ACTION?.HANDLE_SELECT_SECTION:
      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedSection,

        selectedValueForLineAnTMLoadGraph: action?.selectedSection,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedSection: action?.selectedSection,
        selectedSubSection: "",
        subSections: [],
        selectedCell: "",
        cells: [],
        selectedLine: "",
        lines: [],
      };

    case ACTION?.HANDLE_SELECT_SUBSECTION:
      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedSubSection,

        selectedValueForLineAnTMLoadGraph: action?.selectedSubSection,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedSubSection: action?.selectedSubSection,
        selectedCell: "",
        cells: [],
        selectedLine: "",
        lines: [],
      };

    case ACTION?.HANDLE_SELECT_CELL:
      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedCell,

        selectedValueForLineAnTMLoadGraph: action?.selectedCell,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedCell: action?.selectedCell,
        selectedLine: "",
        lines: [],
      };

    case ACTION?.HANDLE_SELECT_LINE:
      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedLine,

        selectedLine: action?.selectedLine,
      };

    case ACTION?.HANDLE_SELECT_YEAR:
      return {
        ...state,
        selectedYear: action?.selectedYear,
        selectedMonth: "",
      };

    case ACTION?.HANDLE_SELECT_MONTH:
      return {
        ...state,
        selectedMonth: action?.selectedMonth,
      };

    default:
      return state;
  }
};
