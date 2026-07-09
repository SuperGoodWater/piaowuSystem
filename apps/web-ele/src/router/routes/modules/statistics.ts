import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:chart-no-axes-combined',
      order: 500,
      title: '统计',
    },
    name: 'StatisticsCenter',
    path: '/statistics',
    redirect: '/statistics/data-center/overview',
    children: [
      {
        meta: {
          icon: 'lucide:database',
          title: '数据中心',
        },
        name: 'StatisticsDataCenter',
        path: 'data-center',
        redirect: '/statistics/data-center/overview',
        children: [
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:layout-dashboard',
              title: '总览',
            },
            name: 'StatisticsDataCenterOverview',
            path: 'overview',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:trees',
              title: '景区',
            },
            name: 'StatisticsDataCenterScenic',
            path: 'scenic',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:utensils-crossed',
              title: '餐饮',
            },
            name: 'StatisticsDataCenterCatering',
            path: 'catering',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:shopping-cart',
              title: '零售',
            },
            name: 'StatisticsDataCenterRetail',
            path: 'retail',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:bed-double',
              title: '住宿',
            },
            name: 'StatisticsDataCenterAccommodation',
            path: 'accommodation',
          },
        ],
      },
      {
        meta: {
          icon: 'lucide:file-bar-chart-2',
          title: '报表中心',
        },
        name: 'StatisticsReportCenter',
        path: 'report-center',
        redirect: '/statistics/report-center/my-favorites',
        children: [
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:star',
              title: '我的收藏',
            },
            name: 'StatisticsReportCenterFavorites',
            path: 'my-favorites',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:briefcase',
              title: '经营报表',
            },
            name: 'StatisticsReportCenterOperation',
            path: 'operation-report',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:ticket',
              title: '门票',
            },
            name: 'StatisticsReportCenterTicket',
            path: 'ticket-report',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:utensils-crossed',
              title: '餐饮',
            },
            name: 'StatisticsReportCenterCatering',
            path: 'catering-report',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:shopping-bag',
              title: '零售',
            },
            name: 'StatisticsReportCenterRetail',
            path: 'retail-report',
          },
          {
            component: () => import('#/views/home/workbench/business-page.vue'),
            meta: {
              icon: 'lucide:package',
              title: '套票',
            },
            name: 'StatisticsReportCenterPackage',
            path: 'package-report',
          },
        ],
      },
    ],
  },
];

export default routes;
