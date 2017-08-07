import { Campaign } from 'moonmail-models';
import { debug } from '../../lib/logger';
import decrypt from '../../lib/auth-token-decryptor';
import { ApiErrors } from '../../lib/errors';
import omitEmpty from 'omit-empty';

export function respond(event, cb) {
  debug('= listCampaigns.action', JSON.stringify(event));
  decrypt(event.authToken)
    .then((decoded) => {
      const defaultOptions = {
        limit: 250
      };
      const defaultFilters = {
        false: { archived: { ne: true } },
        true: { archived: { eq: true } }
      };

      const options = Object.assign(
        defaultOptions,
        omitEmpty(event.options || {})
      );

      const filters = defaultFilters[event.filters.archived || 'false'];
      Campaign.allBy('userId', decoded.sub, Object.assign({}, options, { filters }))
        .then((campaigns) => {
          debug('= listCampaigns.action', 'Success');
          return cb(null, campaigns);
        })
        .catch((e) => {
          debug('= listCampaigns.action', e);
          return cb(ApiErrors.response(e));
        });
    })
    .catch(err => cb(ApiErrors.response(err), null));
}
