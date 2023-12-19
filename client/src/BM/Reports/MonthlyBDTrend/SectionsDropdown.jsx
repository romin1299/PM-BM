import * as React from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import axios from "axios";
import { OutlinedInput } from "@mui/material";

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

export default function SectionsDropdown({ sectionId, setSectionId }) {
  const [sectionValues, setsectionValues] = React.useState([]);

  const handleChange = (event) => {
    setSectionId(event.target.value);
  };

  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const fetchValues = async () => {
    const url = `${baseUrlForFiltering}/byDefault`;
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      console.log("section dropdown res:", res.data.subSections);

      setsectionValues(res.data.subSections);
      setSectionId(res.data.subSections[0]?._id);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    fetchValues();
  }, []);

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <Select
        displayEmpty
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={sectionId}
        label="Section"
        sx={{
          width: 130,
          "& .MuiSelect-select": { paddingTop: "5px", paddingBottom: "5px" },
        }}
        MenuProps={MenuProps}
        input={<OutlinedInput />}
        onChange={handleChange}
      >
        <MenuItem disabled sx={{ pt: 0, pb: 0 }}>
          <em>Sub Sections</em>
        </MenuItem>
        {sectionValues &&
          sectionValues.map((section, index) => (
            <MenuItem key={index} value={section._id}>
              {section.subSection_name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
