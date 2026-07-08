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
  storeTypeOptions,
  templateTypeOptions,
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
type TemplateStatus = '停用' | '启用';

interface TemplateRecord {
  id: string;
  scope: string;
  status: TemplateStatus;
  templateName: string;
  templatePreview: string;
  templateType: string;
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
  templateName: '',
  templateType: '',
});
const pageSize = ref(10);
const selectedTemplateId = ref('');
const templateData = ref<TemplateRecord[]>(
  interactions.sampleData.map((item) => normalizeTemplateRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '打印模板管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedTemplate = computed(
  () =>
    templateData.value.find((item) => item.id === selectedTemplateId.value) ??
    null,
);
const isCreateMode = computed(() => activeAction.value === '新建模板');
const isEditMode = computed(() => activeAction.value === '编辑');
const isPreviewMode = computed(
  () => activeAction.value === '预览' || activeAction.value === '模板预览',
);
const isDisableMode = computed(() => activeAction.value === '停用');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isEditMode.value || isDisableMode.value,
);
const submitButtonText = computed(() => {
  if (isDisableMode.value) {
    return '确认停用';
  }
  return '保存';
});
const filteredTemplates = computed(() => {
  const templateName = filterState.value.templateName.trim().toLowerCase();
  const templateType = filterState.value.templateType;
  const status = filterState.value.status;

  return templateData.value.filter((item) => {
    const matchName =
      !templateName || item.templateName.toLowerCase().includes(templateName);
    const matchType = !templateType || item.templateType === templateType;
    const matchStatus = !status || item.status === status;

    return matchName && matchType && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredTemplates.value.slice(start, end);
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

function normalizeTemplateRecord(
  record: Record<string, string>,
): TemplateRecord {
  return {
    id: record.id ?? `template-${Math.random().toString(36).slice(2, 10)}`,
    scope: record.scope ?? '',
    status: (record.status as TemplateStatus) ?? '启用',
    templateName: record.templateName ?? '',
    templatePreview:
      record.templatePreview ?? '票务信息 / 核销码 / 时间 / 门店',
    templateType: record.templateType ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getTemplateRow(row: Record<string, any>): TemplateRecord {
  return normalizeTemplateRecord(row);
}

function getCellValue(row: TemplateRecord, key: string) {
  return row[key as keyof TemplateRecord] ?? '-';
}

function getStatusTagType(status: TemplateStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateTemplateRecord(id: string, patch: Partial<TemplateRecord>) {
  templateData.value = templateData.value.map((item) =>
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
  selectedTemplateId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getTemplateRow(row);
  activeAction.value = action.label;
  selectedTemplateId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      scope: currentRow.scope,
      status: currentRow.status,
      templateName: currentRow.templateName,
      templatePreview: currentRow.templatePreview,
      templateType: currentRow.templateType,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    status: String(values.status ?? '').trim(),
    templateName: String(values.templateName ?? '').trim(),
    templateType: String(values.templateType ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    status: '',
    templateName: '',
    templateType: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedTemplate.value) {
    populateInteractionForm({
      scope: selectedTemplate.value.scope,
      status: selectedTemplate.value.status,
      templateName: selectedTemplate.value.templateName,
      templatePreview: selectedTemplate.value.templatePreview,
      templateType: selectedTemplate.value.templateType,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createTemplate(values: Record<string, any>) {
  const templateName = String(values.templateName ?? '').trim();
  const templateType = String(values.templateType ?? '').trim();
  const scope = String(values.scope ?? '').trim();
  const status = String(values.status ?? '启用').trim() as TemplateStatus;
  const templatePreview =
    String(values.templatePreview ?? '').trim() ||
    '票务信息 / 核销码 / 时间 / 门店';

  if (!templateName || !templateType || !scope || !status) {
    ElMessage.warning('请先完善模板信息');
    return;
  }

  const duplicated = templateData.value.some(
    (item) =>
      item.templateName === templateName && item.templateType === templateType,
  );
  if (duplicated) {
    ElMessage.warning('同类型下已存在同名模板');
    return;
  }

  templateData.value = [
    normalizeTemplateRecord({
      scope,
      status,
      templateName,
      templatePreview,
      templateType,
      updatedAt: getCurrentDateTime(),
    }),
    ...templateData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建模板：${templateName}`);
  closeDetailDrawer();
}

async function updateTemplate(values: Record<string, any>) {
  if (!selectedTemplate.value) {
    ElMessage.warning('未找到当前模板，请重新选择');
    closeDetailDrawer();
    return;
  }

  const templateName = String(values.templateName ?? '').trim();
  const templateType = String(values.templateType ?? '').trim();
  const scope = String(values.scope ?? '').trim();
  const status = String(values.status ?? '启用').trim() as TemplateStatus;
  const templatePreview =
    String(values.templatePreview ?? '').trim() ||
    '票务信息 / 核销码 / 时间 / 门店';

  if (!templateName || !templateType || !scope || !status) {
    ElMessage.warning('请先完善模板信息');
    return;
  }

  const duplicated = templateData.value.some(
    (item) =>
      item.id !== selectedTemplate.value?.id &&
      item.templateName === templateName &&
      item.templateType === templateType,
  );
  if (duplicated) {
    ElMessage.warning('同类型下已存在同名模板');
    return;
  }

  updateTemplateRecord(selectedTemplate.value.id, {
    scope,
    status,
    templateName,
    templatePreview,
    templateType,
  });
  ElMessage.success(`已更新模板：${templateName}`);
  closeDetailDrawer();
}

async function disableTemplate() {
  if (!selectedTemplate.value) {
    ElMessage.warning('未找到当前模板，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedTemplate.value.status === '停用') {
    ElMessage.warning('当前模板已停用，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateTemplateRecord(selectedTemplate.value.id, {
    status: '停用',
  });
  ElMessage.success(`已停用模板：${selectedTemplate.value.templateName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createTemplate(values);
    return;
  }

  if (isEditMode.value) {
    await updateTemplate(values);
  }
}

async function submitActiveAction() {
  if (isDisableMode.value) {
    await disableTemplate();
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
    selectedTemplateId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建模板',
        type: 'primary',
        description: '新增打印模板并定义适用范围。',
        fields: [
          createTextField({
            field: 'templateName',
            label: '模板名称',
            note: '模板展示名称',
            required: true,
          }),
          createSelectField({
            field: 'templateType',
            label: '模板类型',
            note: '如小票模板、票面模板',
            options: templateTypeOptions,
            required: true,
          }),
          createSelectField({
            field: 'scope',
            label: '适用范围',
            note: '如景区门店、游客中心',
            options: storeTypeOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 停用',
            options: tenantStatusOptions,
            required: true,
          }),
          createTextField({
            field: 'templatePreview',
            label: '模板预览文案',
            note: '用于页面快速预览模板内容摘要',
          }),
        ],
        goal: '建立可供门店选择的打印模板。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写模板名称并选择模板类型。',
          '设置适用范围和状态。',
          '保存后模板进入打印模板列表。',
        ],
      },
    ],
    columns: [
      { key: 'templateName', label: '模板名称' },
      { key: 'templateType', label: '模板类型' },
      { key: 'scope', label: '适用范围' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    filters: [
      createTextFilter({
        field: 'templateName',
        label: '模板名称',
        placeholder: '请输入模板名称',
      }),
      createSelectFilter({
        field: 'templateType',
        label: '模板类型',
        options: templateTypeOptions,
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
        description: '修改模板配置和适用范围。',
        fields: [
          createTextField({
            field: 'templateName',
            label: '模板名称',
            note: '模板展示名称',
            required: true,
          }),
          createSelectField({
            field: 'templateType',
            label: '模板类型',
            note: '模板类型',
            options: templateTypeOptions,
            required: true,
          }),
          createSelectField({
            field: 'scope',
            label: '适用范围',
            note: '控制门店可选范围',
            options: storeTypeOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用 / 停用',
            options: tenantStatusOptions,
            required: true,
          }),
          createTextField({
            field: 'templatePreview',
            label: '模板预览文案',
            note: '用于页面快速预览模板内容摘要',
          }),
        ],
        goal: '维护模板资料。',
        permissionPoints: ['编辑'],
      },
      {
        label: '预览',
        description: '预览当前模板样式。',
        goal: '校验模板内容与版式。',
        permissionPoints: ['查看'],
      },
      {
        label: '停用',
        type: 'danger',
        description: '停用当前模板。',
        goal: '关闭模板继续被配置使用。',
        permissionPoints: ['停用'],
      },
    ],
    sampleData: [
      {
        id: 'template-001',
        scope: '景区门店',
        status: '启用',
        templateName: '标准核销小票模板',
        templatePreview: '票务信息 / 核销时间 / 闸机信息 / 门店',
        templateType: '小票模板',
        updatedAt: '2026-07-04 20:10',
      },
      {
        id: 'template-002',
        scope: '游客中心',
        status: '停用',
        templateName: '游客中心票面模板',
        templatePreview: '景区名称 / 游客须知 / 入园时间 / 条码',
        templateType: '票面模板',
        updatedAt: '2026-07-03 18:00',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理打印模板配置，覆盖模板新建、编辑、预览和停用等核心动作，确保模板适用范围清晰。',
    documentNotes: [
      '同一模板类型下不允许创建同名模板。',
      '模板预览用于快速确认输出内容摘要，不等同于真实打印渲染。',
      '停用模板后，不应再允许门店继续选择该模板。',
    ],
    exceptions: [
      '模板名称、模板类型、适用范围或状态为空时不允许保存。',
      '同类型下模板名称重复时不允许创建或编辑。',
      '已停用模板不允许重复执行停用动作。',
    ],
    fields: [
      { label: '模板名称', note: '打印模板显示名称', required: true },
      { label: '模板类型', note: '区分小票模板或票面模板', required: true },
      { label: '适用范围', note: '控制模板在哪类门店中可使用', required: true },
      { label: '状态', note: '标记模板是否可继续配置使用', required: true },
      { label: '模板预览文案', note: '用于页面快速查看模板内容摘要' },
    ],
    pageGoal: '维护打印模板配置和适用范围，确保模板可预览、可管理、可追踪。',
    permissionPoints: ['新建', '编辑', '查看', '停用'],
    processSteps: [
      '通过模板名称、类型或状态筛选模板。',
      '从列表进入新建、编辑、预览或停用动作。',
      '在抽屉中完成模板信息填写或停用确认。',
      '提交后即时刷新模板状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '停用后门店不应继续选择该模板。',
        target: '停用',
        trigger: '停用',
      },
      {
        current: '停用',
        note: '当前页面暂未提供重新启用动作。',
        target: '停用',
        trigger: '预览',
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
                :type="getStatusTagType(getTemplateRow(row).status)"
              >
                {{ getTemplateRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getTemplateRow(row), column.key)
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
                    action.label === '停用' &&
                    getTemplateRow(row).status === '停用'
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
            :total="filteredTemplates.length"
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

      <div v-if="isPreviewMode && selectedTemplate" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="模板名称">
            {{ selectedTemplate.templateName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="模板类型">
            {{ selectedTemplate.templateType }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="适用范围">
            {{ selectedTemplate.scope }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedTemplate.status)">
              {{ selectedTemplate.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="模板预览">
            {{ selectedTemplate.templatePreview }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedTemplate.updatedAt }}
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
