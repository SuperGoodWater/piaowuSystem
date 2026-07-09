<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

type AppStatus = '使用中' | '已过期' | '未使用';
type ProductCategory =
  | 'AI'
  | '全部应用'
  | '多业态协同'
  | '更多功能'
  | '渠道直连'
  | '版本升级'
  | '生态合作';

interface CenterApp {
  category: ProductCategory;
  description: string;
  endAt?: string;
  id: string;
  name: string;
  price: string;
  provider: string;
  startAt?: string;
  status: AppStatus;
  tags: string[];
}

interface OrderRecord {
  amount: string;
  buyer: string;
  orderNo: string;
  productName: string;
  productType: string;
  quantity: string;
  received: string;
  refundAmount: string;
  status: string;
  time: string;
}

const route = useRoute();
const router = useRouter();
const pageTitle = computed(() => String(route.meta.title ?? '应用中心'));
const productKeyword = ref('');
const activeCategory = ref<ProductCategory>('全部应用');
const activeAppStatus = ref<'使用中' | '全部应用' | '已过期'>('使用中');
const orderKeyword = ref('');
const orderStatus = ref('');
const orderType = ref('');
const orderDateRange = ref<string[]>([]);

const categories: ProductCategory[] = [
  '全部应用',
  '版本升级',
  'AI',
  '渠道直连',
  '多业态协同',
  '更多功能',
  '生态合作',
];

const apps: CenterApp[] = [
  {
    category: '版本升级',
    description: '面向景区售票、检票、游客中心和多门店经营的完整能力包。',
    endAt: '2099-12-31',
    id: 'APP-TICKET-PRO',
    name: '票务专业版',
    price: '¥3998起',
    provider: '全郡来了票务云',
    startAt: '2026-07-01',
    status: '使用中',
    tags: ['可开通', '版本升级'],
  },
  {
    category: '版本升级',
    description: '按订单容量扩展高峰期售票、预约和核销承载能力。',
    id: 'APP-TRAFFIC-BOOST',
    name: '售票高峰加油包',
    price: '¥0.1起',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['按量计费'],
  },
  {
    category: 'AI',
    description: '基于历史订单、天气和活动日历预测客流峰值。',
    id: 'APP-AI-FLOW',
    name: '智能客流预测',
    price: '¥2400',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['官方应用', '经营分析'],
  },
  {
    category: 'AI',
    description: '面向售票咨询、退改规则和入园指引的智能问答工具。',
    id: 'APP-AI-SERVICE',
    name: '票务智能客服',
    price: '¥980',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['客服', '自动回复'],
  },
  {
    category: 'AI',
    description: '自动生成节庆活动文案、门票套餐卖点和小程序内容。',
    id: 'APP-AI-CONTENT',
    name: '活动内容助手',
    price: '¥100起',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['营销', '内容'],
  },
  {
    category: '渠道直连',
    description: '打通美团门票库存、价格、订单和核销状态。',
    endAt: '2099-12-31',
    id: 'APP-MEITUAN-TICKET',
    name: '美团门票直连',
    price: '免费续费',
    provider: '全郡来了票务云',
    startAt: '2026-07-01',
    status: '使用中',
    tags: ['官方应用', '渠道直连'],
  },
  {
    category: '渠道直连',
    description: '打通携程门票产品、库存、下单和核销链路。',
    id: 'APP-CTRIP-TICKET',
    name: '携程门票直连',
    price: '¥1380',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['渠道直连', '可开通'],
  },
  {
    category: '渠道直连',
    description: '支持抖音团购券码核销、订单同步和退款对账。',
    id: 'APP-DOUYIN-GROUPON',
    name: '抖音团购核销',
    price: '¥980',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['团购', '核销'],
  },
  {
    category: '渠道直连',
    description: '管理旅行社协议价、团队订单、结算和分销额度。',
    id: 'APP-AGENCY',
    name: '旅行社分销助手',
    price: '¥1998',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['旅行社', '分销'],
  },
  {
    category: '多业态协同',
    description: '组合门票、餐饮、零售和体验项目，形成一体化套票。',
    id: 'APP-PACKAGE',
    name: '套票组合营销',
    price: '¥1980',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['套票', '营销'],
  },
  {
    category: '多业态协同',
    description: '联动入园核销、二消权益、停车抵扣和会员积分。',
    id: 'APP-BENEFIT',
    name: '二消权益中心',
    price: '¥598',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['权益', '会员'],
  },
  {
    category: '多业态协同',
    description: '管理年卡购买、激活、续费、冻结和入园权益。',
    id: 'APP-ANNUAL-CARD',
    name: '年卡会员中心',
    price: '¥1280',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['年卡', '会员'],
  },
  {
    category: '更多功能',
    description: '连接闸机、手持核销设备和票务订单核验规则。',
    endAt: '2099-12-31',
    id: 'APP-CHECKIN',
    name: '票务核销助手',
    price: '免费续费',
    provider: '全郡来了票务云',
    startAt: '2026-07-01',
    status: '使用中',
    tags: ['核销', '设备联动'],
  },
  {
    category: '更多功能',
    description: '支持电子发票申请、开票状态回传和资金对账。',
    id: 'APP-INVOICE',
    name: '电子发票助手',
    price: '¥599',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['财务', '发票'],
  },
  {
    category: '更多功能',
    description: '统一展示门票、渠道、核销、会员和二消经营指标。',
    id: 'APP-DASHBOARD',
    name: '景区经营看板',
    price: '¥1999',
    provider: '全郡来了票务云',
    status: '未使用',
    tags: ['报表', '数据'],
  },
  {
    category: '生态合作',
    description: '对接导览地图、语音讲解和游线推荐服务。',
    id: 'APP-GUIDE',
    name: '智慧导览合作',
    price: '了解更多',
    provider: '生态合作伙伴',
    status: '未使用',
    tags: ['导览', '合作'],
  },
];

