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
      {
        component: () => import('#/views/settings/account-management.vue'),
        meta: {
          description: '管理账号授权角色、门店和部门',
          icon: 'lucide:user-cog',
          order: 3,
          priority: 'P1',
          title: '账号管理',
        },
        name: 'SettingsAccountManagement',
        path: 'account-management',
      },
      {
        component: () => import('#/views/settings/role-management.vue'),
        meta: {
          description: '维护账号权限组',
          icon: 'lucide:shield-check',
          order: 4,
          priority: 'P1',
          title: '角色管理',
        },
        name: 'SettingsRoleManagement',
        path: 'role-management',
      },
      {
        component: () => import('#/views/settings/department-management.vue'),
        meta: {
          description: '维护账号部门',
          icon: 'lucide:network',
          order: 5,
          priority: 'P1',
          title: '部门管理',
        },
        name: 'SettingsDepartmentManagement',
        path: 'department-management',
      },
    ],
  },
];

export default routes;
