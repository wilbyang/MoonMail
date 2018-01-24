import omitEmpty from 'omit-empty';
import moment from 'moment';

function buildFromImportProgress({ recipientIndex, totalRecipients }) {
  return omitEmpty({
    status: totalRecipients === recipientIndex + 1 ? 'success' : 'importing',
    finishedAt: totalRecipients === recipientIndex + 1 ? moment().unix() : null
  });
}

function create({ status, message, createdAt, finishedAt }) {
  return omitEmpty({
    // Legacy to be deprecated in the future
    importing: status === 'importing',
    // Attributes to keep
    status,
    createdAt,
    finishedAt,
    // In case of error, the error message
    message
  });
}

function aggregateImportStatus(importId, existingImportStatus, { status, message, createdAt, finishedAt }) {
  const sImportId = importId.split('.')[2];

  const importStatus = create({ status, message, createdAt, finishedAt });

  if (!existingImportStatus) {
    return { [sImportId]: importStatus };
  }

  if (!existingImportStatus[sImportId]) {
    return Object.assign({}, existingImportStatus, { [sImportId]: importStatus });
  }

  const existingImportStatusForId = existingImportStatus[sImportId];
  const newImportStatusForId = Object.assign({}, existingImportStatusForId, importStatus);
  return Object.assign({}, existingImportStatus, { [sImportId]: newImportStatusForId });
}

export default {
  create,
  buildFromImportProgress,
  aggregateImportStatus
};
