<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

interface StoreColumnItem {
  key: keyof GroupStoreRecord;
  label: string;
  minWidth?: number;
}

type StoreFundParty = '门店' | '集团';

interface GroupStoreRecord {
  adminPhone: string;
  address: string;
  fundReceiver: StoreFundParty;
  group: string;
  id: string;
  memberOwnership: StoreFundParty;
  name: string;
  serviceFeePayer: StoreFundParty;
  type: string;
}

const storeTypeOptions = [
  { label: '直营网点', value: '直营网点' },
  { label: '加盟门店', value: '加盟门店' },
  { label: '游客中心', value: '游客中心' },
] as const;

const storeGroupOptions = [
  { label: '华东大区', value: '华东大区' },
  { label: '华南大区', value: '华南大区' },
  { label: '景区直营组', value: '景区直营组' },
  { label: '城市合作组', value: '城市合作组' },
] as const;

const fundPartyOptions = [
  { label: '集团', value: '集团' },
  { label: '门店', value: '门店' },
] as const;

const columns: StoreColumnItem[] = [
  { key: 'id', label: '门店ID', minWidth: 130 },
  { key: 'name', label: '门店名称', minWidth: 180 },
  { key: 'type', label: '门店类型', minWidth: 130 },
  { key: 'group', label: '门店分组', minWidth: 140 },
  { key: 'adminPhone', label: '管理员电话', minWidth: 150 },
  { key: 'address', label: '门店地址', minWidth: 240 },
  { key: 'fundReceiver', label: '资金入账方', minWidth: 130 },
  { key: 'serviceFeePayer', label: '服务费承担方', minWidth: 150 },
  { key: 'memberOwnership', label: '会员体系归属', minWidth: 150 },
];

const storeData = ref<GroupStoreRecord[]>([
  {
    adminPhone: '13800010001',
    address: '上海市浦东新区欢乐谷东入口游客服务中心',
    fundReceiver: '集团',
    group: '景区直营组',
    id: 'STORE-10001',
    memberOwnership: '集团',
    name: '欢乐谷东区店',
    serviceFeePayer: '集团',
    type: '直营网点',
  },
  {
    adminPhone: '13800010002',
    address: '上海市浦东新区欢乐谷西入口售票处',
    fundReceiver: '门店',
    group: '景区直营组',
    id: 'STORE-10002',
    memberOwnership: '集团',
    name: '欢乐谷西区店',
    serviceFeePayer: '集团',
    type: '直营网点',
  },
  {
    adminPhone: '13800020001',
    address: '深圳市南山区海岸线景区游客中心一层',
    fundReceiver: '集团',
    group: '华南大区',
    id: 'STORE-20001',
    memberOwnership: '门店',
    name: '海岸线游客中心',
    serviceFeePayer: '门店',
    type: '游客中心',
  },
  {
    adminPhone: '13800030001',
    address: '杭州市西湖区城市广场合作售票点',
    fundReceiver: '门店',
    group: '城市合作组',
    id: 'STORE-30001',
    memberOwnership: '门店',
    name: '西湖城市合作店',
    serviceFeePayer: '门店',
    type: '加盟门店',
  },
]);

const route = useRoute();
const currentPage = ref(1);
const detailVisible = ref(false);
const explanationVisible = ref(false);
const pageSize = ref(10);
const selectedStoreId = ref('');
const filterState = ref({
  fundReceiver: '',
  group: '',
  keyword: '',
  memberOwnership: '',
  serviceFeePayer: '',
  type: '',
});
const maintenanceForm = ref<
  Pick<GroupStoreRecord, 'fundReceiver' | 'memberOwnership' | 'serviceFeePayer'>
>({
  fundReceiver: '集团',
  memberOwnership: '集团',
  serviceFeePayer: '集团',
});

