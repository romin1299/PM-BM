/**
 * Helpers for the part attachments on a Spare request-sheet.
 *
 * Attachments are held in `partAttachments`, a top-level array running parallel
 * to `changeParts`, and merged back onto their part at submit time.
 *
 * They cannot live inside `changeParts` itself: that array is owned by a
 * useFieldArray, and arrays written into it with setValue did not reach the
 * submitted payload — the attachment keys arrived missing, so replacing
 * changeParts left Mongoose to initialise them as empty and every file was
 * dropped from the part while the files themselves stayed on disk.
 */

export const ATTACHMENT_FIELDS = ["drawingAttach", "additionalAttachments"];

export const newFilesFieldName = (fieldName) => `${fieldName}Files`;

/** The parallel attachment array for a sheet that is being opened for editing. */
export const buildPartAttachments = (changeParts = []) =>
  changeParts.map((part) =>
    ATTACHMENT_FIELDS.reduce(
      (attachments, fieldName) => ({
        ...attachments,
        [fieldName]: Array.isArray(part?.[fieldName]) ? part[fieldName] : [],
        [newFilesFieldName(fieldName)]: [],
      }),
      {},
    ),
  );

/**
 * Copies the kept files back onto their part.
 *
 * Always writes both keys, even when empty: a part sent without them would have
 * them re-initialised as empty arrays anyway, so being explicit keeps what the
 * server stores identical to what the form showed.
 *
 * The picked File objects are left out — they travel as multipart file parts,
 * not as sheet data.
 */
export const mergeAttachmentsIntoParts = (changeParts = [], partAttachments = []) =>
  changeParts.map((part, index) =>
    ATTACHMENT_FIELDS.reduce(
      (merged, fieldName) => ({
        ...merged,
        [fieldName]: partAttachments?.[index]?.[fieldName] ?? [],
      }),
      { ...part },
    ),
  );

/** Every newly picked File, with the index of the part it belongs to. */
export const collectNewFiles = (partAttachments = [], fieldName) =>
  partAttachments.flatMap((attachments, index) =>
    (attachments?.[newFilesFieldName(fieldName)] ?? []).map((file) => ({
      index,
      file,
    })),
  );
