import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:contact-round',
      order: 300,
      title: '客户管理',
    },
    name: 'CustomerCenter',
    path: '/customer-center',
    redirect: '/customer-center/visitor-list',
    children: [
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:list',
          title: '游客列表',
        },
        name: 'CustomerCenterVisitorList',
        path: 'visitor-list',
      },
      {
        meta: {
          icon: 'lucide:badge-percent',
          title: '会员管理',
        },
        name: 'CustomerCenterMemberManagement',
        path: 'member-management',
        redirect: '/customer-center/member-management/member-settings',
        children: [
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:settings-2',
              title: '会员设置页面',
            },
            name: 'CustomerCenterMemberSettings',
            path: 'member-settings',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:wallet-cards',
              title: '储值设置',
            },
            name: 'CustomerCenterStoredValueSettings',
            path: 'stored-value-settings',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:coins',
              title: '积分管理',
            },
            name: 'CustomerCenterPointsManagement',
            path: 'points-management',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:gift',
              title: '礼包管理',
            },
            name: 'CustomerCenterGiftPackageManagement',
            path: 'gift-package-management',
          },
        ],
      },
    ],
  },
];

export default routes;
