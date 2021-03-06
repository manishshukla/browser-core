/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable no-param-reassign */

import globalConfig from '../core/config';
import moduleConfig from './config';
import telemetry from '../core/services/telemetry';
import { parse } from '../core/url';
import prefs from '../core/prefs';
import events from '../core/events';
import inject from '../core/kord/inject';
import pacemaker from '../core/services/pacemaker';
import { getMessage } from '../core/i18n';
import { isDesktopBrowser, isAMO, isGhostery, isCliqzBrowser } from '../core/platform';
import background from '../core/base/background';
import { getActiveTab, getWindow } from '../core/browser';
import { openLink } from '../platform/browser-actions';
import { queryTabs, getCurrentTabId } from '../core/tabs';

// Telemetry schemas
import metrics from './telemetry/metrics';
import analyses from './telemetry/analyses';

const TELEMETRY_TYPE = 'control_center';

function isInternalProtocol(url) {
  const internalProtocols = ['chrome', 'resource', 'moz-extension', 'chrome-extension'];
  return internalProtocols.findIndex(protocol => url.startsWith(protocol)) > -1;
}

function getAdultFilterState() {
  const data = {
    conservative: {
      name: getMessage('always'),
      selected: false
    },
    moderate: {
      name: getMessage('always_ask'),
      selected: false
    },
    liberal: {
      name: getMessage('never'),
      selected: false
    }
  };
  let state = prefs.get('adultContentFilter', 'moderate');
  if (state === 'showOnce') {
    state = 'moderate';
  }
  data[state].selected = true;

  return data;
}

class IntervalManager {
  constructor() {
    this.intervals = new Map();
  }

  add(windowId, interval) {
    this.intervals.set(windowId, interval);
  }

  has(windowId) {
    return this.intervals.has(windowId);
  }

  remove(windowId) {
    pacemaker.clearTimeout(this.intervals.get(windowId));
    this.intervals.delete(windowId);
  }

  removeAll() {
    for (const [windowId] of this.intervals) {
      this.remove(windowId);
    }
  }
}

