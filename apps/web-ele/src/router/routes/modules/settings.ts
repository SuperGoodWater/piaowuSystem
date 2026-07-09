import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 100,
      title: '设置',
    },
    name: 'Settings',
    path: '/settings',
    children: [
      {
        component: () => import('#/views/settings/store-management.vue'),
        meta: {
          description: '管理门店联营关联',
          icon: 'lucide:store',
          priority: 'P1',
          title: '门店管理',
        },
        name: 'SettingsStoreManagement',
        path: 'store-management',
      },
    ],
  },
];

export default routes;
