<script lang="ts" setup>
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

interface SaaSFilterField {
  defaultValue?: boolean | number | string | string[];
  field?: string;
  inputType?:
    | 'date'
    | 'daterange'
    | 'password'
    | 'select'
    | 'switch'
    | 'text'
    | 'textarea';
  label: string;
  options?: readonly { label: string; value: boolean | number | string }[];
  placeholder: string;
  required?: boolean;
  rows?: number;
}

interface SaaSColumnItem {
  key: string;
  label: string;
}

interface SaaSFieldItem {
  defaultValue?: boolean | number | string | string[];
  field?: string;
  inputType?:
    | 'date'
    | 'daterange'
    | 'password'
    | 'select'
    | 'switch'
    | 'text'
    | 'textarea';
  label: string;
  note: string;
  options?: readonly { label: string; value: boolean | number | string }[];
  rows?: number;
  required?: boolean;
}

interface SaaSStatusTransitionItem {
  current: string;
  note: string;
  target: string;
  trigger: string;
}

interface SaaSInteractionSpec {
  label: string;
  description?: string;
  documentNotes?: readonly string[];
  fields?: readonly SaaSFieldItem[];
  goal?: string;
  permissionPoints?: readonly string[];
  processSteps?: readonly string[];
  statusTransitions?: readonly SaaSStatusTransitionItem[];
}

interface SaaSActionItem extends SaaSInteractionSpec {
  type?: '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
}

interface SaaSSupportAction extends SaaSInteractionSpec {
  route?: string;
  type: 'drawer' | 'hidden-route';
}

interface SaaSPageMeta {
  actions: readonly SaaSActionItem[];
  columns: readonly SaaSColumnItem[];
  description: string;
  documentNotes?: readonly string[];
  exceptions?: readonly string[];
  fields?: readonly SaaSFieldItem[];
  filters: readonly SaaSFilterField[];
  pageGoal: string;
  pendingItems?: readonly string[];
  permissionPoints?: readonly string[];
  processSteps?: readonly string[];
  rowActions: readonly SaaSActionItem[];
  sampleData: readonly Record<string, string>[];
  statusTransitions?: readonly SaaSStatusTransitionItem[];
  supportActions?: readonly SaaSSupportAction[];
}

type FieldValue = boolean | number | string | string[];

type FieldOption = { label: string; value: boolean | number | string };

interface BaseFieldInput {
  defaultValue?: FieldValue;
  field: string;
  label: string;
  required?: boolean;
}

interface BaseActionFieldInput extends BaseFieldInput {
  note: string;
}

interface BaseFilterInput extends BaseFieldInput {
  placeholder?: string;
}

function createSelectField(
  input: BaseActionFieldInput & {
    options: readonly FieldOption[];
  },
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'select',
  };
}

function createSelectFilter(
  input: BaseFilterInput & {
    options: readonly FieldOption[];
  },
): SaaSFilterField {
  return {
    ...input,
    inputType: 'select',
    placeholder: input.placeholder ?? `请选择${input.label}`,
  };
}

function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

function createTextFilter(input: BaseFilterInput): SaaSFilterField {
  return {
    ...input,
    inputType: 'text',
    placeholder: input.placeholder ?? `请输入${input.label}`,
  };
}

const enabledDisabledOptions = [
  { label: '启用', value: '启用' },
  { label: '禁用', value: '禁用' },
] as const;

const employeeDepartmentOptions = [
  { label: '平台运营部', value: '平台运营部' },
  { label: '客户成功部', value: '客户成功部' },
  { label: '技术支持部', value: '技术支持部' },
] as const;

const parentDepartmentOptions = [
  { label: '总部', value: '总部' },
  ...employeeDepartmentOptions,
] as const;

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
type DepartmentStatus = '启用' | '禁用';