export default background({
  core: inject.module('core'),
  antitracking: inject.module('antitracking'),
  geolocation: inject.service('geolocation', ['setLocationPermission']),

  requiresServices: ['geolocation', 'telemetry', 'pacemaker'],
  telemetrySchemas: [
    ...metrics,
    ...analyses,
  ],

  init(settings) {
    telemetry.register(this.telemetrySchemas);
    this.settings = settings;
    this.ICONS = settings.ICONS;
    this.intervals = new IntervalManager();

    // set default badge color and text
    if (chrome && chrome.browserAction2) {
      chrome.browserAction2.setBadgeBackgroundColor({ color: '#471647' });
      chrome.browserAction2.setBadgeText({ text: '0' });
    }
  },

  unload() {
    telemetry.unregister(this.telemetrySchemas);
    if (this.pageAction) {
      this.pageAction.shutdown();
    }
    this.intervals.removeAll();
  },

  refreshState(tabId) {
    return this.prepareData(tabId).then((data) => {
      this.actions.setState(tabId, data.generalState);
    });
  },

  updateBadgeOnLocationChange({ url, tabId, windowId }) {
    if (!isCliqzBrowser) {
      return;
    }

    if (this.intervals.has(windowId)) {
      this.intervals.remove(windowId);
    }

    if (isInternalProtocol(url) && chrome && chrome.browserAction2) {
      chrome.browserAction2.setBadgeText({ text: null, tabId });
    }
    // wait for tab content to load
    if (!url
      || url === 'about:blank') {
      return;
    }

    const updateBadgeForUrl = async () => {
      if (tabId !== undefined && url) {
        try {
          const info = await this.antitracking.action('getBadgeData', { tabId, url });
          this.updateBadge(tabId, info);
        } catch (e) {
          // pass
        }
      }
    };

    this.refreshState(tabId);
    updateBadgeForUrl();
    let counter = 12;
    const interval = pacemaker.register(() => {
      updateBadgeForUrl();
      counter -= 1;
      if (counter <= 0) {
        this.intervals.remove(windowId);
      }
    }, { timeout: 2000 });
    this.intervals.add(windowId, interval);
  },

  updateBadge(tabId, info) {
    if (typeof chrome !== 'undefined' && chrome.browserAction2 && info !== undefined) {
      chrome.browserAction2.setBadgeText({ text: `${info}`, tabId }, () => {
        if (chrome.runtime.lastError) {
          // do nothing in case something went wrong
        }
      });
    }
  },

  prepareData(/* tabId */) {
    // TODO do I have access to the window here?
    return this.core.action(
      'getWindowStatus',
      getWindow()
    ).then((mData) => {
      const moduleData = mData;
      return this.actions.getFrameData().then((ccData) => {
        // If antitracking module is included, show critical when we get no antitracking state.
        // Otherwise show active.

        ccData.generalState = this.antitracking.isPresent()
          ? (moduleData.antitracking && moduleData.antitracking.state) || 'critical'
          : 'active';

        moduleData.adult = { visible: true, state: getAdultFilterState() };
        moduleData.humanWebOptOut = prefs.get('humanWebOptOut', false);
        moduleData.searchProxy = { enabled: prefs.get('hpn-query', false) };

        ccData.module = moduleData;

        ccData.telemetry = prefs.get('telemetry', true);
        return ccData;
      });
    });
  },

  async getCurrentTabId() {
    // its a guessing game but as it is triggered by
    // user interaction we may be right here
    // idealy we infer the current tab from action sender
    const window = getWindow();
    const tabId = await getCurrentTabId(window);
    return tabId;
  },

  events: {
    'content:location-change': function onLocationChange(...args) {
      this.updateBadgeOnLocationChange(...args);
    },
    'core:tab_select': function onTabSelect(...args) {
      this.updateBadgeOnLocationChange(...args);
    },
  },
  actions: {
    status() {
      return this.prepareData();
    },
    updatePref(data) {
      switch (data.pref) {
        case 'humanWebOptOut':
          events.pub('control-center:toggleHumanWeb');
          break;
        case 'share_location':
          this.geolocation.setLocationPermission(data.value);
          break;
        case 'extensions.https_everywhere.globalEnabled':
          events.pub('control-center:toggleHttpsEverywhere', {
            newState: data.value
          });
          break;
        default: {
          let prefValue = data.value;
          if (data.prefType === 'boolean') {
            prefValue = (prefValue === 'true');
          }
          if (data.prefType === 'integer') {
            prefValue = parseInt(prefValue, 10);
          }
          prefs.set(data.pref, prefValue);
        }
      }

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: data.target,
          state: data.value,
          action: 'click'
        }, `metrics.legacy.control_center.${data.target}`);
      }
    },
    // creates the static frame data without any module details
    // re-used for fast first render and onboarding
    async getFrameData() {
      let { url } = await getActiveTab();

      let friendlyURL = url;
      let isSpecialUrl = false;

      if (url.indexOf('about:') === 0) {
        friendlyURL = url;
        isSpecialUrl = true;
      } else if (url.endsWith('modules/freshtab/home.html')) {
        friendlyURL = `${moduleConfig.settings.BRAND} Tab`;
        isSpecialUrl = true;
      } else if (url.endsWith('modules/history/home.html')) {
        friendlyURL = `${getMessage('freshtab_history_button')}`;
        isSpecialUrl = true;
      } else if (url.endsWith('modules/privacy-dashboard/index.html')) {
        friendlyURL = `${getMessage('control_center_transparency')}`;
        isSpecialUrl = true;
      } else if (
        globalConfig.settings.ONBOARDING_URL
        && url.startsWith(globalConfig.settings.ONBOARDING_URL)
      ) {
        friendlyURL = moduleConfig.settings.BRAND;
        isSpecialUrl = true;
      } else if (url.startsWith('chrome://cliqz/content/anti-phishing/phishing-warning.html')) {
        // in case this is a phishing site (and a warning is displayed),
        // we need to get the actual url instead of the warning page
        url = url.split('chrome://cliqz/content/anti-phishing/phishing-warning.html?u=')[1];
        url = decodeURIComponent(url);
        isSpecialUrl = true;
        friendlyURL = getMessage('anti-phishing-txt0');
      }

      const urlDetails = parse(url);
      let domain = '';
      let extraUrl = '';
      let hostname = '';
      if (urlDetails !== null) {
        domain = urlDetails.generalDomain;
        hostname = urlDetails.hostname;
        extraUrl = (
          (urlDetails.pathname === '/' && urlDetails.search === '')
            ? ''
            : urlDetails.pathname + urlDetails.search
        );
      }

      return {
        activeURL: url,
        friendlyURL,
        isSpecialUrl,
        domain,
        extraUrl,
        hostname,
        module: {}, // will be filled later
        generalState: 'active',
        feedbackURL: moduleConfig.settings.USER_SUPPORT_URL,
        locationSharingURL: 'https://cliqz.com/support/local-results',
        myoffrzURL: 'https://cliqz.com/myoffrz',
        reportSiteURL: 'https://cliqz.com/report-url',
        debug: prefs.get('showConsoleLogs', false),
        isDesktopBrowser,
        amo: isAMO,
        compactView: this.settings.id === 'ghostery@cliqz.com',
        ghostery: this.settings.id === 'ghostery@cliqz.com',
        privacyPolicyURL: globalConfig.settings.PRIVACY_POLICY_URL,
        showPoweredBy: moduleConfig.settings.SHOW_POWERED_BY,
        showLearnMore: !isGhostery
      };
    },

    async getData() {
      const tabId = await this.getCurrentTabId();

      return this.prepareData(tabId).then((data) => {
        const count = data.module.antitracking ? data.module.antitracking.badgeData : 0;
        this.updateBadge(tabId, count);
        return data;
      });
    },

    async updateState(state) {
      const tabId = await this.getCurrentTabId();

      // set the state of the current window
      this.actions.setState(tabId, state);

      // go to all the other windows and refresh the state
      const tabs = await queryTabs();
      tabs.forEach((tab) => {
        // some modules need time to start eg: antitracking
        pacemaker.setTimeout(() => {
          this.refreshState(tab.id);
        }, 3000);
      });
    },

    async updateInstantly(state) {
      const tabId = await this.getCurrentTabId();
      this.actions.setState(tabId, state);
      return this.refreshState(tabId);
    },

    setState(tabId, state) {
      if (!chrome.browserAction2) {
        return;
      }

      const icon = globalConfig.baseURL + this.ICONS[state];

      chrome.browserAction2.setIcon({
        path: {
          16: icon,
          48: icon,
          128: icon
        },
        tabId
      });
      chrome.browserAction2.setBadgeBackgroundColor({ color: '#471647', tabId });
    },

    openURL(data) {
      openLink(data.url, true);

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: data.target,
          action: 'click',
          index: data.index
        }, `metrics.legacy.control_center.${data.target}`);
      }
    },

    'antitracking-strict': function antitrackingStrict({ isPrivateMode, status }) {
      events.pub('control-center:antitracking-strict');
      if (!isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: 'attrack_fair',
          action: 'click',
          state: status === true ? 'on' : 'off'
        }, 'metrics.legacy.control_center.attrack_fair');
      }
    },

    'complementary-search': function complementarySearch({ defaultSearch, isPrivateMode }) {
      events.pub('control-center:setDefault-search', defaultSearch);
      if (!isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: 'complementary_search',
          state: `search_engine_change_${defaultSearch}`,
          action: 'click'
        }, 'metrics.legacy.control_center.complementary_search');
      }
    },

    'search-index-country': function searchIndexCountry({ defaultCountry, isPrivateMode }) {
      events.pub('control-center:setDefault-indexCountry', defaultCountry);
      if (!isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: 'search-index-country',
          state: `search_index_country_${defaultCountry}`,
          action: 'click',
        }, 'metrics.legacy.control_center.search-index-country');
      }
    },

    'antitracking-activator': async function antitrackingActivator(data) {
      const tabId = await this.getCurrentTabId();
      switch (data.status) {
        case 'active':
          this.core.action('enableModule', 'antitracking').then(() => {
            events.pub('antitracking:whitelist:remove', data.hostname, data.isPrivateMode);
          });
          break;
        case 'inactive':
          this.core.action('enableModule', 'antitracking').then(() => {
            events.pub('antitracking:whitelist:add', data.hostname, data.isPrivateMode);
          });
          break;
        case 'critical':
          events.pub('antitracking:whitelist:remove', data.hostname, data.isPrivateMode);
          events.nextTick(() => {
            this.core.action('disableModule', 'antitracking');
          });

          // reset the badge when the anti tracking module gets offline
          this.updateBadge(tabId, '0');
          break;
        default:
          break;
      }

      let state;
      if (data.type === 'switch') {
        state = data.state === 'active' ? 'on' : 'off';
      } else {
        state = data.state;
      }

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: `attrack_${data.type}`,
          state,
          action: 'click',
        }, `metrics.legacy.control_center.attrack_${data.type}`);
      }
    },

    'anti-phishing-activator': function antiphishingActivator(data) {
      inject.module('anti-phishing').action('activator', data.state, data.url);

      let state;
      if (data.type === 'switch') {
        state = data.state === 'active' ? 'on' : 'off';
      } else {
        state = data.state;
      }

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: `antiphishing_${data.type}`,
          state,
          action: 'click',
        }, `metrics.legacy.control_center.antiphishing_${data.type}`);
      }
    },

    'adb-activator': function adbActivator(data) {
      events.pub('control-center:adb-activator', data);

      let state;
      if (data.type === 'switch') {
        state = data.state === 'active' ? 'on' : 'off';
      } else {
        state = data.state;
      }

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: `adblock_${data.type}`,
          state,
          action: 'click',
        }, `metrics.legacy.control_center.adblock_${data.type}`);
      }
    },

    'antitracking-clearcache': function antitrackingClearCache({ isPrivateMode }) {
      events.pub('control-center:antitracking-clearcache', isPrivateMode);
    },

    'adb-optimized': function adbOptimized(data) {
      events.pub('control-center:adb-optimized', data.status);

      if (!data.isPrivateMode) {
        telemetry.push({
          type: TELEMETRY_TYPE,
          target: 'adblock_fair',
          action: 'click',
          state: data.status === true ? 'on' : 'off'
        }, 'metrics.legacy.control_center.adblock_fair');
      }
    },

    'quick-search-state': function quickSearchState(data) {
      prefs.set('modules.search.providers.cliqz.enabled', data.enabled);
      // TODO telemetry
      return this.actions.getData();
    },

    'autoconsent-activator': (data) => {
      const { state, deny, hostname, isPrivateMode, type } = data;
      if (state === 'off_all' || state === 'critical') {
        prefs.set('modules.autoconsent.enabled', false);
      } else {
        const enable = inject.module('core').action('enableModule', 'autoconsent');
        const autoconsent = inject.module('autoconsent');
        enable.then(() => {
          autoconsent.action('setDefaultAction', deny ? 'deny' : 'allow');
          if (hostname) {
            if (state === 'active') {
              autoconsent.action('clearSiteAction', hostname);
            } else {
              autoconsent.action('setSiteAction', hostname, 'none', isPrivateMode);
            }
          }
        });
      }
      if (!isPrivateMode) {
        const msg = {
          type: TELEMETRY_TYPE,
          target: `autoconsent_${type}`,
          state: state || `${deny}`,
          action: 'click',
        };
        telemetry.push(msg, `metrics.legacy.control_center.${msg.target}`);
      }
    }
  },
});
