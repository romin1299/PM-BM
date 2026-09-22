import { memo, useCallback, useRef, useState } from "react";
import { Alert, Col, Row } from "react-bootstrap";
import { axiosPostOrPatch } from "../../Utils/axiosUtils";

const ACCEPT = ".xlsx,.xlsm";

/**
 * Loads a master catalogue from an Excel workbook.
 *
 * Two steps on purpose, mirroring the backend import: "Validate" is a dry run
 * that reports what the file would do — rows read, machines resolved, every
 * error and warning — without writing anything; "Import" applies it. The Tool
 * Room reads the outcome before committing, which matters for a file that can
 * hold thousands of rows.
 */
const postWorkbook = async ({ url, file, commit }) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosPostOrPatch({
    url,
    axiosBody: formData,
    axiosProps: {
      params: { commit: commit ? "Yes" : "No" },
      headers: { "Content-Type": "multipart/form-data" },
    },
  });
};

const Counter = ({ label, value, tone }) => (
  <Col xs={6} md={3} lg={2} className="mb-2">
    <div className="border rounded p-2 text-center h-100">
      <div className={`fw-bold ${tone ?? ""}`} style={{ fontSize: 18 }}>
        {value ?? 0}
      </div>
      <small className="text-muted">{label}</small>
    </div>
  </Col>
);

const IssueList = ({ heading, items = [], truncated = 0, tone }) => {
  if (!items.length) return null;
  return (
    <div className="mt-2">
      <small className={`fw-bold ${tone}`}>
        {heading} ({items.length}
        {truncated ? ` shown, ${truncated} more` : ""})
      </small>
      <div className="border rounded mt-1" style={{ maxHeight: 180, overflow: "auto" }}>
        <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th>Excel row</th>
              <th>Column</th>
              <th>Value</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item?.excelRow ?? "-"}</td>
                <td>{item?.column}</td>
                <td>{item?.value === null || item?.value === undefined ? "" : String(item.value)}</td>
                <td>{item?.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ImportOutcome = ({ result, dryRun }) => {
  const summary = result?.summary ?? {};
  const hasErrors = summary.validationErrors > 0 || summary.failed > 0;

  return (
    <Alert variant={hasErrors ? "warning" : "success"} className="mt-3 mb-0">
      <div className="fw-bold mb-2">
        {dryRun
          ? "Validated — nothing written yet."
          : "Imported."}{" "}
        Sheet "{result?.sheet}", header row {result?.headerRow},{" "}
        {result?.mappedColumns?.length ?? 0} columns recognised.
      </div>
      <Row className="g-2">
        <Counter label="Rows read" value={summary.totalRows} />
        <Counter
          label={dryRun ? "Would be written" : "Written"}
          value={dryRun ? summary.totalRows - summary.failed - summary.duplicateInFile : summary.succeeded}
          tone="text-success"
        />
        {!dryRun && <Counter label="Created" value={summary.created} />}
        {!dryRun && <Counter label="Updated" value={summary.updated} />}
        <Counter label="Machine resolved" value={summary.withMachine} />
        <Counter label="Machine unresolved" value={summary.withoutMachine} tone="text-warning" />
        <Counter label="Duplicates in file" value={summary.duplicateInFile} tone="text-warning" />
        <Counter label="Validation errors" value={summary.validationErrors} tone="text-danger" />
        <Counter label="Warnings" value={summary.warnings} tone="text-warning" />
      </Row>
      <IssueList
        heading="Errors (these rows are skipped)"
        items={result?.errors}
        truncated={result?.truncated?.errors}
        tone="text-danger"
      />
      <IssueList
        heading="Duplicates in file (first occurrence kept)"
        items={result?.duplicates}
        truncated={result?.truncated?.duplicates}
        tone="text-warning"
      />
      <IssueList
        heading="Warnings (rows are still imported)"
        items={result?.warnings?.slice(0, 50)}
        truncated={(result?.truncated?.warnings ?? 0) + Math.max(0, (result?.warnings?.length ?? 0) - 50)}
        tone="text-warning"
      />
    </Alert>
  );
};

const SpareMasterImportPanel = memo(({ url, onImported }) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(null); // "validate" | "import" | null
  const [outcome, setOutcome] = useState(null);

  const handleFileChange = useCallback((event) => {
    setFile(event.target.files?.[0] ?? null);
    setOutcome(null);
  }, []);

  const run = useCallback(
    async (commit) => {
      if (!file) return;
      setBusy(commit ? "import" : "validate");
      const response = await postWorkbook({ url, file, commit });
      setBusy(null);
      if (response?.isError) return;

      setOutcome({ result: response.result, dryRun: !commit });
      if (commit) {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onImported) onImported(response.result);
      }
    },
    [file, url, onImported],
  );

  return (
    <div className="cell p-3 rounded-2 mt-3">
      <Row className="align-items-center g-2">
        <Col xs="auto">
          <b>Upload master (Excel)</b>
        </Col>
        <Col xs={12} md={5}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="form-control"
            onChange={handleFileChange}
            disabled={Boolean(busy)}
          />
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || Boolean(busy)}
            onClick={() => run(false)}
          >
            {busy === "validate" ? "Validating…" : "Validate"}
          </button>
          <button
            type="button"
            className="btn bg-success text-white"
            // Import only after a clean-enough validation of this same file.
            disabled={!file || Boolean(busy) || !outcome || !outcome.dryRun}
            onClick={() => run(true)}
            title={!outcome?.dryRun ? "Validate the file first" : "Write the file to the master"}
          >
            {busy === "import" ? "Importing…" : "Import"}
          </button>
        </Col>
        {/* <Col xs={12}>
          <small className="text-muted">
            Same column layout as the parts master (PartsNumber = location, PartsName,
            PartsModel, MakerName, …). Rows are matched on location, so re-uploading a
            corrected file updates parts in place.
          </small>
        </Col> */}
      </Row>

      {outcome && <ImportOutcome {...outcome} />}
    </div>
  );
});

export default SpareMasterImportPanel;
