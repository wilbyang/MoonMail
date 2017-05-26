import cuid from 'cuid';
import { Automation, AutomationAction } from 'moonmail-models';
import { newError, paramsChecker, errors } from '../../../lib/api-utils';
import FootprintCalculator from './footprint_calculator';

export default class CreateAutomaionAction {
  static execute({automationId, userId, automationAction }) {
    return this._getAutomation(userId, automationId)
      .then(automation => this._createAutomationAction(automation, automationAction))
  }

  static _getAutomation(userId, automationId) {
    const requiredProps = ['status', 'listId', 'userId', 'id'];
    const checkProperties = paramsChecker(requiredProps);
    return Automation.get(userId, automationId)
      .then(checkProperties)
      .catch(() => Promise.reject(
        newError('InvalidAutomation', 'The provided automation is invalid', 401))
      );
  }

  static _createAutomationAction(automation, automationAction) {
    const requiredProps = ['name', 'type'];
    const checkProperties = paramsChecker(requiredProps);
    return checkProperties(automationAction)
      .then(action => this._buildAutomationAction({automationAction: action, automation}))
      .then(action => this._doCreateAutomationAction(action));
  }

  static _buildAutomationAction({automationAction, automation}) {
    const {userId, listId, status, senderId} = automation;
    const id = cuid();
    const action = Object.assign(
      {delay: 0, automationId: automation.id},
      automationAction,
      {userId, listId, status, senderId, id}
    );
    const footprint = FootprintCalculator.calculate(action);
    action.footprint = footprint;
    return action;
  }

  static _doCreateAutomationAction(params) {
    return AutomationAction.save(params)
      .then(() => params);
  }
}
