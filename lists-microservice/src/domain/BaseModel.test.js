// import '../lib/specHelper';
// import Joi from 'joi';
// import cuid from 'cuid';
// import moment from 'moment';
// import { Model } from 'moonmail-models';
// import BaseModel from './BaseModel';
// import chunkArray from '../lib/utils/chunkArray';


// class EmptyModel extends BaseModel { }

// class ValidModel extends BaseModel {
//   static get createSchema() {
//     return Joi.object({
//       id: Joi.string().default(cuid()),
//       email: Joi.string().required().email(),
//       createdAt: Joi.number().default(moment().unix())
//     });
//   }

//   static get updateSchema() {
//     return Joi.object({
//       email: Joi.string().required().email(),
//       updatedAt: Joi.number().default(moment().unix())
//     });
//   }
// }

// describe('BaseModel', () => {
//     describe('.validate', () => {
//       it('delegates to Joi.validate if the schema is not null, otherwise resolves', async () => {
//         const emptyModel = { name: 'Some name' };
//         const emptyModelResult = await EmptyModel.validate(null, emptyModel);
//         expect(emptyModelResult).to.deep.equals(emptyModel);

//         const validModel = { email: 'some@example.com' };
//         const validModelResult = await ValidModel.validate(Joi.object({
//           email: Joi.string().required().email()
//         }), validModel);
//         expect(validModelResult).to.deep.equals(validModel);
//       });
//     });

//   describe('.find', () => {
//     context('when the searched item exists', () => {
//       before(() => {
//         sinon.stub(Model, 'get').resolves({ id: '1' });
//       });
//       after(() => {
//         Model.get.restore();
//       });
//       it('returns it', async () => {
//         const item = await ValidModel.find('1');
//         expect(item).to.deep.equals({ id: '1' });
//       });
//     });
//     context('when the searched item doesnt exist', () => {
//       before(() => {
//         sinon.stub(Model, 'get').resolves({});
//       });
//       after(() => {
//         Model.get.restore();
//       });
//       it('raises an error', async () => {
//         try {
//           await ValidModel.find(1);
//         } catch (err) {
//           expect(err).to.match(/ItemNotFound/);
//         }
//       });
//     });
//   });

//   describe('.update', () => {
//     context('when the update payload is empty', () => {
//       before(() => {
//         sinon.stub(Model, 'update').resolves({ id: '1' });
//       });
//       after(() => {
//         Model.update.restore();
//       });
//       it('raises an error', async () => {
//         try {
//           const item = await ValidModel.update({}, '1');
//         } catch (err) {
//           expect(err).to.match(/EmptyPayload/);
//           expect(Model.update).not.to.have.been.called;
//         }
//       });
//     });

//     context('when the update payload exists', () => {
//       const payload = { id: '1', email: 'ups@example.com' };
//       before(() => {
//         sinon.stub(Model, 'update').resolves(payload);
//       });
//       after(() => {
//         Model.update.restore();
//       });
//       it('validates and resolves accordingly', async () => {
//         const item = await ValidModel.update({ email: payload.email }, '1');
//         expect(Model.update.lastCall.args[0].email).to.equals(payload.email);
//         expect(Model.update.lastCall.args[0]).to.have.property('updatedAt');
//         expect(item.email).to.equals(payload.email);
//       });
//     });
//   });

//   // describe('.initialize', () => {
//   //   it('builds a basic item attaching uuids and createdAt fields dont exist already in the object', () => {
//   //     const item = { email: 'some@example.com' };
//   //     const initializedItem = ValidModel.initialize(item);
//   //     expect(initializedItem).to.have.property('id');
//   //     expect(initializedItem).to.have.property('createdAt');

//   //     const anotherItem = { email: 'some@example.com', id: 1, createdAt: 123 };
//   //     const initializedItem2 = ValidModel.initialize(anotherItem);
//   //     expect(initializedItem2.id).to.equals(1);
//   //     expect(initializedItem2.createdAt).to.equals(123);

//   //     const anotherItem2 = { email: 'some@example.com' };
//   //     const initializedItem3 = ValidModel.initialize(anotherItem2, itm => ({ id: 'my-custom-id' }));
//   //     expect(initializedItem3.id).to.equals('my-custom-id');
//   //     expect(initializedItem3).to.have.property('createdAt');
//   //   });
//   // });

//   describe('.create', () => {
//     const payload = { email: 'ups@example.com' };
//     before(() => {
//       // Model don't return the data after saving
//       sinon.stub(Model, 'save').resolves({});
//     });
//     after(() => {
//       Model.save.restore();
//     });
//     it('validates and resolves accordingly', async () => {
//       const item = await ValidModel.create(payload);
//       expect(item.email).to.equals(payload.email);
//       expect(item).to.have.property('createdAt');
//       expect(item).to.have.property('id');
//     });
//   });


//   describe('.saveAll', () => {
//     context('when all the items are valid', () => {
//       const item1 = { id: '1', email: 'ups1@example.com' };
//       const item2 = { id: '2', email: 'ups2@example.com' };
//       const item3 = { id: '3', email: 'ups3@example.com' };
//       before(() => {
//         sinon.stub(Model, 'saveAll').resolves([item1, item2, item3]);
//       });
//       after(() => {
//         Model.saveAll.restore();
//       });
//       it('validates and resolves accordingly', async () => {
//         const items = await ValidModel.saveAll([item1, item2, item3]);
//         const callArgs = Model.saveAll.lastCall.args[0];
//         expect(callArgs.length).to.equals(3);
//         expect(callArgs[0]).to.have.property('createdAt');
//         expect(callArgs[0]).to.have.property('id');
//       });
//     });

//     context('when some item doesnt validate', () => {
//       before(() => {
//         sinon.stub(Model, 'saveAll').resolves({});
//       });
//       after(() => {
//         Model.saveAll.restore();
//       });
//       it('raises an error', async () => {
//         try {
//           const items = await ValidModel.saveAll([{ email: 'ups1@' }, { id: '1', email: 'ups1@example.com' }]);
//           const callArgs = Model.saveAll.lastCall.args[0];
//           expect(callArgs.length).to.equals(3);
//           expect(callArgs[0]).to.have.property('createdAt');
//           expect(callArgs[0]).to.have.property('id');
//         } catch (err) {
//           expect(Model.saveAll).not.to.have.been.called;
//           expect(err.name).to.equals('ValidationError');
//         }
//       });
//     });
//   });

//   describe('.batchCreate', () => {
//     const items = Array.apply(null, { length: 50 }).map(Number.call, Number).map(i => ({ email: `example${i}@email.com` }));
//     before(() => {
//       sinon.stub(BaseModel, 'saveAll').resolves(items.slice(0, 25));
//     });
//     after(() => {
//       BaseModel.saveAll.restore();
//     });
//     it('validates and resolves accordingly', async () => {
//       const itms = await ValidModel.batchCreate(items);
//       itms.forEach(item => expect(item).to.be.a('object'));
//     });
//   });
// });
