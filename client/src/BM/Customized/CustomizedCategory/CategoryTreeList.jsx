import React, { useRef, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { RenderInputRow } from "./ManageCategories";
import MuiDeleteDialog from "./MuiDeleteDialog";
import { Row, Col } from "react-bootstrap";

const CategoryTreeList = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState([]);
  //adding and editing is similar, can be optimized by using only one but for better understanding there are two states
  const [addingId, setAddingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const inputRef = useRef(null);

  const toggleCategory = (categoryId) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(
        expandedCategories.filter((id) => id !== categoryId)
      );
    } else {
      setExpandedCategories([categoryId]);
    }
  };

  const RenderCategory = ({ category, parentCategoryId }) => {
    // console.log("category._id:", category.name, "-->", category._id);
    // console.log("parentCategoryId:", parentCategoryId);

    const listItemStyles = [
      {
        "&:hover": { backgroundColor: "#004b5b2e", cursor: "pointer" },
      },
      {
        "& + .MuiListItemSecondaryAction-root": {
          visibility: "hidden",
        },
        "&:hover + .MuiListItemSecondaryAction-root": {
          visibility: "visible",
        },
      },
    ];

    const listItemTextStyles = {
      "& .MuiListItemText-primary":
        parentCategoryId < 0
          ? {
            // color: "#4f4f4f",
            fontWeight: "600",
          }
          : {
            color: "#555555",
            fontSize: "15px",
          },
    };

    return (
      <div key={category._id}>
        <Divider />

        {category._id === editingId ? (
          // If the current category is set to editing then the row will be rendered as input field
          <RenderInputRow
            inputRef={inputRef}
            onSubmit={onEditCategory}
            category={{ ...category, parentCategoryId }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          // else category will be shown as simple text item
          <ListItem
            sx={listItemStyles}
            disablePadding
            onClick={() => {
              category.subCategories?.length > 0 &&
                toggleCategory(category._id);
              setAddingId(null);
            }}
          >
            {category.subCategories?.length > 0 ? (
              // If current category has subcategories then expand icons will be shown
              <IconButton style={{ marginRight: 5 }} size="small">
                {expandedCategories.includes(category._id) ? (
                  <ExpandLessIcon fontSize="inherit" />
                ) : (
                  <ExpandMoreIcon fontSize="inherit" />
                )}
              </IconButton>
            ) : (
              // else make space instead of icon before category name
              <span style={{ width: parentCategoryId < 0 ? "33px" : "48px" }} />
            )}

            <ListItemText primary={category.name} sx={listItemTextStyles} />

            <ListItemSecondaryAction
              sx={{ "&:hover": { visibility: "visible" } }}
            >
              {parentCategoryId < 0 && (
                // Subcategories can be added only to the categories with parent Id < 0  [i.e. -1]
                <Tooltip title="Add Subcategory" disableInteractive>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingId(null);
                      setAddingId(parentCategoryId);
                      setExpandedCategories([category._id]);
                    }}
                  >
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Edit" disableInteractive>
                <IconButton
                  size="small"
                  onClick={() => {
                    setAddingId(null);
                    setEditingId(category._id);
                    console.log("editing id:", category._id);
                  }}
                >
                  <EditIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>

              <MuiDeleteDialog
                item={{ ...category, parentCategoryId }}
                handleSubmit={onDeleteCategory}
              />
            </ListItemSecondaryAction>
          </ListItem>
        )}

        {parentCategoryId < 0 && expandedCategories.includes(category._id) && (
          <List disablePadding>
            {category.subCategories?.map((childCategory) => (
              <RenderCategory
                category={childCategory}
                parentCategoryId={category._id}
              />
            ))}

            {addingId === parentCategoryId && (
              //If sub category is being added and parent category id matches then render the input row
              <RenderInputRow
                inputRef={inputRef}
                onSubmit={onAddCategory}
                category={{ parentCategoryId: category._id }}
                onCancel={() => setAddingId(null)}
              />
            )}
          </List>
        )}
      </div>
    );
  };

  return (
    <Box className="cell p-3">
      <h4>Categories</h4>

      <Stack
      // justifyContent={"end"}
      // alignItems="center"
      // direction="row"
      // spacing={2}
      >
        <Row>
          <Col >
            <Button
              variant="contained"
              size="small"
              sx={{
                color: "#ffffff",
                background: "#E47E07",
                "&:hover": { borderColor: "#E47E07",background: "#BC6806" },
              }}
              endIcon={<AddIcon />}
              onClick={() => {
                setEditingId(-1);
                toggleCategory(-1);
              }}
            >
              <Typography sx={{ pt: "2px" }} variant="body1">
                Add new Category
              </Typography>
            </Button>
          </Col>
        </Row>

      </Stack>

      <List sx={{ pb: 0 }}>
        {/* map all the categories fetched from the server */}
        {categories.length > 0 ? (
          categories.map((category) => (
            // for the first iteration of the mapping the given category will always be parent.
            // parentCategoryId = -1 means that there does not exist parent for this category.
            <RenderCategory category={category} parentCategoryId={-1} />
          ))
        ) : (
          <div className="alert alert-secondary mb-2 text-center text-danger" role="alert">
            No categories data to show!
          </div>
        )}

        {/* New category adding row will be rendered here */}
        {editingId && editingId === -1 && (
          <RenderInputRow
            inputRef={inputRef}
            onSubmit={onAddCategory}
            category={{ parentCategoryId: -1 }}
            onCancel={() => setEditingId(null)}
          />
        )}
      </List>
    </Box>
  );
};

export default CategoryTreeList;
