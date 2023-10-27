import React, { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// SubcategoryActions component for rendering IconButton with icon
const SubcategoryActions = ({ onAction, icon }) => (
  <IconButton onClick={onAction}>
    {icon}
  </IconButton>
);

const DropdownWithSubcategories = () => {
  // State variables
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [mainTitles, setMainTitles] = useState([
    { label: 'Category 1', subcategories: ['Subcategory A', 'Subcategory B', 'Subcategory C'] },
    { label: 'Category 2', subcategories: ['Subcategory D', 'Subcategory E', 'Subcategory F'] },
  ]);
  const [newMainTitle, setNewMainTitle] = useState('');
  const [editedMainTitle, setEditedMainTitle] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editedSubcategory, setEditedSubcategory] = useState('');

  // Handler for category selection change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory('');
  };

  // Handler for subcategory selection change
  const handleSubcategoryChange = (e) => {
    setSelectedSubcategory(e.target.value);
  };

  // Handler for various actions (add, edit, delete)
  const handleAction = (actionType) => {
    switch(actionType) {
        // Add new main title
      case 'addMainTitle':
      if (newMainTitle.trim() !== '') {
        const updatedMainTitles = [...mainTitles, { label: newMainTitle, subcategories: [] }];
        setMainTitles(updatedMainTitles);
        setSelectedCategory(newMainTitle);
        setNewMainTitle('');
      }
      break;
    
      // Edit main title
      case 'editMainTitle':
        if (editedMainTitle.trim() !== '') {
          const updatedMainTitles = mainTitles.map((title) =>
            title.label === selectedCategory ? { ...title, label: editedMainTitle } : title
          );
          setMainTitles(updatedMainTitles);
          setSelectedCategory(editedMainTitle);
          setEditedMainTitle('');
        }
        break;

      // Delete main title
      case 'deleteMainTitle':
        const updatedMainTitles = mainTitles.filter((title) => title.label !== selectedCategory);
        setMainTitles(updatedMainTitles);
        setSelectedCategory('');
        setSelectedSubcategory('');
        break;

      // Add new subcategory
      case 'addSubcategory':
            if (newSubcategory.trim() !== '') {
              const updatedMainTitles = mainTitles.map((title) =>
                title.label === selectedCategory
                  ? { ...title, subcategories: [...title.subcategories, newSubcategory] }
                  : title
              );
              setMainTitles(updatedMainTitles);
              setNewSubcategory('');
            }
            break;

      // Edit subcategory
      case 'editSubcategory':
        if (editedSubcategory.trim() !== '') {
          const updatedMainTitles = mainTitles.map((title) =>
            title.label === selectedCategory
              ? {
                  ...title,
                  subcategories: title.subcategories.map((sub) =>
                    sub === selectedSubcategory ? editedSubcategory : sub
                  ),
                }
              : title
          );
          setMainTitles(updatedMainTitles);
          setSelectedSubcategory(editedSubcategory);
          setEditedSubcategory('');
        }
        break;

      // Delete subcategory
      case 'deleteSubcategory':
        const updatedTitles = mainTitles.map((title) =>
          title.label === selectedCategory
            ? { ...title, subcategories: title.subcategories.filter((sub) => sub !== selectedSubcategory) }
            : title
        );
        setMainTitles(updatedTitles);
        setSelectedSubcategory('');
        break;

      default:
        break;
    }
  };

  return (
    <div className='container'>
      <h2>Select Category</h2>

      <select value={selectedCategory} onChange={handleCategoryChange}>
        <option value="">Select Category</option>
        {mainTitles.map((mainTitle, index) => (
          <option key={index} value={mainTitle.label}>
            {mainTitle.label}
          </option>
        ))}
      </select>

      {selectedCategory && (
        <>
          <TextField
            type="text"
            value={newMainTitle}
            onChange={(e) => setNewMainTitle(e.target.value)}
            label="New Main Title"
            variant="outlined"
          />
          <SubcategoryActions onAction={() => handleAction('addMainTitle')} icon={<AddIcon />} />

          <TextField
            type="text"
            value={editedMainTitle}
            onChange={(e) => setEditedMainTitle(e.target.value)}
            label="Edit Main Title"
            variant="outlined"
          />
          <SubcategoryActions onAction={() => handleAction('editMainTitle')} icon={<ModeEditIcon />} />

          <SubcategoryActions onAction={() => handleAction('deleteMainTitle')} icon={<DeleteIcon />} />
        </>
      )}
      <br/><br/>

      {selectedCategory && (
        <select value={selectedSubcategory} onChange={handleSubcategoryChange}>
          <option value="">Select Subcategory</option>
          {mainTitles
            .find((mainTitle) => mainTitle.label === selectedCategory)
            .subcategories.map((subcategory, index) => (
              <option key={index} value={subcategory}>
                {subcategory}
              </option>
            ))}
        </select>
      )}

      {selectedCategory && selectedSubcategory && (
        <>
          <TextField
            type="text"
            value={newSubcategory}
            onChange={(e) => setNewSubcategory(e.target.value)}
            label="New Subcategory"
            variant="outlined"
          />
          <SubcategoryActions onAction={() => handleAction('addSubcategory')} icon={<AddIcon />} />

          <TextField
            type="text"
            value={editedSubcategory}
            onChange={(e) => setEditedSubcategory(e.target.value)}
            label="Edit Subcategory"
            variant="outlined"
          />
          <SubcategoryActions onAction={() => handleAction('editSubcategory')} icon={<ModeEditIcon />} />

          <SubcategoryActions onAction={() => handleAction('deleteSubcategory')} icon={<DeleteIcon />} />
        </>
      )}
    </div>
  );
};

export default DropdownWithSubcategories;
