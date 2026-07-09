<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

interface MeteredResource {
  billingMethod: string;
  id: string;
  name: string;
  pointCost: number;
  scenario: string;
  unit: string;
  updatedAt: string;
}

interface PointPackage {
  id: string;
  points: number;
  price: number;
}

interface ResourceFormState {
  billingMethod: string;
  name: string;
  pointCost: number;
  unit: string;
}

interface PackageFormState {
  points: number;
  price: number;
}

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title ?? '资源管理'));
const resourceKeyword = ref('');
const maintainVisible = ref(false);
const packageVisible = ref(false);
const activeResourceId = ref('');
const resources = ref<MeteredResource[]>([
  {
    billingMethod: '每条短信扣 1 麦点',
    id: 'RES-SMS',
    name: '短信通知',
    pointCost: 1,
    scenario: '订单通知、核销提醒、退款通知',
    unit: '条短信',
    updatedAt: '2026-07-10 09:30',
  },
  {
    billingMethod: '每次营销生成扣 20 麦点',
    id: 'RES-AI-MARKETING',
    name: 'AI营销',
    pointCost: 20,
    scenario: '活动方案、客群营销、复购唤醒',
    unit: '次营销生成',
    updatedAt: '2026-07-10 09:32',
  },
  {
    billingMethod: '每篇文案扣 5 麦点',
    id: 'RES-AI-COPY',
    name: 'AI文案',
    pointCost: 5,
    scenario: '门票卖点、套票介绍、渠道推广文案',
    unit: '篇文案',
    updatedAt: '2026-07-10 09:34',
  },
  {
    billingMethod: '每次预测扣 30 麦点',
    id: 'RES-AI-FLOW',
    name: '智能客流预测',
    pointCost: 30,
    scenario: '节假日客流、预约容量、闸机压力预测',
    unit: '次预测',
    updatedAt: '2026-07-10 09:36',
  },
  {
    billingMethod: '每张发票扣 2 麦点',
    id: 'RES-INVOICE',
    name: '电子发票',
    pointCost: 2,
    scenario: '游客开票、企业开票、发票状态回传',
    unit: '张发票',
    updatedAt: '2026-07-10 09:38',
  },
  {
    billingMethod: '每次同步扣 1 麦点',
    id: 'RES-CHANNEL-SYNC',
    name: '渠道订单同步',
    pointCost: 1,
    scenario: '美团、携程、抖音订单同步和状态回传',
    unit: '次同步',
    updatedAt: '2026-07-10 09:40',
  },
  {
    billingMethod: '每次分析扣 10 麦点',
    id: 'RES-DATA',
    name: '经营数据分析',
    pointCost: 10,
    scenario: '门票、核销、渠道、会员和二消数据分析',
    unit: '次分析',
    updatedAt: '2026-07-10 09:42',
  },
  {
    billingMethod: '每段讲解扣 8 麦点',
    id: 'RES-GUIDE-AUDIO',
    name: '语音讲解生成',
    pointCost: 8,
    scenario: '景点导览、活动介绍、游线讲解',
    unit: '段讲解',
    updatedAt: '2026-07-10 09:44',
  },
]);

const pointPackages = ref<PointPackage[]>([
  {
    id: 'PKG-100',
    points: 1000,
    price: 100,
  },
  {
    id: 'PKG-1000',
    points: 11_000,
    price: 1000,
  },
]);

const resourceForm = reactive<ResourceFormState>({
  billingMethod: '',
  name: '',
  pointCost: 1,
  unit: '',
});

const packageForm = reactive<PackageFormState>({
  points: 1000,
  price: 100,
});

const activeResource = computed(
  () =>
    resources.value.find((item) => item.id === activeResourceId.value) ?? null,
);
const filteredResources = computed(() => {
  const keyword = resourceKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return resources.value;
  }
  return resources.value.filter(
    (item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.billingMethod.toLowerCase().includes(keyword) ||
      item.scenario.toLowerCase().includes(keyword),
  );
});

function getNowText() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function buildBillingMethod(unit: string, pointCost: number) {
  return `每${unit}扣 ${pointCost} 麦点`;
}

function openMaintain(row: Record<string, any>) {
  const resource = row as MeteredResource;
  activeResourceId.value = resource.id;
  Object.assign(resourceForm, {
    billingMethod: resource.billingMethod,
    name: resource.name,
    pointCost: resource.pointCost,
    unit: resource.unit,
  });
  maintainVisible.value = true;
}

function saveResource() {
  if (!activeResource.value) {
    return;
  }
  if (!resourceForm.unit.trim()) {
    ElMessage.warning('请填写计费单位');
    return;
  }
  activeResource.value.unit = resourceForm.unit.trim();
  activeResource.value.pointCost = resourceForm.pointCost;
  activeResource.value.billingMethod = buildBillingMethod(
    activeResource.value.unit,
    activeResource.value.pointCost,
  );
  activeResource.value.updatedAt = getNowText();
  maintainVisible.value = false;
  ElMessage.success('计费方式已更新');
}

function openPackageDialog() {
  Object.assign(packageForm, {
    points: 1000,
    price: 100,
  });
  packageVisible.value = true;
}

