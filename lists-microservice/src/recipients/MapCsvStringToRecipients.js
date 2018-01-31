import Papa from 'papaparse';
import Promise from 'bluebird';
import _ from 'lodash';
import stripBom from 'strip-bom';
import omitEmpty from 'omit-empty';

const systemMetadataKeyPattern = /^systemMedatadata__/;

function addMetadata(recipient, row, headerMapping = {}) {
  const metadata = Object.entries(headerMapping)
    .filter(el => el[1] && el[1] !== 'false' && el[1] !== 'email')
    .reduce((metadata, columnMetadataMapping) => {
      const csvColumn = columnMetadataMapping[0];
      const metadataKey = columnMetadataMapping[1];
      const normalizedKey = normalizedMetadataKey(metadataKey);
      const metadataPath = isSystemMetadata(metadataKey)
        ? `systemMetadata.${normalizedKey}`
        : `metadata.${normalizedKey}`;
      _.set(metadata, metadataPath, row[csvColumn]);
      return metadata;
    }, { metadata: {}, systemMetadata: {} });
  return Object.assign({}, recipient, omitEmpty(metadata));
}

function isSystemMetadata(key) {
  return systemMetadataKeyPattern.test(key);
}

function normalizedMetadataKey(key = '') {
  return key.replace(systemMetadataKeyPattern, '');
}

function buildBaseRecipient(row, userId, listId, headerMapping = {}) {
  const emailHeader = Object.keys(headerMapping).find(h => headerMapping[h] === 'email');
  const email = row[emailHeader].trim();
  const baseRecipient = {
    email,
    userId,
    listId
  };
  return baseRecipient;
}

function rowToRecipient(row, userId, listId, headerMapping) {
  const baseRecipient = buildBaseRecipient(row, userId, listId, headerMapping);
  return addMetadata(baseRecipient, row, headerMapping);
}

// TODO: Improve me
function mapCsvRecipients({ csvString, userId, listId, headerMapping }) {
  return new Promise((resolve, reject) => {
    const recipients = [];
    const safeCsvString = stripBom(csvString);
    // TODO: Fix me
    return Papa.parse(safeCsvString, {
      header: true,
      // dynamicTyping: true,
      skipEmptyLines: true,
      step: (results) => {
        try {
          if (results.errors.length > 0) return false;
          const row = results.data[0];
          const recipient = rowToRecipient(row, userId, listId, headerMapping);
          if (recipient) {
            isValidEmail(recipient.email) && recipients.push(recipient);
          }
        } catch (err) {
          // console.log(err)
        }
      },
      error: (err, file, inputElem, reason) => {
        reject(new Error(`ImportError: ${err}. Reason: ${reason}`));
      },
      complete: () => {
        const uniqueRecipients = _.uniqBy(recipients, 'email');
        resolve(uniqueRecipients);
      }
    });
  });
}

function isValidEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export default {
  execute: mapCsvRecipients
};
