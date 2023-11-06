import React, { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { Box } from "@mui/material";
import CategoryTreeList from "./CategoryTreeList";

const initialState = [
  {
    id: 22,
    name: "Problem",
    subCategories: [
      {
        id: 23,
        name: "This is problem 1",
        subCategories: [],
      },
      {
        id: 24,
        name: "This is problem 2",
        subCategories: [],
      },
      {
        id: 25,
        name: "This is problem 3",
        subCategories: [],
      },
      {
        id: 26,
        name: "This is problem 4",
        subCategories: [],
      },
    ],
  },
  {
    id: 32,
    name: "Break Down",
    subCategories: [
      {
        id: 33,
        name: "This is BD 1",
        subCategories: [],
      },
      {
        id: 34,
        name: "This is BD 2",
        subCategories: [],
      },
      {
        id: 35,
        name: "This is BD 3",
        subCategories: [],
      },
      {
        id: 36,
        name: "This is BD 4",
        subCategories: [],
      },
    ],
  },
  {
    id: 42,
    name: "Critical",
    subCategories: [
      {
        id: 43,
        name: "This is Major Error 1",
        subCategories: [],
      },
      {
        id: 44,
        name: "This is Major Error 2",
        subCategories: [],
      },
    ],
  },
];

const ManageCategories = () => {
  const [categories, setCategories] = useState(initialState);

  const handleAddCategory = (parentCategoryId, categoryName, subCategoryId) => {
    // Implement the add category functionality
    // Update the state accordingly
    console.log("Add --> req.body:", {
      name: categoryName,
      parentCategoryId,
      subCategoryId,
    });
  };

  const handleEditCategory = (
    parentCategoryId,
    categoryName,
    subCategoryId
  ) => {
    // Implement the edit category functionality
    // Update the state accordingly
    console.log("Edit --> req.body:", {
      name: categoryName,
      parentCategoryId,
      subCategoryId,
    });
  };

  const handleDeleteCategory = (
    parentCategoryId,
    categoryName,
    subCategoryId
  ) => {
    // Implement the delete category functionality
    // Update the state accordingly
    console.log("Delete --> req.body:", {
      name: categoryName,
      parentCategoryId,
      subCategoryId,
    });
  };

  return (
    <Box>
      <CategoryTreeList
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </Box>
  );
};

export default ManageCategories;

export const RenderInputRow = ({ category, inputRef, onSubmit, onCancel }) => {
  const isParent = category.parentCategoryId === -1;
  return (
    <ListItem
      sx={{
        backgroundColor: "#004b5b14",
        cursor: "pointer",
        borderRadius: "5px",
        pt: isParent ? "1px" : "2px",
        pb: isParent ? "1px" : "2px",
      }}
      disablePadding
    >
      <span style={{ width: "33px" }} />

      <input
        type="text"
        placeholder={
          category?.name ? "Enter Subcategory name" : "Enter Category name"
        }
        ref={inputRef}
        className={`category-input-button ${isParent ? "fs-1rem" : ""}`}
        defaultValue={category?.name}
        style={{ width: "85%", fontWeight: isParent ? "600" : "400" }}
        autoFocus
      />

      <ListItemSecondaryAction sx={{ "&:hover": { display: "flex" } }}>
        <IconButton
          size="small"
          color="success"
          onClick={() => {
            // params sequence for all action functions (parentCategoryId, categoryName, subCategoryId)
            if (inputRef.current.value.trim() !== "") {
              onSubmit(
                category.parentCategoryId,
                inputRef.current.value,
                category.id
              );
              onCancel();
            }
          }}
        >
          <DoneIcon fontSize="inherit" color="success" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onCancel}>
          <CloseIcon fontSize="inherit" color="error" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};
