'use strict';

import 'babel-polyfill';

class ApiErrors {
  static get errors() {
    return {
      invalidToken: {
        message: 'Missing or invalid JWT',
        status: 401
      }
    };
  }

  static response(error) {
    if (this._isAuthError(error)) {
      return this._authResponse();
    } else {
      return this._defaultResponse(error);
    }
  }

  static _isAuthError(error) {
    const errorName = error.name;
    const authErrorNames = ['TokenExpiredError', 'JsonWebTokenError'];
    if (errorName && authErrorNames.includes(errorName)) {
      return true;
    } else {
      return false;
    }
  }

  static _defaultResponse(error) {
    return JSON.stringify({status: 400, message: error.message || error });
  }

  static _authResponse() {
    return JSON.stringify(this.errors.invalidToken);
  }
}

module.exports.ApiErrors = ApiErrors;
