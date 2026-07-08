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
import {
  featureModuleOptions,
  publishStatusOptions,
  versionNameOptions,
} from '../_shared/options';

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
type PublishStatus = '已下线' | '已发布' | '草稿';

interface FeatureRecord {
  featureModule: string;
  id: string;
  status: PublishStatus;
  targetVersion: string;
  title: string;
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
  featureModule: '',
  status: '',
  title: '',
});
const pageSize = ref(10);
const selectedFeatureId = ref('');
const featureData = ref<FeatureRecord[]>(
  interactions.sampleData.map((item) => normalizeFeatureRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '功能上新'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedFeature = computed(
  () =>
    featureData.value.find((item) => item.id === selectedFeatureId.value) ??
    null,
);
const isCreateMode = computed(() => activeAction.value === '新建上新通知');
const isEditMode = computed(() => activeAction.value === '编辑');
const isPublishMode = computed(() => activeAction.value === '发布');
const isOfflineMode = computed(() => activeAction.value === '下线');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isPublishMode.value ||
    isOfflineMode.value,
);
const submitButtonText = computed(() => {
  if (isPublishMode.value) return '确认发布';
  if (isOfflineMode.value) return '确认下线';
  return '保存';
});
const filteredFeatures = computed(() => {
  const title = filterState.value.title.trim().toLowerCase();
  const featureModule = filterState.value.featureModule;
  const status = filterState.value.status;

  return featureData.value.filter((item) => {
    const matchTitle = !title || item.title.toLowerCase().includes(title);
    const matchModule = !featureModule || item.featureModule === featureModule;
    const matchStatus = !status || item.status === status;
    return matchTitle && matchModule && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredFeatures.value.slice(start, end);
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
  commonConfig: { componentProps: { class: 'w-full' } },
  compact: true,
  handleReset: handleFilterReset,
  handleSubmit: handleFilterSubmit,
  layout: 'vertical',
  resetButtonOptions: { content: '重置筛选' },
  schema: buildFilterSchema(interactions.filters),
  showDefaultActions: true,
  submitButtonOptions: { content: '查询' },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
});

const [DetailActionForm, detailActionFormApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
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
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.inputType === 'switch') return false;
  if (field.inputType === 'daterange') return [];
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
    case 'text':
    default:
      return {
        component: 'Input',
        componentProps: { placeholder },
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
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function normalizeFeatureRecord(record: Record<string, string>): FeatureRecord {
  return {
    featureModule: record.featureModule ?? '',
    id: record.id ?? `feature-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as PublishStatus) ?? '草稿',
    targetVersion: record.targetVersion ?? '',
    title: record.title ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getFeatureRow(row: Record<string, any>): FeatureRecord {
  return normalizeFeatureRecord(row);
}

function getCellValue(row: FeatureRecord, key: string) {
  return row[key as keyof FeatureRecord] ?? '-';
}

function getStatusTagType(status: PublishStatus) {
  if (status === '已发布') return 'success';
  if (status === '草稿') return 'info';
  return 'warning';
}

function updateFeatureRecord(id: string, patch: Partial<FeatureRecord>) {
  featureData.value = featureData.value.map((item) =>
    item.id === id
      ? { ...item, ...patch, updatedAt: getCurrentDateTime() }
      : item,
  );
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedFeatureId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getFeatureRow(row);
  activeAction.value = action.label;
  selectedFeatureId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      featureModule: currentRow.featureModule,
      status: currentRow.status,
      targetVersion: currentRow.targetVersion,
      title: currentRow.title,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    featureModule: String(values.featureModule ?? '').trim(),
    status: String(values.status ?? '').trim(),
    title: String(values.title ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = { featureModule: '', status: '', title: '' };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedFeature.value) {
    populateInteractionForm({
      featureModule: selectedFeature.value.featureModule,
      status: selectedFeature.value.status,
      targetVersion: selectedFeature.value.targetVersion,
      title: selectedFeature.value.title,
    });
    return;
  }
  applyInteractionForm(activeInteraction.value);
}

async function createFeature(values: Record<string, any>) {
  const title = String(values.title ?? '').trim();
  const featureModule = String(values.featureModule ?? '').trim();
  const targetVersion = String(values.targetVersion ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PublishStatus;

  if (!title || !featureModule || !targetVersion || !status) {
    ElMessage.warning('请先完善上新通知信息');
    return;
  }

  featureData.value = [
    normalizeFeatureRecord({
      featureModule,
      status,
      targetVersion,
      title,
      updatedAt: getCurrentDateTime(),
    }),
    ...featureData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建上新通知：${title}`);
  closeDetailDrawer();
}

async function updateFeature(values: Record<string, any>) {
  if (!selectedFeature.value) {
    ElMessage.warning('未找到当前上新通知，请重新选择');
    closeDetailDrawer();
    return;
  }

  const title = String(values.title ?? '').trim();
  const featureModule = String(values.featureModule ?? '').trim();
  const targetVersion = String(values.targetVersion ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PublishStatus;

  if (!title || !featureModule || !targetVersion || !status) {
    ElMessage.warning('请先完善上新通知信息');
    return;
  }

  updateFeatureRecord(selectedFeature.value.id, {
    featureModule,
    status,
    targetVersion,
    title,
  });
  ElMessage.success(`已更新上新通知：${title}`);
  closeDetailDrawer();
}

async function publishFeature() {
  if (!selectedFeature.value) {
    ElMessage.warning('未找到当前上新通知，请重新选择');
    closeDetailDrawer();
    return;
  }
  if (selectedFeature.value.status === '已发布') {
    ElMessage.warning('当前上新通知已发布，无需重复操作');
    closeDetailDrawer();
    return;
  }
  updateFeatureRecord(selectedFeature.value.id, { status: '已发布' });
  ElMessage.success(`已发布上新通知：${selectedFeature.value.title}`);
  closeDetailDrawer();
}

async function offlineFeature() {
  if (!selectedFeature.value) {
    ElMessage.warning('未找到当前上新通知，请重新选择');
    closeDetailDrawer();
    return;
  }
  if (selectedFeature.value.status === '已下线') {
    ElMessage.warning('当前上新通知已下线，无需重复操作');
    closeDetailDrawer();
    return;
  }
  updateFeatureRecord(selectedFeature.value.id, { status: '已下线' });
  ElMessage.success(`已下线上新通知：${selectedFeature.value.title}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createFeature(values);
    return;
  }
  if (isEditMode.value) {
    await updateFeature(values);
  }
}

async function submitActiveAction() {
  if (isPublishMode.value) {
    await publishFeature();
    return;
  }
  if (isOfflineMode.value) {
    await offlineFeature();
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
    selectedFeatureId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建上新通知',
        type: 'primary',
        description: '新增功能上新通知并指定目标版本。',
        fields: [
          createTextField({
            field: 'title',
            label: '标题',
            note: '上新通知标题',
            required: true,
          }),
          createSelectField({
            field: 'featureModule',
            label: '功能模块',
            note: '如会员营销、票务能力',
            options: featureModuleOptions,
            required: true,
          }),
          createSelectField({
            field: 'targetVersion',
            label: '目标版本',
            note: '通知适用的版本范围',
            options: versionNameOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '草稿 / 已发布 / 已下线',
            options: publishStatusOptions,
            required: true,
          }),
        ],
        goal: '创建功能上新通知。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写标题并选择功能模块。',
          '指定目标版本和当前状态。',
          '保存后通知进入上新列表。',
        ],
      },
    ],
    columns: [
      { key: 'title', label: '标题' },
      { key: 'featureModule', label: '功能模块' },
      { key: 'targetVersion', label: '目标版本' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    filters: [
      createTextFilter({
        field: 'title',
        label: '标题',
        placeholder: '请输入标题',
      }),
      createSelectFilter({
        field: 'featureModule',
        label: '功能模块',
        options: featureModuleOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '状态',
        options: publishStatusOptions,
      }),
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改上新通知内容和目标版本。',
        fields: [
          createTextField({
            field: 'title',
            label: '标题',
            note: '上新通知标题',
            required: true,
          }),
          createSelectField({
            field: 'featureModule',
            label: '功能模块',
            note: '对应上新功能模块',
            options: featureModuleOptions,
            required: true,
          }),
          createSelectField({
            field: 'targetVersion',
            label: '目标版本',
            note: '通知适用范围',
            options: versionNameOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '草稿 / 已发布 / 已下线',
            options: publishStatusOptions,
            required: true,
          }),
        ],
        goal: '维护通知内容准确性。',
        permissionPoints: ['编辑'],
      },
      {
        label: '发布',
        type: 'success',
        description: '发布当前上新通知。',
        goal: '对租户或门店同步功能变化。',
        permissionPoints: ['发布'],
      },
      {
        label: '下线',
        type: 'danger',
        description: '下线当前上新通知。',
        goal: '关闭通知展示。',
        permissionPoints: ['下线'],
      },
    ],
    sampleData: [
      {
        featureModule: '会员营销',
        id: 'feature-001',
        status: '草稿',
        targetVersion: '旗舰版',
        title: '新增会员积分兑换活动',
        updatedAt: '2026-07-06 08:40',
      },
      {
        featureModule: '票务能力',
        id: 'feature-002',
        status: '已发布',
        targetVersion: '专业版',
        title: '新增团队票订单汇总报表',
        updatedAt: '2026-07-05 14:20',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理功能上新通知的创建、编辑、发布和下线，确保版本能力变化能及时同步给目标用户。',
    documentNotes: [
      '上新通知应明确功能模块和目标版本，避免错误触达。',
      '发布后通知应对目标范围可见。',
      '下线通知后不应继续在上新入口展示。',
    ],
    exceptions: [
      '标题、功能模块、目标版本或状态为空时不允许保存。',
      '已发布通知不允许重复执行发布动作。',
      '已下线通知不允许重复执行下线动作。',
    ],
    fields: [
      { label: '标题', note: '上新通知标题', required: true },
      { label: '功能模块', note: '对应上新的功能模块', required: true },
      { label: '目标版本', note: '指定通知适用的版本范围', required: true },
      { label: '状态', note: '控制通知当前展示状态', required: true },
    ],
    pageGoal: '维护功能上新通知和展示状态，确保新能力变化被准确同步。',
    permissionPoints: ['新建', '编辑', '发布', '下线'],
    processSteps: [
      '通过标题、功能模块或状态筛选通知。',
      '从列表进入新建、编辑、发布或下线动作。',
      '在抽屉中完成通知信息填写或状态确认。',
      '提交后即时刷新通知状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '草稿',
        note: '发布后通知进入展示状态。',
        target: '已发布',
        trigger: '发布',
      },
      {
        current: '已发布',
        note: '下线后通知停止展示。',
        target: '已下线',
        trigger: '下线',
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
                :type="getStatusTagType(getFeatureRow(row).status)"
              >
                {{ getFeatureRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getFeatureRow(row), column.key)
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
            :total="filteredFeatures.length"
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
        v-if="
          selectedFeature &&
          !hasActionFields &&
          !isPublishMode &&
          !isOfflineMode
        "
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="标题">
            {{ selectedFeature.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="功能模块">
            {{ selectedFeature.featureModule }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="目标版本">
            {{ selectedFeature.targetVersion }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedFeature.status)">
              {{ selectedFeature.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedFeature.updatedAt }}
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
