type StoreStatus = '停用' | '启用' | '过期';

interface StoreRecord {
  address: string;
  authorizationExpireAt: string;
  createdAt: string;
  detailAddress: string;
  id: string;
  managerPhone: string;
  managerUsername: string;
  payRate: string;
  status: StoreStatus;
  storeCode: string;
  storeName: string;
  storeType: string;
  tenantName: string;
  version: string;
}

const storeManagementSampleData: StoreRecord[] = [
  {
    address: '深圳市南山区欢乐谷园区主入口',
    authorizationExpireAt: '2027-06-30',
    createdAt: '2026-07-01 10:30',
    detailAddress: '欢乐谷东区 1 号服务中心',
    id: 'store-001',
    managerPhone: '13600009999',
    managerUsername: 'happy_valley_east',
    payRate: '0.55%',
    status: '启用',
    storeCode: 'ST0001',
    storeName: '欢乐谷东区店',
    storeType: '景区门店',
    tenantName: '星河票务集团',
    version: '旗舰版',
  },
  {
    address: '青岛市市南区海岸线游客中心',
    authorizationExpireAt: '2026-12-31',
    createdAt: '2026-07-02 15:00',
    detailAddress: '海岸线游客中心 2 楼',
    id: 'store-002',
    managerPhone: '13700008888',
    managerUsername: 'coast_visitor_center',
    payRate: '0.68%',
    status: '过期',
    storeCode: 'ST0002',
    storeName: '海岸线游客中心',
    storeType: '零售门店',
    tenantName: '海岸线文旅',
    version: '基础版',
  },
  {
    address: '广州市番禺区欢乐谷西区',
    authorizationExpireAt: '2027-03-31',
    createdAt: '2026-07-03 09:15',
    detailAddress: '欢乐谷西区售票处旁',
    id: 'store-003',
    managerPhone: '13800007777',
    managerUsername: 'happy_valley_west',
    payRate: '0.60%',
    status: '停用',
    storeCode: 'ST0003',
    storeName: '欢乐谷西区店',
    storeType: '景区门店',
    tenantName: '星河票务集团',
    version: '专业版',
  },
  {
    address: '上海市浦东新区星河集团总部',
    authorizationExpireAt: '2028-07-04',
    createdAt: '2026-07-04 11:20',
    detailAddress: '星河总部 3 楼运营中心',
    id: 'store-004',
    managerPhone: '13900006666',
    managerUsername: 'galaxy_hq_store',
    payRate: '0.45%',
    status: '启用',
    storeCode: 'ST0004',
    storeName: '星河总部旗舰店',
    storeType: '集团门店',
    tenantName: '星河票务集团',
    version: '旗舰版',
  },
  {
    address: '深圳市南山区欢乐谷美食街',
    authorizationExpireAt: '2027-07-05',
    createdAt: '2026-07-05 13:45',
    detailAddress: '欢乐谷美食街 A12 档口',
    id: 'store-005',
    managerPhone: '13500005555',
    managerUsername: 'happy_food_a12',
    payRate: '0.72%',
    status: '启用',
    storeCode: 'ST0005',
    storeName: '欢乐谷美食街店',
    storeType: '餐饮门店',
    tenantName: '星河票务集团',
    version: '专业版',
  },
  {
    address: '厦门市思明区海岸线度假酒店',
    authorizationExpireAt: '2027-10-31',
    createdAt: '2026-07-06 08:50',
    detailAddress: '酒店前厅 PMS 服务台',
    id: 'store-006',
    managerPhone: '13400004444',
    managerUsername: 'coast_hotel_pms',
    payRate: '0.58%',
    status: '启用',
    storeCode: 'ST0006',
    storeName: '海岸线度假酒店 PMS',
    storeType: 'PMS',
    tenantName: '海岸线文旅',
    version: '专业版',
  },
  {
    address: '青岛市崂山区海岸线礼品中心',
    authorizationExpireAt: '2027-01-15',
    createdAt: '2026-07-07 16:10',
    detailAddress: '礼品中心 1 层收银区',
    id: 'store-007',
    managerPhone: '13300003333',
    managerUsername: 'coast_gift_shop',
    payRate: '0.70%',
    status: '停用',
    storeCode: 'ST0007',
    storeName: '海岸线礼品中心',
    storeType: '零售门店',
    tenantName: '海岸线文旅',
    version: '基础版',
  },
  {
    address: '杭州市西湖区星河城市会客厅',
    authorizationExpireAt: '2026-11-30',
    createdAt: '2026-07-08 10:05',
    detailAddress: '城市会客厅 B 区综合服务台',
    id: 'store-008',
    managerPhone: '13200002222',
    managerUsername: 'galaxy_city_lounge',
    payRate: '0.62%',
    status: '过期',
    storeCode: 'ST0008',
    storeName: '星河城市会客厅',
    storeType: '集团门店',
    tenantName: '星河票务集团',
    version: '基础版',
  },
];

export { storeManagementSampleData };
export type { StoreRecord, StoreStatus };
