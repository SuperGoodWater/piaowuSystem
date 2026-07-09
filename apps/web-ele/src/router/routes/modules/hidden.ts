import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: '旧概览跳转',
    },
    name: 'LegacyDashboardRedirect',
    path: '/dashboard',
    redirect: '/home/workspace',
  },
  {
    meta: {
      hideInMenu: true,
      title: '旧分析页跳转',
    },
    name: 'LegacyDashboardAnalyticsRedirect',
    path: '/dashboard/analytics',
    redirect: '/home/analytics',
  },
  {
    meta: {
      hideInMenu: true,
      title: '旧工作台跳转',
    },
    name: 'LegacyDashboardWorkspaceRedirect',
    path: '/dashboard/workspace',
    redirect: '/home/workspace',
  },
  {
    meta: {
      hideInMenu: true,
      title: '旧分析页跳转',
    },
    name: 'LegacyAnalyticsRedirect',
    path: '/analytics',
    redirect: '/home/analytics',
  },
  {
    meta: {
      hideInMenu: true,
      title: '旧工作台跳转',
    },
    name: 'LegacyWorkspaceRedirect',
    path: '/workspace',
    redirect: '/home/workspace',
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/hidden/profile/index.vue'),
    meta: {
      icon: 'lucide:user',
      hideInMenu: true,
      title: $t('page.auth.profile'),
    },
  },
];

export default routes;
