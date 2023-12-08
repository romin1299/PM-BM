import React, { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../../modules/PageModules";
import "../RequestSheet.scss";

const ProblemList = ({ problems, setProblems }) => {
  const [newProblemText, setNewProblemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editedProblem, setEditedProblem] = useState(null);

  const addProblem = () => {
    if (newProblemText.trim() !== "") {
      const newProblem = {
        id: Date.now(),
        problem: newProblemText,
      };
      setProblems([...problems, newProblem]);
      setNewProblemText("");
      setIsAdding(false);
    }
  };

  const updateProblem = () => {
    if (editedProblem.problem.trim() !== "") {
      const updatedProblems = problems.map((problem) =>
        problem.id === editedProblem.id ? editedProblem : problem
      );
      setProblems(updatedProblems);
      setEditedProblem(null);
    }
  };

  const cancelEdit = () => {
    setEditedProblem(null);
  };

  const cancelAdd = () => {
    setNewProblemText("");
    setIsAdding(false);
  };

  const deleteProblem = (problemId) => {
    const updatedProblems = problems.filter(
      (problem) => problem.id !== problemId
    );
    setProblems(updatedProblems);
  };

  return (
    <div className="mtd-problem-section">
      <Row className="m-2">
        <Col lg={9} md={9} sm={9} className="border d-flex align-items-center gap-1">
          <b>PROBLEM</b>
        </Col>
        <Col
          lg={3} md={3} sm={3}
          style={{ cursor: "pointer" }}
          className="border col-auto d-flex gap-1 p-1"
        >
          <b>UPDATE</b>
          {/* <AddBoxIcon onClick={() => setIsAdding(true)} /> */}
          {/* <button onClick={() => setIsAdding(true)}>Add New Entry</button> */}
        </Col>
      </Row>

      {problems.map((problem, index) =>
        editedProblem && editedProblem.id === problem.id ? (
          <Row key={problem.id} className="m-2">
            <Col
              lg={9}
              className="border d-flex align-items-center gap-1"
              style={{ fontSize: "14px" }}
            >
              <b>{`Problem ${index + 1}: `}</b>
              <input
                type="text"
                value={editedProblem.problem}
                onChange={(e) =>
                  setEditedProblem({
                    ...editedProblem,
                    problem: e.target.value,
                  })
                }
              />
            </Col>
            <Col lg={3} className="border col-auto d-flex gap-1 p-1">
              <button class="bg-info text-white border-0" onClick={updateProblem}>Update</button>
              <button class="bg-danger text-white border-0" onClick={cancelEdit}>Cancel</button>
            </Col>
          </Row>
        ) : (
          <Row key={problem.id} className="m-0">
            <Col
             lg={9} md={12} sm={12}
              className="border d-flex align-items-center gap-1"
              style={{ fontSize: "14px" }}
            >
              <b>Problem {index + 1}: </b>
              {problem.problem}
            </Col>
            <Col lg={3} md={12} sm={12}  className="border col-auto d-flex gap-1 p-1">
              <button class="bg-warning text-white border-0" onClick={() => setEditedProblem({ ...problem })}>
                Edit
              </button>
              <button class="bg-danger text-white border-0" onClick={() => deleteProblem(problem.id)}>Delete</button>
            </Col>
          </Row>
        )
      )}

      {isAdding ? (
        <Row className="m-2">
          <Col
            lg={9} md={12} sm={12}
            className="border d-flex align-items-center gap-1"
            style={{ fontSize: "14px" }}
          >
            <b>{`Problem ${problems.length + 1}: `}</b>
            <input
              type="text"
              value={newProblemText}
              onChange={(e) => setNewProblemText(e.target.value)}
            />
          </Col>
          <Col lg={3} md={12} sm={12} className="border col-auto d-flex gap-1 p-1">
            <button class="bg-success text-white border-0" onClick={addProblem}>Add</button>
            <button class="bg-danger text-white border-0" onClick={cancelAdd}>Cancel</button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0  p-1 border">
          <Col lg={4}>
          <button class="bg-warning text-white border-0 pt-1 pb-2 mt-1" onClick={() => setIsAdding(true)}>Add Problem</button>
          </Col>
        </Row>
      )}

      {Array.from({ length: 2 - problems.length }).map((_, index) => (
        <Row key={index} className="m-2 p-1 border">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default ProblemList;
