'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _logger = require('./../logger');

var _model = require('./model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ScheduledEmail = function (_Model) {
  _inherits(ScheduledEmail, _Model);

  function ScheduledEmail() {
    _classCallCheck(this, ScheduledEmail);

    return _possibleConstructorReturn(this, (ScheduledEmail.__proto__ || Object.getPrototypeOf(ScheduledEmail)).apply(this, arguments));
  }

  _createClass(ScheduledEmail, null, [{
    key: 'toBeSent',
    value: function toBeSent() {
      (0, _logger.debug)('= ScheduledEmail.toBeSent');
      var params = {
        TableName: this.tableName,
        FilterExpression: 'scheduledAt < :now and #status = :status and attribute_not_exists(sentAt)',
        ExpressionAttributeValues: {
          ':now': (0, _moment2.default)().unix(),
          ':status': 'scheduled'
        },
        ExpressionAttributeNames: {
          '#status': 'status'
        }
      };
      return this._client('scan', params).then(function (result) {
        return result.Items;
      });
    }
  }, {
    key: 'tableName',
    get: function get() {
      return process.env.SCHEDULED_EMAILS_TABLE;
    }
  }, {
    key: 'hashKey',
    get: function get() {
      return 'automationActionId';
    }
  }, {
    key: 'rangeKey',
    get: function get() {
      return 'id';
    }
  }]);

  return ScheduledEmail;
}(_model.Model);

module.exports.ScheduledEmail = ScheduledEmail;



[{
  id: 'cjko5enkh000001qqenncb04x',
  userId: 'google-oauth2|113981504912653237153',
  sender:
  {
    fromName: 'BESTGIFT - Têxteis Casa Hotelaria e Restauração',
    verified: true,
    emailAddress: 'jeferson.euclides@microapps.com',
    id: 'cjkb9ndiw000001q68c66x41y',
    apiSecret: 'zem3qVqxYMl7zO89w3bI3yIVSQTaBgLqaniqnduF',
    apiKey: 'AKIAIDW22VMJ47EQKSVA',
    sendingQuota: '100000',
    region: 'eu-west-1'
  },
  status: 'scheduled',
  scheduledAt: 1533915034,
  automationId: 'cjkbauncu000001qg87o4h72x',
  automationActionId: 'cjkbavexe000001pbetlvmlcs',
  recipient:
  {
    metadata: [Object],
    subscriptionOrigin: 'signupForm',
    systemMetadata: [Object],
    riskScore: 0,
    listId: 'cjge93ngo000001qaqrd2hdms',
    userId: 'google-oauth2|113981504912653237153',
    status: 'subscribed',
    verificationCode: 'cjko5duzt000w01qg35zy9ewf',
    createdAt: 1533914997,
    email: 'jeferson.euclides@microapps.com',
    id: 'amVmZXJzb24uZXVjbGlkZXNAbWljcm9hcHBzLmNvbQ',
    unsubscribeUrl: 'https://jamgfqiefe.execute-api.eu-west-1.amazonaws.com/prod/lists/cjge93ngo000001qaqrd2hdms/recipients/amVmZXJzb24uZXVjbGlkZXNAbWljcm9hcHBzLmNvbQ/unsubscribe?cid=cjkbavexe000001pbetlvmlcs'
  },
  campaign:
  {
    body: '<div style="text-align: center">\n <h1>test subscribe</h1>\n <p>\n Hello Jeferson! <br/>\n Pellentesque vel dui sed orci faucibus iaculis. Suspendisse dictum magna id.\n </p>\n <br/>\n <p>\n Test automation\n </p>\n</div>\n\n<br/>\n<!-- \nThis is a mandatory footer tag.\nRemove it only if you want to customize your footer\n\nSimple footer layout: \n\n<p>\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris non condimentum metus. Mauris malesuada leo nec felis dapibus, quis ornare nunc semper. Pellentesque non massa lacus. Pellentesque tempor felis non libero tristique semper. Duis consectetur scelerisque dolor, non blandit massa malesuada ut. In hac habitasse platea dictumst. Vestibulum sagittis quam in lobortis malesuada. Sed dui sem, pulvinar eget augue nec.<br />\n <br />\n <a href="https://jamgfqiefe.execute-api.eu-west-1.amazonaws.com/prod/lists/cjge93ngo000001qaqrd2hdms/recipients/amVmZXJzb24uZXVjbGlkZXNAbWljcm9hcHBzLmNvbQ/unsubscribe?cid=cjkbavexe000001pbetlvmlcs">Unsubscribe</a> jeferson.euclides@microapps.com from this list.<br />\n <br />\n Our mailing address is:<br />\n Address address 1<br data-mce-bogus="1">Address address 2<br data-mce-bogus="1">City State 123456789-000<br />\n <br />\n Copyright (C) 2018 <a href="https://www.google.com">My Company</a>. All rights reserved.\n</p>\n -->\n <img src="https://800q7cc00e.execute-api.eu-west-1.amazonaws.com/prod/links/open/cjkbavexe000001pbetlvmlcs?r=amVmZXJzb24uZXVjbGlkZXNAbWljcm9hcHBzLmNvbQ&u=google-oauth2%7C113981504912653237153&l=cjge93ngo000001qaqrd2hdms" width="1" height="1" />',
    subject: 'test subscribe',
    id: 'cjkbavexe000001pbetlvmlcs'
  }
}]