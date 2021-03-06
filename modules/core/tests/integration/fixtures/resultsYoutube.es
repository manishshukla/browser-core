/*!
 * Copyright (c) 2014-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export default [
  {
    url: 'https://www.youtube.com/',
    score: 21242.994,
    snippet: {
      deepResults: [
        {
          links: [
            {
              title: '> Title - Gronkh',
              url: 'https://www.youtube.com/user/Gronkh'
            },
            {
              title: '> Title - Verlauf',
              url: 'https://www.youtube.com/feed/history'
            },
            {
              title: '> Title - BibisBeautyPalace',
              url: 'https://www.youtube.com/user/BibisBeautyPalace'
            },
            {
              title: '> Title - Rocket Beans TV',
              url: 'https://www.youtube.com/user/ROCKETBEANSTV'
            }
          ],
          type: 'buttons'
        },
        {
          links: [
            {
              extra: {
                duration: 719,
                thumbnail: 'http://localhost:3000/static/images/hqdefault.jpg',
                views: '251329',
                expected_views: '251,329'
              },
              title: '> Title - Unge REAGIERT auf Kochen mit Tanzverbot! | ungeklickt',
              url: 'https://www.youtube.com/watch?v=zTcNN-zwCog'
            },
            {
              extra: {
                duration: 215,
                thumbnail: 'http://localhost:3000/static/images/hqdefault.jpg',
                views: '29279',
                expected_views: '29,279'
              },
              title: '> Title - Felix von der Laden Vlog Musik | Conro - Circus (feat. Beckii Power)🍂',
              url: 'https://www.youtube.com/watch?v=7u6v3_pO-7E'
            },
            {
              extra: {
                duration: 252,
                thumbnail: 'http://localhost:3000/static/images/broken_youtube_hqdefault.jpg',
                views: '24764',
                expected_views: '24,764'
              },
              title: '> Title - 100% Kostenlos Gutschein - Ihr wolltet immer Leben wie ein König? - Ich zeige euch wie VLOG03',
              url: 'https://www.youtube.com/watch?v=vOtqfhwvY94'
            }
          ],
          type: 'videos'
        }
      ],
      description: 'Zeige deine Videos deinen Freunden, Familienmitgliedern und der ganzen Welt.',
      extra: {
        __message__: {
          buttons: [
            {
              action: 'dismiss',
              text: 'dismiss'
            }
          ],
          pref: 'showYoutubeDynamicMsg',
          searchTerm: 'myQuery',
          text: 'ytDynamicSearch'
        },
        alternatives: [],
        language: {},
        name_cat: 'ez_video-recommended',
        og: {
          image: 'http://localhost:3000/static/images/youtube_logo_stacked-vfl225ZTx.png'
        }
      },
      friendlyUrl: 'youtube.com',
      title: '> Title - YouTube'
    },
    c_url: 'https://www.youtube.com/?hl=de\u0026gl=DE',
    type: 'rh',
    subType: {
      class: 'EntityVideo',
      id: '-1907376115342448101',
      name: 'YouTube'
    },
    template: 'entity-video-1',
    trigger_method: 'url'
  },
];

export const videosResults = [
  {
    url: 'https://www.youtube.com/',
    score: 21242.994,
    snippet: {
      deepResults: [
        {
          links: [
            {
              extra: {
                duration: 719,
                thumbnail: 'http://localhost:3000/static/images/hqdefault.jpg',
                views: '251329'
              },
              title: '> Title - Unge REAGIERT auf Kochen mit Tanzverbot! | ungeklickt',
              url: 'https://www.youtube.com/watch?v=zTcNN-zwCog'
            },
            {
              extra: {
                duration: 215,
                thumbnail: 'http://localhost:3000/static/images/hqdefault.jpg',
                views: '29279'
              },
              title: '> Title - Felix von der Laden Vlog Musik | Conro - Circus (feat. Beckii Power)🍂',
              url: 'https://www.youtube.com/watch?v=7u6v3_pO-7E'
            },
            {
              extra: {
                duration: 252,
                thumbnail: 'http://localhost:3000/static/images/broken_youtube_hqdefault.jpg',
                views: '24764'
              },
              title: '> Title - 100% Kostenlos Gutschein - Ihr wolltet immer Leben wie ein König? - Ich zeige euch wie VLOG03',
              url: 'https://www.youtube.com/watch?v=vOtqfhwvY94'
            }
          ],
          type: 'videos'
        },
      ],
      description: 'Zeige deine Videos deinen Freunden, Familienmitgliedern und der ganzen Welt.',
      extra: {
        __message__: {
          buttons: [
            {
              action: 'dismiss',
              text: 'dismiss'
            }
          ],
          pref: 'showYoutubeDynamicMsg',
          searchTerm: 'myQuery',
          text: 'ytDynamicSearch'
        },
        alternatives: [],
        language: {},
        name_cat: 'ez_video-recommended',
        og: {
          image: 'http://localhost:3000/static/images/youtube_logo_stacked-vfl225ZTx.png'
        }
      },
      friendlyUrl: 'youtube.com',
      title: '> Title - YouTube'
    },
    c_url: 'https://www.youtube.com/?hl=de\u0026gl=DE',
    type: 'rh',
    subType: {
      class: 'EntityVideo',
      id: '-1907376115342448101',
      name: 'YouTube'
    },
    template: 'entity-video-1',
    trigger_method: 'url'
  },
];
