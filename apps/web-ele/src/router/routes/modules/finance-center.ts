import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wallet',
      order: 400,
      title: '财务中心',
    },
    name: 'FinanceCenter',
    path: '/finance-center',
    redirect: '/finance-center/my-account',
    children: [
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:circle-dollar-sign',
          title: '我的账户',
        },
        name: 'FinanceCenterMyAccount',
        path: 'my-account',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:chart-column-big',
          title: '资金统计',
        },
        name: 'FinanceCenterFundStatistics',
        path: 'fund-statistics',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: '资金日志',
        },
        name: 'FinanceCenterFundLog',
        path: 'fund-log',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:scale',
          title: '分账规则',
        },
        name: 'FinanceCenterSettlementRules',
        path: 'settlement-rules',
      },
      {
        component: () => import('#/views/home/workbench/business-page.vue'),
        meta: {
          icon: 'lucide:receipt',
          title: '电子发票',
        },
        name: 'FinanceCenterElectronicInvoice',
        path: 'electronic-invoice',
      },
    ],
  },
];

export default routes;