const orders: OrderRecord[] = [
  {
    amount: '3998 元',
    buyer: '星河票务集团',
    orderNo: 'AC202607010001',
    productName: '票务专业版',
    productType: '版本升级',
    quantity: '1',
    received: '3998 元',
    refundAmount: '0 元',
    status: '已支付',
    time: '2026-07-01 10:20',
  },
  {
    amount: '免费',
    buyer: '星河总部旗舰店',
    orderNo: 'AC202607010002',
    productName: '美团门票直连',
    productType: '渠道直连',
    quantity: '1',
    received: '0 元',
    refundAmount: '0 元',
    status: '已开通',
    time: '2026-07-01 10:32',
  },
  {
    amount: '免费',
    buyer: '欢乐谷东区店',
    orderNo: 'AC202607010003',
    productName: '票务核销助手',
    productType: '更多功能',
    quantity: '1',
    received: '0 元',
    refundAmount: '0 元',
    status: '已开通',
    time: '2026-07-01 11:08',
  },
];

const ownedApps = computed(() =>
  apps.filter((item) => item.status !== '未使用'),
);
const homeOwnedApps = computed(() => ownedApps.value.slice(0, 4));
const balance = computed(() => '¥0');
const productList = computed(() => {
  const keyword = productKeyword.value.trim().toLowerCase();
  return apps.filter((item) => {
    const matchesCategory =
      activeCategory.value === '全部应用' ||
      item.category === activeCategory.value;
    const matchesKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(keyword));
    return matchesCategory && matchesKeyword;
  });
});
const managedApps = computed(() => {
  if (activeAppStatus.value === '全部应用') {
    return apps;
  }
  return apps.filter((item) => item.status === activeAppStatus.value);
});
const orderList = computed(() => {
  const keyword = orderKeyword.value.trim().toLowerCase();
  return orders.filter((item) => {
    const [startDate, endDate] = orderDateRange.value;
    const matchesKeyword =
      !keyword ||
      item.orderNo.toLowerCase().includes(keyword) ||
      item.productName.toLowerCase().includes(keyword);
    const matchesStatus =
      !orderStatus.value || item.status === orderStatus.value;
    const matchesType =
      !orderType.value || item.productType === orderType.value;
    const orderDate = item.time.slice(0, 10);
    const matchesDate =
      !startDate ||
      !endDate ||
      (orderDate >= startDate && orderDate <= endDate);
    return matchesKeyword && matchesStatus && matchesType && matchesDate;
  });
});
const currentView = computed(() => {
  if (route.name === 'ApplicationCenterProductList') {
    return 'productList';
  }
  if (route.name === 'ApplicationCenterAppManagement') {
    return 'appManagement';
  }
  if (route.name === 'ApplicationCenterMyOrders') {
    return 'orders';
  }
  return 'home';
});
const categoryGroups = computed(() =>
  categories
    .filter((item) => item !== '全部应用')
    .map((category) => ({
      category,
      items: apps.filter((item) => item.category === category),
    })),
);

function getStatusTagType(status: AppStatus | string) {
  if (status === '使用中' || status === '已支付' || status === '已开通') {
    return 'success';
  }
  if (status === '已过期') {
    return 'info';
  }
  return 'warning';
}

function getActionText(app: CenterApp) {
  if (app.status === '使用中') {
    return app.price === '免费续费' ? '免费续费' : '续费';
  }
  if (app.price === '了解更多') {
    return '了解更多';
  }
  return '开通';
}

function goTo(name: string) {
  router.push({ name });
}

function goToCategory(category: ProductCategory) {
  activeCategory.value = category;
  goTo('ApplicationCenterProductList');
}
</script>

