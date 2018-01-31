import './lib/specHelper';
import Api from './Api';

// An initial draft of the api spec
describe('Api', () => {
  it('allows to publish recipient imported events', () => {
    expect(Api).to.have.property('publishRecipientImportedEvents');
  });

  it('allows to publish recipient created event', () => {
    expect(Api).to.have.property('publishRecipientCreatedEvent');
  });

  it('allows to publish recipient updated events', () => {
    expect(Api).to.have.property('publishRecipientUpdatedEvent');
  });

  it('allows to publish recipient deleted events', () => {
    expect(Api).to.have.property('publishRecipientDeletedEvent');
  });

  it('allows to get a recipient by its id', () => {
    expect(Api).to.have.property('getRecipient');
  });

  it('allows to create a batch of recipients', () => {
    expect(Api).to.have.property('createRecipientsBatch');
  });

  it('allows to update a batch of recipients', () => {
    expect(Api).to.have.property('updateRecipientsBatch');
  });

  it('allows to import a batch of recipients', () => {
    expect(Api).to.have.property('importRecipientsBatch');
  });

  it('allows to delete a recipient in Elasticsearch', () => {
    expect(Api).to.have.property('deleteRecipientEs');
  });

  it('allows to create a recipient in Elasticsearch', () => {
    expect(Api).to.have.property('createRecipientEs');
  });

  it('allows to update a recipient in Elasticsearch', () => {
    expect(Api).to.have.property('updateRecipientEs');
  });

  it('allows to map a csv string to recipients', () => {
    expect(Api).to.have.property('mapCsvStringToRecipients');
  });

  it('allows to perform advanced search upon recipients', () => {
    expect(Api).to.have.property('searchRecipients');
  });

  it('allows to get all available email lists', () => {
    expect(Api).to.have.property('getAllLists');
  });
});
