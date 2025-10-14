import React, { useEffect, useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { Box } from "@mui/material";
import CategoryTreeList from "./CategoryTreeList";
import axios from "axios";

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

const ManageCategories = ({notEditable}) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/getCategories", {
        withCredentials: true,
        credentials: "include",
      });
      // console.log("res:", res);
      // console.log("getCategory:", res.data.getCategory);
      setCategories(res.data.getCategory);
    } catch (error) {
      console.log("error:", error);
    }
  };

  const handleAddCategory = async (
    categoryName,
    categoryId,
    parentCategoryId
  ) => {
    try {
      axios({
        method: "post",
        url:
          // check if desired category is subcategory or not
          parentCategoryId <= 0
            ? // parentCategoryId <= 0 means it has no other parent category
              // if category has no parent then call api to add category
              "/addCategories"
            : // if category has parent then call api to add sub category
              `/addSubCategories/${parentCategoryId}`,
        data: { name: categoryName },
        withCredentials: true,
      });

      fetchCategories();
    } catch (error) {
      console.log("error:", error);
    }
  };

  //optimizing below function is remaining
  const handleEditCategory = async (
    categoryName,
    categoryId,
    parentCategoryId
  ) => {
    try {
      axios({
        method: "patch",
        url:
          // check if desired category is subcategory or not
          parentCategoryId <= 0
            ? // parentCategoryId <= 0 means it has no other parent category
              // if category has no parent then call api to update category
              `/updateCategory/${categoryId}`
            : // if category has parent then call api to update sub category
              `/updateSubCategory/${categoryId}`,
        data:
          parentCategoryId <= 0
            ? { catName: categoryName }
            : { subName: categoryName },
        withCredentials: true,
      });

      fetchCategories();
    } catch (error) {
      console.log("error:", error);
    }
  };

  const handleDeleteCategory = async (
    categoryName,
    categoryId,
    parentCategoryId
  ) => {
    try {
      axios({
        method: "patch",
        url:
          // check if desired category is subcategory or not
          parentCategoryId <= 0
            ? // parentCategoryId <= 0 means it has no other parent category
              // if category has no parent then call api to delete category
              `/deleteCategory/${categoryId}`
            : // if category has parent then call api to delete sub category
              `/deleteSubCategory/${parentCategoryId}/${categoryId}`,
        data: { catName: categoryName },
        withCredentials: true,
      });

      fetchCategories();
    } catch (error) {
      console.log("error:", error);
    }
  };

  return (
    <Box>
      <CategoryTreeList
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        notEditable={notEditable}
      />
    </Box>
  );
};

export default ManageCategories;

export const RenderInputRow = ({ category, inputRef, onSubmit, onCancel }) => {
  // category with parentCategoryId == -1 means there is not parent
  // category with mongodb object _id as parentCategoryId means this category has parent with `_id`
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
      <span style={{ width: isParent ? "33px" : "48px" }} />

      <form></form>

      <input
        type="text"
        placeholder={
          isParent ? "Enter category name" : "Enter sub category name"
        }
        ref={inputRef}
        className={`category-input-button ${isParent ? "fs-1rem" : ""}`}
        defaultValue={category?.name}
        style={{
          width: isParent ? "82%" : "78%",
          fontWeight: isParent ? "500" : "400",
        }}
        autoFocus
      />

      <ListItemSecondaryAction sx={{ "&:hover": { display: "flex" } }}>
        <IconButton
          type="submit"
          size="small"
          color="success"
          onClick={() => {
            // params sequence for all action functions (parentCategoryId, categoryName, subCategoryId)
            if (inputRef.current.value.trim() !== "") {
              onSubmit(
                inputRef.current.value,
                category._id,
                category.parentCategoryId
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
