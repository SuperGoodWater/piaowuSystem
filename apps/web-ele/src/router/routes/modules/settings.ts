import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 1000,
      title: '设置',
    },
    name: 'Settings',
    path: '/settings',
    children: [
      {
        component: () => import('#/views/settings/store-settings.vue'),
        meta: {
          description: '维护当前门店资料信息',
          icon: 'lucide:settings-2',
          order: 1,
          priority: 'P1',
          title: '门店设置',
        },
        name: 'SettingsStoreSettings',
        path: 'store-settings',
      },
      {
        component: () => import('#/views/settings/store-management.vue'),
        meta: {
          description: '管理集团下属门店配置',
          icon: 'lucide:store',
          order: 2,
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
