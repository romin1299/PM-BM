import * as React from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import { useState, useEffect, useContext } from "react";

import RoutingContext from "../../../../context/routing/RoutingContext";
import { fetchFinancialYears } from "../../../../Integration/APIExports";

import { ACTION, getFiltrationValue } from "./CommonFiltrationComponent";
import { Box, Button } from "@mui/material";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 130,
    },
  },
};

const products = [
  "Product 1",
  "Product 2",
  "Product 3",
  "Product 4",
  "Product 5",
];

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const Months = [
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

export default function LineSelectionDropdown({
  selectedSection,
  sections,
  selectedSubSection,
  subSections,
  selectedCell,
  cells,
  selectedLine,
  lines,
  selectedMachine,
  machines,
  selectedYear,
  selectedMonth,

  reducerDispatch,
  baseUrlForFiltering,
  monthFiltration,
  yearFiltration,

  sectionFiltration,
  subSectionFiltration,
  cellFiltration,
  lineFiltration,
  machineFiltration,

  resetButtonFiltration,
}) {
  const context = useContext(RoutingContext);

  const theme = useTheme();

  const [financialYears, setFinancialYears] = useState([selectedYear]);

  const getStyleForSelectedValue = async (item, selectedItem, purpose) => {
    return {
      fontWeight:
        (purpose === "for-array-value" ? item : item?._id) === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
  }, []);

  const getFiltrationValueBasedOnSection = async ({ section }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/sectionBased/${section}`,
      });

      const {
        message,

        flagForTogglingFilter,
        selectedValue,

        selectedSection,

        selectedSubSection,
        subSections,
        selectedCell,
        cells,
        selectedLine,
        lines,
        selectedMachine,
        machines,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_SECTION,

          flagForTogglingFilter,
          selectedValue,

          selectedSection,

          selectedSubSection,
          subSections,
          cells,
          selectedCell,
          selectedLine,
          lines,
          selectedMachine,
          machines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueBasedOnSubSection = async ({ subSection }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/subSectionBased/${subSection}`,
      });

      const {
        message,

        selectedValue,
        flagForTogglingFilter,

        selectedSubSection,

        selectedCell,
        cells,
        selectedLine,
        lines,
        selectedMachine,
        machines,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_SUBSECTION,

          selectedValue,
          flagForTogglingFilter,

          selectedSubSection,

          selectedCell,
          cells,
          selectedLine,
          lines,
          selectedMachine,
          machines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueBasedOnCell = async ({ cell }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/cellBased/${cell}`,
      });
      const {
        message,
        flagForTogglingFilter,
        selectedValue,

        selectedCell,

        selectedLine,
        lines,
        selectedMachine,
        machines,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_CELL,
          flagForTogglingFilter,
          selectedValue,

          selectedCell,

          selectedLine,
          lines,
          selectedMachine,
          machines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueBasedOnLine = async ({ line }) => {
    try {
      const { res, data } = await getFiltrationValue({
        url: `${baseUrlForFiltering}/lineBased/${line}`,
      });
      const {
        message,

        flagForTogglingFilter,
        selectedValue,

        selectedLine,

        machines,
        selectedMachine,
      } = data;

      if (res?.status === 201) {
        reducerDispatch({
          type: ACTION.GET_DATA_BASED_ON_LINE,
          flagForTogglingFilter,
          selectedValue,

          selectedLine,

          selectedMachine,
          machines,
          message,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getFiltrationValueByDefault = async () => {
    const { res, data } = await getFiltrationValue({
      url: `${baseUrlForFiltering}/byDefault`,
    });

    const {
      message,

      flagForTogglingFilter,
      selectedValue,

      selectedSection,
      sections,
      selectedSubSection,
      subSections,
      selectedCell,
      cells,
      selectedLine,
      lines,
      selectedMachine,
      machines,
    } = data;

    if (res?.status === 201) {
      reducerDispatch({
        type: ACTION.GET_DATA,

        flagForTogglingFilter,
        selectedValue,

        selectedSection,
        sections,
        selectedSubSection,
        subSections,
        cells,
        selectedCell,
        selectedLine,
        lines,
        selectedMachine,
        machines,
        message,
      });
    }
  };

  useEffect(() => {
    getFiltrationValueByDefault();
  }, []);

  return (
    <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {(baseUrlForFiltering === "/getFiltrationValue/plant-level-filtration"
        ? true
        : context?.tm_grade === "HOD") &&
        sectionFiltration &&
        sections?.length > 0 && (
          <FormControl size="small">
            <Select
              displayEmpty
              value={selectedSection}
              onChange={(e) => {
                reducerDispatch({
                  type: ACTION.HANDLE_SELECT_SECTION,
                  flagForTogglingFilter: "based-on-section",
                  selectedSection: e.target.value,
                });
                getFiltrationValueBasedOnSection({ section: e.target.value });
              }}
              input={<OutlinedInput />}
              // renderValue={(selected) => <strong>{selected}</strong>}
              sx={{
                width: 130,
                "& .MuiSelect-select": {
                  paddingTop: "5px",
                  paddingBottom: "5px",
                },
              }}
              MenuProps={MenuProps}
              inputProps={{ "aria-label": "Without label" }}
            >
              <MenuItem disabled value="">
                <em style={{ fontSize: "14px", color: "#9f9f9f" }}>Sections</em>
              </MenuItem>

              {sections.map((item) => (
                <MenuItem
                  key={item?._id}
                  value={item?._id}
                  style={getStyleForSelectedValue(item, selectedSection)}
                >
                  {item?.section_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

      {subSectionFiltration && subSections?.length > 0 && (
        <FormControl size="small">
          <Select
            displayEmpty
            value={selectedSubSection}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_SUBSECTION,
                flagForTogglingFilter: "based-on-subSection",
                selectedSubSection: e.target.value,
              });
              getFiltrationValueBasedOnSubSection({
                subSection: e.target.value,
              });
            }}
            input={<OutlinedInput />}
            // renderValue={(selected) => <strong>{selected}</strong>}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            {/* {selectedSubSection === "" && ( )} */}
            <MenuItem disabled value="">
              <em style={{ fontSize: "14px", color: "#9f9f9f" }}>
                Sub Sections
              </em>
            </MenuItem>

            {subSections.map((item) => (
              <MenuItem
                key={item?._id}
                value={item?._id}
                style={getStyleForSelectedValue(item, selectedSubSection)}
              >
                {item?.subSection_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {cellFiltration && cells?.length > 0 && (
        <FormControl size="small">
          <Select
            displayEmpty
            value={selectedCell}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_CELL,
                flagForTogglingFilter: "based-on-cell",
                selectedCell: e.target.value,
              });
              getFiltrationValueBasedOnCell({ cell: e.target.value });
            }}
            input={<OutlinedInput />}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem disabled value="">
              <em style={{ fontSize: "14px", color: "#9f9f9f" }}>
                Select Cell
              </em>
            </MenuItem>

            {cells.map((item) => (
              <MenuItem
                key={item?._id}
                value={item?._id}
                style={getStyleForSelectedValue(item, selectedCell)}
              >
                {item?.cell_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {lineFiltration && lines?.length > 0 && (
        <FormControl size="small">
          <Select
            displayEmpty
            value={selectedLine}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_LINE,
                flagForTogglingFilter: "based-on-line",
                selectedLine: e.target.value,
              });
              getFiltrationValueBasedOnLine({ line: e.target.value });
            }}
            input={<OutlinedInput />}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem disabled value="">
              <em style={{ fontSize: "14px", color: "#9f9f9f" }}>
                Select Line
              </em>
            </MenuItem>

            {lines.map((item) => (
              <MenuItem
                key={item?._id}
                value={item?._id}
                style={getStyleForSelectedValue(item, selectedLine)}
              >
                {item?.line_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {machineFiltration && machines?.length > 0 && (
        <FormControl size="small">
          <Select
            displayEmpty
            value={selectedMachine}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_MACHINE,
                flagForTogglingFilter: "based-on-machine",
                selectedMachine: e.target.value,
              });
            }}
            input={<OutlinedInput />}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            <MenuItem disabled value="">
              <em style={{ fontSize: "14px", color: "#9f9f9f" }}>
                Select Machine
              </em>
            </MenuItem>

            {machines.map((item) => (
              <MenuItem
                key={item?._id}
                value={item?._id}
                style={getStyleForSelectedValue(item, selectedMachine)}
              >
                {item?.machine_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {yearFiltration && (
        <FormControl size="small">
          <Select
            displayEmpty
            value={selectedYear}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_YEAR,
                selectedYear: e.target.value,
              });
            }}
            input={<OutlinedInput />}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            renderValue={(value) => {
              if (value) return value;
              return "Year";
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            {financialYears.map((item) => (
              <MenuItem
                key={item}
                value={item}
                style={getStyleForSelectedValue(
                  item,
                  selectedYear,
                  "for-array-value"
                )}
              >
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl size="small">
        {monthFiltration && (
          <Select
            displayEmpty
            value={selectedMonth}
            onChange={(e) => {
              reducerDispatch({
                type: ACTION.HANDLE_SELECT_MONTH,
                selectedMonth: e.target.value,
              });
            }}
            input={<OutlinedInput />}
            sx={{
              width: 130,
              "& .MuiSelect-select": {
                paddingTop: "5px",
                paddingBottom: "5px",
              },
            }}
            renderValue={(value) => {
              if (value) {
                return value;
              }
              return "Month";
            }}
            MenuProps={MenuProps}
            inputProps={{ "aria-label": "Without label" }}
          >
            {Months.map((item) => (
              <MenuItem
                key={item}
                value={item}
                style={getStyleForSelectedValue(
                  item,
                  selectedMonth,
                  "for-array-value"
                )}
              >
                {item}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>

      {resetButtonFiltration && (
        <Button
          // className="btn bg-button"
          variant="contained"
          size="small"
          disableElevation
          className="bg-button"
          onClick={async () => {
            let selectedYear =
              new Date().getMonth() < 3
                ? `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`
                : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

            await reducerDispatch({
              type: ACTION.HANDLE_SELECT_YEAR,
              selectedYear,
            });

            getFiltrationValueByDefault(selectedYear);
          }}
        >
          Reset
        </Button>
      )}
    </Box>
  );
}

export const YearDropdown = ({ selectedYear, setSelectedYear }) => {
  const theme = useTheme();

  const getStyleForSelectedValue = async (item, selectedItem) => {
    return {
      fontWeight:
        item === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  const [financialYears, setFinancialYears] = useState([selectedYear]);

  const fetchFYYearData = async () => {
    const { financialYears } = await fetchFinancialYears();
    setFinancialYears(financialYears);
  };

  useEffect(() => {
    fetchFYYearData();
  }, []);

  return (
    <>
      <Select
        displayEmpty
        value={selectedYear}
        onChange={(e) => {
          setSelectedYear(e.target.value);
        }}
        input={<OutlinedInput />}
        sx={{
          width: 130,
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        renderValue={(value) => {
          if (value) {
            return value;
          }
          return "Year";
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {financialYears.map((item) => (
          <MenuItem
            key={item}
            value={item}
            style={getStyleForSelectedValue(item, selectedYear)}
          >
            {item}
          </MenuItem>
        ))}
      </Select>
    </>
  );
};

export const MonthDropdown = ({ selectedMonth, setSelectedMonth }) => {
  const theme = useTheme();

  const getStyleForSelectedValue = async (item, selectedItem) => {
    return {
      fontWeight:
        item === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  return (
    <>
      <Select
        displayEmpty
        value={selectedMonth}
        onChange={(e) => {
          setSelectedMonth(e.target.value);
        }}
        input={<OutlinedInput />}
        sx={{
          width: 130,
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        renderValue={(value) => {
          if (value) {
            return value;
          }
          return "Month";
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        {Months.map((item) => (
          <MenuItem
            key={item}
            value={item}
            style={getStyleForSelectedValue(item, selectedMonth)}
          >
            {item}
          </MenuItem>
        ))}
      </Select>
    </>
  );
};

export const CommonDropdown = ({
  selectedItem,
  setSelectedItem,
  arr,
  defaultTitle,
  objKeyName,
}) => {
  const theme = useTheme();

  const getStyleForSelectedValue = async (item, selectedItem) => {
    return {
      fontWeight:
        item?._id === selectedItem
          ? theme.typography.fontWeightMedium
          : theme.typography.fontWeightRegular,
    };
  };

  return (
    <>
      <Select
        displayEmpty
        value={selectedItem}
        onChange={(e) => {
          setSelectedItem(e.target.value);
        }}
        input={<OutlinedInput />}
        sx={{
          width: 130,
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        MenuProps={MenuProps}
        inputProps={{ "aria-label": "Without label" }}
      >
        <MenuItem disabled value="">
          <em style={{ fontSize: "14px", color: "#9f9f9f" }}>{defaultTitle}</em>
        </MenuItem>

        {arr.map((item) => (
          <MenuItem
            key={item?._id}
            value={item?._id}
            style={getStyleForSelectedValue(item, selectedItem)}
          >
            {item?.[objKeyName]}
          </MenuItem>
        ))}
      </Select>
    </>
  );
};

{
  /* <Select
displayEmpty
value={selectedSection}
onChange={handleChange}
input={<OutlinedInput />}
renderValue={(selected) => {
  if (selected.length === 0) {
    return <strong>Sections</strong>;
  }

  return selected.join(", ");
}}
sx={{
  width: 130,
  "& .MuiSelect-select": {
    paddingTop: "5px",
    paddingBottom: "5px",
  },
}}
MenuProps={MenuProps}
inputProps={{ "aria-label": "Without label" }}
>
<MenuItem disabled value="">
  <p>Sections</p>
</MenuItem>
{products.map((name) => (
  <MenuItem
    key={name}
    value={name}
    style={getStyles(name, personName, theme)}
  >
    {name}
  </MenuItem>
))}
</Select> */
}