function addPackage() {
  if (packageForm.price <= 0 || packageForm.points <= 0) {
    ElMessage.warning('售价和麦点数量必须大于 0');
    return;
  }
  pointPackages.value.push({
    id: `PKG-${Date.now()}`,
    points: packageForm.points,
    price: packageForm.price,
  });
  packageVisible.value = false;
  ElMessage.success('麦点资源包已添加');
}

function removePackage(id: string) {
  pointPackages.value = pointPackages.value.filter((item) => item.id !== id);
}
</script>

<template>
  <Page
    description="维护按量付费资源的麦点计费方式和麦点资源包售价。"
    :title="pageTitle"
  >
    <div class="resource-management">
      <section class="filter-panel">
        <div class="filter-row">
          <ElInput
            v-model="resourceKeyword"
            class="resource-search"
            clearable
            placeholder="搜索应用名称、计费方式或使用场景"
          />
          <ElButton type="primary" @click="openPackageDialog">
            新增麦点资源包
          </ElButton>
        </div>

        <div class="package-row">
          <div
            v-for="item in pointPackages"
            :key="item.id"
            class="package-card"
          >
            <div>
              <div class="package-title">{{ item.price }} 元</div>
              <div class="package-desc">{{ item.points }} 麦点</div>
            </div>
            <ElButton link type="danger" @click="removePackage(item.id)">
              删除
            </ElButton>
          </div>
        </div>
      </section>

      <section class="table-panel">
        <div class="table-title-row">
          <div>
            <div class="section-title">按量资源计费</div>
            <div class="section-desc">
              资源管理销售的是按量扣减的麦点，不按时间周期计费。
            </div>
          </div>
          <ElTag type="success">麦点计费</ElTag>
        </div>

        <ElTable :data="filteredResources" size="small" stripe>
          <ElTable.TableColumn label="名称" min-width="180" prop="name">
            <template #default="{ row }">
              <div class="resource-name">{{ row.name }}</div>
              <div class="resource-scenario">{{ row.scenario }}</div>
            </template>
          </ElTable.TableColumn>
          <ElTable.TableColumn
            label="计费方式"
            min-width="220"
            prop="billingMethod"
          />
          <ElTable.TableColumn
            label="更新时间"
            min-width="150"
            prop="updatedAt"
          />
          <ElTable.TableColumn label="操作" fixed="right" min-width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="openMaintain(row)">
                维护
              </ElButton>
            </template>
          </ElTable.TableColumn>
        </ElTable>
      </section>

      <ElDialog v-model="maintainVisible" title="维护计费方式" width="520px">
        <ElForm label-position="top">
          <ElFormItem label="应用名称">
            <ElInput v-model="resourceForm.name" disabled />
          </ElFormItem>
          <ElFormItem label="计费单位">
            <ElInput
              v-model="resourceForm.unit"
              placeholder="例如：条短信、篇文案、次预测"
            />
          </ElFormItem>
          <ElFormItem label="扣减麦点">
            <ElInputNumber
              v-model="resourceForm.pointCost"
              :min="1"
              :precision="0"
              class="full-width"
            />
          </ElFormItem>
          <ElFormItem label="计费方式预览">
            <ElInput
              :model-value="
                buildBillingMethod(
                  resourceForm.unit || '计费单位',
                  resourceForm.pointCost,
                )
              "
              disabled
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElSpace>
            <ElButton @click="maintainVisible = false">取消</ElButton>
            <ElButton type="primary" @click="saveResource">保存</ElButton>
          </ElSpace>
        </template>
      </ElDialog>

      <ElDialog v-model="packageVisible" title="新增麦点资源包" width="480px">
        <ElForm label-position="top">
          <ElFormItem label="售价（元）">
            <ElInputNumber
              v-model="packageForm.price"
              :min="1"
              :precision="0"
              class="full-width"
            />
          </ElFormItem>
          <ElFormItem label="麦点数量">
            <ElInputNumber
              v-model="packageForm.points"
              :min="1"
              :precision="0"
              class="full-width"
            />
          </ElFormItem>
          <ElFormItem label="套餐预览">
            <ElInput
              :model-value="`${packageForm.price} 元 ${packageForm.points} 麦点`"
              disabled
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElSpace>
            <ElButton @click="packageVisible = false">取消</ElButton>
            <ElButton type="primary" @click="addPackage">添加</ElButton>
          </ElSpace>
        </template>
      </ElDialog>
    </div>
  </Page>
</template>

<style scoped>
.resource-management {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-panel,
.table-panel {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.filter-row,
.table-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resource-search {
  max-width: 420px;
}

.package-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.package-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: #f7f8fb;
}

.package-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.package-desc,
.resource-scenario,
.section-desc {
  margin-top: 4px;
  color: #667085;
  font-size: 13px;
}

.section-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.resource-name {
  color: #111827;
  font-weight: 600;
}

.full-width {
  width: 100%;
}

@media (max-width: 768px) {
  .filter-row,
  .table-title-row {
    align-items: stretch;
    flex-direction: column;
  }

  .resource-search {
    max-width: none;
    width: 100%;
  }
}
</style>
