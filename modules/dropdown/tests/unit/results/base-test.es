/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* global chai, describeModule */


export default describeModule('dropdown/results/generic',
  function () {
    return {
      'core/events': {},
      '../../core/console': {},
      'platform/globals': {
        chrome: {},
      },
    };
  },
  function () {
    const resultTools = {
      assistants: {

      },
    };
    let GenericResult;

    beforeEach(function () {
      GenericResult = this.module().default;
    });

    context('with no title', function () {
      let result;

      beforeEach(function () {
        result = new GenericResult({
          url: 'https://www.test.test',
        }, resultTools);
      });

      it('should fill title with stripped url', function () {
        chai.expect(result).to.have.property('title').that.equals('test.test');
      });
    });

    context('with deep results', function () {
      [
        {
          methodName: 'internalResults',
          deepResultsType: 'buttons',
        },
        {
          methodName: 'imageResults',
          deepResultsType: 'images',
        },
        {
          methodName: 'anchorResults',
          deepResultsType: 'simple_links',
        },
        {
          methodName: 'newsResults',
          deepResultsType: 'news',
        },
      ].forEach((testCase) => {
        context(`#${testCase.methodName}`, function () {
          let result;
          let subResults;

          beforeEach(function () {
            result = new GenericResult({
              text: 'hello world',
              data: {
                deepResults: [
                  {
                    links: [
                      {}
                    ],
                    type: testCase.deepResultsType,
                  }
                ]
              }
            }, resultTools);
            subResults = result[testCase.methodName];
          });

          // Sanity check
          it('result has a query', function () {
            chai.expect(result)
              .to.have.property('query').that.equals(result.rawResult.text);
          });

          it('maps the result', function () {
            chai.expect(subResults)
              .to.have.property('length').that.equals(1);
          });

          it('gets query from parent', function () {
            chai.expect(subResults[0])
              .to.have.property('query').that.equals(result.query);
          });
        });
      });
    });
  });
