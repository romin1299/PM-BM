import { memo, useCallback, useMemo } from "react";
import { Col } from "react-bootstrap";
import { useWatch } from "react-hook-form";

/**
 * File picker for a part's attachments.
 *
 * A plain multiple file input cannot drop one of its files: its value is a
 * read-only FileList, and picking again replaces the whole selection rather than
 * adding to it. So the chosen files are held in form state instead, the input is
 * only ever used to collect additions, and each file is listed with its own
 * remove control.
 *
 * Two separate lists are kept for the same field:
 *
 *   - `<field>`      the files already stored on the sheet, as
 *                    { filename, originalname }. Removing one drops it from what
 *                    is sent back, so it is no longer on the part.
 *   - `<field>Files` the newly picked File objects, uploaded on submit.
 *
 * Keeping them apart is what lets a requester add a drawing without discarding
 * the ones already there, which a single input cannot express.
 *
 * Both live under `partAttachments`, a top-level array running parallel to
 * changeParts, rather than inside changeParts itself. changeParts is owned by a
 * useFieldArray, and values written into it with setValue did not survive into
 * the submitted payload — the attachment keys arrived missing, so Mongoose
 * replaced the stored arrays with empty ones and every file was dropped from the
 * part. The page merges these back onto their part when it submits.
 */

export const newFilesFieldName = (fieldName) => `${fieldName}Files`;

/** Attachments are part of the sheet, so touching them has to mark the form dirty. */
const markDirty = { shouldDirty: true };

const AttachmentField = memo(
  ({
    label,
    index,
    fieldName,
    control,
    setValue,
    isReadOnly,
    onRemoveUploaded,
  }) => {
    const uploadedPath = `partAttachments.${index}.${fieldName}`;
    const newFilesPath = `partAttachments.${index}.${newFilesFieldName(
      fieldName,
    )}`;

    const watchedUploaded = useWatch({ control, name: uploadedPath });
    const watchedNewFiles = useWatch({ control, name: newFilesPath });

    // Memoised so the empty fallback is not a fresh array on every render, which
    // would change the callbacks below each time.
    const uploaded = useMemo(() => watchedUploaded ?? [], [watchedUploaded]);
    const newFiles = useMemo(() => watchedNewFiles ?? [], [watchedNewFiles]);

    const handleSelect = useCallback(
      (event) => {
        const picked = Array.from(event.target.files ?? []);
        if (!picked.length) return;

        /**
         * Added to what is already chosen rather than replacing it, and de-duped
         * on name + size so picking the same file twice does not upload it twice.
         */
        const existing = new Set(
          newFiles.map((file) => `${file.name}:${file.size}`),
        );

        setValue(
          newFilesPath,
          [
            ...newFiles,
            ...picked.filter(
              (file) => !existing.has(`${file.name}:${file.size}`),
            ),
          ],
          markDirty,
        );

        // Cleared so the same file can be picked again after being removed —
        // the input fires no change event when its value is unchanged.
        event.target.value = "";
      },
      [newFiles, newFilesPath, setValue],
    );

    const handleRemoveNew = useCallback(
      (fileIndex) =>
        setValue(
          newFilesPath,
          newFiles.filter((_, position) => position !== fileIndex),
          markDirty,
        ),
      [newFiles, newFilesPath, setValue],
    );

    const handleRemoveUploaded = useCallback(
      (file) => {
        setValue(
          uploadedPath,
          uploaded.filter((item) => item?.filename !== file?.filename),
          markDirty,
        );
        onRemoveUploaded?.(file?.filename);
      },
      [uploaded, uploadedPath, setValue, onRemoveUploaded],
    );

    const RemoveButton = ({ onClick }) => (
      <button
        type="button"
        className="bg-danger text-white border-0 ms-2"
        style={{ lineHeight: 1, padding: "0 6px" }}
        title="Remove"
        onClick={onClick}
      >
        &times;
      </button>
    );

    return (
      <>
        <Col className="w-100 d-flex justify-content-between pb-1">
          <small>{label}</small>
          <input
            type="file"
            multiple
            className="w-75"
            disabled={isReadOnly}
            onChange={handleSelect}
          />
        </Col>

        {newFiles.length > 0 && (
          <Col className="w-100 d-flex flex-column pb-1">
            <small>Selected ({newFiles.length})</small>
            {newFiles.map((file, fileIndex) => (
              <div
                key={`${file.name}-${file.size}-${fileIndex}`}
                className="d-flex align-items-center justify-content-between"
              >
                <small>{file.name}</small>
                {!isReadOnly && (
                  <RemoveButton onClick={() => handleRemoveNew(fileIndex)} />
                )}
              </div>
            ))}
          </Col>
        )}

        {uploaded.length > 0 && (
          <Col className="w-100 d-flex flex-column pb-1">
            <small>Previously uploaded ({uploaded.length})</small>
            {uploaded.map((file, fileIndex) => (
              <div
                key={file?.filename || fileIndex}
                className="d-flex align-items-center justify-content-between"
              >
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`${process.env.REACT_APP_BASE_URL}/v1/spare/${file?.filename}`}
                >
                  {file?.originalname}
                </a>
                {!isReadOnly && (
                  <RemoveButton onClick={() => handleRemoveUploaded(file)} />
                )}
              </div>
            ))}
          </Col>
        )}
      </>
    );
  },
);

export default AttachmentField;
