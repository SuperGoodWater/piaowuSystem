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
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { appShelfStatusOptions, appTypeOptions } from '../_shared/options';

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
type AppShelfStatus = '已上架' | '已下架';

interface AppRecord {
  appName: string;
  appType: string;
  id: string;
  status: AppShelfStatus;
  updatedAt: string;
  visibility: string;
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
  appName: '',
  appType: '',
  status: '',
});
const pageSize = ref(10);
const selectedAppId = ref('');
const appData = ref<AppRecord[]>(
  interactions.sampleData.map((item) => normalizeAppRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '应用列表管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedApp = computed(
  () => appData.value.find((item) => item.id === selectedAppId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新增应用');
const isEditMode = computed(() => activeAction.value === '编辑');
const isVisibilityMode = computed(() => activeAction.value === '设置可见性');
const isOfflineMode = computed(() => activeAction.value === '下架');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isCreateMode.value || isEditMode.value || isVisibilityMode.value,
);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isVisibilityMode.value ||
    isOfflineMode.value,
);
const submitButtonText = computed(() =>
  isOfflineMode.value ? '确认下架' : '保存',
);
const filteredApps = computed(() => {
  const appName = filterState.value.appName.trim().toLowerCase();
  const appType = filterState.value.appType;
  const status = filterState.value.status;

  return appData.value.filter((item) => {
    const matchesName =
      !appName || item.appName.toLowerCase().includes(appName);
    const matchesType = !appType || item.appType === appType;
    const matchesStatus = !status || item.status === status;
    return matchesName && matchesType && matchesStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredApps.value.slice(start, start + pageSize.value);
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
  { includeRules = false }: { includeRules?: boolean } = {},
): VbenFormSchema {
  const fieldName = getFieldName(field, index);
  const placeholder =
    'placeholder' in field && field.placeholder
      ? field.placeholder
      : `${field.inputType === 'select' ? '请选择' : '请输入'}${field.label}`;

  switch (field.inputType) {
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

function buildFilterSchema(filters: readonly SaaSFilterField[] = []) {
  return filters.map((filter, index) => buildFieldSchema(filter, index));
}

function buildInteractionSchema(interaction?: InteractionItem) {
  return (interaction?.fields ?? []).map((field, index) =>
    buildFieldSchema(field, index, { includeRules: true }),
  );
}

function applyInteractionForm(interaction?: InteractionItem) {
  detailActionFormApi.setState({ schema: buildInteractionSchema(interaction) });
  detailActionFormApi.resetForm({
    values: buildDefaultValues(interaction?.fields ?? []),
  });
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
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function normalizeAppRecord(record: Record<string, string>): AppRecord {
  return {
    appName: record.appName ?? '',
    appType: record.appType ?? '',
    id: record.id ?? `app-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as AppShelfStatus) ?? '已下架',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
    visibility: record.visibility ?? '',
  };
}

function getAppRow(row: Record<string, any>) {
  return row as AppRecord;
}

function getCellValue(row: AppRecord, key: string) {
  return row[key as keyof AppRecord] ?? '-';
}

function getStatusTagType(status: AppShelfStatus) {
  return status === '已上架' ? 'success' : 'info';
}

function updateAppRecord(id: string, patch: Partial<AppRecord>) {
  appData.value = appData.value.map((item) =>
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
  selectedAppId.value = '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getAppRow(row);
  activeAction.value = action.label;
  selectedAppId.value = currentRow.id;
  applyInteractionForm(action);

  if (action.label === '编辑' || action.label === '设置可见性') {
    populateInteractionForm({
      appName: currentRow.appName,
      appType: currentRow.appType,
      status: currentRow.status,
      visibility: currentRow.visibility,
    });
  }

  detailVisible.value = true;
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    appName: String(values.appName ?? '').trim(),
    appType: String(values.appType ?? '').trim(),
    status: String(values.status ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    appName: '',
    appType: '',
    status: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if ((isEditMode.value || isVisibilityMode.value) && selectedApp.value) {
    populateInteractionForm({
      appName: selectedApp.value.appName,
      appType: selectedApp.value.appType,
      status: selectedApp.value.status,
      visibility: selectedApp.value.visibility,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createApp(values: Record<string, any>) {
  const appName = String(values.appName ?? '').trim();
  const appType = String(values.appType ?? '').trim();
  const visibility = String(values.visibility ?? '').trim();
  const status = String(values.status ?? '已下架').trim() as AppShelfStatus;

  if (!appName || !appType || !visibility) {
    ElMessage.warning('请先完善应用信息');
    return;
  }

  const duplicated = appData.value.some((item) => item.appName === appName);
  if (duplicated) {
    ElMessage.warning('已存在同名应用，请调整后再提交');
    return;
  }

  appData.value = [
    normalizeAppRecord({
      appName,
      appType,
      status,
      updatedAt: getCurrentDateTime(),
      visibility,
    }),
    ...appData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新增应用：${appName}`);
  closeDetailDrawer();
}

async function editApp(values: Record<string, any>) {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  const appName = String(values.appName ?? '').trim();
  const appType = String(values.appType ?? '').trim();
  const visibility = String(values.visibility ?? '').trim();
  const status = String(values.status ?? '已下架').trim() as AppShelfStatus;

  if (!appName || !appType || !visibility) {
    ElMessage.warning('请先完善应用信息');
    return;
  }

  updateAppRecord(selectedApp.value.id, {
    appName,
    appType,
    status,
    visibility,
  });
  ElMessage.success(`已更新应用：${appName}`);
  closeDetailDrawer();
}

async function updateVisibility(values: Record<string, any>) {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  const visibility = String(values.visibility ?? '').trim();

  if (!visibility) {
    ElMessage.warning('请先填写可见范围');
    return;
  }

  updateAppRecord(selectedApp.value.id, { visibility });
  ElMessage.success(`已更新应用可见性：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function offlineApp() {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已下架') {
    ElMessage.info('当前应用已下架');
    closeDetailDrawer();
    return;
  }

  updateAppRecord(selectedApp.value.id, { status: '已下架' });
  ElMessage.success(`已下架应用：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createApp(values);
    return;
  }

  if (isEditMode.value) {
    await editApp(values);
    return;
  }

  if (isVisibilityMode.value) {
    await updateVisibility(values);
  }
}

async function submitActiveAction() {
  if (isOfflineMode.value) {
    await offlineApp();
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
    selectedAppId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新增应用',
        type: 'primary',
        description: '登记新的 SaaS 应用，并配置其类型和可见范围。',
        fields: [
          createTextField({
            field: 'appName',
            label: '应用名称',
            note: '应用展示名称',
            required: true,
          }),
          createSelectField({
            field: 'appType',
            label: '应用类型',
            note: '营销应用 / 运营应用 / 数据应用',
            options: appTypeOptions,
            required: true,
          }),
          createTextareaField({
            field: 'visibility',
            label: '可见范围',
            note: '如旗舰版可见、景区门店可见',
            required: true,
            rows: 3,
          }),
          createSelectField({
            field: 'status',
            label: '上架状态',
            note: '已上架 / 已下架',
            options: appShelfStatusOptions,
            required: true,
          }),
        ],
        goal: '建立新的应用档案。',
        permissionPoints: ['新增应用'],
      },
    ],
    filters: [
      createTextFilter({
        field: 'appName',
        label: '应用名称',
        placeholder: '请输入应用名称',
      }),
      createSelectFilter({
        field: 'appType',
        label: '应用类型',
        options: appTypeOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '上架状态',
        options: appShelfStatusOptions,
      }),
    ],
    columns: [
      { key: 'appName', label: '应用名称' },
      { key: 'appType', label: '应用类型' },
      { key: 'visibility', label: '可见范围' },
      { key: 'status', label: '上架状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改应用名称、类型和上架状态。',
        fields: [
          createTextField({
            field: 'appName',
            label: '应用名称',
            note: '应用展示名称',
            required: true,
          }),
          createSelectField({
            field: 'appType',
            label: '应用类型',
            note: '营销应用 / 运营应用 / 数据应用',
            options: appTypeOptions,
            required: true,
          }),
          createTextareaField({
            field: 'visibility',
            label: '可见范围',
            note: '按版本或门店类型配置可见性',
            required: true,
            rows: 3,
          }),
          createSelectField({
            field: 'status',
            label: '上架状态',
            note: '应用当前上架状态',
            options: appShelfStatusOptions,
            required: true,
          }),
        ],
        goal: '维护应用基础信息。',
        permissionPoints: ['编辑应用'],
      },
      {
        label: '设置可见性',
        type: 'warning',
        description: '调整应用对不同版本或门店类型的可见范围。',
        fields: [
          createTextareaField({
            field: 'visibility',
            label: '可见范围',
            note: '支持按版本、门店类型、组织范围描述',
            required: true,
            rows: 4,
          }),
        ],
        goal: '控制应用开通范围。',
        permissionPoints: ['设置可见性'],
      },
      {
        label: '下架',
        type: 'danger',
        description: '关闭当前应用的开通入口，不影响已开通门店。',
        goal: '停止新门店继续开通该应用。',
        permissionPoints: ['下架应用'],
      },
    ],
    sampleData: [
      {
        appName: '会员营销中心',
        appType: '营销应用',
        id: 'app-001',
        status: '已上架',
        updatedAt: '2026-07-02 12:15',
        visibility: '旗舰版可见',
      },
      {
        appName: '门店巡检台',
        appType: '运营应用',
        id: 'app-002',
        status: '已下架',
        updatedAt: '2026-07-05 16:40',
        visibility: '全部门店可见',
      },
      {
        appName: '经营分析看板',
        appType: '数据应用',
        id: 'app-003',
        status: '已上架',
        updatedAt: '2026-07-06 18:10',
        visibility: '专业版 / 旗舰版可见',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '管理应用档案、上架状态和可见范围。',
    description:
      '用于维护 SaaS 应用的基本信息、上架状态以及不同版本或门店类型的可见性。',
    documentNotes: [
      '应用下架仅关闭新的开通入口，不影响已开通门店继续使用。',
      '可见范围需要和业务版本、门店类型保持一致。',
    ],
    fields: [
      { label: '应用名称', note: '应用在后台与前台展示的名称', required: true },
      {
        label: '应用类型',
        note: '区分营销、运营、数据等应用类型',
        required: true,
      },
      {
        label: '可见范围',
        note: '定义哪些版本或门店类型可看到该应用',
        required: true,
      },
      { label: '上架状态', note: '控制应用是否允许新门店开通', required: true },
    ],
    processSteps: [
      '通过应用名称、类型、上架状态筛选应用。',
      '在抽屉中完成新增、编辑或可见性配置。',
      '通过下架动作关闭当前应用的开通入口。',
    ],
    permissionPoints: ['新增应用', '编辑应用', '设置可见性', '下架应用'],
    exceptions: [
      '同名应用不允许重复创建。',
      '可见范围为空时，不允许保存应用。',
      '已下架应用不需要重复执行下架操作。',
    ],
    statusTransitions: [
      {
        current: '已上架',
        trigger: '下架',
        target: '已下架',
        note: '下架后不再允许新的门店开通该应用。',
      },
      {
        current: '已下架',
        trigger: '编辑并改为已上架',
        target: '已上架',
        note: '重新上架后，符合可见范围的门店可再次开通。',
      },
    ],
  };
}
</script>

<template>
  <Page :description="undefined" :title="undefined">
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
                :type="getStatusTagType(getAppRow(row).status)"
              >
                {{ getAppRow(row).status }}
              </ElTag>
              <span v-else>{{ getCellValue(getAppRow(row), column.key) }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="220">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  v-for="action in interactions.rowActions"
                  :key="action.label"
                  link
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
            :total="filteredApps.length"
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
                <ElTag type="warning">{{ pagePriority }}</ElTag>
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
        v-if="selectedApp && !hasActionFields && !isOfflineMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="应用名称">
            {{ selectedApp.appName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用类型">
            {{ selectedApp.appType }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="可见范围">
            {{ selectedApp.visibility }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上架状态">
            <ElTag :type="getStatusTagType(selectedApp.status)">
              {{ selectedApp.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedApp.updatedAt }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-else-if="hasActionFields" class="flex flex-col gap-4">
        <DetailActionForm />
      </div>

      <div
        v-else-if="selectedApp"
        class="rounded-lg border border-dashed border-[var(--el-border-color)] p-4 text-sm leading-7"
      >
        <div>当前应用：{{ selectedApp.appName }}</div>
        <div>当前状态：{{ selectedApp.status }}</div>
        <div>下架后仅关闭新门店的开通入口。</div>
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
