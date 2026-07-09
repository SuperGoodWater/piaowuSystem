<script lang="ts" setup>
import type { StoreRecord } from '#/views/saas/customer-management/store-management-data';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { setSelectedStore } from '#/router/helpers/store-selection';
import { storeManagementSampleData } from '#/views/saas/customer-management/store-management-data';

type StoreCategory = string;
type CreateStep = 'form' | 'list' | 'type' | 'version';

interface StoreTypeOption {
  description: string;
  formType: string;
  label: string;
  note?: string;
  value: string;
}

interface StoreVersionOption {
  badge?: string;
  features: string[];
  price: string;
  scene: string;
  subtitle: string;
  title: string;
}

const router = useRouter();
const activeCategory = ref<StoreCategory>('全部');
const createStep = ref<CreateStep>('list');
const keyword = ref('');
const currentPhone = '+86-18973195600';
const selectedStoreType = ref<null | StoreTypeOption>(null);
const selectedVersion = ref<null | StoreVersionOption>(null);
const createdStores = ref<StoreRecord[]>([]);
const createForm = reactive({
  address: '',
  businessType: '酒店',
  contactPhone: '18973195600',
  detailAddress: '',
  inviteCode: '',
  region: '',
  storeName: '',
});

const stores = computed(() => [
  ...createdStores.value,
  ...storeManagementSampleData,
]);

const storeTypeOptions: StoreTypeOption[] = [
  {
    description: '高效管理门店，提升经营效率',
    formType: 'PMS',
    label: 'PMS',
    value: 'PMS',
  },
  {
    description: '多渠道高效分发，助力销售增长',
    formType: '营销门店',
    label: '营销系统',
    value: '营销系统',
  },
  {
    description: '多门店集中管理，适合连锁经营',
    formType: '集团门店',
    label: '集团版',
    note: '请先创建 PMS 或营销系统后再使用集团版',
    value: '集团门店',
  },
];

const versionOptions: StoreVersionOption[] = [
  {
    features: ['住宿管理', '订单管理', '客户管理', '基础统计报表', '在线客服'],
    price: '免费使用',
    scene: '适合中小型门店、单店经营，满足基础经营需求。',
    subtitle: '简单易用，快速上手',
    title: '基础版',
  },
  {
    badge: '免费试用',
    features: [
      '专业住宿管理',
      '订单管理',
      '会员/会员卡',
      '优惠券',
      '多业态管理',
      'OTA 渠道',
      '营销系统',
      '专属客服',
    ],
    price: '¥3998 / 年起',
    scene: '适合多种类型门店，覆盖订单、会员、渠道和营销协同。',
    subtitle: '功能齐全，专业好用',
    title: '专业版',
  },
  {
    badge: '免费试用',
    features: [
      '高级统计报表',
      'AR 账户',
      '夜审固化',
      '前台交接班',
      '多终端',
      '智能门锁对接',
      '智能房卡对接',
      '企业客户',
    ],
    price: '¥2000 + ¥100 / 间/年',
    scene: '适合连锁经营和精细化运营，强化财务、报表和多系统对接。',
    subtitle: '便捷高效，精细管理',
    title: '商务版',
  },
];

const businessTypeOptions = ['酒店', '景区', '零售', '餐饮', '综合门店'];
const regionOptions = [
  '广东省深圳市',
  '上海市浦东新区',
  '北京市朝阳区',
  '浙江省杭州市',
];

const categories = computed<StoreCategory[]>(() => [
  '全部',
  ...new Set(stores.value.map((item) => item.storeType)),
]);

const filteredStores = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  return stores.value.filter((item) => {
    const matchesCategory =
      activeCategory.value === '全部' ||
      item.storeType === activeCategory.value;
    const matchesKeyword =
      !value ||
      item.managerPhone.toLowerCase().includes(value) ||
      item.storeCode.toLowerCase().includes(value) ||
      item.storeName.toLowerCase().includes(value) ||
      item.storeType.toLowerCase().includes(value) ||
      item.tenantName.toLowerCase().includes(value);

    return matchesCategory && matchesKeyword;
  });
});

async function selectStore(store: StoreRecord) {
  setSelectedStore({
    id: store.id,
    name: store.storeName,
    type: store.storeType,
  });
  ElMessage.success(`已选择门店：${store.storeName}`);
  await router.replace('/home/workspace');
}

function handleCreateStore() {
  createStep.value = 'type';
}

function backToList() {
  createStep.value = 'list';
}

function chooseStoreType(option: StoreTypeOption) {
  selectedStoreType.value = option;
  selectedVersion.value = null;
  createForm.businessType = option.formType;
  createStep.value = 'version';
}

