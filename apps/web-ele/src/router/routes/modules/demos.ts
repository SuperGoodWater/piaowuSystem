import type { RouteRecordRaw } from 'vue-router';

import { VBEN_DOC_URL, VBEN_GITHUB_URL, VBEN_LOGO_URL } from '@vben/constants';

import { IFrameView } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 9999,
      title: $t('demos.title'),
    },
    name: 'Demos',
    path: '/demos',
    children: [
      {
        meta: {
          title: $t('demos.elementPlus'),
        },
        name: 'NaiveDemos',
        path: 'element',
        component: () => import('#/views/demos/element/index.vue'),
      },
      {
        meta: {
          title: $t('demos.form'),
        },
        name: 'BasicForm',
        path: 'form',
        component: () => import('#/views/demos/form/basic.vue'),
      },
      {
        meta: {
          badgeType: 'dot',
          icon: VBEN_LOGO_URL,
          title: $t('demos.vben.title'),
        },
        name: 'VbenProject',
        path: '/vben-admin',
        children: [
          {
            name: 'VbenDocument',
            path: 'document',
            component: IFrameView,
            meta: {
              icon: 'lucide:book-open-text',
              link: VBEN_DOC_URL,
              title: $t('demos.vben.document'),
            },
          },
          {
            name: 'VbenGithub',
            path: 'github',
            component: IFrameView,
            meta: {
              icon: 'mdi:github',
              link: VBEN_GITHUB_URL,
              title: 'Github',
            },
          },
        ],
      },
      {
        name: 'VbenAbout',
        path: '/vben-admin/about',
        component: () => import('#/views/demos/about/index.vue'),
        meta: {
          icon: 'lucide:copyright',
          title: $t('demos.vben.about'),
        },
      },
    ],
  },
];

export default routes;
