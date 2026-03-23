import React, { useEffect, useState } from "react";
import MaterialTable from "@material-table/core";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import tableIcons from "../../../components/MatrialTableIcon";
import {
  MaterialTableOptions,
  MaterialTableStyle,
} from "../../Utils/TableUtils/MaterialTableProps";

const SubJobModal = ({ show, onHide, selectedJob, onSave }) => {
  const [subJobs, setSubJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch sub job list for selected job
  useEffect(() => {
    if (selectedJob?._id) {
      setLoading(true);
      axios
        .get(`/jobs/${selectedJob._id}`)
        .then((res) => {
          setSubJobs(res.data.job_content || []);
        })
        .catch((err) => console.error("Failed to fetch sub jobs:", err))
        .finally(() => setLoading(false));
    }
  }, [selectedJob]);

  // 🔹 Columns
  const subJobColumns = [
    {
      title: "Sr. No.",
      render: (rowData) => `${rowData.tableData.id + 1}`,
      editable: "never",
      width: "10%",
    },
    {
      title: "Parent Job Name",
      field: "parent_job_name",
      validate: (rowData) =>
        rowData.parent_job_name ? true : "Parent Job Name is required",
    },
    {
      title: "Expected Time (hrs)",
      field: "expectedTime",
      type: "numeric",
      align: "left", 
      validate: (rowData) =>
        rowData.expectedTime ? true : "Expected Time is required",
    },
  ];

  // 🔹 Add
  const handleAddRow = async (newRow) => {
    try {
      const { data } = await axios.post(
        `/jobs/${selectedJob._id}/job-content`,
        newRow
      );
      setSubJobs(data.job_content || []);
    } catch (err) {
      console.error("Error adding sub job:", err);
    }
  };

  // 🔹 Update
  const handleUpdateRow = async (newRow) => {
    try {
      console.log(newRow?.tableData?.index)
      const { data } = await axios.put(
        `/jobs/${selectedJob._id}/job-content/${newRow?.tableData?.index}`,
        newRow
      );
      setSubJobs(data.job_content || []);
    } catch (err) {
      console.error("Error updating sub job:", err);
    }
  };

  // 🔹 Delete
  const handleDeleteRow = async (oldRow) => {
    try {
      console.log(oldRow)
      const { data } = await axios.delete(
        `/jobs/${selectedJob._id}/job-content/${oldRow?._id}`
      );
      setSubJobs(data.job_content || []);
    } catch (err) {
      console.error("Error deleting sub job:", err);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      backdrop="static"
      centered
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Manage Job Content for:{" "}
          <span className="text-primary">{selectedJob?.job_name}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <MaterialTable
          title="Sub Job Contents"
          columns={subJobColumns}
          data={subJobs}
          icons={tableIcons}
          isLoading={loading}
          editable={{
            onRowAdd: handleAddRow,
            onRowUpdate: handleUpdateRow,
            onRowDelete: handleDeleteRow,
          }}
          options={{
            ...MaterialTableOptions,
            search: false,
            paging: false,
            actionsColumnIndex: -1,
            maxBodyHeight: "400px",
          }}
          style={MaterialTableStyle}
        />
      </Modal.Body>

      {/* <Modal.Footer>
        <Button variant="success" onClick={() => onSave(subJobs)}>
          Save & Close
        </Button>
      </Modal.Footer> */}
    </Modal>
  );
};

export default SubJobModal;
