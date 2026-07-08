<script lang="ts" setup>
import type {
  SaaSActionItem,
  SaaSFieldItem,
  SaaSFilterField,
  SaaSPageMeta,
} from '../_shared/page-meta';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElMessage,
  ElPagination,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { enabledDisabledOptions } from '../_shared/options';

type PageInteractions = Pick<
  SaaSPageMeta,
  | 'actions'
  | 'columns'
  | 'filters'
  | 'rowActions'
  | 'sampleData'
  | 'supportActions'
>;
type PageExplanations = Pick<
  SaaSPageMeta,
  | 'description'
  | 'documentNotes'
  | 'exceptions'
  | 'fields'
  | 'pageGoal'
  | 'pendingItems'
  | 'permissionPoints'
  | 'processSteps'
  | 'statusTransitions'
>;

type InteractionItem = SaaSActionItem;
type FormFieldItem = SaaSFieldItem | SaaSFilterField;
type BrandStatus = '启用' | '禁用';

interface BrandRecord {
  brandCode: string;
  brandName: string;
  deviceCount: string;
  id: string;
  status: BrandStatus;
  updatedAt: string;
}

const interactions = createInteractions();
const explanations = createExplanations();

const route = useRoute();
const activeAction = ref('');
const currentPage = ref(1);
const detailExplanationVisible = ref(false);
const detailVisible = ref(false);
const explanationVisible = ref(false);
const filterState = ref({
  brandCode: '',
  brandName: '',
  status: '',
});
const pageSize = ref(10);
const selectedBrandId = ref('');
const brandData = ref<BrandRecord[]>(
  interactions.sampleData.map((item) => normalizeBrandRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '设备品牌'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedBrand = computed(
  () =>
    brandData.value.find((item) => item.id === selectedBrandId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新增品牌');
const isEditMode = computed(() => activeAction.value === '编辑');
const isDisableMode = computed(() => activeAction.value === '禁用');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isEditMode.value || isDisableMode.value,
);
const submitButtonText = computed(() => {
  if (isDisableMode.value) {
    return '确认禁用';
  }
  return '保存';
});
const filteredBrands = computed(() => {
  const brandName = filterState.value.brandName.trim().toLowerCase();
  const brandCode = filterState.value.brandCode.trim().toLowerCase();
  const status = filterState.value.status;

  return brandData.value.filter((item) => {
    const matchName =
      !brandName || item.brandName.toLowerCase().includes(brandName);
    const matchCode =
      !brandCode || item.brandCode.toLowerCase().includes(brandCode);
    const matchStatus = !status || item.status === status;

    return matchName && matchCode && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredBrands.value.slice(start, end);
});
const explanationFieldsData = computed(() =>
  (explanations.fields ?? []).map((item) => ({ ...item })),
);
const explanationStatusTransitionData = computed(() =>
  (explanations.statusTransitions ?? []).map((item) => ({ ...item })),
);
const activeInteractionFieldsData = computed(() =>
  (activeInteraction.value?.fields ?? []).map((item) => ({ ...item })),
);

const [FilterForm] = useVbenForm({
  actionLayout: 'newLine',
  actionPosition: 'right',
  actionWrapperClass: 'pt-3 flex-wrap gap-3',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  compact: true,
  handleReset: handleFilterReset,
  handleSubmit: handleFilterSubmit,
  layout: 'vertical',
  resetButtonOptions: {
    content: '重置筛选',
  },
  schema: buildFilterSchema(interactions.filters),
  showDefaultActions: true,
  submitButtonOptions: {
    content: '查询',
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
});

const [DetailActionForm, detailActionFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  handleSubmit: handleDetailSubmit,
  layout: 'vertical',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

function getInteractionGoal(interaction?: InteractionItem) {
  return interaction?.goal || explanations.pageGoal;
}

function buildFieldKey(label: string, index: number) {
  return `field_${index}_${label}`;
}

function getFieldName(
  field: Pick<FormFieldItem, 'field' | 'label'>,
  index: number,
) {
  return field.field ?? buildFieldKey(field.label, index);
}

function getFieldDefaultValue(field: FormFieldItem) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  if (field.inputType === 'switch') {
    return false;
  }
  if (field.inputType === 'daterange') {
    return [];
  }
  return '';
}

function buildFieldSchema(
  field: FormFieldItem,
  index: number,
  {
    includeRules = false,
  }: {
    includeRules?: boolean;
  } = {},
): VbenFormSchema {
  const fieldName = getFieldName(field, index);
  const placeholder =
    'placeholder' in field && field.placeholder
      ? field.placeholder
      : `${field.inputType === 'select' ? '请选择' : '请输入'}${field.label}`;

  switch (field.inputType) {
    case 'date':
      return {
        component: 'DatePicker',
        componentProps: {
          placeholder,
          type: 'date',
          valueFormat: 'YYYY-MM-DD',
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'selectRequired' : undefined,
      };
    case 'daterange':
      return {
        component: 'DatePicker',
        componentProps: {
          endPlaceholder: '结束日期',
          startPlaceholder: '开始日期',
          type: 'daterange',
          valueFormat: 'YYYY-MM-DD',
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'selectRequired' : undefined,
      };
    case 'password':
      return {
        component: 'Input',
        componentProps: {
          placeholder,
          showPassword: true,
          type: 'password',
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'required' : undefined,
      };
    case 'select':
      return {
        component: 'Select',
        componentProps: {
          filterable: true,
          options: field.options ?? [],
          placeholder,
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'selectRequired' : undefined,
      };
    case 'switch':
      return {
        component: 'Switch',
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
      };
    case 'textarea':
      return {
        component: 'Input',
        componentProps: {
          autosize: {
            maxRows: Math.max(field.rows || 3, 6),
            minRows: field.rows || 3,
          },
          placeholder,
          type: 'textarea',
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'required' : undefined,
      };
    case 'text':
    default:
      return {
        component: 'Input',
        componentProps: {
          placeholder,
        },
        defaultValue: getFieldDefaultValue(field),
        fieldName,
        label: field.label,
        rules: includeRules && field.required ? 'required' : undefined,
      };
  }
}

function buildDefaultValues(fields: readonly FormFieldItem[] = []) {
  return Object.fromEntries(
    fields.map((field, index) => [
      getFieldName(field, index),
      getFieldDefaultValue(field),
    ]),
  );
}

function buildFilterSchema(fields: readonly SaaSFilterField[]) {
  return fields.map((field, index) => buildFieldSchema(field, index));
}

function buildInteractionSchema(interaction?: InteractionItem) {
  return (interaction?.fields ?? []).map((field, index) =>
    buildFieldSchema(field, index, {
      includeRules: true,
    }),
  );
}

function applyInteractionForm(interaction?: InteractionItem) {
  const schema = buildInteractionSchema(interaction);
  const defaults = buildDefaultValues(interaction?.fields ?? []);

  detailActionFormApi.setState({ schema });
  detailActionFormApi.resetForm({ values: defaults });
  void detailActionFormApi.resetValidate();
}

function populateInteractionForm(values: Record<string, any>) {
  detailActionFormApi.resetForm({
    values: buildDefaultValues(activeInteraction.value?.fields ?? []),
  });
  detailActionFormApi.resetForm({ values });
  void detailActionFormApi.resetValidate();
}

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function normalizeBrandRecord(record: Record<string, string>): BrandRecord {
  return {
    brandCode: record.brandCode ?? '',
    brandName: record.brandName ?? '',
    deviceCount: record.deviceCount ?? '0',
    id: record.id ?? `brand-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as BrandStatus) ?? '启用',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getBrandRow(row: Record<string, any>): BrandRecord {
  return normalizeBrandRecord(row);
}

function getCellValue(row: BrandRecord, key: string) {
  return row[key as keyof BrandRecord] ?? '-';
}

function getStatusTagType(status: BrandStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateBrandRecord(id: string, patch: Partial<BrandRecord>) {
  brandData.value = brandData.value.map((item) =>
    item.id === id
      ? {
          ...item,
          ...patch,
          updatedAt: getCurrentDateTime(),
        }
      : item,
  );
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedBrandId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getBrandRow(row);
  activeAction.value = action.label;
  selectedBrandId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      brandCode: currentRow.brandCode,
      brandName: currentRow.brandName,
      status: currentRow.status,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    brandCode: String(values.brandCode ?? '').trim(),
    brandName: String(values.brandName ?? '').trim(),
    status: String(values.status ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    brandCode: '',
    brandName: '',
    status: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedBrand.value) {
    populateInteractionForm({
      brandCode: selectedBrand.value.brandCode,
      brandName: selectedBrand.value.brandName,
      status: selectedBrand.value.status,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createBrand(values: Record<string, any>) {
  const brandName = String(values.brandName ?? '').trim();
  const brandCode = String(values.brandCode ?? '').trim();
  const status = String(values.status ?? '启用').trim() as BrandStatus;

  if (!brandName || !brandCode || !status) {
    ElMessage.warning('请先完善品牌信息');
    return;
  }

  const duplicated = brandData.value.some(
    (item) => item.brandCode === brandCode || item.brandName === brandName,
  );
  if (duplicated) {
    ElMessage.warning('品牌名称或品牌编码已存在，请重新填写');
    return;
  }

  brandData.value = [
    normalizeBrandRecord({
      brandCode,
      brandName,
      deviceCount: '0',
      status,
      updatedAt: getCurrentDateTime(),
    }),
    ...brandData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新增品牌：${brandName}`);
  closeDetailDrawer();
}

async function updateBrand(values: Record<string, any>) {
  if (!selectedBrand.value) {
    ElMessage.warning('未找到当前品牌，请重新选择');
    closeDetailDrawer();
    return;
  }

  const brandName = String(values.brandName ?? '').trim();
  const brandCode = String(values.brandCode ?? '').trim();
  const status = String(values.status ?? '启用').trim() as BrandStatus;

  if (!brandName || !brandCode || !status) {
    ElMessage.warning('请先完善品牌信息');
    return;
  }

  const duplicated = brandData.value.some(
    (item) =>
      item.id !== selectedBrand.value?.id &&
      (item.brandCode === brandCode || item.brandName === brandName),
  );
  if (duplicated) {
    ElMessage.warning('品牌名称或品牌编码已存在，请重新填写');
    return;
  }

  updateBrandRecord(selectedBrand.value.id, {
    brandCode,
    brandName,
    status,
  });
  ElMessage.success(`已更新品牌：${brandName}`);
  closeDetailDrawer();
}

async function disableBrand() {
  if (!selectedBrand.value) {
    ElMessage.warning('未找到当前品牌，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedBrand.value.status === '禁用') {
    ElMessage.warning('当前品牌已禁用，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateBrandRecord(selectedBrand.value.id, {
    status: '禁用',
  });
  ElMessage.success(`已禁用品牌：${selectedBrand.value.brandName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createBrand(values);
    return;
  }

  if (isEditMode.value) {
    await updateBrand(values);
  }
}

async function submitActiveAction() {
  if (isDisableMode.value) {
    await disableBrand();
    return;
  }

  await detailActionFormApi.validateAndSubmitForm();
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page;
}

watch(detailVisible, (visible) => {
  if (!visible) {
    activeAction.value = '';
    detailExplanationVisible.value = false;
    selectedBrandId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新增品牌',
        type: 'primary',
        description: '新增设备品牌并定义品牌编码。',
        fields: [
          createTextField({
            field: 'brandName',
            label: '品牌名称',
            note: '品牌展示名称',
            required: true,
          }),
          createTextField({
            field: 'brandCode',
            label: '品牌编码',
            note: '品牌唯一编码',
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 禁用',
            options: enabledDisabledOptions,
            required: true,
          }),
        ],
        goal: '维护设备品牌基础档案。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写品牌名称与品牌编码。',
          '选择品牌状态。',
          '保存后品牌进入资源管理列表。',
        ],
      },
    ],
    columns: [
      { key: 'brandName', label: '品牌名称' },
      { key: 'brandCode', label: '品牌编码' },
      { key: 'deviceCount', label: '设备数量' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    filters: [
      createTextFilter({
        field: 'brandName',
        label: '品牌名称',
        placeholder: '请输入品牌名称',
      }),
      createTextFilter({
        field: 'brandCode',
        label: '品牌编码',
        placeholder: '请输入品牌编码',
      }),
      createSelectFilter({
        field: 'status',
        label: '状态',
        options: enabledDisabledOptions,
      }),
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改品牌名称、编码或状态。',
        fields: [
          createTextField({
            field: 'brandName',
            label: '品牌名称',
            note: '品牌展示名称',
            required: true,
          }),
          createTextField({
            field: 'brandCode',
            label: '品牌编码',
            note: '品牌唯一编码',
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 禁用',
            options: enabledDisabledOptions,
            required: true,
          }),
        ],
        goal: '维护品牌资料。',
        permissionPoints: ['编辑'],
      },
      {
        label: '禁用',
        type: 'danger',
        description: '停用当前品牌。',
        goal: '阻止后续设备继续引用该品牌。',
        permissionPoints: ['禁用'],
      },
    ],
    sampleData: [
      {
        brandCode: 'PX',
        brandName: '票星终端',
        deviceCount: '48',
        id: 'brand-001',
        status: '启用',
        updatedAt: '2026-07-05 15:10',
      },
      {
        brandCode: 'ZP',
        brandName: '智票硬件',
        deviceCount: '21',
        id: 'brand-002',
        status: '禁用',
        updatedAt: '2026-07-04 18:20',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理设备品牌基础档案，覆盖品牌新增、编辑和禁用等核心品牌管理动作。',
    documentNotes: [
      '品牌名称和品牌编码在平台内都应保持唯一。',
      '禁用品牌后，新的设备不应继续引用该品牌。',
      '已有设备数量用于判断品牌当前在用规模。',
    ],
    exceptions: [
      '品牌名称、品牌编码或状态为空时不允许保存。',
      '品牌名称或品牌编码重复时不允许创建或编辑。',
      '已禁用品牌不允许重复执行禁用动作。',
    ],
    fields: [
      { label: '品牌名称', note: '品牌显示名称', required: true },
      { label: '品牌编码', note: '品牌唯一识别码', required: true },
      { label: '状态', note: '标记品牌当前是否可继续使用', required: true },
      { label: '设备数量', note: '当前品牌下已登记设备数量' },
    ],
    pageGoal: '维护设备品牌档案，确保品牌编码、状态与设备引用关系准确。',
    permissionPoints: ['新建', '编辑', '禁用'],
    processSteps: [
      '通过品牌名称、品牌编码或状态筛选品牌。',
      '从列表进入新增、编辑或禁用动作。',
      '在抽屉中完成品牌信息填写或状态确认。',
      '提交后即时刷新品牌状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '禁用后新的设备不应继续选择该品牌。',
        target: '禁用',
        trigger: '禁用',
      },
      {
        current: '禁用',
        note: '当前页面暂未提供恢复启用动作。',
        target: '禁用',
        trigger: '编辑',
      },
    ],
  };
}
</script>

<template>
  <Page :description="explanations.description" :title="pageTitle">
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
        <FilterForm>
          <template #reset-before>
            <ElButton
              v-for="action in interactions.actions"
              :key="action.label"
              :type="action.type || 'primary'"
              @click="openAction(action)"
            >
              {{ action.label }}
            </ElButton>
          </template>
        </FilterForm>
      </div>

      <div class="saas-table-panel rounded-md bg-card p-3">
        <ElTable class="saas-data-table" :data="tableData" size="small" stripe>
          <ElTable.TableColumn
            v-for="column in interactions.columns"
            :key="column.key"
            :label="column.label"
            min-width="150"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getBrandRow(row).status)"
              >
                {{ getBrandRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getBrandRow(row), column.key)
              }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="220">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  v-for="action in interactions.rowActions"
                  :key="action.label"
                  link
                  :disabled="
                    action.label === '禁用' &&
                    getBrandRow(row).status === '禁用'
                  "
                  :type="action.type || 'primary'"
                  @click="handleRowAction(action, row)"
                >
                  {{ action.label }}
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
            :total="filteredBrands.length"
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
          <ElTag type="info">查看说明</ElTag>
        </div>

        <div class="max-h-[65vh] overflow-y-auto pr-1">
          <div class="flex flex-col gap-4">
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="优先级">
                <ElTag :type="pagePriority === 'P0' ? 'danger' : 'warning'">
                  {{ pagePriority }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="页面目标">
                {{ explanations.pageGoal }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="主要说明">
                {{ explanations.description }}
              </ElDescriptionsItem>
            </ElDescriptions>

            <div
              v-if="
                explanations.documentNotes &&
                explanations.documentNotes.length > 0
              "
              class="rounded-lg border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)] p-4"
            >
              <div class="mb-2 text-sm font-medium">规则提醒</div>
              <ul
                class="list-disc pl-5 text-sm leading-6 text-[var(--el-text-color-secondary)]"
              >
                <li v-for="note in explanations.documentNotes" :key="note">
                  {{ note }}
                </li>
              </ul>
            </div>

            <div v-if="explanationFieldsData.length > 0">
              <div class="mb-2 text-sm font-medium">核心字段</div>
              <ElTable :data="explanationFieldsData" stripe>
                <ElTable.TableColumn
                  label="字段"
                  prop="label"
                  min-width="180"
                />
                <ElTable.TableColumn label="是否必填" min-width="120">
                  <template #default="{ row }">
                    <ElTag :type="row.required ? 'danger' : 'info'">
                      {{ row.required ? '必填' : '非必填' }}
                    </ElTag>
                  </template>
                </ElTable.TableColumn>
                <ElTable.TableColumn label="说明" prop="note" min-width="320" />
              </ElTable>
            </div>

            <div
              v-if="
                explanations.processSteps &&
                explanations.processSteps.length > 0
              "
            >
              <div class="mb-2 text-sm font-medium">关键流程</div>
              <ol
                class="list-decimal pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
              >
                <li v-for="step in explanations.processSteps" :key="step">
                  {{ step }}
                </li>
              </ol>
            </div>

            <div v-if="explanationStatusTransitionData.length > 0">
              <div class="mb-2 text-sm font-medium">状态流转</div>
              <ElTable :data="explanationStatusTransitionData" stripe>
                <ElTable.TableColumn
                  label="当前状态"
                  prop="current"
                  min-width="120"
                />
                <ElTable.TableColumn
                  label="触发动作"
                  prop="trigger"
                  min-width="160"
                />
                <ElTable.TableColumn
                  label="目标状态"
                  prop="target"
                  min-width="120"
                />
                <ElTable.TableColumn label="说明" prop="note" min-width="320" />
              </ElTable>
            </div>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div
                v-if="
                  explanations.permissionPoints &&
                  explanations.permissionPoints.length > 0
                "
              >
                <div class="mb-2 text-sm font-medium">权限点</div>
                <ul
                  class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
                >
                  <li
                    v-for="permission in explanations.permissionPoints"
                    :key="permission"
                  >
                    {{ permission }}
                  </li>
                </ul>
              </div>

              <div
                v-if="
                  explanations.exceptions && explanations.exceptions.length > 0
                "
              >
                <div class="mb-2 text-sm font-medium">异常与限制</div>
                <ul
                  class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
                >
                  <li
                    v-for="exception in explanations.exceptions"
                    :key="exception"
                  >
                    {{ exception }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <ElButton type="primary" @click="explanationVisible = false">
          我知道了
        </ElButton>
      </template>
    </ElDialog>

    <ElDrawer v-model="detailVisible" size="40%">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-base font-medium">{{ activeAction }}</span>
          <ElButton
            link
            type="primary"
            @click="detailExplanationVisible = true"
          >
            查看说明
          </ElButton>
        </div>
      </template>

      <div
        v-if="selectedBrand && !hasActionFields && !isDisableMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="品牌名称">
            {{ selectedBrand.brandName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="品牌编码">
            {{ selectedBrand.brandCode }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="设备数量">
            {{ selectedBrand.deviceCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedBrand.status)">
              {{ selectedBrand.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedBrand.updatedAt }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-else-if="hasActionFields" class="flex flex-col gap-4">
        <DetailActionForm />
      </div>

      <ElEmpty
        v-else
        description="当前操作没有表单内容，请点击“查看说明”了解处理规则。"
      />

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton v-if="showResetButton" @click="resetActiveForm">
            重置
          </ElButton>
          <ElButton @click="detailVisible = false">
            {{ showSubmitButton || hasActionFields ? '取消' : '关闭' }}
          </ElButton>
          <ElButton
            v-if="showSubmitButton"
            type="primary"
            @click="submitActiveAction"
          >
            {{ submitButtonText }}
          </ElButton>
        </div>
      </template>
    </ElDrawer>

    <ElDialog
      v-model="detailExplanationVisible"
      :title="`${activeAction}说明`"
      width="760px"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <span class="text-base font-medium">{{ activeAction }}</span>
          <ElTag type="info">查看说明</ElTag>
        </div>

        <div class="max-h-[65vh] overflow-y-auto pr-1">
          <div class="flex flex-col gap-4">
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="页面">
                {{ pageTitle }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="动作">
                {{ activeAction }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="目标">
                {{ getInteractionGoal(activeInteraction) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem
                v-if="activeInteraction?.description"
                label="说明"
              >
                {{ activeInteraction.description }}
              </ElDescriptionsItem>
            </ElDescriptions>

            <div
              v-if="
                activeInteraction?.documentNotes &&
                activeInteraction.documentNotes.length > 0
              "
              class="rounded-lg border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)] p-4"
            >
              <div class="mb-2 text-sm font-medium">规则提醒</div>
              <ul
                class="list-disc pl-5 text-sm leading-6 text-[var(--el-text-color-secondary)]"
              >
                <li v-for="note in activeInteraction.documentNotes" :key="note">
                  {{ note }}
                </li>
              </ul>
            </div>

            <div v-if="activeInteractionFieldsData.length > 0">
              <div class="mb-2 text-sm font-medium">涉及字段</div>
              <ElTable
                :data="activeInteractionFieldsData"
                max-height="260"
                stripe
              >
                <ElTable.TableColumn
                  label="字段"
                  prop="label"
                  min-width="140"
                />
                <ElTable.TableColumn label="是否必填" min-width="110">
                  <template #default="{ row }">
                    <ElTag :type="row.required ? 'danger' : 'info'">
                      {{ row.required ? '必填' : '非必填' }}
                    </ElTag>
                  </template>
                </ElTable.TableColumn>
                <ElTable.TableColumn label="说明" prop="note" min-width="260" />
              </ElTable>
            </div>

            <div
              v-if="
                activeInteraction?.processSteps &&
                activeInteraction.processSteps.length > 0
              "
              class="flex flex-col gap-2"
            >
              <div class="text-sm font-medium">处理流程</div>
              <ol
                class="list-decimal pl-5 text-sm leading-6 text-[var(--el-text-color-primary)]"
              >
                <li v-for="step in activeInteraction.processSteps" :key="step">
                  {{ step }}
                </li>
              </ol>
            </div>

            <div
              v-if="
                activeInteraction?.permissionPoints &&
                activeInteraction.permissionPoints.length > 0
              "
              class="flex flex-col gap-2"
            >
              <div class="text-sm font-medium">相关权限点</div>
              <ElSpace wrap>
                <ElTag
                  v-for="permission in activeInteraction.permissionPoints"
                  :key="permission"
                >
                  {{ permission }}
                </ElTag>
              </ElSpace>
            </div>

            <div
              v-if="
                activeInteraction?.statusTransitions &&
                activeInteraction.statusTransitions.length > 0
              "
            >
              <div class="mb-2 text-sm font-medium">状态流转</div>
              <ElTable
                :data="
                  activeInteraction.statusTransitions.map((item) => ({
                    ...item,
                  }))
                "
                max-height="260"
                stripe
              >
                <ElTable.TableColumn
                  label="当前状态"
                  prop="current"
                  min-width="120"
                />
                <ElTable.TableColumn
                  label="触发动作"
                  prop="trigger"
                  min-width="140"
                />
                <ElTable.TableColumn
                  label="目标状态"
                  prop="target"
                  min-width="120"
                />
                <ElTable.TableColumn label="说明" prop="note" min-width="260" />
              </ElTable>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <ElButton type="primary" @click="detailExplanationVisible = false">
          我知道了
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.saas-filter-panel {
  padding-bottom: 8px;
}

.saas-filter-panel :deep(.grid) {
  row-gap: 4px;
}

.saas-filter-panel :deep(.col-span-full.flex.items-center.gap-3) {
  row-gap: 12px;
  padding-bottom: 0;
}

.saas-filter-panel :deep(.col-span-full.flex.items-center.gap-3 .el-button) {
  margin-left: 0;
}

.saas-filter-panel :deep(.el-form-item) {
  margin-bottom: 12px;
}

.saas-table-panel {
  padding-top: 8px;
  padding-bottom: 12px;
  overflow: hidden;
}

.saas-data-table {
  --el-table-bg-color: transparent;
  --el-table-border-color: transparent;
  --el-table-header-bg-color: hsl(var(--accent));
  --el-table-row-hover-bg-color: hsl(var(--accent-hover));
  --el-table-striped-bg-color: hsl(var(--accent) / 60%);
}

.saas-data-table :deep(.el-table__header th) {
  color: hsl(var(--foreground));
  font-weight: 600;
}

.saas-data-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.saas-data-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.saas-data-table :deep(th.el-table__cell),
.saas-data-table :deep(td.el-table__cell) {
  border-bottom-color: var(--el-border-color-lighter);
}
</style>
