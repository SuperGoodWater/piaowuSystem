import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:house',
      order: 0,
      title: '工作台',
    },
    name: 'Home',
    path: '/home',
    redirect: '/home/workspace',
    children: [
      {
        component: () => import('#/views/home/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          order: 1,
          title: '工作概览',
        },
        name: 'HomeWorkspace',
        path: 'workspace',
      },
      {
        component: () => import('#/views/home/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          order: 2,
          title: $t('page.dashboard.analytics'),
        },
        name: 'HomeAnalytics',
        path: 'analytics',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:ticket',
          order: 3,
          title: '门票产品管理',
        },
        name: 'WorkbenchTicketProductManagement',
        path: 'ticket-product-management',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:shopping-bag',
          order: 4,
          title: '零售产品管理',
        },
        name: 'WorkbenchRetailProductManagement',
        path: 'retail-product-management',
      },
      {
        meta: {
          icon: 'lucide:receipt-text',
          order: 5,
          title: '订单管理',
        },
        name: 'WorkbenchOrderManagement',
        path: 'order-management',
        children: [
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:ticket-check',
              order: 1,
              title: '门票订单',
            },
            name: 'WorkbenchTicketOrder',
            path: 'ticket-order',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:timer',
              order: 2,
              title: '计时票订单',
            },
            name: 'WorkbenchTimeTicketOrder',
            path: 'time-ticket-order',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:package-check',
              order: 3,
              title: '套票订单',
            },
            name: 'WorkbenchPackageTicketOrder',
            path: 'package-ticket-order',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:id-card',
              order: 4,
              title: '年卡订单',
            },
            name: 'WorkbenchAnnualCardOrder',
            path: 'annual-card-order',
          },
        ],
      },
    ],
  },
];

export default routes;
