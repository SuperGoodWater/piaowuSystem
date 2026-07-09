import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:blocks',
      order: 900,
      title: '应用中心',
    },
    name: 'ApplicationCenter',
    path: '/application-center',
    redirect: '/application-center/home',
    children: [
      {
        component: () => import('#/views/application-center/index.vue'),
        meta: {
          icon: 'lucide:house',
          order: 1,
          title: '应用首页',
        },
        name: 'ApplicationCenterHome',
        path: 'home',
      },
      {
        component: () => import('#/views/application-center/index.vue'),
        meta: {
          icon: 'lucide:shopping-bag',
          order: 2,
          title: '商品列表',
        },
        name: 'ApplicationCenterProductList',
        path: 'product-list',
      },
      {
        component: () => import('#/views/application-center/index.vue'),
        meta: {
          icon: 'lucide:layout-grid',
          order: 3,
          title: '应用管理',
        },
        name: 'ApplicationCenterAppManagement',
        path: 'app-management',
      },
      {
        component: () => import('#/views/application-center/index.vue'),
        meta: {
          icon: 'lucide:receipt-text',
          order: 4,
          title: '我的订单',
        },
        name: 'ApplicationCenterMyOrders',
        path: 'my-orders',
      },
    ],
  },
];

export default routes;
