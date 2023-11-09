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
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { RenderInputRow } from "./ManageCategories";

const CategoryTreeList = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState([]);
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
    return (
      <div key={category.id}>
        <Divider />

        {/* {console.log("category.id:", category.id, editingId)} */}

        {category.id === editingId ? (
          <RenderInputRow
            inputRef={inputRef}
            onSubmit={onEditCategory}
            category={{ ...category, parentCategoryId }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <ListItem
            sx={[
              {
                "&:hover": { backgroundColor: "#004b5b2e", cursor: "pointer" },
              },
              {
                "& + .MuiListItemSecondaryAction-root": {
                  display: "none",
                },
                "&:hover + .MuiListItemSecondaryAction-root": {
                  display: "flex",
                },
                // ".MuiListItemSecondaryAction-root:hover + &:hover": {
                //   backgroundColor: "#004b5b2e",
                //   cursor: "pointer",
                // },
              },
            ]}
            disablePadding
            onClick={() => {
              category.subCategories?.length > 0 && toggleCategory(category.id);
              setAddingId(null);
            }}
          >
            {category.subCategories?.length > 0 ? (
              <IconButton style={{ marginRight: 5 }} size="small">
                {expandedCategories.includes(category.id) ? (
                  <ExpandLessIcon fontSize="inherit" />
                ) : (
                  <ExpandMoreIcon fontSize="inherit" />
                )}
              </IconButton>
            ) : (
              <span style={{ width: "48px" }} /> // Spacer for the icon
            )}

            <ListItemText
              primary={category.name}
              sx={{
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
              }}
            />
            <ListItemSecondaryAction sx={{ "&:hover": { display: "flex" } }}>
              <IconButton
                size="small"
                onClick={() => {
                  setEditingId(category.id);
                  console.log("editing id:", category.id);
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDeleteCategory(category.id)}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>

              {parentCategoryId < 0 && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setAddingId(parentCategoryId);
                    setExpandedCategories([category.id]);
                  }}
                >
                  <AddIcon fontSize="inherit" />
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        )}

        {category.subCategories?.length > 0 &&
          expandedCategories.includes(category.id) && (
            <List disablePadding>
              {addingId === parentCategoryId && (
                <RenderInputRow
                  inputRef={inputRef}
                  onSubmit={onAddCategory}
                  category={{ parentCategoryId: -2 }}
                  onCancel={() => setAddingId(null)}
                />
              )}

              {category.subCategories?.map((childCategory) => (
                <RenderCategory
                  category={childCategory}
                  parentCategoryId={category.id}
                />
              ))}
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
        <Button
          variant="outlined"
          size="small"
          sx={{
            color: "#004b5b",
            borderColor: "#004b5b",
            "&:hover": { borderColor: "#3f97a9" },
          }}
          endIcon={<AddIcon />}
          onClick={() => setEditingId(-1)}
        >
          <Typography sx={{ pt: "2px" }} variant="body1">
            Add new Category
          </Typography>
        </Button>
      </Stack>

      <List sx={{ pb: 0 }}>
        {editingId && editingId === -1 && (
          <RenderInputRow
            inputRef={inputRef}
            onSubmit={onAddCategory}
            category={{ parentCategoryId: -1 }}
            onCancel={() => setEditingId(null)}
          />
        )}

        {categories.map((category) => (
          <RenderCategory category={category} parentCategoryId={-1} />
        ))}
      </List>
    </Box>
  );
};

export default CategoryTreeList;
