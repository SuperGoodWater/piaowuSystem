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
  createTextFilter,
} from '../_shared/field-factory';
import {
  jointOperationStatusOptions,
  sampleStoreOptions,
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
type JointStatus = '已建立' | '已解除';

interface JointOperationRecord {
  dataScope: string;
  id: string;
  initiatorStore: string;
  relatedStores: string;
  status: JointStatus;
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
  initiatorStore: '',
  relatedStores: '',
  status: '',
});
const pageSize = ref(10);
const selectedJointId = ref('');
const jointData = ref<JointOperationRecord[]>(
  interactions.sampleData.map((item) => normalizeJointRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '联营关系管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedJoint = computed(
  () =>
    jointData.value.find((item) => item.id === selectedJointId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '发起联营');
const isReleaseMode = computed(() => activeAction.value === '解除联营');
const isViewMode = computed(() => activeAction.value === '查看范围');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isReleaseMode.value,
);
const submitButtonText = computed(() => {
  if (isReleaseMode.value) {
    return '确认解除';
  }
  return '保存';
});
const filteredJoints = computed(() => {
  const initiatorStore = filterState.value.initiatorStore.trim().toLowerCase();
  const relatedStores = filterState.value.relatedStores.trim().toLowerCase();
  const status = filterState.value.status;

  return jointData.value.filter((item) => {
    const matchInitiator =
      !initiatorStore ||
      item.initiatorStore.toLowerCase().includes(initiatorStore);
    const matchRelated =
      !relatedStores ||
      item.relatedStores.toLowerCase().includes(relatedStores);
    const matchStatus = !status || item.status === status;

    return matchInitiator && matchRelated && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredJoints.value.slice(start, end);
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

function normalizeJointRecord(
  record: Record<string, string>,
): JointOperationRecord {
  return {
    dataScope: record.dataScope ?? '',
    id: record.id ?? `joint-${Math.random().toString(36).slice(2, 10)}`,
    initiatorStore: record.initiatorStore ?? '',
    relatedStores: record.relatedStores ?? '',
    status: (record.status as JointStatus) ?? '已建立',
    updatedAt: record.updatedAt ?? '',
  };
}

function getJointRow(row: Record<string, any>): JointOperationRecord {
  return normalizeJointRecord(row);
}

function getCellValue(row: JointOperationRecord, key: string) {
  return row[key as keyof JointOperationRecord] ?? '-';
}

function getStatusTagType(status: JointStatus) {
  return status === '已建立' ? 'success' : 'info';
}

function updateJointRecord(id: string, patch: Partial<JointOperationRecord>) {
  jointData.value = jointData.value.map((item) =>
    item.id === id
      ? {
          ...item,
          ...patch,
          updatedAt: getCurrentDateTime(),
        }
      : item,
  );
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

function closeDetailDrawer() {
  detailVisible.value = false;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedJointId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getJointRow(row);
  activeAction.value = action.label;
  selectedJointId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    initiatorStore: String(values.initiatorStore ?? '').trim(),
    relatedStores: String(values.relatedStores ?? '').trim(),
    status: String(values.status ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    initiatorStore: '',
    relatedStores: '',
    status: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  applyInteractionForm(activeInteraction.value);
}

async function createJoint(values: Record<string, any>) {
  const initiatorStore = String(values.initiatorStore ?? '').trim();
  const relatedStores = String(values.relatedStores ?? '').trim();
  const dataScope = String(values.dataScope ?? '').trim() || '订单、营收、会员';

  if (!initiatorStore || !relatedStores) {
    ElMessage.warning('请先完善联营信息');
    return;
  }

  if (relatedStores.includes(initiatorStore)) {
    ElMessage.warning('关联门店中不能包含发起门店自身');
    return;
  }

  const duplicated = jointData.value.some(
    (item) =>
      item.initiatorStore === initiatorStore &&
      item.relatedStores === relatedStores &&
      item.status === '已建立',
  );
  if (duplicated) {
    ElMessage.warning('当前联营关系已存在');
    return;
  }

  jointData.value = [
    normalizeJointRecord({
      dataScope,
      initiatorStore,
      relatedStores,
      status: '已建立',
      updatedAt: getCurrentDateTime(),
    }),
    ...jointData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已发起联营：${initiatorStore}`);
  closeDetailDrawer();
}

async function releaseJoint() {
  if (!selectedJoint.value) {
    ElMessage.warning('未找到当前联营关系，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedJoint.value.status === '已解除') {
    ElMessage.warning('当前联营关系已解除，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateJointRecord(selectedJoint.value.id, {
    status: '已解除',
  });
  ElMessage.success(`已解除联营：${selectedJoint.value.initiatorStore}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createJoint(values);
  }
}

async function submitActiveAction() {
  if (isReleaseMode.value) {
    await releaseJoint();
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
    selectedJointId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '发起联营',
        type: 'primary',
        description: '选择发起门店与关联门店，建立联营关系。',
        fields: [
          createSelectField({
            field: 'initiatorStore',
            label: '发起门店',
            note: '联营发起方',
            options: sampleStoreOptions,
            required: true,
          }),
          createTextareaField({
            field: 'relatedStores',
            label: '关联门店',
            note: '被关联门店，可多填',
            required: true,
            rows: 3,
          }),
          createTextareaField({
            field: 'dataScope',
            label: '可查看数据范围',
            note: '默认包含订单、营收、会员等数据',
            rows: 2,
          }),
        ],
        goal: '建立门店间数据联营关系。',
        permissionPoints: ['建立'],
        processSteps: [
          '选择发起门店。',
          '填写关联门店。',
          '确认可共享的数据范围后提交。',
        ],
      },
      {
        label: '解除联营',
        type: 'danger',
        description: '解除门店联营关系，并关闭联营数据查看范围。',
        documentNotes: ['解除前需校验管理员权限。'],
        goal: '终止门店间联营关系。',
        permissionPoints: ['解除'],
      },
    ],
    columns: [
      { key: 'initiatorStore', label: '发起门店' },
      { key: 'relatedStores', label: '关联门店' },
      { key: 'dataScope', label: '数据范围' },
      { key: 'status', label: '联营状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    filters: [
      createTextFilter({
        field: 'initiatorStore',
        label: '发起门店',
        placeholder: '请输入发起门店',
      }),
      createTextFilter({
        field: 'relatedStores',
        label: '关联门店',
        placeholder: '请输入关联门店',
      }),
      createSelectFilter({
        field: 'status',
        label: '联营状态',
        options: jointOperationStatusOptions,
      }),
    ],
    rowActions: [
      {
        label: '查看范围',
        description: '查看联营后可共享的数据范围。',
        goal: '确认联营数据边界。',
        permissionPoints: ['查看'],
      },
      {
        label: '解除联营',
        type: 'danger',
        description: '对单条联营关系执行解除操作。',
        goal: '关闭当前联营关系。',
        permissionPoints: ['解除'],
      },
    ],
    sampleData: [
      {
        dataScope: '订单、营收、会员',
        id: 'joint-001',
        initiatorStore: '欢乐谷东区店',
        relatedStores: '欢乐谷西区店、欢乐谷南门店',
        status: '已建立',
        updatedAt: '2026-07-05 11:30',
      },
      {
        dataScope: '订单、会员',
        id: 'joint-002',
        initiatorStore: '海岸线游客中心',
        relatedStores: '海岸线北门店',
        status: '已解除',
        updatedAt: '2026-07-03 15:20',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理门店间联营关系，覆盖发起联营、查看共享范围和解除联营等关键动作。',
    documentNotes: [
      '联营关系建立后，关联门店可共享指定的数据范围。',
      '解除联营前应确认业务方是否已完成相关数据交接。',
      '发起门店和关联门店不允许填写为同一门店。',
    ],
    exceptions: [
      '发起门店为空或关联门店为空时不允许提交。',
      '关联门店中包含发起门店自身时不允许发起联营。',
      '已解除的联营关系不允许重复解除。',
    ],
    fields: [
      { label: '发起门店', note: '联营关系的发起方门店', required: true },
      { label: '关联门店', note: '被联营的门店集合', required: true },
      { label: '可查看数据范围', note: '联营后允许共享的数据边界' },
      { label: '联营状态', note: '标记联营关系当前是否生效' },
    ],
    pageGoal: '建立和维护门店联营关系，并清晰约束共享数据范围。',
    permissionPoints: ['查看', '建立', '解除'],
    processSteps: [
      '通过发起门店、关联门店或状态筛选联营记录。',
      '从页面发起新的联营关系，或从列表查看范围、解除联营。',
      '在抽屉中完成信息填写或确认动作。',
      '提交后实时更新联营状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '已建立',
        note: '解除后门店间共享数据能力关闭。',
        target: '已解除',
        trigger: '解除联营',
      },
      {
        current: '已解除',
        note: '如需恢复，应重新发起联营。',
        target: '已建立',
        trigger: '发起联营',
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
                :type="getStatusTagType(getJointRow(row).status)"
              >
                {{ getJointRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getJointRow(row), column.key)
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
                    action.label === '解除联营' &&
                    getJointRow(row).status === '已解除'
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
            :total="filteredJoints.length"
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

      <div v-if="isViewMode && selectedJoint" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="发起门店">
            {{ selectedJoint.initiatorStore }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="关联门店">
            {{ selectedJoint.relatedStores }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="数据范围">
            {{ selectedJoint.dataScope }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="联营状态">
            <ElTag :type="getStatusTagType(selectedJoint.status)">
              {{ selectedJoint.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedJoint.updatedAt }}
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