interface DepartmentRecord {
  departmentName: string;
  employeeCount: string;
  id: string;
  manager: string;
  parentDepartment: string;
  status: DepartmentStatus;
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
  departmentName: '',
  manager: '',
  status: '',
});
const pageSize = ref(10);
const selectedDepartmentId = ref('');
const departmentData = ref<DepartmentRecord[]>(
  interactions.sampleData.map((item) => normalizeDepartmentRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '部门管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedDepartment = computed(
  () =>
    departmentData.value.find(
      (item) => item.id === selectedDepartmentId.value,
    ) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新增部门');
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
const filteredDepartments = computed(() => {
  const departmentName = filterState.value.departmentName.trim().toLowerCase();
  const manager = filterState.value.manager.trim().toLowerCase();
  const status = filterState.value.status;

  return departmentData.value.filter((item) => {
    const matchDepartment =
      !departmentName ||
      item.departmentName.toLowerCase().includes(departmentName);
    const matchManager =
      !manager || item.manager.toLowerCase().includes(manager);
    const matchStatus = !status || item.status === status;

    return matchDepartment && matchManager && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredDepartments.value.slice(start, end);
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

function normalizeDepartmentRecord(
  record: Record<string, string>,
): DepartmentRecord {
  return {
    departmentName: record.departmentName ?? '',
    employeeCount: record.employeeCount ?? '0',
    id: record.id ?? `department-${Math.random().toString(36).slice(2, 10)}`,
    manager: record.manager ?? '',
    parentDepartment: record.parentDepartment ?? '总部',
    status: (record.status as DepartmentStatus) ?? '启用',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getDepartmentRow(row: Record<string, any>): DepartmentRecord {
  return normalizeDepartmentRecord(row);
}

function getCellValue(row: DepartmentRecord, key: string) {
  return row[key as keyof DepartmentRecord] ?? '-';
}

function getStatusTagType(status: DepartmentStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateDepartmentRecord(id: string, patch: Partial<DepartmentRecord>) {
  departmentData.value = departmentData.value.map((item) =>
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
  selectedDepartmentId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getDepartmentRow(row);
  activeAction.value = action.label;
  selectedDepartmentId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      departmentName: currentRow.departmentName,
      manager: currentRow.manager,
      parentDepartment: currentRow.parentDepartment,
      status: currentRow.status,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    departmentName: String(values.departmentName ?? '').trim(),
    manager: String(values.manager ?? '').trim(),
    status: String(values.status ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    departmentName: '',
    manager: '',
    status: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedDepartment.value) {
    populateInteractionForm({
      departmentName: selectedDepartment.value.departmentName,
      manager: selectedDepartment.value.manager,
      parentDepartment: selectedDepartment.value.parentDepartment,
      status: selectedDepartment.value.status,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createDepartment(values: Record<string, any>) {
  const departmentName = String(values.departmentName ?? '').trim();
  const parentDepartment =
    String(values.parentDepartment ?? '总部').trim() || '总部';
  const manager = String(values.manager ?? '').trim();
  const status = String(values.status ?? '启用').trim() as DepartmentStatus;

  if (!departmentName || !manager || !status) {
    ElMessage.warning('请先完善部门信息');
    return;
  }

  const duplicated = departmentData.value.some(
    (item) => item.departmentName === departmentName,
  );
  if (duplicated) {
    ElMessage.warning('部门名称已存在，请重新填写');
    return;
  }

  departmentData.value = [
    normalizeDepartmentRecord({
      departmentName,
      employeeCount: '0',
      manager,
      parentDepartment,
      status,
      updatedAt: getCurrentDateTime(),
    }),
    ...departmentData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新增部门：${departmentName}`);
  closeDetailDrawer();
}

async function updateDepartment(values: Record<string, any>) {
  if (!selectedDepartment.value) {
    ElMessage.warning('未找到当前部门，请重新选择');
    closeDetailDrawer();
    return;
  }

  const departmentName = String(values.departmentName ?? '').trim();
  const parentDepartment =
    String(values.parentDepartment ?? '总部').trim() || '总部';
  const manager = String(values.manager ?? '').trim();
  const status = String(values.status ?? '启用').trim() as DepartmentStatus;

  if (!departmentName || !manager || !status) {
    ElMessage.warning('请先完善部门信息');
    return;
  }

  const duplicated = departmentData.value.some(
    (item) =>
      item.id !== selectedDepartment.value?.id &&
      item.departmentName === departmentName,
  );
  if (duplicated) {
    ElMessage.warning('部门名称已存在，请重新填写');
    return;
  }

  updateDepartmentRecord(selectedDepartment.value.id, {
    departmentName,
    manager,
    parentDepartment,
    status,
  });
  ElMessage.success(`已更新部门：${departmentName}`);
  closeDetailDrawer();
}

async function disableDepartment() {
  if (!selectedDepartment.value) {
    ElMessage.warning('未找到当前部门，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedDepartment.value.status === '禁用') {
    ElMessage.warning('当前部门已禁用，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateDepartmentRecord(selectedDepartment.value.id, {
    status: '禁用',
  });
  ElMessage.success(`已禁用部门：${selectedDepartment.value.departmentName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createDepartment(values);
    return;
  }

  if (isEditMode.value) {
    await updateDepartment(values);
  }
}

async function submitActiveAction() {
  if (isDisableMode.value) {
    await disableDepartment();
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
    selectedDepartmentId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新增部门',
        type: 'primary',
        description: '新增 SaaS 内部组织部门。',
        fields: [
          createTextField({
            field: 'departmentName',
            label: '部门名称',
            note: '组织名称',
            required: true,
          }),
          createSelectField({
            field: 'parentDepartment',
            label: '上级部门',
            note: '用于组织归属结构',
            options: parentDepartmentOptions,
          }),
          createTextField({
            field: 'manager',
            label: '负责人',
            note: '部门负责人',
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
        goal: '建立可供员工归属选择的组织结构。',
        permissionPoints: ['新增'],
        processSteps: [
          '填写部门名称和负责人。',
          '选择上级部门与状态。',
          '保存后部门进入组织列表。',
        ],
      },
    ],
    columns: [
      { key: 'departmentName', label: '部门名称' },
      { key: 'parentDepartment', label: '上级部门' },
      { key: 'manager', label: '负责人' },
      { key: 'employeeCount', label: '员工数' },
      { key: 'status', label: '状态' },
    ],
    filters: [
      createTextFilter({
        field: 'departmentName',
        label: '部门名称',
        placeholder: '请输入部门名称',
      }),
      createTextFilter({
        field: 'manager',
        label: '负责人',
        placeholder: '请输入负责人',
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
        description: '修改部门负责人、上级归属或启停状态。',
        fields: [
          createTextField({
            field: 'departmentName',
            label: '部门名称',
            note: '组织名称',
            required: true,
          }),
          createSelectField({
            field: 'parentDepartment',
            label: '上级部门',
            note: '用于组织归属结构',
            options: parentDepartmentOptions,
          }),
          createTextField({
            field: 'manager',
            label: '负责人',
            note: '部门负责人',
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
        goal: '维护组织结构与归属信息。',
        permissionPoints: ['编辑'],
      },
      {
        label: '禁用',
        type: 'danger',
        description: '禁用部门后，不再允许新员工选择该部门。',
        goal: '关闭不再使用的组织单元。',
        permissionPoints: ['禁用'],
      },
    ],
    sampleData: [
      {
        departmentName: '平台运营部',
        employeeCount: '18',
        id: 'department-001',
        manager: '李青',
        parentDepartment: '总部',
        status: '启用',
        updatedAt: '2026-07-05 10:30',
      },
      {
        departmentName: '客户成功部',
        employeeCount: '9',
        id: 'department-002',
        manager: '张宁',
        parentDepartment: '总部',
        status: '启用',
        updatedAt: '2026-07-04 16:20',
      },
      {
        departmentName: '区域支持组',
        employeeCount: '4',
        id: 'department-003',
        manager: '王晨',
        parentDepartment: '技术支持部',
        status: '禁用',
        updatedAt: '2026-07-03 14:15',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理 SaaS 内部组织部门，覆盖新增、编辑、禁用等组织结构维护动作。',
    documentNotes: [
      '部门名称在组织内应保持唯一，避免员工归属混淆。',
      '禁用部门后，不再允许新员工继续选择该部门。',
      '调整上级部门时，应同步关注组织层级和负责人归属。',
    ],
    exceptions: [
      '部门名称重复时不允许创建或保存。',
      '负责人为空时不允许提交。',
      '已禁用部门不允许重复执行禁用动作。',
    ],
    fields: [
      { label: '部门名称', note: '组织显示名称', required: true },
      { label: '上级部门', note: '当前部门所属的上级组织' },
      { label: '负责人', note: '部门负责人姓名', required: true },
      { label: '状态', note: '决定部门是否可被继续选择', required: true },
      { label: '员工数', note: '当前部门下员工数量' },
    ],
    pageGoal: '维护组织结构和部门归属信息，确保部门状态、负责人和层级准确。',
    permissionPoints: ['新增', '编辑', '禁用'],
    processSteps: [
      '通过部门名称、负责人或状态筛选部门。',
      '从列表进入新增、编辑或禁用动作。',
      '在抽屉中完成组织信息填写或确认操作。',
      '提交后即时刷新部门状态和层级信息。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '禁用后不允许新员工继续选择该部门。',
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
                :type="getStatusTagType(getDepartmentRow(row).status)"
              >
                {{ getDepartmentRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getDepartmentRow(row), column.key)
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
                    getDepartmentRow(row).status === '禁用'
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
            :total="filteredDepartments.length"
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
        v-if="selectedDepartment && !hasActionFields && !isDisableMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="部门名称">
            {{ selectedDepartment.departmentName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上级部门">
            {{ selectedDepartment.parentDepartment }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="负责人">
            {{ selectedDepartment.manager }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="员工数">
            {{ selectedDepartment.employeeCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedDepartment.status)">
              {{ selectedDepartment.status }}
            </ElTag>
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
