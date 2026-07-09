import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:route',
      order: 200,
      title: '销售渠道',
    },
    name: 'SalesChannel',
    path: '/sales-channel',
    redirect: '/sales-channel/travel-agency-management',
    children: [
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:briefcase-business',
          title: '旅行社管理',
        },
        name: 'SalesChannelTravelAgencyManagement',
        path: 'travel-agency-management',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:plane',
          title: 'OTA管理',
        },
        name: 'SalesChannelOTAManagement',
        path: 'ota-management',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:users',
          title: '人人分销',
        },
        name: 'SalesChannelUniversalDistribution',
        path: 'universal-distribution',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:smartphone',
          title: '小程序',
        },
        name: 'SalesChannelMiniProgram',
        path: 'mini-program',
      },
    ],
  },
];

export default routes;
