import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:building-2',
      order: 1100,
      title: 'SaaS管理',
    },
    name: 'SaaSManagement',
    path: '/saas',
    children: [
      {
        meta: {
          icon: 'lucide:users-round',
          order: 1,
          title: '客户管理',
        },
        name: 'SaaSCustomerManagement',
        path: 'customer-management',
        children: [
          {
            component: () =>
              import('#/views/saas/customer-management/tenant-management.vue'),
            meta: {
              description: '管理租户和顶级管理员',
              icon: 'lucide:building',
              priority: 'P0',
              title: '租户管理',
            },
            name: 'SaaSTenantManagement',
            path: 'tenant-management',
          },
          {
            component: () =>
              import('#/views/saas/customer-management/store-management.vue'),
            meta: {
              description: '管理门店及门店状态',
              icon: 'lucide:store',
              priority: 'P0',
              title: '门店管理',
            },
            name: 'SaaSStoreManagement',
            path: 'store-management',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:package-open',
          order: 3,
          title: 'SaaS产品管理',
        },
        name: 'SaaSProductManagement',
        path: 'product-management',
        children: [
          {
            component: () =>
              import('#/views/saas/product-management/application-list-management.vue'),
            meta: {
              description: '管理应用资料、价格、上下架和停用状态',
              icon: 'lucide:layout-grid',
              priority: 'P1',
              title: '应用管理',
            },
            name: 'SaaSApplicationListManagement',
            path: 'application-list-management',
          },
          {
            component: () =>
              import('#/views/saas/product-management/resource-management.vue'),
            meta: {
              description: '维护按量付费资源和麦点资源包',
              icon: 'lucide:coins',
              priority: 'P1',
              title: '资源管理',
            },
            name: 'SaaSResourceManagement',
            path: 'resource-management',
          },
          {
            component: () =>
              import('#/views/saas/product-management/store-version-management.vue'),
            meta: {
              description: '管理不同门店类型下的版本',
              icon: 'lucide:git-branch-plus',
              priority: 'P0',
              title: '门店版本管理',
            },
            name: 'SaaSStoreVersionManagement',
            path: 'store-version-management',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:database-zap',
          order: 4,
          title: '平台资源管理',
        },
        name: 'SaaSPlatformResourceManagement',
        path: 'platform-resource-management',
        children: [
          {
            component: () =>
              import('#/views/saas/platform-resource-management/device-list.vue'),
            meta: {
              description: '管理设备注册绑定',
              icon: 'lucide:laptop-minimal-check',
              priority: 'P1',
              title: '设备列表',
            },
            name: 'SaaSDeviceList',
            path: 'device-list',
          },
          {
            component: () =>
              import('#/views/saas/platform-resource-management/print-template-management.vue'),
            meta: {
              description: '管理打印模板',
              icon: 'lucide:printer',
              priority: 'P1',
              title: '打印模板管理',
            },
            name: 'SaaSPrintTemplateManagement',
            path: 'print-template-management',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:megaphone',
          order: 5,
          title: '公告管理',
        },
        name: 'SaaSAnnouncementManagement',
        path: 'announcement-management',
        children: [
          {
            component: () =>
              import('#/views/saas/announcement-management/top-announcement.vue'),
            meta: {
              description: '管理顶部公告',
              icon: 'lucide:panel-top',
              priority: 'P1',
              title: '顶部公告',
            },
            name: 'SaaSTopAnnouncement',
            path: 'top-announcement',
          },
          {
            component: () =>
              import('#/views/saas/announcement-management/news-information.vue'),
            meta: {
              description: '管理资讯内容',
              icon: 'lucide:newspaper',
              priority: 'P1',
              title: '新闻资讯',
            },
            name: 'SaaSNewsInformation',
            path: 'news-information',
          },
          {
            component: () =>
              import('#/views/saas/announcement-management/feature-announcement.vue'),
            meta: {
              description: '管理功能上新通知',
              icon: 'lucide:sparkles',
              priority: 'P1',
              title: '功能上新',
            },
            name: 'SaaSFeatureAnnouncement',
            path: 'feature-announcement',
          },
          {
            component: () =>
              import('#/views/saas/announcement-management/popup-announcement.vue'),
            meta: {
              description: '管理弹窗公告',
              icon: 'lucide:monitor-up',
              priority: 'P1',
              title: '弹窗公告',
            },
            name: 'SaaSPopupAnnouncement',
            path: 'popup-announcement',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:shield-check',
          order: 6,
          title: '平台通用能力',
        },
        name: 'SaaSPlatformCapabilities',
        path: 'platform-capabilities',
        children: [
          {
            component: () =>
              import('#/views/saas/platform-capabilities/operation-log.vue'),
            meta: {
              description: '管理操作留痕',
              icon: 'lucide:file-clock',
              priority: 'P1',
              title: '操作日志',
            },
            name: 'SaaSOperationLog',
            path: 'operation-log',
          },
          {
            component: () =>
              import('#/views/saas/platform-capabilities/audit-log.vue'),
            meta: {
              description: '管理关键审计记录',
              icon: 'lucide:file-search-2',
              priority: 'P1',
              title: '审计日志',
            },
            name: 'SaaSAuditLog',
            path: 'audit-log',
          },
          {
            component: () =>
              import('#/views/saas/platform-capabilities/message-notification.vue'),
            meta: {
              description: '管理通知触达',
              icon: 'lucide:messages-square',
              priority: 'P1',
              title: '消息通知',
            },
            name: 'SaaSMessageNotification',
            path: 'message-notification',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:user-cog',
          order: 7,
          title: 'SaaS用户管理',
        },
        name: 'SaaSSystemUserManagement',
        path: 'system-user-management',
        children: [
          {
            component: () =>
              import('#/views/saas/system-user-management/employee-account-management.vue'),
            meta: {
              description: '管理SaaS内部员工',
              icon: 'lucide:user-round-pen',
              priority: 'P1',
              title: '员工账号管理',
            },
            name: 'SaaSEmployeeAccountManagement',
            path: 'employee-account-management',
          },
          {
            component: () =>
              import('#/views/saas/system-user-management/function-permission-management.vue'),
            meta: {
              description: '管理功能级权限',
              icon: 'lucide:key-round',
              priority: 'P1',
              title: '功能权限管理',
            },
            name: 'SaaSFunctionPermissionManagement',
            path: 'function-permission-management',
          },
          {
            component: () =>
              import('#/views/saas/system-user-management/department-management.vue'),
            meta: {
              description: '管理组织归属',
              icon: 'lucide:network',
              priority: 'P1',
              title: '部门管理',
            },
            name: 'SaaSDepartmentManagement',
            path: 'department-management',
          },
        ],
      },
    ],
  },
];

export default routes;
