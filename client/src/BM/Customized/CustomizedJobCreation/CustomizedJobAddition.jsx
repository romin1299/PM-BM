import React, { useState, useEffect } from "react";
import MaterialTable from "@material-table/core";
import tableIcons from "../../../components/MatrialTableIcon";
import {
  MaterialTableOptions,
  MaterialTableStyle,
  MaterialTableSX,
} from "../../Utils/TableUtils/MaterialTableProps";
import SubJobModal from "./SubJobModal";
import axios from "axios";
import { Box } from "@mui/material";
import ChartTitleBar from "../../Reports/Common/ChartTitleBar";

const API_BASE = "/jobs";

const CustomizedJobAddition = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Fetch All Jobs */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_BASE);
      setJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /** Add Job */
  const handleAddJob = async (newJob) => {
    try {
      const { data } = await axios.post(API_BASE, {
        ...newJob,
        job_content: [],
      });
      setJobs((prev) => [data, ...prev]);
    } catch (err) {
      console.error("Error adding job:", err);
    }
  };

  /** Update Job */
  const handleUpdateJob = async (newData, oldData) => {
    try {
      const { data } = await axios.put(`${API_BASE}/${oldData._id}`, newData);
      setJobs((prev) => prev.map((job) => (job._id === data._id ? data : job)));
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  /** Delete Job */
  const handleDeleteJob = async (oldData) => {
    try {
      await axios.delete(`${API_BASE}/${oldData._id}`);
      setJobs((prev) => prev.filter((job) => job._id !== oldData._id));
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  /** Modal: Open Sub Jobs */
  const handleOpenSubJobModal = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  /** Modal: Save Sub Jobs */
  const handleSaveSubJobs = async (updatedSubJobs) => {
    try {
      const payload = { ...selectedJob, job_content: updatedSubJobs };
      const { data } = await axios.put(
        `${API_BASE}/${selectedJob._id}`,
        payload
      );
      setJobs((prev) => prev.map((job) => (job._id === data._id ? data : job)));
      setShowModal(false);
      setSelectedJob(null);
    } catch (err) {
      console.error("Error saving sub jobs:", err);
    }
  };

  const headerOfJobCreation = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: "never",
      width: "10%",
    },
    {
      title: "Job Name",
      field: "job_name",
      validate: (rowData) => (rowData.job_name ? true : "Job Name is required"),
      width: "60%",
    },
  ];

  return (
    <>
      <Box className="cell p-3">
        <ChartTitleBar title="Job Creation" />
        <MaterialTable
          title="Job Creation"
          icons={tableIcons}
          columns={headerOfJobCreation}
          data={jobs}
          isLoading={loading}
          actions={[
            {
              icon: () => (
                <button
                  className="border-0 btn"
                  style={{ background: "#E47E07" }}
                >
                  Add Content
                </button>
              ),
              tooltip: "Add / Edit Sub Job Content",
              onClick: (event, rowData) => handleOpenSubJobModal(rowData),
              // isFreeAction: false, // ✅ ensures it appears in every row
            },
          ]}
          editable={{
            onRowAdd: (newData) => handleAddJob(newData),
            onRowUpdate: (newData, oldData) =>
              handleUpdateJob(newData, oldData),
            onRowDelete: (oldData) => handleDeleteJob(oldData),
          }}
          localization={{
            header: { actions: "Actions" },
          }}
          options={{
            ...MaterialTableOptions,
            pageSize: 5,
            actionsColumnIndex: -1, // ✅ shows actions on the rightmost side
            addRowPosition: "first", // optional: adds new job row at top
          }}
          style={MaterialTableStyle}
          sx={MaterialTableSX}
        />
      </Box>

      {showModal && (
        <SubJobModal
          show={showModal}
          onHide={() => setShowModal(false)}
          selectedJob={selectedJob}
          onSave={handleSaveSubJobs}
        />
      )}
    </>
  );
};

export default CustomizedJobAddition;