<template>
  <Page :title="pageTitle">
    <div class="application-center">
      <template v-if="currentView === 'home'">
        <div class="home-layout">
          <section class="hero-panel">
            <div class="hero-kicker">票务经营应用中心</div>
            <div class="hero-title">
              把售票、核销、渠道和会员能力装进同一个工作台
            </div>
            <div class="hero-desc">
              面向景区、游客中心和多门店经营场景，按需开通渠道直连、核销、年卡、电子发票和经营分析能力。
            </div>
            <div class="hero-actions">
              <ElButton
                type="primary"
                @click="goTo('ApplicationCenterProductList')"
              >
                查看可开通应用
              </ElButton>
              <ElButton @click="goTo('ApplicationCenterAppManagement')">
                查看我的应用
              </ElButton>
            </div>
          </section>

          <section class="my-apps-panel">
            <div class="panel-title-row">
              <div class="panel-title">我的应用</div>
              <ElButton
                link
                type="primary"
                @click="goTo('ApplicationCenterAppManagement')"
              >
                查看全部
              </ElButton>
            </div>
            <div class="owned-list">
              <div
                v-for="app in homeOwnedApps"
                :key="app.id"
                class="owned-item"
              >
                <div>
                  <div class="owned-name">{{ app.name }}</div>
                  <div class="owned-date">
                    {{ app.startAt ?? '未开通' }} 至 {{ app.endAt ?? '待开通' }}
                  </div>
                  <ElButton size="small">续费</ElButton>
                </div>
                <ElTag :type="getStatusTagType(app.status)">
                  {{ app.status }}
                </ElTag>
              </div>
            </div>
          </section>

          <aside class="summary-panel">
            <div class="summary-card">
              <div class="summary-label">支付账户余额</div>
              <div class="summary-balance">{{ balance }}</div>
              <div class="summary-links">查看适用商品 | 查看明细</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">当前版本</div>
              <div class="summary-title">票务专业版</div>
              <div class="summary-text">可叠加渠道、AI、设备和会员能力。</div>
            </div>
          </aside>
        </div>

        <section
          v-for="group in categoryGroups"
          :key="group.category"
          class="category-section"
        >
          <div class="category-band">
            <div class="category-title">{{ group.category }}</div>
            <ElButton size="small" @click="goToCategory(group.category)">
              查看全部
            </ElButton>
          </div>
          <div class="category-grid">
            <article
              v-for="app in group.items.slice(0, 4)"
              :key="app.id"
              class="app-card is-flat"
            >
              <div class="app-card-main">
                <div class="app-name">{{ app.name }}</div>
                <div class="tag-row">
                  <ElTag
                    v-for="tag in app.tags.slice(0, 2)"
                    :key="tag"
                    size="small"
                  >
                    {{ tag }}
                  </ElTag>
                </div>
                <div class="app-desc">{{ app.description }}</div>
                <div class="provider">{{ app.provider }}</div>
              </div>
              <ElButton size="small" type="primary" plain>
                {{ app.price }}
              </ElButton>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="currentView === 'productList'">
        <div class="list-toolbar">
          <ElTabs v-model="activeCategory">
            <ElTabPane
              v-for="category in categories"
              :key="category"
              :label="category"
              :name="category"
            />
          </ElTabs>
          <ElInput
            v-model="productKeyword"
            class="search-input"
            clearable
            placeholder="请输入您需要的应用"
          />
        </div>

        <div class="product-grid">
          <article v-for="app in productList" :key="app.id" class="app-card">
            <div class="app-card-main">
              <div class="app-name">{{ app.name }}</div>
              <div class="tag-row">
                <ElTag
                  v-for="tag in app.tags.slice(0, 2)"
                  :key="tag"
                  size="small"
                >
                  {{ tag }}
                </ElTag>
              </div>
              <div class="app-desc">{{ app.description }}</div>
              <div class="provider">{{ app.provider }}</div>
            </div>
            <div class="card-bottom">
              <ElTag v-if="app.status === '使用中'" type="success">