function chooseVersion(option: StoreVersionOption) {
  selectedVersion.value = option;
  createStep.value = 'form';
}

function backToTypeSelect() {
  createStep.value = 'type';
}

function backToVersionSelect() {
  createStep.value = 'version';
}

function getNewStoreCode() {
  const maxNumber = stores.value.reduce((max, item) => {
    const match = item.storeCode.match(/^ST(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `ST${String(maxNumber + 1).padStart(4, '0')}`;
}

function submitCreateStore() {
  if (
    !selectedStoreType.value ||
    !selectedVersion.value ||
    !createForm.storeName.trim() ||
    !createForm.region ||
    !createForm.detailAddress.trim()
  ) {
    ElMessage.warning('请先填写完整的门店信息');
    return;
  }

  const now = new Date();
  const storeName = createForm.storeName.trim();
  const newStore: StoreRecord = {
    address: createForm.region,
    authorizationExpireAt: '2099-12-31',
    createdAt: now.toISOString().slice(0, 16).replace('T', ' '),
    detailAddress: createForm.detailAddress.trim(),
    id: `store-created-${now.getTime()}`,
    managerPhone: createForm.contactPhone,
    managerUsername: createForm.contactPhone,
    payRate: '0.60%',
    status: '启用',
    storeCode: getNewStoreCode(),
    storeName,
    storeType: selectedStoreType.value.value,
    tenantName: '星河票务集团',
    version: selectedVersion.value.title,
  };

  createdStores.value.unshift(newStore);
  activeCategory.value = newStore.storeType;
  keyword.value = '';
  createForm.storeName = '';
  createForm.region = '';
  createForm.detailAddress = '';
  createForm.inviteCode = '';
  createStep.value = 'list';
  ElMessage.success(`已创建门店：${storeName}`);
}
</script>

<template>
  <div class="store-select-page">
    <div v-if="createStep === 'list'" class="store-select-inner">
      <div class="account-line">
        {{ currentPhone }}
      </div>

      <div class="toolbar">
        <div class="category-tabs">
          <button
            v-for="category in categories"
            :key="category"
            class="category-tab"
            :class="{ active: activeCategory === category }"
            type="button"
            @click="activeCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <div class="toolbar-actions">
          <ElInput
            v-model="keyword"
            class="search-input"
            clearable
            placeholder="搜索名称"
          />
          <ElButton type="primary" @click="handleCreateStore">
            创建门店
          </ElButton>
        </div>
      </div>

      <div class="store-grid">
        <button
          v-for="store in filteredStores"
          :key="store.id"
          class="store-card"
          type="button"
          @click="selectStore(store)"
        >
          <div class="card-top">
            <div class="type-line">
              <span>{{ store.storeType }}</span>
            </div>
            <ElTag
              :effect="store.storeType === '集团门店' ? 'dark' : 'plain'"
              type="info"
            >
              {{ store.version }}
            </ElTag>
          </div>

          <div class="store-name">
            {{ store.storeName }}
          </div>
          <div class="expire-line">
            有效期至：{{ store.authorizationExpireAt }}
          </div>
        </button>
      </div>
    </div>

    <div v-else class="create-store-page">
      <div class="create-header">
        <ElButton text @click="backToList">返回门店列表</ElButton>
        <div class="create-steps">
          <span :class="{ active: createStep === 'type' }">选择门店类型</span>
          <span :class="{ active: createStep === 'version' }">选择门店版本</span>
          <span :class="{ active: createStep === 'form' }">输入门店信息</span>
        </div>
      </div>

      <div v-if="createStep === 'type'" class="store-type-stage">
        <button
          v-for="option in storeTypeOptions"
          :key="option.value"
          class="create-type-card"
          type="button"
          @click="chooseStoreType(option)"
        >
          <div class="type-illustration" :class="`is-${option.label}`">
            <span class="window-dot"></span>
            <span class="window-dot"></span>
            <span class="window-dot"></span>
            <span class="mock-line"></span>
            <span class="mock-line short"></span>
            <span class="mock-block"></span>
          </div>
          <div class="create-type-title">{{ option.label }}</div>
          <div class="create-type-desc">{{ option.description }}</div>
          <div v-if="option.note" class="create-type-note">
            {{ option.note }}
          </div>
        </button>
      </div>

      <div v-else-if="createStep === 'version'" class="version-stage">
        <button
          v-for="version in versionOptions"
          :key="version.title"
          class="version-card"
          type="button"
          @click="chooseVersion(version)"
        >
          <span v-if="version.badge" class="version-badge">
            {{ version.badge }}
          </span>
          <div class="version-title">{{ version.title }}</div>
          <div class="version-subtitle">{{ version.subtitle }}</div>
          <div class="version-divider"></div>
          <div class="version-price">{{ version.price }}</div>
          <div class="feature-list">
            <span v-for="feature in version.features" :key="feature">
              {{ feature }}
            </span>
          </div>
          <div class="scene-title">适用场景</div>
          <div class="scene-desc">{{ version.scene }}</div>
        </button>
      </div>

      <div v-else class="store-form-stage">
        <div class="store-form-card">
          <div class="form-ribbon">
            {{ selectedStoreType?.label }}
          </div>
          <div class="form-title">创建门店</div>
          <div class="form-version">
            {{ selectedVersion?.title }} · {{ selectedVersion?.price }}
          </div>

          <ElForm class="create-store-form" label-width="86px">
            <ElFormItem required label="门店名称">
              <ElInput
                v-model="createForm.storeName"
                placeholder="请输入门店名称"
              />
            </ElFormItem>
            <ElFormItem required label="门店类型">
              <ElSelect v-model="createForm.businessType">
                <ElOption
                  v-for="item in businessTypeOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem required label="门店地址">
              <ElSelect v-model="createForm.region" placeholder="请选择省市区">
                <ElOption
                  v-for="item in regionOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="详细地址">
              <ElInput
                v-model="createForm.detailAddress"
                placeholder="请输入详细地址"
              />
            </ElFormItem>
            <ElFormItem label="联系人">
              <ElInput v-model="createForm.contactPhone" />
            </ElFormItem>
            <ElFormItem label="邀请码">
              <ElInput
                v-model="createForm.inviteCode"
                placeholder="请输入邀请码（选填）"
              />
            </ElFormItem>
          </ElForm>

          <div class="form-actions">
            <ElButton @click="backToVersionSelect">上一步</ElButton>
            <ElButton type="primary" @click="submitCreateStore">
              创建门店
            </ElButton>
          </div>
        </div>
      </div>

      <div v-if="createStep === 'version'" class="create-footer">
        <ElButton @click="backToTypeSelect">上一步</ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.store-select-page {
  min-height: 100vh;
  background: #f1f3f7;
  color: #101828;
}

.store-select-inner {
  width: min(1200px, calc(100vw - 72px));
  margin: 0 auto;
  padding: 48px 0;
}

.account-line {
  margin-bottom: 26px;
  color: #344054;
  font-size: 14px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.category-tabs {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #d8dee8;
  background: #fff;
  border-radius: 8px;
}

.category-tab {
  min-width: 52px;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-right: 1px solid #d8dee8;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
}

.category-tab:last-child {
  border-right: 0;
}

.category-tab.active {
  color: #145cff;
  box-shadow: inset 0 0 0 1px #145cff;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.search-input {
  width: 300px;
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.store-card {
  min-height: 124px;
  padding: 18px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.store-card:hover {
  border-color: #145cff;
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.type-line {
  display: inline-flex;
  align-items: center;
  color: #111827;
  font-size: 14px;
}

.store-name {
  margin-top: 18px;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.expire-line {
  margin-top: 10px;
  color: #344054;
  font-size: 13px;
}

.create-store-page {
  width: min(1260px, calc(100vw - 72px));
  margin: 0 auto;
  padding: 44px 0 64px;
}

.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.create-steps {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #fff;
}

.create-steps span {
  min-width: 132px;
  padding: 9px 16px;
  border-right: 1px solid #d8dee8;
  color: #667085;
  font-size: 13px;
  text-align: center;
}

.create-steps span:last-child {
  border-right: 0;
}

.create-steps .active {
  color: #145cff;
  box-shadow: inset 0 0 0 1px #145cff;
}

.store-type-stage {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 276px));
  justify-content: center;
  gap: 32px;
  min-height: 520px;
  padding-top: 46px;
}

.create-type-card {
  height: 446px;
  padding: 72px 26px 34px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.create-type-card:hover {
  border-color: #145cff;
  box-shadow: 0 14px 32px rgba(16, 24, 40, 0.08);
  transform: translateY(-2px);
}

.type-illustration {
  position: relative;
  width: 160px;
  height: 118px;
  margin: 18px auto 62px;
  border: 5px solid #edf1f8;
  border-radius: 14px;
  background: #fbfcff;
}

.window-dot {
  position: relative;
  top: 10px;
  left: -50px;
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 5px;
  border-radius: 50%;
  background: #ff655c;
}

.window-dot:nth-child(2) {
  background: #ffb83d;
}

.window-dot:nth-child(3) {
  background: #31c95d;
}

.mock-line {
  position: absolute;
  top: 38px;
  left: 18px;
  width: 74px;
  height: 8px;
  border-radius: 2px;
  background: #2f6bff;
}

.mock-line.short {
  top: 57px;
  width: 58px;
}

.mock-block {
  position: absolute;
  right: -24px;
  bottom: -18px;
  width: 74px;
  height: 70px;
  border-radius: 7px;
  background: #2f6bff;
  box-shadow: inset 0 16px #f1f5ff;
}

.type-illustration.is-营销系统 .mock-line,
.type-illustration.is-营销系统 .mock-line.short {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff6a2a;
}

.type-illustration.is-营销系统 .mock-line {
  top: 66px;
  left: 22px;
}

.type-illustration.is-营销系统 .mock-line.short {
  top: 38px;
  left: 52px;
}

.type-illustration.is-营销系统 .mock-block {
  right: -30px;
  bottom: -15px;
  width: 50px;
  height: 70px;
  border-radius: 4px 20px 4px 4px;
  background: #ff6a2a;
  box-shadow: 32px 0 0 #ff6a2a;
}

.type-illustration.is-集团版 .mock-line {
  background: #ffc928;
}

.type-illustration.is-集团版 .mock-line.short {
  width: 86px;
  background: #ffe391;
}

.type-illustration.is-集团版 .mock-block {
  background: #ffc928;
  box-shadow: inset 18px 0 #fff0b3;
}

.create-type-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
}

.create-type-desc {
  margin-top: 18px;
  color: #667085;
  font-size: 14px;
}

.create-type-note {
  width: 170px;
  margin: 40px auto 0;
  color: #8a94a6;
  font-size: 13px;
  line-height: 1.55;
}

.version-stage {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 380px));
  justify-content: center;
  gap: 40px;
}

.version-card {
  position: relative;
  min-height: 710px;
  padding: 32px 20px 28px;
  border: 1px solid #e8edf5;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(16, 24, 40, 0.06);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.version-card:hover {
  border-color: #145cff;
  transform: translateY(-2px);
}

.version-badge {
  position: absolute;
  top: -8px;
  right: 0;
  padding: 7px 18px;
  border-radius: 0 8px 0 8px;
  background: #ff4d2d;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.version-title,
.version-subtitle,
.version-price {
  text-align: center;
}

.version-title {
  font-size: 28px;
  font-weight: 800;
}

.version-subtitle {
  margin-top: 14px;
  font-size: 16px;
}

.version-divider {
  width: 32px;
  height: 4px;
  margin: 16px auto 28px;
  border-radius: 4px;
  background: #145cff;
}

.version-price {
  min-height: 42px;
  color: #1246c8;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.1;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 18px;
  margin-top: 34px;
  padding-top: 24px;
  border-top: 1px dashed #d8dee8;
  color: #344054;
  font-size: 13px;
  line-height: 1.35;
}

.scene-title {
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px dashed #d8dee8;
  color: #667085;
  text-align: center;
}

.scene-desc {
  margin-top: 22px;
  color: #344054;
  font-size: 14px;
  line-height: 1.75;
}

.create-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.store-form-stage {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

.store-form-card {
  position: relative;
  width: min(438px, calc(100vw - 40px));
  min-height: 576px;
  padding: 70px 40px 52px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 34px rgba(16, 24, 40, 0.08);
}

.form-ribbon {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 122px;
  padding: 12px 24px;
  border-radius: 8px 0 0 0;
  background: linear-gradient(105deg, #145cff 0%, #145cff 82%, transparent 83%);
  color: #fff;
  font-size: 20px;
}

.form-title {
  color: #1f2937;
  font-size: 28px;
  font-weight: 800;
  text-align: center;
}

.form-version {
  margin-top: 10px;
  color: #667085;
  text-align: center;
}

.create-store-form {
  margin-top: 30px;
}

.create-store-form :deep(.el-select) {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 44px;
}

.form-actions .el-button--primary {
  min-width: 160px;
}

@media (max-width: 1100px) {
  .store-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .store-type-stage,
  .version-stage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .store-select-inner {
    width: min(100vw - 32px, 560px);
    padding: 28px 0;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .category-tabs {
    overflow-x: auto;
    width: 100%;
  }

  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .store-grid {
    grid-template-columns: 1fr;
  }

  .create-store-page {
    width: min(100vw - 32px, 560px);
    padding: 24px 0 44px;
  }

  .create-header {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .create-steps {
    display: grid;
    grid-template-columns: 1fr;
  }

  .create-steps span {
    border-right: 0;
    border-bottom: 1px solid #d8dee8;
  }

  .create-steps span:last-child {
    border-bottom: 0;
  }

  .store-type-stage,
  .version-stage {
    grid-template-columns: 1fr;
    gap: 18px;
    padding-top: 12px;
  }

  .create-type-card,
  .version-card {
    min-height: auto;
    height: auto;
  }

  .store-form-card {
    padding: 70px 22px 36px;
  }
}
</style>
