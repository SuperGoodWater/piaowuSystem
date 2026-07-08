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
  combinedAnnouncementTargetOptions,
  tenantStatusOptions,
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
type AnnouncementStatus = '停用' | '启用';

interface AnnouncementRecord {
  id: string;
  publishTime: string;
  status: AnnouncementStatus;
  target: string;
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
  status: '',
  target: '',
  title: '',
});
const pageSize = ref(10);
const selectedAnnouncementId = ref('');
const announcementData = ref<AnnouncementRecord[]>(
  interactions.sampleData.map((item) => normalizeAnnouncementRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '顶部公告'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedAnnouncement = computed(
  () =>
    announcementData.value.find(
      (item) => item.id === selectedAnnouncementId.value,
    ) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新建公告');
const isEditMode = computed(() => activeAction.value === '编辑');
const isToggleMode = computed(() => activeAction.value === '启停');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isEditMode.value || isToggleMode.value,
);
const submitButtonText = computed(() => {
  if (isToggleMode.value) {
    return '确认切换';
  }
  return '保存';
});
const filteredAnnouncements = computed(() => {
  const title = filterState.value.title.trim().toLowerCase();
  const target = filterState.value.target;
  const status = filterState.value.status;

  return announcementData.value.filter((item) => {
    const matchTitle = !title || item.title.toLowerCase().includes(title);
    const matchTarget = !target || item.target === target;
    const matchStatus = !status || item.status === status;

    return matchTitle && matchTarget && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredAnnouncements.value.slice(start, end);
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

function normalizeAnnouncementRecord(
  record: Record<string, string>,
): AnnouncementRecord {
  return {
    id:
      record.id ??
      `top-announcement-${Math.random().toString(36).slice(2, 10)}`,
    publishTime: record.publishTime ?? getCurrentDateTime(),
    status: (record.status as AnnouncementStatus) ?? '启用',
    target: record.target ?? '',
    title: record.title ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getAnnouncementRow(row: Record<string, any>): AnnouncementRecord {
  return normalizeAnnouncementRecord(row);
}

function getCellValue(row: AnnouncementRecord, key: string) {
  return row[key as keyof AnnouncementRecord] ?? '-';
}

function getStatusTagType(status: AnnouncementStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateAnnouncementRecord(
  id: string,
  patch: Partial<AnnouncementRecord>,
) {
  announcementData.value = announcementData.value.map((item) =>
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
  selectedAnnouncementId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getAnnouncementRow(row);
  activeAction.value = action.label;
  selectedAnnouncementId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      publishTime: currentRow.publishTime.slice(0, 10),
      status: currentRow.status,
      target: currentRow.target,
      title: currentRow.title,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    status: String(values.status ?? '').trim(),
    target: String(values.target ?? '').trim(),
    title: String(values.title ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    status: '',
    target: '',
    title: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedAnnouncement.value) {
    populateInteractionForm({
      publishTime: selectedAnnouncement.value.publishTime.slice(0, 10),
      status: selectedAnnouncement.value.status,
      target: selectedAnnouncement.value.target,
      title: selectedAnnouncement.value.title,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createAnnouncement(values: Record<string, any>) {
  const title = String(values.title ?? '').trim();
  const target = String(values.target ?? '').trim();
  const status = String(values.status ?? '启用').trim() as AnnouncementStatus;
  const publishTime = String(values.publishTime ?? '').trim();

  if (!title || !target || !status) {
    ElMessage.warning('请先完善公告信息');
    return;
  }

  const duplicated = announcementData.value.some(
    (item) =>
      item.title === title && item.target === target && item.status === '启用',
  );
  if (duplicated) {
    ElMessage.warning('相同对象下已存在同名启用公告');
    return;
  }

  announcementData.value = [
    normalizeAnnouncementRecord({
      publishTime: publishTime || getCurrentDateTime(),
      status,
      target,
      title,
      updatedAt: getCurrentDateTime(),
    }),
    ...announcementData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建公告：${title}`);
  closeDetailDrawer();
}

async function updateAnnouncement(values: Record<string, any>) {
  if (!selectedAnnouncement.value) {
    ElMessage.warning('未找到当前公告，请重新选择');
    closeDetailDrawer();
    return;
  }

  const title = String(values.title ?? '').trim();
  const target = String(values.target ?? '').trim();
  const status = String(values.status ?? '启用').trim() as AnnouncementStatus;
  const publishTime = String(values.publishTime ?? '').trim();

  if (!title || !target || !status) {
    ElMessage.warning('请先完善公告信息');
    return;
  }

  const duplicated = announcementData.value.some(
    (item) =>
      item.id !== selectedAnnouncement.value?.id &&
      item.title === title &&
      item.target === target &&
      item.status === '启用',
  );
  if (duplicated) {
    ElMessage.warning('相同对象下已存在同名启用公告');
    return;
  }

  updateAnnouncementRecord(selectedAnnouncement.value.id, {
    publishTime: publishTime || selectedAnnouncement.value.publishTime,
    status,
    target,
    title,
  });
  ElMessage.success(`已更新公告：${title}`);
  closeDetailDrawer();
}

async function toggleAnnouncement() {
  if (!selectedAnnouncement.value) {
    ElMessage.warning('未找到当前公告，请重新选择');
    closeDetailDrawer();
    return;
  }

  const nextStatus: AnnouncementStatus =
    selectedAnnouncement.value.status === '启用' ? '停用' : '启用';

  updateAnnouncementRecord(selectedAnnouncement.value.id, {
    status: nextStatus,
  });
  ElMessage.success(
    `${nextStatus === '启用' ? '已启用' : '已停用'}公告：${selectedAnnouncement.value.title}`,
  );
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createAnnouncement(values);
    return;
  }

  if (isEditMode.value) {
    await updateAnnouncement(values);
  }
}

async function submitActiveAction() {
  if (isToggleMode.value) {
    await toggleAnnouncement();
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
    selectedAnnouncementId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建公告',
        type: 'primary',
        description: '新增顶部公告并配置通知对象与发布时间。',
        fields: [
          createTextField({
            field: 'title',
            label: '公告标题',
            note: '顶部公告标题',
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '通知对象',
            note: '租户管理员 / 门店管理员',
            options: combinedAnnouncementTargetOptions,
            required: true,
          }),
          {
            field: 'publishTime',
            inputType: 'date',
            label: '发布时间',
            note: '公告展示时间',
          },
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 停用',
            options: tenantStatusOptions,
            required: true,
          }),
        ],
        goal: '发布面向平台用户的顶部公告。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写公告标题并选择通知对象。',
          '设置发布时间和公告状态。',
          '保存后公告进入顶部公告列表。',
        ],
      },
    ],
    columns: [
      { key: 'title', label: '公告标题' },
      { key: 'target', label: '通知对象' },
      { key: 'status', label: '状态' },
      { key: 'publishTime', label: '发布时间' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    filters: [
      createTextFilter({
        field: 'title',
        label: '公告标题',
        placeholder: '请输入公告标题',
      }),
      createSelectFilter({
        field: 'target',
        label: '通知对象',
        options: combinedAnnouncementTargetOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '状态',
        options: tenantStatusOptions,
      }),
    ],
    rowActions: [
      {
        label: '编辑',
        description: '调整顶部公告内容或通知对象。',
        fields: [
          createTextField({
            field: 'title',
            label: '公告标题',
            note: '顶部公告标题',
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '通知对象',
            note: '租户管理员 / 门店管理员',
            options: combinedAnnouncementTargetOptions,
            required: true,
          }),
          {
            field: 'publishTime',
            inputType: 'date',
            label: '发布时间',
            note: '公告展示时间',
          },
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 停用',
            options: tenantStatusOptions,
            required: true,
          }),
        ],
        goal: '维护顶部公告内容。',
        permissionPoints: ['编辑'],
      },
      {
        label: '启停',
        type: 'warning',
        description: '控制公告是否在顶部展示。',
        goal: '启用或下线顶部公告。',
        permissionPoints: ['发布', '下线'],
      },
    ],
    sampleData: [
      {
        id: 'top-announcement-001',
        publishTime: '2026-07-06 09:00',
        status: '启用',
        target: '租户管理员 / 门店管理员',
        title: '暑期票务高峰保障公告',
        updatedAt: '2026-07-06 09:00',
      },
      {
        id: 'top-announcement-002',
        publishTime: '2026-07-05 10:30',
        status: '停用',
        target: '租户管理员',
        title: '租户后台升级提醒',
        updatedAt: '2026-07-05 18:20',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理顶部公告发布、编辑和启停，确保面向平台用户的重要提示能及时展示。',
    documentNotes: [
      '顶部公告需明确通知对象，避免错误触达。',
      '同一对象下不建议同时存在多条同名启用公告。',
      '停用公告后，前台顶部不应继续展示该内容。',
    ],
    exceptions: [
      '公告标题、通知对象或状态为空时不允许保存。',
      '相同对象下存在同名启用公告时不能重复创建。',
      '启停动作需要基于当前选中的公告执行。',
    ],
    fields: [
      { label: '公告标题', note: '顶部展示的公告标题', required: true },
      { label: '通知对象', note: '指定公告接收对象', required: true },
      { label: '发布时间', note: '公告开始展示时间' },
      { label: '状态', note: '控制公告当前是否展示', required: true },
    ],
    pageGoal: '维护顶部公告内容和展示状态，确保关键通知准确触达平台用户。',
    permissionPoints: ['新建', '编辑', '发布', '下线'],
    processSteps: [
      '通过公告标题、通知对象或状态筛选公告。',
      '从列表进入新建、编辑或启停动作。',
      '在抽屉中完成公告信息填写或状态切换确认。',
      '提交后即时刷新公告状态和发布时间。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '停用后公告不再展示在顶部。',
        target: '停用',
        trigger: '启停',
      },
      {
        current: '停用',
        note: '重新启用后恢复顶部展示。',
        target: '启用',
        trigger: '启停',
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
                :type="getStatusTagType(getAnnouncementRow(row).status)"
              >
                {{ getAnnouncementRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getAnnouncementRow(row), column.key)
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
            :total="filteredAnnouncements.length"
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
        v-if="selectedAnnouncement && !hasActionFields && !isToggleMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="公告标题">
            {{ selectedAnnouncement.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="通知对象">
            {{ selectedAnnouncement.target }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedAnnouncement.status)">
              {{ selectedAnnouncement.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发布时间">
            {{ selectedAnnouncement.publishTime }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedAnnouncement.updatedAt }}
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