使用中
</ElTag>
              <ElButton type="primary" plain>
                {{ app.price }}
              </ElButton>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="currentView === 'appManagement'">
        <ElTabs v-model="activeAppStatus">
          <ElTabPane label="使用中" name="使用中" />
          <ElTabPane label="已过期" name="已过期" />
          <ElTabPane label="全部应用" name="全部应用" />
        </ElTabs>
        <div class="result-count">找到{{ managedApps.length }}个应用</div>
        <div class="managed-grid">
          <article
            v-for="app in managedApps"
            :key="app.id"
            class="managed-card"
          >
            <div>
              <div class="app-name">{{ app.name }}</div>
              <div class="owned-date">
                {{ app.startAt ?? '未开通' }} 至 {{ app.endAt ?? '待开通' }}
              </div>
              <ElButton size="small">
                {{ getActionText(app) }}
              </ElButton>
            </div>
            <ElTag :type="getStatusTagType(app.status)">
              {{ app.status }}
            </ElTag>
          </article>
        </div>
      </template>

      <template v-else>
        <div class="order-filter">
          <ElInput
            v-model="orderKeyword"
            class="order-search"
            clearable
            placeholder="搜索订单编号、应用名称"
          />
          <ElDatePicker
            v-model="orderDateRange"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
          <ElSelect v-model="orderStatus" clearable placeholder="订单状态">
            <ElOption label="已支付" value="已支付" />
            <ElOption label="已开通" value="已开通" />
            <ElOption label="已退款" value="已退款" />
          </ElSelect>
          <ElSelect v-model="orderType" clearable placeholder="商品类型">
            <ElOption
              v-for="category in categories.filter(
                (item) => item !== '全部应用',
              )"
              :key="category"
              :label="category"
              :value="category"
            />
          </ElSelect>
        </div>

        <ElTable :data="orderList" empty-text="暂无数据" stripe>
          <ElTable.TableColumn
            label="商品信息"
            prop="productName"
            min-width="180"
          />
          <ElTable.TableColumn
            label="商品类型"
            prop="productType"
            min-width="120"
          />
          <ElTable.TableColumn label="商品单价" prop="amount" min-width="120" />
          <ElTable.TableColumn label="数量" prop="quantity" min-width="80" />
          <ElTable.TableColumn label="订单金额" prop="amount" min-width="120" />
          <ElTable.TableColumn
            label="买家实付"
            prop="received"
            min-width="120"
          />
          <ElTable.TableColumn
            label="退款金额"
            prop="refundAmount"
            min-width="120"
          />
          <ElTable.TableColumn label="订单状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getStatusTagType(row.status)">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTable.TableColumn>
          <ElTable.TableColumn label="收件信息" prop="buyer" min-width="150" />
          <ElTable.TableColumn label="操作" fixed="right" min-width="120">
            <template #default>
              <ElButton link type="primary">查看</ElButton>
            </template>
          </ElTable.TableColumn>
        </ElTable>
        <ElEmpty v-if="orderList.length === 0" description="暂无数据" />
      </template>
    </div>
  </Page>
</template>

<style scoped>
.application-center {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-layout {
  display: grid;
  grid-template-columns: 330px minmax(420px, 1fr) 260px;
  gap: 16px;
}

.hero-panel,
.my-apps-panel,
.summary-card,
.category-section,
.app-card,
.managed-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.hero-panel {
  min-height: 230px;
  padding: 28px;
  background: #f3f7ff;
}

.hero-kicker {
  color: #145cff;
  font-size: 13px;
  font-weight: 600;
}

.hero-title {
  margin-top: 18px;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
}

.hero-desc {
  margin-top: 16px;
  color: #475467;
  font-size: 14px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

.my-apps-panel {
  padding: 16px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  font-weight: 700;
}

.owned-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.owned-item,
.managed-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 88px;
  padding: 14px;
  border-radius: 8px;
  background: #f5f7fb;
}

.owned-name,
.app-name {
  color: #111827;
  font-weight: 700;
}

.owned-date,
.provider {
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
}

.summary-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-card {
  padding: 16px;
}

.summary-label {
  color: #344054;
  font-weight: 600;
}

.summary-balance {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
}

.summary-links,
.summary-text {
  margin-top: 10px;
  color: #667085;
  font-size: 13px;
}

.summary-title {
  margin-top: 10px;
  font-size: 18px;
  font-weight: 700;
}

.category-section {
  display: grid;
  grid-template-columns: 170px 1fr;
  overflow: hidden;
}

.category-band {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px 20px;
  background: #f7f8fb;
}

.category-title {
  color: #145cff;
  font-size: 20px;
  font-weight: 700;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.app-card {
  display: flex;
  justify-content: space-between;
  min-height: 130px;
  padding: 18px;
  border-top: 0;
  border-right: 0;
  border-bottom: 0;
  border-radius: 0;
}

.app-card.is-flat {
  border-left-color: var(--el-border-color-lighter);
}

.app-card-main {
  min-width: 0;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.app-desc {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 10px;
  color: #475467;
  font-size: 13px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.list-toolbar {
  padding: 0 4px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.search-input {
  width: 360px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.product-grid .app-card {
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.result-count {
  color: #344054;
  font-size: 14px;
}

.managed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.order-filter {
  display: grid;
  grid-template-columns:
    minmax(260px, 1.4fr) minmax(320px, 1fr) minmax(180px, 0.7fr)
    minmax(180px, 0.7fr);
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
}

.order-search,
.order-filter :deep(.el-select),
.order-filter :deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 1200px) {
  .home-layout {
    grid-template-columns: 1fr;
  }

  .category-section {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }

  .order-filter {
    grid-template-columns: 1fr;
  }
}
</style>
