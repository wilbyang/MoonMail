import PublicHttpApi from './src/PublicHttpApi';
import RecipientCommands from './src/RecipientCommands';
import RecipientEventProcessors from './src/RecipientEventProcessors';
import RecipientQueries from './src/RecipientQueries';

// The public HTTP Api endpoints
module.exports.createRecipient = PublicHttpApi.createRecipient;
module.exports.updateRecipient = PublicHttpApi.updateRecipient;
module.exports.getRecipient = PublicHttpApi.getRecipient;
module.exports.listRecipients = PublicHttpApi.listRecipients;
module.exports.getAllLists = PublicHttpApi.getAllLists;


// Recipient related commands
module.exports.importRecipientsCsvFromS3 = RecipientCommands.importRecipientsCsvFromS3;

// Recipient event processors
module.exports.recipientImportedProcessor = RecipientEventProcessors.recipientImportedProcessor;
module.exports.recipientCreatedProcessor = RecipientEventProcessors.recipientCreatedProcessor;
module.exports.recipientUpdatedProcessor = RecipientEventProcessors.recipientUpdatedProcessor;
module.exports.syncRecipientStreamWithES = RecipientEventProcessors.syncRecipientStreamWithES;

// Recipient queries
module.exports.searchRecipientsRaw = RecipientQueries.searchRecipients;
