import React, { useState } from 'react';

function Dashboard1() {
  const [activeSection, setActiveSection] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [activeLine, setActiveLine] = useState(null);
  const [activeMachine, setActiveMachine] = useState(null);

  const handleClick = (type, id) => {
    switch (type) {
      case 'section':
        setActiveSection(id);
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case 'subsection':
        if (activeSubsection === id) {
          navigateBack('subsection');
        } else {
          setActiveSubsection(id);
          setActiveCell(null);
          setActiveLine(null);
          setActiveMachine(null);
        }
        break;
      case 'cell':
        if (activeCell === id) {
          navigateBack('cell');
        } else {
          setActiveCell(id);
          setActiveLine(null);
          setActiveMachine(null);
        }
        break;
      case 'line':
        if (activeLine === id) {
          navigateBack('line');
        } else {
          setActiveLine(id);
          setActiveMachine(null);
        }
        break;
      case 'machine':
        if (activeMachine === id) {
          navigateBack('machine');
        } else {
          setActiveMachine(id);
        }
        break;
      default:
        break;
    }
  };

  const navigateBack = (type) => {
    switch (type) {
      case 'section':
        setActiveSection(null);
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case 'subsection':
        setActiveSubsection(null);
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case 'cell':
        setActiveCell(null);
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case 'line':
        setActiveLine(null);
        setActiveMachine(null);
        break;
      case 'machine':
        setActiveMachine(null);
        setActiveLine(activeLine); // Go back to the Line
        break;
      default:
        break;
    }
  };

  const generateCells = () => {
    switch (activeSubsection) {
      case 'subsection1':
        return ['cell1', 'cell2'];
      case 'subsection2':
        return ['cell3', 'cell4'];
      default:
        return [];
    }
  };

  const generateLines = () => {
    switch (activeCell) {
      case 'cell1':
        return ['line1', 'line2'];
      case 'cell2':
        return ['line3', 'line4'];
      case 'cell3':
        return ['line5', 'line6'];
      case 'cell4':
        return ['line7', 'line8'];
      default:
        return [];
    }
  };

  const generateMachines = () => {
    switch (activeLine) {
      case 'line1':
        return ['machine1', 'machine2'];
      case 'line2':
        return ['machine3', 'machine4'];
      case 'line3':
        return ['machine5', 'machine6'];
      case 'line4':
        return ['machine7', 'machine8'];
      case 'line5':
        return ['machine9', 'machine10'];
      case 'line6':
        return ['machine11', 'machine12'];
      case 'line7':
        return ['machine13', 'machine14'];
      case 'line8':
        return ['machine15', 'machine16'];
      default:
        return [];
    }
  };

  return (
    <>
      <div id="section" className="d-flex">
        <h2
          className="cursor"
          onClick={() => handleClick('section', 'section')}
        >
          Section
        </h2>
      </div>
      {activeSection === 'section' && (
        <div id="subsection1" className="d-flex">
          <h2
            className="cursor"
            onClick={() => handleClick('subsection', 'subsection1')}
          >
            Subsection 1
          </h2>
          <h2
            className="cursor"
            onClick={() => handleClick('subsection', 'subsection2')}
          >
            Subsection 2
          </h2>
        </div>
      )}
      {activeSubsection && (
  <div className="d-flex">
    {generateCells().map((cell) => (
      <div id={cell} key={cell}>
        <h2
          className="cursor"
          onClick={() => handleClick('cell', cell)}
        >
          {cell}
        </h2>
      </div>
    ))}
  </div>
)}

{activeCell && (
  <div className="d-flex">
    {generateLines().map((line) => (
      <div id={line} key={line}>
        <h2
          className="cursor"
          onClick={() => handleClick('line', line)}
        >
          {line}
        </h2>
      </div>
    ))}
  </div>
)}

{activeLine && (
  <div className="d-flex">
    {generateMachines().map((machine) => (
      <div id={machine} key={machine}>
        <h2
          className="cursor"
          onClick={() => handleClick('machine', machine)}
        >
          {machine}
        </h2>
      </div>
    ))}
  </div>
)}
      {activeMachine && (
        <div id="content" className="d-flex">
          <h2
            className="cursor"
            onClick={() => navigateBack('machine')}
          >
            &nbsp;
          </h2>
        </div>
      )}
      {activeLine && (
        <div id="content" className="d-flex">
          <h2
            className="cursor"
            onClick={() => navigateBack('line')}
          >
            &nbsp;
          </h2>
        </div>
      )}
      {activeCell && (
        <div id="content" className="d-flex">
          <h2
            className="cursor"
            onClick={() => navigateBack('cell')}
          >
            &nbsp;
          </h2>
        </div>
      )}
      {activeSubsection && (
        <div id="content" className="d-flex">
          <h2
            className="cursor"
            onClick={() => navigateBack('subsection')}
          >
            &nbsp;
          </h2>
        </div>
      )}
    </>
  );
}

export default Dashboard1;
