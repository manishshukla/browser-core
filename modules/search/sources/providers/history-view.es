/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { from } from 'rxjs';
import BaseProvider from './base';
// responses
import { getResponse } from '../responses';
import CONFIG from '../../core/config';
import { getResourceUrl } from '../../core/platform';

const sessionsUrl = query => ([
  getResourceUrl(CONFIG.settings.HISTORY_URL),
  '#/',
  CONFIG.settings['modules.history.search-path'],
  encodeURIComponent(query),
].join(''));

export default class HistoryView extends BaseProvider {
  constructor() {
    super('historyView');
  }

  search(query, config) {
    if (!query.trim() || !config.providers[this.id].isEnabled) {
      return this.getEmptySearch(config, query);
    }

    return from([
      getResponse({
        provider: this.id,
        config,
        query,
        results: [{
          provider: this.id,
          url: sessionsUrl(query),
          text: query,
          query,
          data: {
            kind: ['history-ui'],
            template: 'sessions',
          },
        }],
        state: 'done',
      })
    ])
      .pipe(this.getOperators());
  }
}
