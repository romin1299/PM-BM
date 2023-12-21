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

export default function TeamMembersDropdown({
  tmId,
  setTmId,
  selectedValue,
  flagForTogglingFilter,
}) {
  const [menuItems, setMenuItems] = React.useState([]);

  const handleChange = (event) => {
    console.log("event.target.value:", event.target.value);
    setTmId(event.target.value);
  };

  const fetchValues = async () => {
    const url = `/getAllTmNames/${flagForTogglingFilter}/${selectedValue}`;
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      console.log("tm dropdown res:", res?.data?.TLHOSS_and_TM_user_list);

      setMenuItems(res?.data?.TLHOSS_and_TM_user_list);
      setTmId(res?.data?.TLHOSS_and_TM_user_list?.[0]?._id);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    if (selectedValue) fetchValues();
  }, [selectedValue]);

  return (
    <FormControl sx={{ minWidth: 170 }} size="small">
      <Select
        displayEmpty
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={tmId}
        label="Section"
        sx={{
          width: 170,
          fontSize: "14px",
          "& .MuiSelect-select": {
            paddingTop: "5px",
            paddingBottom: "5px",
          },
        }}
        MenuProps={MenuProps}
        input={<OutlinedInput />}
        onChange={handleChange}
      >
        <MenuItem disabled sx={{ pt: 0, pb: 0, fontSize: "14px" }}>
          <em style={{ fontSize: "14px", color: "#9f9f9f" }}>Select TM</em>
        </MenuItem>
        {menuItems &&
          menuItems.map((item, index) => (
            <MenuItem
              key={index}
              value={item._id}
              sx={{
                fontSize: "14px",
              }}
            >
              {item.tm_name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
