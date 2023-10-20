import React, { useState } from "react";
import "./tabs.css";
import { Row, Col } from "react-bootstrap";

function Dashboard1() {
  // Define state variables
  const [activePlant, setActivePlant] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [activeLine, setActiveLine] = useState(null);
  const [activeMachine, setActiveMachine] = useState(null);

  const handlePlantClick = (plant) => {
    setActivePlant(plant);
    setActiveSection(null);
    setActiveSubsection(null);
    setActiveCell(null);
    setActiveLine(null);
    setActiveMachine(null);
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setActiveSubsection(null);
    setActiveCell(null);
    setActiveLine(null);
    setActiveMachine(null);
  };

  // Function to handle button clicks
  const handleClick = (type, id) => {
    switch (type) {
      case "plant":
        handlePlantClick(id);
        break;
      case "section":
        handleSectionClick(id);
        break;
      case "subsection":
        if (activeSubsection === id) {
          navigateBack("section");
        } else {
          setActiveSubsection(id);
          setActiveCell(null);
          setActiveLine(null);
          setActiveMachine(null);
        }
        break;
      case "cell":
        if (activeCell === id) {
          navigateBack("cell");
        } else {
          setActiveCell(id);
          setActiveLine(null);
          setActiveMachine(null);
        }
        break;
      case "line":
        if (activeLine === id) {
          navigateBack("line");
        } else {
          setActiveLine(id);
          setActiveMachine(null);
        }
        break;
      case "machine":
        if (activeMachine === id) {
          navigateBack("machine");
        } else {
          setActiveMachine(id);
        }
        break;
      default:
        break;
    }
  };

  // Function to navigate back
  const navigateBack = (type) => {
    switch (type) {
      case "plant":
        setActivePlant(null);
        setActiveSection(null);
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case "section":
        setActiveSection(null);
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case "subsection":
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case "cell":
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case "line":
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case "machine":
        setActiveMachine(null);
        setActiveLine(activeLine); // Go back to the Line
        break;
      default:
        break;
    }
  };

  const generateSections = () => {
    switch (activePlant) {
      case "Plant1":
        return ["section1", "section2", "section3"];
      case "Plant2":
        return ["section4", "section5", "section6", "section7", "section8"];
      default:
        return [];
    }
  };

  const generateSubsections = () => {
    switch (activeSection) {
      case "section1":
        return ["subsection1", "subsection2"];
      case "section2":
        return ["subsection3", "subsection4","subsection13", "subsection14","subsection23"];
      case "section3":
        return ["subsection5", "subsection6", "subsection4"];
      case "section4":
        return ["subsection7", "subsection8"];
      default:
        return [];
    }
  };

  // Function to generate cells based on active subsection
  const generateCells = () => {
    switch (activeSubsection) {
      case "subsection1":
        return ["cell1", "cell2","cell3", "cell4","cell5", "cell6"];
      case "subsection2":
        return ["cell3", "cell4"];
      case "subsection3":
        return ["cell5", "cell6"];
      case "subsection4":
        return ["cell7", "cell8"];
      default:
        return [];
    }
  };

  // Function to generate lines based on active cell
  const generateLines = () => {
    switch (activeCell) {
      case "cell1":
        return ["line1", "line2","line3", "line4"];
      case "cell2":
        return ["line3", "line4"];
      case "cell3":
        return ["line5", "line6"];
      case "cell4":
        return ["line7", "line8"];
      default:
        return [];
    }
  };

  // Function to generate machines based on active line
  const generateMachines = () => {
    switch (activeLine) {
      case "line1":
        return ["machine1", "machine2"];
      case "line2":
        return ["machine3", "machine4"];
      case "line3":
        return ["machine5", "machine6"];
      case "line4":
        return ["machine7", "machine8"];
      case "line5":
        return ["machine9", "machine10"];
      case "line6":
        return ["machine11", "machine12"];
      case "line7":
        return ["machine13", "machine14"];
      case "line8":
        return ["machine15", "machine16"];
      default:
        return [];
    }
  };

  return (
    <>
      {/* Render Sections if Plant is active */}
      <Row>
        <Col>
          {/* Render Plant */}
          <div id="plant" className="d-block">
            <p
              className={`cursor plant-button ${activePlant ? "active" : ""}`}
              onClick={() => handlePlantClick("Plant1")}
            >
              Plant 1
            </p>
          </div>
        </Col>
        <Col>
          {activePlant && (
            <div id="sections" className="d-block">
              {generateSections().map((section) => (
                <div id={section} key={section}>
                  <p
                    className={`cursor section-button ${
                      activeSection === section ? "active" : ""
                    }`}
                    onClick={() => handleSectionClick(section)}
                  >
                    {section}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Col>
        <Col>
          {/* Render Subsections if Section is active */}
          {activeSection && (
            <div id="subsections" className="d-block">
              {generateSubsections().map((subsection) => (
                <div id={subsection} key={subsection}>
                  <p
                    className={`cursor subsection-button ${
                      activeSubsection === subsection ? "active" : ""
                    }`}
                    onClick={() => handleClick("subsection", subsection)}
                  >
                    {subsection}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Col>
        <Col>
          {/* Render Cells if Subsection is active */}
          {activeSubsection && (
            <div className="d-block">
              {generateCells().map((cell) => (
                <div id={cell} key={cell}>
                  <p
                    className="cursor cell-button"
                    onClick={() => handleClick("cell", cell)}
                  >
                    {cell}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Col>
        <Col>
          {/* Render Lines if Cell is active */}
          {activeCell && (
            <div className="d-block">
              {generateLines().map((line) => (
                <div id={line} key={line}>
                  <p
                    className="cursor line-button"
                    onClick={() => handleClick("line", line)}
                  >
                    {line}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Col>
        <Col>
          {/* Render Machines if Line is active */}
          {activeLine && (
            <div className="d-block">
              {generateMachines().map((machine) => (
                <div id={machine} key={machine}>
                  <p
                    className="machine-button"
                    onClick={() => handleClick("machine", machine)}
                  >
                    {machine}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Col>
        <Col>
          {activeLine && (
            <div id="content" className="d-block">
              <p className="cursor" onClick={() => navigateBack("line")}>
                &nbsp;
              </p>
            </div>
          )}
        </Col>
        <Col>
          {activeCell && (
            <div id="content" className="d-block">
              <p className="cursor" onClick={() => navigateBack("cell")}>
                &nbsp;
              </p>
            </div>
          )}
        </Col>
        <Col>
          {activeSubsection && (
            <div id="content" className="d-block">
              <p className="cursor" onClick={() => navigateBack("subsection")}>
                &nbsp;
              </p>
            </div>
          )}
        </Col>
        <Col>
          {activeSection && (
            <div id="content" className="d-block">
              <p className="cursor" onClick={() => navigateBack("plant")}>
                &nbsp;
              </p>
            </div>
          )}
        </Col>
      </Row>

      {/* Render activeMachine button */}
      {/* {activeMachine && (
        <div id="content" className="d-flex">
          <p
            className="cursor active-machine-button"
            onClick={() => navigateBack("machine")}
          >
            &nbsp;
          </p>
        </div>
      )} */}

      {/* Render navigation buttons */}
    </>
  );
}

export default Dashboard1;
