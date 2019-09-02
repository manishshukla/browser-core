/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import prefs from '../core/prefs';
import { isDesktopBrowser, isWindows } from '../core/platform';

import config from './config';

const setupInitialPage = (window, url) => {
  const urls = [
    url,
    `${url}#`,
    `${url}#/`,
  ];
  const initialPages = window.gInitialPages || [];

  urls.forEach((u) => {
    const isInitialPage = initialPages.indexOf(u) >= 0;

    if (!isInitialPage) {
      initialPages.push(u);
    }
  });
};

/**
* @namespace freshtab
*/
export default class Win {
  /**
  * @class Window
  * @constructor
  */
  constructor({ window, background }) {
    this.background = background;

    setupInitialPage(window, config.settings.NEW_TAB_URL);
  }

  /**
  *@method init
  *@return null
  */
  init() {
    this.showOnboarding();
  }

  unload() {}

  status() {
    return {
      visible: true,
      enabled: this.background.newTabPage.isActive,
    };
  }

  showOnboarding() {
    this.showUnsupportedOsWarning();
  }

  showUnsupportedOsWarning() {
    const dismissedAlerts = JSON.parse(prefs.get('dismissedAlerts', '{}'));
    const messageType = 'windows-xp-vista-end-of-support';
    const isDismissed = dismissedAlerts[messageType] && dismissedAlerts[messageType].count >= 1;

    if (isDismissed || !isWindows()) {
      return;
    }

    if (isDesktopBrowser) {
      return;
    }

    this.background.messageCenter.action(
      'showMessage',
      'MESSAGE_HANDLER_FRESHTAB',
      {
        id: messageType,
        template: messageType,
      },
    );
  }
}
