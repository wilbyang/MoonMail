import chai from 'chai';
import sinon from 'sinon';
import 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { Automation, AutomationAction } from 'moonmail-models';
import CreateAutomationAction from './create_automation_action';
import FootprintCalculator from './footprint_calculator';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('CreateAutomationAction', () => {
  const validAutomation = {
    id: 'valid',
    name: 'name',
    listId: 'lid',
    senderId: 'sid',
    status: 'active',
    userId: 'uid'
  };
  const invalidAutomation = {id: 'invalid', userId: 'uid', name: 'incomplete'};
  describe('.execute()', () => {
    beforeEach(() => {
      sinon.stub(Automation, 'get')
        .withArgs(validAutomation.userId, validAutomation.id)
        .resolves(validAutomation)
        .withArgs(invalidAutomation.userId, invalidAutomation.id)
        .resolves(invalidAutomation)
        .withArgs(sinon.match.any).resolves({});
    });
    afterEach(() => {
      Automation.get.restore();
    });

    context('when the automation is invalid', () => {
      const automationId = invalidAutomation.id;
      const {userId} = invalidAutomation;

      it('should reject the promise', (done) => {
        const promise = CreateAutomationAction
          .execute({automationId, userId});
        expect(promise).to.be.eventually.rejectedWith('InvalidAutomation')
          .notify(done);
      });
    });

    context('when the automation is valid', () => {
      const automationId = validAutomation.id;
      const {userId} = validAutomation;

      context('and the action is not valid', () => {
        const automationAction = {name: 'without type'};

        it('should reject the promise', (done) => {
          const promise = CreateAutomationAction
            .execute({automationId, userId, automationAction});
          expect(promise).to.be.eventually.rejectedWith('MissingParams')
            .notify(done);
        });
      });

      context('and the action is valid', () => {
        beforeEach(() => {
          sinon.stub(AutomationAction, 'save').resolves({});
        });
        afterEach(() => AutomationAction.save.restore());

        const automationAction = {
          name: 'my automation',
          userId: 'fake-user',
          type: 'list.recipient.subscribe',
          status: 'whatever'
        };
        const {userId, listId, status, senderId} = validAutomation;
        const computedAutomationAction = Object.assign({}, automationAction, {userId, listId, status, senderId});

        it('should pick listId, senderId and status from automation', async () => {
          await CreateAutomationAction.execute({automationId, userId, automationAction});
          expect(AutomationAction.save).to.have.been.calledOnce;
          expect(AutomationAction.save).to.have.been
            .calledWithMatch(sinon.match(computedAutomationAction));
        });

        it('should contain the event footprint', async () => {
          const footprint = FootprintCalculator.calculate(computedAutomationAction);
          await CreateAutomationAction.execute({automationId, userId, automationAction});
          expect(AutomationAction.save).to.have.been.calledOnce;
          expect(AutomationAction.save).to.have.been
            .calledWithMatch(sinon.match({footprint}));
        });
      });
    });
  });
});