const pageTitle = computed(() => String(route.meta.title ?? '门店管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const selectedStore = computed(
  () =>
    storeData.value.find((item) => item.id === selectedStoreId.value) ?? null,
);
const filteredStores = computed(() => {
  const keyword = filterState.value.keyword.trim().toLowerCase();
  const type = filterState.value.type;
  const group = filterState.value.group;
  const fundReceiver = filterState.value.fundReceiver;
  const serviceFeePayer = filterState.value.serviceFeePayer;
  const memberOwnership = filterState.value.memberOwnership;

  return storeData.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      item.id.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.adminPhone.includes(keyword);
    const matchesType = !type || item.type === type;
    const matchesGroup = !group || item.group === group;
    const matchesFundReceiver =
      !fundReceiver || item.fundReceiver === fundReceiver;
    const matchesServiceFeePayer =
      !serviceFeePayer || item.serviceFeePayer === serviceFeePayer;
    const matchesMemberOwnership =
      !memberOwnership || item.memberOwnership === memberOwnership;

    return (
      matchesKeyword &&
      matchesType &&
      matchesGroup &&
      matchesFundReceiver &&
      matchesServiceFeePayer &&
      matchesMemberOwnership
    );
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredStores.value.slice(start, start + pageSize.value);
});

function getCellValue(row: GroupStoreRecord, key: keyof GroupStoreRecord) {
  return row[key] || '-';
}

function getStoreRow(row: Record<string, string>): GroupStoreRecord {
  return row as unknown as GroupStoreRecord;
}

function getFundPartyTagType(party: StoreFundParty) {
  return party === '集团' ? 'success' : 'warning';
}

function handleFilterSubmit() {
  filterState.value = {
    fundReceiver: filterState.value.fundReceiver,
    group: filterState.value.group,
    keyword: filterState.value.keyword.trim(),
    memberOwnership: filterState.value.memberOwnership,
    serviceFeePayer: filterState.value.serviceFeePayer,
    type: filterState.value.type,
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    fundReceiver: '',
    group: '',
    keyword: '',
    memberOwnership: '',
    serviceFeePayer: '',
    type: '',
  };
  currentPage.value = 1;
}

function openStoreMaintenance(row: GroupStoreRecord) {
  selectedStoreId.value = row.id;
  maintenanceForm.value = {
    fundReceiver: row.fundReceiver,
    memberOwnership: row.memberOwnership,
    serviceFeePayer: row.serviceFeePayer,
  };
  detailVisible.value = true;
}

function saveStoreMaintenance() {
  if (!selectedStore.value) return;

  storeData.value = storeData.value.map((item) =>
    item.id === selectedStore.value?.id
      ? {
          ...item,
          ...maintenanceForm.value,
        }
      : item,
  );
  ElMessage.success(`已维护门店配置：${selectedStore.value.name}`);
  detailVisible.value = false;
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page;
}
</script>

<template>
  <Page :title="pageTitle">
    <template #title>
      <div class="mb-2 flex items-center gap-3">
        <div class="text-lg font-semibold">
          {{ pageTitle }}
        </div>
        <ElButton link type="primary" @click="explanationVisible = true">
          查看说明
        </ElButton>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div class="saas-filter-panel rounded-md bg-card p-3">
        <ElForm
          class="saas-filter-form"
          :model="filterState"
          label-position="left"
          @submit.prevent="handleFilterSubmit"
        >
          <div class="saas-filter-grid">
            <ElFormItem label="门店查询">
              <ElInput
                v-model="filterState.keyword"
                clearable
                placeholder="请输入门店ID、名称或管理员电话"
              />
            </ElFormItem>

            <ElFormItem label="门店类型">
              <ElSelect
                v-model="filterState.type"
                clearable
                filterable
                placeholder="请选择门店类型"
              >
                <ElOption
                  v-for="option in storeTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="门店分组">
              <ElSelect
                v-model="filterState.group"
                clearable
                filterable
                placeholder="请选择门店分组"
              >
                <ElOption
                  v-for="option in storeGroupOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="资金入账方">
              <ElSelect
                v-model="filterState.fundReceiver"
                clearable
                placeholder="请选择资金入账方"
              >
                <ElOption
                  v-for="option in fundPartyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="服务费承担方">
              <ElSelect
                v-model="filterState.serviceFeePayer"
                clearable
                placeholder="请选择服务费承担方"
              >
                <ElOption
                  v-for="option in fundPartyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="会员体系归属">
              <ElSelect
                v-model="filterState.memberOwnership"
                clearable
                placeholder="请选择会员体系归属"
              >
                <ElOption
                  v-for="option in fundPartyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <div class="saas-filter-actions">
              <ElButton type="primary" native-type="submit">查询</ElButton>
              <ElButton @click="handleFilterReset">重置</ElButton>
            </div>
          </div>
        </ElForm>
      </div>

      <div class="saas-table-panel rounded-md bg-card p-3">
        <ElTable class="saas-data-table" :data="tableData" size="small" stripe>
          <ElTable.TableColumn
            v-for="column in columns"
            :key="column.key"
            :label="column.label"
            :min-width="column.minWidth || 150"
          >
            <template #default="{ row }">
              <ElTag
                v-if="
                  column.key === 'fundReceiver' ||
                  column.key === 'serviceFeePayer' ||
                  column.key === 'memberOwnership'
                "
                :type="getFundPartyTagType(getStoreRow(row)[column.key])"
              >
                {{ getCellValue(getStoreRow(row), column.key) }}
              </ElTag>
              <span v-else>{{
                getCellValue(getStoreRow(row), column.key)
              }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="100">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  link
                  type="primary"
                  @click="openStoreMaintenance(getStoreRow(row))"
                >
                  维护
                </ElButton>
              </ElSpace>
            </template>
          </ElTable.TableColumn>
        </ElTable>

        <div class="mt-3 flex justify-end">
          <ElPagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :total="filteredStores.length"
            @current-change="handleCurrentPageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </div>

    <ElDialog
      v-model="explanationVisible"
      :title="`${pageTitle}说明`"
      width="760px"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <span class="text-base font-medium">{{ pageTitle }}</span>
          <ElTag type="info">设置</ElTag>
          <ElTag :type="pagePriority === 'P0' ? 'danger' : 'warning'">
            {{ pagePriority }}
          </ElTag>
        </div>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="页面目标">
            集团查看并管理下属门店基础信息、资金归属、服务费承担方和会员体系归属。
          </ElDescriptionsItem>
          <ElDescriptionsItem label="展示范围">
            直接展示当前集团下属门店列表，用于查看门店归属、资金配置和会员体系接入情况。
          </ElDescriptionsItem>
          <ElDescriptionsItem label="核心字段">
            门店ID、门店名称、门店类型、门店分组、管理员电话、门店地址、资金入账方、服务费承担方、会员体系归属。
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <template #footer>
        <ElButton type="primary" @click="explanationVisible = false">
          我知道了
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="detailVisible" title="维护门店" width="760px">
      <ElDescriptions v-if="selectedStore" :column="2" border>
        <ElDescriptionsItem label="门店ID">
          {{ selectedStore.id }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="门店名称">
          {{ selectedStore.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="门店类型">
          {{ selectedStore.type }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="门店分组">
          {{ selectedStore.group }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="管理员电话">
          {{ selectedStore.adminPhone }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="门店地址">
          {{ selectedStore.address }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm
        v-if="selectedStore"
        class="mt-4"
        :model="maintenanceForm"
        label-position="top"
      >
        <div class="saas-maintenance-grid">
          <ElFormItem label="资金入账方">
            <ElSelect v-model="maintenanceForm.fundReceiver">
              <ElOption
                v-for="option in fundPartyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="服务费承担方">
            <ElSelect v-model="maintenanceForm.serviceFeePayer">
              <ElOption
                v-for="option in fundPartyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="会员体系归属">
            <ElSelect v-model="maintenanceForm.memberOwnership">
              <ElOption
                v-for="option in fundPartyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="detailVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveStoreMaintenance">保存</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.saas-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: flex-start;
}

.saas-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 32px;
}

.saas-maintenance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.saas-data-table :deep(.el-table__cell) {
  vertical-align: top;
}

.saas-data-table :deep(.cell) {
  line-height: 1.5;
}
</style>
