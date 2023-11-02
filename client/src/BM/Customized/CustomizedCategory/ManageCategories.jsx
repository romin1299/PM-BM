import React, { useState } from "react";
import {IconButton, List, ListItem, Paper, TextField } from "@mui/material";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { Col, Row } from "react-bootstrap";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

// SubcategoryActions component for rendering IconButton with icon
const SubcategoryActions = ({ onAction, icon }) => (
  <IconButton size="small" onClick={onAction}>
    {icon}
  </IconButton>
);

const ManageCategories = () => {
  // State variables
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [mainTitles, setMainTitles] = useState([
    {
      label: "Category 1",
      subcategories: ["Subcategory A", "Subcategory B", "Subcategory C"],
    },
    {
      label: "Category 2",
      subcategories: ["Subcategory D", "Subcategory E", "Subcategory F"],
    },
  ]);
  const [newMainTitle, setNewMainTitle] = useState("");
  const [editedMainTitle, setEditedMainTitle] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  const [currentIndex, setCurrentIndex] = useState(null);
  const [editedSubcategory, setEditedSubcategory] = useState("");

  // Handler for category selection change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory("");
  };

  // Handler for subcategory selection change
  const handleSubcategoryChange = (e) => {
    setSelectedSubcategory(e.target.value);
  };

  // Handler for various actions (add, edit, delete)
  const handleAction = (actionType, currSubcategory) => {
    switch (actionType) {
      // Add new main title
      case "addMainTitle":
        if (newMainTitle.trim() !== "") {
          const updatedMainTitles = [
            ...mainTitles,
            { label: newMainTitle, subcategories: [] },
          ];
          setMainTitles(updatedMainTitles);
          setSelectedCategory(newMainTitle);
          setNewMainTitle("");
        }
        break;

      // Edit main title
      case "editMainTitle":
        if (editedMainTitle.trim() !== "") {
          const updatedMainTitles = mainTitles.map((title) =>
            title.label === selectedCategory
              ? { ...title, label: editedMainTitle }
              : title
          );
          setMainTitles(updatedMainTitles);
          setSelectedCategory(editedMainTitle);
          setEditedMainTitle("");
        }
        break;

      // Delete main title
      case "deleteMainTitle":
        const updatedMainTitles = mainTitles.filter(
          (title) => title.label !== selectedCategory
        );
        setMainTitles(updatedMainTitles);
        setSelectedCategory("");
        setSelectedSubcategory("");
        break;

      // Add new subcategory
      case "addSubcategory":
        if (newSubcategory.trim() !== "") {
          const updatedMainTitles = mainTitles.map((title) =>
            title.label === selectedCategory
              ? {
                  ...title,
                  subcategories: [...title.subcategories, newSubcategory],
                }
              : title
          );
          setMainTitles(updatedMainTitles);
          setNewSubcategory("");
        }
        break;

      // Edit subcategory
      case "editSubcategory":
        console.log("editedSubcategory:", editedSubcategory);
        if (editedSubcategory.trim() !== "") {
          const updatedMainTitles = mainTitles.map((title) => {
            console.log("title:", title);

            return title.label === selectedCategory
              ? {
                  ...title,
                  subcategories: title.subcategories.map((sub) => {
                    console.log("sub:", sub);
                    console.log("selectedSubcategory:", selectedSubcategory);
                    return sub === selectedSubcategory
                      ? editedSubcategory
                      : sub;
                  }),
                }
              : title;
          });
          setCurrentIndex(null);
          setMainTitles(updatedMainTitles);
          setSelectedSubcategory(editedSubcategory);
          setEditedSubcategory("");
        }
        break;

      // Delete subcategory
      case "deleteSubcategory":
        const updatedTitles = mainTitles.map((title) => {
          console.log("title:", title);

          return title.label === selectedCategory
            ? {
                ...title,
                subcategories: title.subcategories.filter(
                  (sub) => sub !== currSubcategory
                ),
              }
            : title;
        });
        setMainTitles(updatedTitles);
        break;

      default:
        break;
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3 }} className="container">
      <h4>Categories</h4>

      <Row className="mb-2">
        <Col className="col-auto">
          <TextField
            label="New Main Title"
            id="new-main-title"
            value={newMainTitle}
            onChange={(e) => setNewMainTitle(e.target.value)}
            size="small"
          />
        </Col>
        <Col className="col-auto">
          <SubcategoryActions
            onAction={() => handleAction("addMainTitle")}
            icon={<AddIcon />}
          />
        </Col>
      </Row>

      <Row className="mb-2">
        <Col lg={4} className="col-auto">
          <select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Select Category</option>
            {mainTitles.map((mainTitle, index) => (
              <option key={index} value={mainTitle.label}>
                {mainTitle.label}
              </option>
            ))}
          </select>
        </Col>

        <Col lg={8}>
          {selectedCategory && (
            <>
              <TextField
                type="text"
                value={editedMainTitle}
                onChange={(e) => setEditedMainTitle(e.target.value)}
                label="Edit Main Title"
                variant="outlined"
                size="small"
              />

              <SubcategoryActions
                onAction={() => handleAction("editMainTitle")}
                icon={<ModeEditIcon />}
              />

              <SubcategoryActions
                onAction={() => handleAction("deleteMainTitle")}
                icon={<DeleteIcon />}
              />
            </>
          )}
        </Col>
      </Row>

      {selectedCategory && (
        <>
          {mainTitles
            .find((mainTitle) => mainTitle.label === selectedCategory)
            .subcategories.map((subcategory, index) => (
              <Row key={index}>
                <Col lg={4} className="ps-5 col-sm-auto">
                  <List>
                    {currentIndex === index ? (
                      <>
                        <input
                          value={editedSubcategory}
                          onChange={(e) => setEditedSubcategory(e.target.value)}
                          label="Edit Subcategory"
                        />
                        <SubcategoryActions
                          onAction={(e) => handleAction("editSubcategory")}
                          icon={<DoneIcon fontSize="small" color="success" />}
                        />

                        <SubcategoryActions
                          onAction={() => setCurrentIndex(null)}
                          icon={<CloseIcon fontSize="small" color="danger" />}
                        />
                      </>
                    ) : (
                      <ListItem
                        component="div"
                        disablePadding
                        key={index}
                        value={subcategory}
                      >
                        {subcategory}
                      </ListItem>
                    )}
                  </List>
                </Col>

                <Col lg={8} className="col-sm-auto">
                  <SubcategoryActions
                    onAction={() => {
                      setCurrentIndex(index);
                      setSelectedSubcategory(subcategory);
                      setEditedSubcategory(subcategory);
                    }}
                    icon={<ModeEditIcon fontSize="small" />}
                  />

                  <SubcategoryActions
                    onAction={() => {
                      handleAction("deleteSubcategory", subcategory);
                    }}
                    icon={<DeleteIcon fontSize="small" />}
                  />
                </Col>
              </Row>
            ))}

          <Row>
            <Col lg={12} className="ps-5 col-sm-auto">
              <TextField
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                label="New Subcategory"
                variant="outlined"
                size="small"
              />
              <SubcategoryActions
                onAction={() => handleAction("addSubcategory")}
                icon={<AddIcon />}
              />
            </Col>
          </Row>
        </>
      )}
    </Paper>
  );
};

export default ManageCategories;
