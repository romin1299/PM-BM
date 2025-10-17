export const initialState = (isWithLocalStorageForFiltration) => {
    console.log("For update----");

  if (isWithLocalStorageForFiltration === "Yes")
    return {
      selectedValue: localStorage.getItem("selectedValue") || "",
      flagForTogglingFilter:
        localStorage.getItem("flagForTogglingFilter") || "",

      selectedValueForLineAnTMLoadGraph:
        localStorage.getItem("selectedValueForLineAnTMLoadGraph") || "",
      togglingFilterFlagForLineAnTMLoadGraph:
        localStorage.getItem("togglingFilterFlagForLineAnTMLoadGraph") || "",

      selectedSection: localStorage.getItem("selectedSection") || "",
      sections:
        (localStorage.getItem("sections") &&
          typeof JSON.parse(localStorage.getItem("sections")) === "object" &&
          JSON.parse(localStorage.getItem("sections"))) ||
        [],

      selectedSubSection: localStorage.getItem("selectedSubSection") || "",
      subSections:
        (localStorage.getItem("subSections") &&
          typeof JSON.parse(localStorage.getItem("subSections")) === "object" &&
          JSON.parse(localStorage.getItem("subSections"))) ||
        [],

      selectedCell: localStorage.getItem("selectedCell") || "",
      cells:
        (localStorage.getItem("cells") &&
          typeof JSON.parse(localStorage.getItem("cells")) === "object" &&
          JSON.parse(localStorage.getItem("cells"))) ||
        [],

      selectedLine: localStorage.getItem("selectedLine") || "",
      lines:
        (localStorage.getItem("lines") &&
          typeof JSON.parse(localStorage.getItem("lines")) === "object" &&
          JSON.parse(localStorage.getItem("lines"))) ||
        [],

      selectedMachine: localStorage.getItem("selectedMachine") || "",
      machines:
        (localStorage.getItem("machines") &&
          typeof JSON.parse(localStorage.getItem("machines")) === "object" &&
          JSON.parse(localStorage.getItem("machines"))) ||
        [],

      selectedRSStatus: localStorage.getItem("selectedRSStatus") || "",

      selectedMaintenanceType:
        localStorage.getItem("selectedMaintenanceType") || "",

      selectedCurrentStatusOfRS:
        localStorage.getItem("selectedCurrentStatusOfRS") || "",

      selectedCategoryType: localStorage.getItem("selectedCategoryType") || "",

      selectedQuarter: localStorage.getItem("selectedQuarter") || "",

      selectedMonth: localStorage.getItem("selectedMonth") || "",
      selectedYear:
        localStorage.getItem("selectedYear") ||
        (new Date().getMonth() < 3
          ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
          : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`),

      message: "",
      isLoading: true,
      isError: false,
    };
  return {
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

    selectedMachine: "",
    machines: [],

    selectedRSStatus: "",

    selectedMaintenanceType: "",

    selectedCurrentStatusOfRS: "",

    selectedCategoryType: "",

    selectedQuarter: "",

    selectedMonth: "",
    selectedYear:
      new Date().getMonth() < 3
        ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
        : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,

    message: "",
    isLoading: true,
    isError: false,
  };
};

export const ACTION = {
  GET_DATA: "get-data",
  GET_DATA_BASED_ON_SECTION: "get-data-based-on-section-selection",
  GET_DATA_BASED_ON_SUBSECTION: "get-data-based-on-subSection-selection",
  GET_DATA_BASED_ON_CELL: "get-data-based-on-cell-selection",
  GET_DATA_BASED_ON_LINE: "get-data-based-on-line-selection",
  HANDLE_SELECT_SECTION: "handle-selected-section",
  HANDLE_SELECT_SUBSECTION: "handle-selected-subSection",
  HANDLE_SELECT_CELL: "handle-selected-cell",
  HANDLE_SELECT_LINE: "handle-selected-line",
  HANDLE_SELECT_MACHINE: "handle-selected-machine",
  HANDLE_SELECT_YEAR: "handle-selected-year",
  HANDLE_SELECT_MONTH: "handle-selected-month",
  HANDLE_SELECT_MAINTENANCE_TYPE: "handle-selected-maintenanceType",
  HANDLE_SELECT_CURRENT_RS_STATUS: "handle-selected-current-rs-status",
  HANDLE_SELECT_CM_CATEGORY: "handle-selected-category",
  HANDLE_SELECT_QUARTER: "handle-selected-quarter",
  HANDLE_SELECT_STATUS: "handle-selected-status",
  HANDLE_RESET: "reset-filters",
};

export const getFiltrationValue = async ({ url }) => {
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
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedValue);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem(
          "selectedValueForLineAnTMLoadGraph",
          action?.selectedValue
        );
        localStorage.setItem(
          "togglingFilterFlagForLineAnTMLoadGraph",
          action?.flagForTogglingFilter
        );
        localStorage.setItem("selectedSection", action?.selectedSection);
        localStorage.setItem("sections", JSON.stringify(action?.sections));
        localStorage.setItem("selectedSubSection", action?.selectedSubSection);
        localStorage.setItem(
          "subSections",
          JSON.stringify(action?.subSections)
        );
        localStorage.setItem("selectedCell", action?.selectedCell);
        localStorage.setItem("cells", JSON.stringify(action?.cells));
        localStorage.setItem("selectedLine", action?.selectedLine);
        localStorage.setItem("lines", JSON.stringify(action?.lines));
        localStorage.setItem("selectedMachine", action?.selectedMachine);
        localStorage.setItem("machines", JSON.stringify(action?.machines));
        if (action?.isReset) {
          localStorage.setItem("selectedQuarter", "");
          localStorage.setItem("selectedRSStatus", "");
          localStorage.setItem("selectedMaintenanceType", "");
          localStorage.setItem("selectedCurrentStatusOfRS", "");
          localStorage.setItem("selectedCategoryType", "");
        }

        localStorage.setItem(
          "selectedYear",
          new Date().getMonth() < 3
            ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
            : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        );
        localStorage.setItem("selectedMonth", action?.selectedMonth);
      }

      let resetTheFilterValue = {};
      if (action?.isReset) {
        resetTheFilterValue = {
          selectedQuarter: "",
          selectedRSStatus: "",
          selectedMaintenanceType: "",
          selectedCurrentStatusOfRS: "",
          selectedCategoryType: "",
        };
      }
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
        selectedLine: action?.selectedLine,
        lines: action?.lines,
        selectedMachine: action?.selectedMachine,
        machines: action?.machines,
        ...resetTheFilterValue,
        selectedYear:
          new Date().getMonth() < 3
            ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
            : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        selectedMonth: action?.selectedMonth,
      };

    case ACTION?.GET_DATA_BASED_ON_SECTION:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedValue);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem(
          "selectedValueForLineAnTMLoadGraph",
          action?.selectedValue
        );
        localStorage.setItem(
          "togglingFilterFlagForLineAnTMLoadGraph",
          action?.flagForTogglingFilter
        );
        localStorage.setItem("selectedSection", action?.selectedSection);

        localStorage.setItem("selectedSubSection", action?.selectedSubSection);
        localStorage.setItem(
          "subSections",
          JSON.stringify(action?.subSections)
        );
        localStorage.setItem("selectedCell", action?.selectedCell);
        localStorage.setItem("cells", JSON.stringify(action?.cells));
        localStorage.setItem("selectedLine", action?.selectedLine);
        localStorage.setItem("lines", JSON.stringify(action?.lines));
        localStorage.setItem("selectedMachine", action?.selectedMachine);
        localStorage.setItem("machines", JSON.stringify(action?.machines));
      }

      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedValueForLineAnTMLoadGraph: action?.selectedValue,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedSection: action?.selectedSection,

        selectedSubSection: action?.selectedSubSection,
        subSections: action?.subSections,
        selectedCell: action?.selectedCell,
        cells: action?.cells,
        selectedLine: action?.selectedLine,
        lines: action?.lines,
        selectedMachine: action?.selectedMachine,
        machines: action?.machines,
      };

    case ACTION?.GET_DATA_BASED_ON_SUBSECTION:
      // let obj = {};
      // if (action?.selectedCell) {
      //   obj = {
      //     selectedCell: action?.selectedCell,
      //     selectedValue: action?.selectedCell,
      //     flagForTogglingFilter: action?.flagForTogglingFilter,
      //   };
      // }
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedValue);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedSubSection", action?.selectedSubSection);
        localStorage.setItem("selectedCell", action?.selectedCell);
        localStorage.setItem("cells", JSON.stringify(action?.cells));
        localStorage.setItem("selectedLine", action?.selectedLine);
        localStorage.setItem("lines", JSON.stringify(action?.lines));
        localStorage.setItem("selectedMachine", action?.selectedMachine);
        localStorage.setItem("machines", JSON.stringify(action?.machines));
      }

      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedSubSection: action?.selectedSubSection,

        selectedCell: action?.selectedCell,
        cells: action?.cells,
        selectedLine: action?.selectedLine,
        lines: action?.lines,
        selectedMachine: action?.selectedMachine,
        machines: action?.machines,
      };

    case ACTION?.GET_DATA_BASED_ON_CELL:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedValue);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedCell", action?.selectedCell);
        localStorage.setItem("selectedLine", action?.selectedLine);
        localStorage.setItem("lines", JSON.stringify(action?.lines));
        localStorage.setItem("selectedMachine", action?.selectedMachine);
        localStorage.setItem("machines", JSON.stringify(action?.machines));
      }

      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedCell: action?.selectedCell,

        selectedLine: action?.selectedLine,
        lines: action?.lines,
        selectedMachine: action?.selectedMachine,
        machines: action?.machines,
      };

    case ACTION?.GET_DATA_BASED_ON_LINE:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedValue);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem("selectedLine", action?.selectedLine);
        localStorage.setItem("selectedMachine", action?.selectedMachine);
        localStorage.setItem("machines", JSON.stringify(action?.machines));
      }

      return {
        ...state,
        isLoading: false,
        message: action?.message,

        selectedValue: action?.selectedValue,
        flagForTogglingFilter: action?.flagForTogglingFilter,

        selectedLine: action?.selectedLine,

        selectedMachine: action?.selectedMachine,
        machines: action?.machines,
      };

    case ACTION?.HANDLE_SELECT_SECTION:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedSection);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem(
          "selectedValueForLineAnTMLoadGraph",
          action?.selectedSection
        );
        localStorage.setItem(
          "togglingFilterFlagForLineAnTMLoadGraph",
          action?.flagForTogglingFilter
        );
        localStorage.setItem("selectedSection", action?.selectedSection);

        localStorage.removeItem("selectedSubSection");
        localStorage.removeItem("subSections");
        localStorage.removeItem("selectedCell");
        localStorage.removeItem("cells");
        localStorage.removeItem("selectedLine");
        localStorage.removeItem("lines");
        localStorage.removeItem("selectedMachine");
        localStorage.removeItem("machines");
      }

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
        selectedMachine: "",
        machines: [],
      };

    case ACTION?.HANDLE_SELECT_SUBSECTION:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedSubSection);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem(
          "selectedValueForLineAnTMLoadGraph",
          action?.selectedSubSection
        );
        localStorage.setItem(
          "togglingFilterFlagForLineAnTMLoadGraph",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedSubSection", action?.selectedSubSection);

        localStorage.removeItem("selectedCell");
        localStorage.removeItem("cells");
        localStorage.removeItem("selectedLine");
        localStorage.removeItem("lines");
        localStorage.removeItem("selectedMachine");
        localStorage.removeItem("machines");
      }

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
        selectedMachine: "",
        machines: [],
      };

    case ACTION?.HANDLE_SELECT_CELL:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedCell);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );
        localStorage.setItem(
          "selectedValueForLineAnTMLoadGraph",
          action?.selectedCell
        );
        localStorage.setItem(
          "togglingFilterFlagForLineAnTMLoadGraph",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedCell", action?.selectedCell);
      }

      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedCell,

        selectedValueForLineAnTMLoadGraph: action?.selectedCell,
        togglingFilterFlagForLineAnTMLoadGraph: action?.flagForTogglingFilter,

        selectedCell: action?.selectedCell,
        // lines: action?.lines || [],
        // selectedLine: action?.selectedLine || "",
        // selectedMachine: action?.selectedMachine || "",
        // machines: action?.machines || [],
      };

    case ACTION?.HANDLE_SELECT_LINE:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedLine);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedLine", action?.selectedLine);
      }

      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedLine,

        selectedLine: action?.selectedLine || "",
        // selectedMachine: action?.selectedMachine || "",
        // machines: action?.machines || [],
      };

    case ACTION?.HANDLE_SELECT_MACHINE:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedValue", action?.selectedMachine);
        localStorage.setItem(
          "flagForTogglingFilter",
          action?.flagForTogglingFilter
        );

        localStorage.setItem("selectedMachine", action?.selectedMachine);
      }

      return {
        ...state,

        flagForTogglingFilter: action?.flagForTogglingFilter,
        selectedValue: action?.selectedMachine,

        selectedMachine: action?.selectedMachine,
      };

    case ACTION?.HANDLE_SELECT_YEAR:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedYear", action?.selectedYear);
        !action?.defaultSelectedMonth &&
          localStorage.removeItem("selectedMonth");
        localStorage.removeItem("selectedRSStatus");
        localStorage.removeItem("selectedMaintenanceType");
        localStorage.removeItem("selectedCurrentStatusOfRS");
        localStorage.removeItem("selectedCategoryType");
        localStorage.removeItem("selectedQuarter");
      }

      if (!action?.defaultSelectedMonth) {
        state = {
          ...state,
          selectedMonth: "",
        };
      }

      return {
        ...state,
        selectedYear: action?.selectedYear,
        selectedRSStatus: "",
        selectedMaintenanceType: "",
        selectedCurrentStatusOfRS: "",
        selectedCategoryType: "",
        selectedQuarter: "",
      };

    // case ACTION?.HANDLE_SELECT_YEAR_WITHOUT_FY:
    //   if (action?.isWithLocalStorageForFiltration === "Yes") {
    //     localStorage.setItem(
    //       "selectedYearWithoutFY",
    //       action?.selectedYearWithoutFY
    //     );
    //     localStorage.removeItem("selectedRSStatus");
    //     localStorage.removeItem("selectedMaintenanceType");
    //     localStorage.removeItem("selectedQuarter");
    //   }

    //   return {
    //     ...state,
    //     selectedYearWithoutFY: action?.selectedYearWithoutFY,
    //     selectedRSStatus: "",
    //     selectedMaintenanceType: "",
    //     selectedQuarter: "",
    //   };

    case ACTION?.HANDLE_SELECT_MONTH:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedMonth", action?.selectedMonth);
      }

      return {
        ...state,
        selectedMonth: action?.selectedMonth,
      };

    case ACTION?.HANDLE_SELECT_STATUS:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedRSStatus", action?.selectedRSStatus);
      }

      return {
        ...state,
        selectedRSStatus: action?.selectedRSStatus,
      };

    case ACTION?.HANDLE_SELECT_MAINTENANCE_TYPE:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem(
          "selectedMaintenanceType",
          action?.selectedMaintenanceType
        );
      }

      return {
        ...state,
        selectedMaintenanceType: action?.selectedMaintenanceType,
      };

    case ACTION?.HANDLE_SELECT_CURRENT_RS_STATUS:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem(
          "selectedCurrentStatusOfRS",
          action?.selectedCurrentStatusOfRS
        );
      }

      return {
        ...state,
        selectedCurrentStatusOfRS: action?.selectedCurrentStatusOfRS,
      };

    case ACTION?.HANDLE_SELECT_CM_CATEGORY:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem(
          "selectedCategoryType",
          action?.selectedCategoryType
        );
      }

      return {
        ...state,
        selectedCategoryType: action?.selectedCategoryType,
      };

    case ACTION?.HANDLE_SELECT_QUARTER:
      if (action?.isWithLocalStorageForFiltration === "Yes") {
        localStorage.setItem("selectedQuarter", action?.selectedQuarter);
      }

      return {
        ...state,
        selectedQuarter: action?.selectedQuarter,
      };

    default:
      return state;
  }
};
