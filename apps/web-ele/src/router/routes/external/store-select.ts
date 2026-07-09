import type { RouteRecordRaw } from 'vue-router';

import { STORE_SELECT_PATH } from '#/router/helpers/store-selection';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/store-select/index.vue'),
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      title: '选择门店',
    },
    name: 'StoreSelect',
    path: STORE_SELECT_PATH,
  },
];

export default routes;
