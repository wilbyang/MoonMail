'use strict';

import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';
import omitEmpty from 'omit-empty';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  decrypt(event.authToken).then((decoded) => {
    const defaultOptions = {
      limit: 10
    };
    const defaultFilters = {
      archived: { ne: true }
    };

    const filters = event.filters;

    // TODO: Fixme!
    if (!filters.archived.eq) {
      delete filters.archived;
    }

    if (!filters.status.eq) {
      delete filters.status;
    }

    if (filters.archived) {
      filters.archived.eq = JSON.parse(filters.archived.eq);
      // Should not happen, but just in case.
      if (filters.archived.eq === false) {
        filters.archived.ne = true;
      }
    }
    //

    Campaign.filterBy('userId', decoded.sub,
      Object.assign({}, defaultOptions, omitEmpty(event.options)),
      Object.assign({}, defaultFilters, omitEmpty(filters))
    ).then((campaigns) => {
      debug('= listCampaigns.action', 'Success');
      return cb(null, campaigns);
    }).catch((e) => {
      debug('= listCampaigns.action', e);
      return cb(ApiErrors.response(e));
    });
  }).catch(err => cb(ApiErrors.response(err), null));
}
