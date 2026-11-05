import React, { memo } from "react";
import { Row, Col } from "reactstrap";

/**
 * The cell -> line -> machine grid of the main dashboard.
 *
 * MainDashboard rendered this block eight times, once per branch of its
 * dashboard-level/permission logic, and each copy walked the flat arrays the
 * API returns with a nested map: every cell looped over every line, and every
 * line looped over every machine. For UTILITY that is 6 x 49 + 49 x 606 =
 * ~30,000 comparisons on each render, and because the markup lived inline in
 * MainDashboard it was redone whenever any unrelated piece of state changed -
 * a chart arriving, a dropdown loading, the month select re-rendering.
 *
 * Grouping the arrays once (buildHierarchyIndex) makes the lookups direct, and
 * memoising the component means the 600-odd machine buttons are only rebuilt
 * when something they actually display changes. The markup, the ordering and
 * the colour mapping are unchanged: cells, lines and machines still appear in
 * the order the API sent them, because the index preserves array order.
 */

const ROW_STYLE = { display: "flex", justifyContent: "flex-start" };

/**
 * PM status -> button colour.
 *
 * All eight copies of this expression in MainDashboard were identical once
 * comments and whitespace were removed, so this is that same mapping. Both an
 * absent PMStatus and an unrecognised status fall through to the grey, exactly
 * as the original chain of ternaries did.
 */
const PM_STATUS_COLOR = {
  "Current Plan": "white",
  Ongoing: "#ffff59",
  Completed: "#5fe15f",
  "Done with delay": "#ffc356",
  "PM Skip": "#ff8888",
  "No Completion": "#ff8888",
};

const NOT_SCHEDULED_COLOR = "#ababab";

export const getMachineColor = (machine, selectedMonth) => {
  const pmStatus = machine?.checkSheet_data?.PMStatus;
  if (!pmStatus) return NOT_SCHEDULED_COLOR;
  return PM_STATUS_COLOR[pmStatus[selectedMonth]] ?? NOT_SCHEDULED_COLOR;
};

/** Groups rows by a parent id, keeping each group in its original array order. */
const groupBy = (rows, parentKey) => {
  const grouped = new Map();
  for (const row of rows ?? []) {
    const parentId = row?.[parentKey];
    if (parentId === undefined || parentId === null) continue;
    const bucket = grouped.get(parentId);
    if (bucket) bucket.push(row);
    else grouped.set(parentId, [row]);
  }
  return grouped;
};

/**
 * Turns the flat cellData/lineData/machineData arrays of
 * /postSectionToGetAllDataForMainDashboard into parent -> children lookups.
 * Build it once per payload with useMemo and pass it down.
 */
export const buildHierarchyIndex = (allDataSectionWise) => ({
  cellsBySubSection: groupBy(allDataSectionWise?.cellData, "subSection_names"),
  linesByCell: groupBy(allDataSectionWise?.lineData, "cell_names"),
  machinesByLine: groupBy(allDataSectionWise?.machineData, "line_names"),
});

const EMPTY = [];

const MachineButton = memo(
  ({ machine, lineName, selectedMonth, disabled, onMachineClick }) => (
    <button
      style={{ background: getMachineColor(machine, selectedMonth) }}
      className="machine"
      disabled={disabled}
      onClick={() => onMachineClick(machine, lineName)}
    >
      {machine.machine_nickname}
    </button>
  ),
);

const LineCard = memo(
  ({ line, machines, selectedMonth, disabled, onMachineClick }) => (
    <Col xs={12} md={6} lg={3}>
      <div className="line">
        <div className="line_name">
          <p>{line.line_name}</p>
        </div>
        <div className="machineCard">
          {/*
            Keyed by position as well as id: a machine carrying two
            checkSheet_data entries for the same year is unwound into two rows
            by the API, so _id alone is not unique here. Those machines render
            twice on the dashboard today and still do - this only keeps React's
            keys unique, it does not change what is shown.
          */}
          {machines.map((machine, position) => (
            <MachineButton
              key={`${machine._id}_${position}`}
              machine={machine}
              lineName={line.line_name}
              selectedMonth={selectedMonth}
              disabled={disabled}
              onMachineClick={onMachineClick}
            />
          ))}
        </div>
      </div>
    </Col>
  ),
);

/**
 * The cells of one sub-section, with their lines and machines.
 * `subSectionId` undefined renders nothing, which is what the original
 * `selectedSubSectionId === cell.subSection_names` comparison did.
 */
const CellGrid = memo(
  ({ subSectionId, index, selectedMonth, disabled, onMachineClick }) => {
    const cells = index.cellsBySubSection.get(subSectionId) ?? EMPTY;

    return cells.map((cell) => (
      <div className="cell" key={cell._id}>
        <p>{cell.cell_name}</p>

        <div>
          <Row style={ROW_STYLE}>
            {(index.linesByCell.get(cell._id) ?? EMPTY).map((line) => (
              <LineCard
                key={line._id}
                line={line}
                machines={index.machinesByLine.get(line._id) ?? EMPTY}
                selectedMonth={selectedMonth}
                disabled={disabled}
                onMachineClick={onMachineClick}
              />
            ))}
          </Row>
        </div>
      </div>
    ));
  },
);

/**
 * Every sub-section of the section, each with its own heading and cells, used
 * where the dashboard shows the whole section rather than one sub-section.
 */
export const SubSectionGrid = memo(
  ({
    subSections,
    index,
    selectedMonth,
    disabled,
    onMachineClick,
    colClassName,
  }) =>
    (subSections ?? EMPTY).map((subSection) => (
      <Col
        xs={12}
        md={12}
        lg={12}
        className={colClassName}
        key={subSection._id}
      >
        <div className="subSection">
          <div className="subSectionText">{subSection.subSection_name}</div>

          <CellGrid
            subSectionId={subSection._id}
            index={index}
            selectedMonth={selectedMonth}
            disabled={disabled}
            onMachineClick={onMachineClick}
          />
        </div>
      </Col>
    )),
);

export default CellGrid;
