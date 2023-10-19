import React, { useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { AddBoxIcon } from "../../../../modules/PageModules";
import "../RequestSheet.scss";

const ProblemList = () => {
  const [problems, setProblems] = useState([
    { id: 1, problem: "Machine not working" },
    { id: 2, problem: "Overheating" },
  ]);

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
    setEditedProblem(null); // Reset editedProblem
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
      <Row className="m-0 border">
        <Col className="d-flex align-items-lg-center gap-1">
          <b>PROBLEM: </b>
        </Col>
        <Col style={{cursor:"pointer"}} className="col-auto">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Col>
      </Row>
      {problems.map((problem, index) =>
        editedProblem && editedProblem.id === problem.id ? (
          <Row key={problem.id} className="m-0 border">
            <Col
              className="d-flex align-items-lg-center gap-1"
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
            <Col className="col-auto d-flex gap-1 p-1">
              <button onClick={updateProblem}>Update</button>
              <button onClick={cancelEdit}>Cancel</button>
            </Col>
          </Row>
        ) : (
          <Row key={problem.id} className="m-0 border">
            <Col
              className="d-flex align-items-lg-center gap-1"
              style={{ fontSize: "14px" }}
            >
              <b>{`Problem ${index + 1}: `}</b>
              {problem.problem}
            </Col>
            <Col className="col-auto d-flex gap-1 p-1">
              <button onClick={() => deleteProblem(problem.id)}>Delete</button>
              <button onClick={() => setEditedProblem({ ...problem })}>
                Edit
              </button>
            </Col>
          </Row>
        )
      )}

      {isAdding ? (
        <Row className="m-0 border">
          <Col
            className="d-flex align-items-lg-center gap-1"
            style={{ fontSize: "14px" }}
          >
            <b>{`Problem ${problems.length + 1}: `}</b>
            <input
              type="text"
              value={newProblemText}
              onChange={(e) => setNewProblemText(e.target.value)}
            />
          </Col>
          <Col className="col-auto d-flex gap-1 p-1">
            <button onClick={addProblem}>Add</button>
            <button onClick={cancelAdd}>Cancel</button>
          </Col>
        </Row>
      ) : (
        <Row className="m-0 border">
          <Col className="d-flex justify-content-center align-items-lg-center gap-1 p-1">
            <AddBoxIcon onClick={() => setIsAdding(true)} />
          </Col>
        </Row>
      )}

      {Array.from({ length: 2 - problems.length }).map((_, index) => (
        <Row key={index} className="m-0 border p-1">
          <AddBoxIcon onClick={() => setIsAdding(true)} />
        </Row>
      ))}
    </div>
  );
};

export default ProblemList;
