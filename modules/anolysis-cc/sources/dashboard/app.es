/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* global Handlebars */

import templates from '../templates';

/**
 * Retrieves demographics.
 */
function showDemographics(anolysis) {
  anolysis.getDemographics().then((demographics) => {
    // Update browser_attributes section
    document.getElementById('browser-attributes').innerHTML = templates.browser_attributes(demographics);
  });
}

/**
 * Gets analyses and metrics available in anolysis, as well as
 * the state of metrics `today`
 */
function showSignalDefinitions(anolysis, metricsToday) {
  anolysis.getSignalDefinitions().then((definitions) => {
    const triggeredMetrics = metricsToday;
    const analyses = [];
    const metrics = [];
    definitions.forEach(([name, def]) => {
      const entity = {};
      entity.name = name;
      entity.schema = JSON.stringify(def.schema, null, 2);
      entity.description = def.description;
      entity.class = '';
      entity.count = '';
      if (name in triggeredMetrics) {
        entity.count = triggeredMetrics[name].length;
        entity.class = 'label';
      }
      if (def.generate !== undefined || def.sendToBackend !== undefined) {
        if (def.offsets && def.offsets.includes(0)) {
          entity.class = 'no-aggregation-needed';
        } else {
          entity.class = 'aggregation-needed';
        }
        analyses.push(entity);
      } else {
        metrics.push(entity);
      }
    });

    document.getElementById('analyses').innerHTML = templates.analyses(analyses);
    document.getElementById('metrics').innerHTML = templates.metrics(metrics);
  });
}

/**
 * Given a metric name, it will return the available
 * state for today's date
 */
function getMetric(metricsToday, metricName) {
  const available = metricsToday[metricName] || [];
  const signals = [];
  if (available.length > 0) {
    for (let i = 0; i < available.length; i += 1) {
      const sig = {};
      sig.prefix = JSON.stringify(available[i]);
      sig.count = i;
      sig.signal = JSON.stringify(available[i], null, 2);
      signals.push(sig);
    }
  }
  return signals;
}

/**
 * About section at the end.
 */
function showAbout() {
  document.getElementById('about').innerHTML = templates.about();
}

/**
 * Builds the site.
 */
export default async function main(anolysis) {
  // original string looks "?<entityType>=<entityName>"
  const [entityType, entityName] = location.search.slice(1).split('=').map(
    x => decodeURIComponent(x)
  );

  // Will update on page refresh only
  const today = await anolysis.getDate();
  const metricsToday = await anolysis.getMetricsForDate(today);

  // Register and plug in the templates
  Handlebars.partials = templates;
  let path = '';
  if (entityType) {
    path = 'resource://cliqz/anolysis-cc/index.html';
  }
  document.getElementById('main').innerHTML = templates.main({ path });

  anolysis.isAnolysisInitialized().then((state) => {
    if (state === false) {
      document.getElementById('messages').innerHTML = templates.error({
        message: 'Anolysis has not been initialized properly'
      });
    }
  });

  if (!entityType) {
    showDemographics(anolysis);
    showSignalDefinitions(anolysis, metricsToday);
    showAbout();
  } else if (entityType === 'metric') {
    const metric = entityName;
    const signals = getMetric(metricsToday, entityName);
    document.getElementById('metrics').innerHTML = templates.tabular_acordion(
      { metric, signals }
    );
  } else if (entityType === 'analysis') {
    // TODO: add later
  }
}
