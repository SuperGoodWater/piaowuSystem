import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:house',
      order: 0,
      title: '首页',
    },
    name: 'Home',
    path: '/home',
    redirect: '/home/analytics',
    children: [
      {
        component: () => import('#/views/home/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          order: 1,
          title: $t('page.dashboard.analytics'),
        },
        name: 'HomeAnalytics',
        path: 'analytics',
      },
      {
        component: () => import('#/views/home/workspace/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          order: 2,
          title: $t('page.dashboard.workspace'),
        },
        name: 'HomeWorkspace',
        path: 'workspace',
      },
    ],
  },
];

export default routes;
