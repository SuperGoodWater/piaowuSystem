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
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

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

function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

const employeeDepartmentOptions = [
  { label: '平台运营部', value: '平台运营部' },
  { label: '客户成功部', value: '客户成功部' },
  { label: '技术支持部', value: '技术支持部' },
] as const;

const employeeRoleOptions = [
  { label: '运营经理', value: '运营经理' },
  { label: '客户成功经理', value: '客户成功经理' },
  { label: '技术支持专员', value: '技术支持专员' },
] as const;

const enabledDisabledOptions = [
  { label: '启用', value: '启用' },
  { label: '禁用', value: '禁用' },
] as const;

type PageInteractions = Pick<
  SaaSPageMeta,
  'actions' | 'columns' | 'rowActions' | 'sampleData' | 'supportActions'
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
type FormFieldItem = SaaSFieldItem;
type EmployeeStatus = '启用' | '禁用';

interface EmployeeRecord {
  account: string;
  department: string;
  id: string;
  name: string;
  permissionScope: string;
  role: string;
  status: EmployeeStatus;
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
  account: '',
  department: '',
  name: '',
  status: '',
});
const pageSize = ref(10);
const selectedEmployeeId = ref('');
const employeeData = ref<EmployeeRecord[]>(
  interactions.sampleData.map((item) => normalizeEmployeeRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '员工账号管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedEmployee = computed(
  () =>
    employeeData.value.find((item) => item.id === selectedEmployeeId.value) ??
    null,
);
const isCreateMode = computed(() => activeAction.value === '新建员工');
const isEditMode = computed(() => activeAction.value === '编辑');
const isPermissionMode = computed(() => activeAction.value === '权限配置');
const isDisableMode = computed(() => activeAction.value === '禁用');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isCreateMode.value || isEditMode.value || isPermissionMode.value,
);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isPermissionMode.value ||
    isDisableMode.value,
);
const submitButtonText = computed(() => {
  if (isPermissionMode.value) {
    return '保存权限';
  }
  if (isDisableMode.value) {
    return '确认禁用';
  }
  return '保存';
});
const filteredEmployees = computed(() => {
  const name = filterState.value.name.trim().toLowerCase();
  const account = filterState.value.account.trim().toLowerCase();
  const department = filterState.value.department;
  const status = filterState.value.status;

  return employeeData.value.filter((item) => {
    const matchName = !name || item.name.toLowerCase().includes(name);
    const matchAccount =
      !account || item.account.toLowerCase().includes(account);
    const matchDepartment = !department || item.department === department;
    const matchStatus = !status || item.status === status;

    return matchName && matchAccount && matchDepartment && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredEmployees.value.slice(start, end);
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

function normalizeEmployeeRecord(
  record: Record<string, string>,
): EmployeeRecord {
  return {
    account: record.account ?? '',
    department: record.department ?? '',
    id: record.id ?? `employee-${Math.random().toString(36).slice(2, 10)}`,
    name: record.name ?? '',
    permissionScope: record.permissionScope ?? '客户管理、公告管理',
    role: record.role ?? '',
    status: (record.status as EmployeeStatus) ?? '启用',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getEmployeeRow(row: Record<string, any>): EmployeeRecord {
  return normalizeEmployeeRecord(row);
}

function getCellValue(row: EmployeeRecord, key: string) {
  return row[key as keyof EmployeeRecord] ?? '-';
}

function getStatusTagType(status: EmployeeStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateEmployeeRecord(id: string, patch: Partial<EmployeeRecord>) {
  employeeData.value = employeeData.value.map((item) =>
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
  selectedEmployeeId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getEmployeeRow(row);
  activeAction.value = action.label;
  selectedEmployeeId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      account: currentRow.account,
      department: currentRow.department,
      name: currentRow.name,
      role: currentRow.role,
      status: currentRow.status,
    });
  }

  if (action.label === '权限配置') {
    populateInteractionForm({
      department: currentRow.department,
      permissionScope: currentRow.permissionScope,
      role: currentRow.role,
    });
  }
}

function handleFilterSubmit() {
  filterState.value = {
    name: filterState.value.name.trim(),
    account: filterState.value.account.trim(),
    department: filterState.value.department.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    account: '',
    department: '',
    name: '',
    status: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if ((isEditMode.value || isPermissionMode.value) && selectedEmployee.value) {
    if (isEditMode.value) {
      populateInteractionForm({
        account: selectedEmployee.value.account,
        department: selectedEmployee.value.department,
        name: selectedEmployee.value.name,
        role: selectedEmployee.value.role,
        status: selectedEmployee.value.status,
      });
      return;
    }

    populateInteractionForm({
      department: selectedEmployee.value.department,
      permissionScope: selectedEmployee.value.permissionScope,
      role: selectedEmployee.value.role,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createEmployee(values: Record<string, any>) {
  const name = String(values.name ?? '').trim();
  const account = String(values.account ?? '').trim();
  const department = String(values.department ?? '').trim();
  const role = String(values.role ?? '').trim();

  if (!name || !account || !department || !role) {
    ElMessage.warning('请先完善员工信息');
    return;
  }

  const duplicated = employeeData.value.some(
    (item) => item.account === account,
  );
  if (duplicated) {
    ElMessage.warning('登录账号已存在，请重新填写');
    return;
  }

  employeeData.value = [
    normalizeEmployeeRecord({
      account,
      department,
      name,
      permissionScope: '待配置',
      role,
      status: '启用',
      updatedAt: getCurrentDateTime(),
    }),
    ...employeeData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建员工：${name}`);
  closeDetailDrawer();
}

async function updateEmployee(values: Record<string, any>) {
  if (!selectedEmployee.value) {
    ElMessage.warning('未找到当前员工，请重新选择');
    closeDetailDrawer();
    return;
  }

  const name = String(values.name ?? '').trim();
  const account = String(values.account ?? '').trim();
  const department = String(values.department ?? '').trim();
  const role = String(values.role ?? '').trim();
  const status = String(values.status ?? '启用').trim() as EmployeeStatus;

  if (!name || !account || !department || !role || !status) {
    ElMessage.warning('请先完善员工信息');
    return;
  }

  const duplicated = employeeData.value.some(
    (item) =>
      item.id !== selectedEmployee.value?.id && item.account === account,
  );
  if (duplicated) {
    ElMessage.warning('登录账号已存在，请重新填写');
    return;
  }

  updateEmployeeRecord(selectedEmployee.value.id, {
    account,
    department,
    name,
    role,
    status,
  });
  ElMessage.success(`已更新员工：${name}`);
  closeDetailDrawer();
}

async function updatePermission(values: Record<string, any>) {
  if (!selectedEmployee.value) {
    ElMessage.warning('未找到当前员工，请重新选择');
    closeDetailDrawer();
    return;
  }

  const role = String(values.role ?? '').trim();
  const department = String(values.department ?? '').trim();
  const permissionScope = String(values.permissionScope ?? '').trim();

  if (!role || !department || !permissionScope) {
    ElMessage.warning('请先完善权限配置');
    return;
  }

  updateEmployeeRecord(selectedEmployee.value.id, {
    department,
    permissionScope,
    role,
  });
  ElMessage.success(`已保存权限配置：${selectedEmployee.value.name}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createEmployee(values);
    return;
  }

  if (isEditMode.value) {
    await updateEmployee(values);
    return;
  }

  if (isPermissionMode.value) {
    await updatePermission(values);
  }
}

async function submitActiveAction() {
  await detailActionFormApi.validateAndSubmitForm();
}

function getEmployeeStatusAction(row: EmployeeRecord) {
  return row.status === '启用'
    ? {
        label: '禁用',
        nextStatus: '禁用' as EmployeeStatus,
        type: 'danger' as const,
      }
    : {
        label: '启用',
        nextStatus: '启用' as EmployeeStatus,
        type: 'success' as const,
      };
}

async function toggleEmployeeStatus(row: Record<string, any>) {
  const currentRow = getEmployeeRow(row);
  const action = getEmployeeStatusAction(currentRow);

  try {
    await ElMessageBox.confirm(
      action.nextStatus === '禁用'
        ? '禁用后，该员工账号不可继续访问后台。'
        : '启用后，该员工账号可以重新访问后台。',
      `${action.label}员工`,
      {
        cancelButtonText: '取消',
        center: true,
        confirmButtonText: `确认${action.label}`,
        type: action.nextStatus === '启用' ? 'success' : 'warning',
      },
    );
  } catch {
    return;
  }

  updateEmployeeRecord(currentRow.id, {
    status: action.nextStatus,
  });
  ElMessage.success(`已${action.label}员工：${currentRow.name}`);
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
    selectedEmployeeId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建员工',
        type: 'primary',
        description: '创建 SaaS 内部员工账号并归属到对应组织。',
        fields: [
          createTextField({
            field: 'name',
            label: '员工姓名',
            note: '员工展示名称',
            required: true,
          }),
          createTextField({
            field: 'account',
            label: '登录账号',
            note: '员工登录账号',
            required: true,
          }),
          createSelectField({
            field: 'department',
            label: '所属部门',
            note: '组织归属',
            options: employeeDepartmentOptions,
            required: true,
          }),
          createSelectField({
            field: 'role',
            label: '角色',
            note: '用于承接功能权限范围',
            options: employeeRoleOptions,
            required: true,
          }),
        ],
        goal: '建立可登录、可授权的内部员工账号。',
        permissionPoints: ['新建'],
        processSteps: [
          '录入员工姓名和登录账号。',
          '选择所属部门与角色。',
          '保存后生成员工账号，可继续进行权限配置。',
        ],
      },
    ],
    columns: [
      { key: 'name', label: '员工姓名' },
      { key: 'account', label: '登录账号' },
      { key: 'department', label: '所属部门' },
      { key: 'role', label: '角色' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改员工归属、角色或基础资料。',
        fields: [
          createTextField({
            field: 'name',
            label: '员工姓名',
            note: '员工展示名称',
            required: true,
          }),
          createTextField({
            field: 'account',
            label: '登录账号',
            note: '员工登录账号',
            required: true,
          }),
          createSelectField({
            field: 'department',
            label: '所属部门',
            note: '组织归属',
            options: employeeDepartmentOptions,
            required: true,
          }),
          createSelectField({
            field: 'role',
            label: '角色',
            note: '用于承接功能权限范围',
            options: employeeRoleOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '决定员工是否可继续登录系统',
            options: enabledDisabledOptions,
            required: true,
          }),
        ],
        goal: '维护员工账号基础信息。',
        permissionPoints: ['编辑'],
      },
      {
        label: '权限配置',
        type: 'warning',
        description: '维护员工的功能级权限范围。',
        fields: [
          createSelectField({
            field: 'department',
            label: '所属部门',
            note: '同步记录当前员工组织归属',
            options: employeeDepartmentOptions,
            required: true,
          }),
          createSelectField({
            field: 'role',
            label: '角色',
            note: '角色决定默认权限范围',
            options: employeeRoleOptions,
            required: true,
          }),
          createTextField({
            field: 'permissionScope',
            label: '权限范围',
            note: '填写当前员工可访问的模块范围',
            required: true,
          }),
        ],
        goal: '为员工分配明确的功能权限范围。',
        permissionPoints: ['权限配置'],
      },
      {
        label: '禁用',
        type: 'danger',
        description: '停用当前员工账号。',
        goal: '终止员工继续访问后台。',
        permissionPoints: ['禁用'],
      },
    ],
    sampleData: [
      {
        account: 'ops_zhang',
        department: '平台运营部',
        id: 'employee-001',
        name: '张宁',
        permissionScope: '客户管理、公告管理、平台通用能力',
        role: '运营经理',
        status: '启用',
        updatedAt: '2026-07-03 18:20',
      },
      {
        account: 'success_li',
        department: '客户成功部',
        id: 'employee-002',
        name: '李青',
        permissionScope: '客户管理、SaaS产品管理',
        role: '客户成功经理',
        status: '启用',
        updatedAt: '2026-07-05 09:40',
      },
      {
        account: 'support_wang',
        department: '技术支持部',
        id: 'employee-003',
        name: '王晨',
        permissionScope: '平台资源管理、平台通用能力',
        role: '技术支持专员',
        status: '禁用',
        updatedAt: '2026-07-04 14:10',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理 SaaS 内部员工账号，覆盖新建、编辑、权限配置、禁用和启用等核心员工管理动作。',
    documentNotes: [
      '登录账号在系统内必须唯一，不允许重复。',
      '员工角色决定默认权限边界，权限配置可在此基础上细化。',
      '禁用员工后，该账号不可继续访问后台。',
    ],
    exceptions: [
      '登录账号重复时不能创建或保存。',
      '未选择部门或角色时不允许提交。',
      '员工启用和禁用动作互斥展示。',
    ],
    fields: [
      { label: '员工姓名', note: '员工显示名称', required: true },
      { label: '登录账号', note: '员工登录系统使用的账号', required: true },
      { label: '所属部门', note: '员工归属的组织部门', required: true },
      { label: '角色', note: '决定员工默认权限边界', required: true },
      { label: '状态', note: '标记账号当前是否可用' },
    ],
    pageGoal: '维护内部员工账号及其权限范围，确保员工账号状态和组织归属准确。',
    permissionPoints: ['新建', '编辑', '权限配置', '禁用', '启用'],
    processSteps: [
      '通过员工姓名、登录账号、部门或状态筛选员工。',
      '从列表进入新建、编辑、权限配置，或通过居中弹窗确认启用/禁用。',
      '新增、编辑和权限配置在抽屉中完成，启用/禁用使用居中确认弹窗。',
      '提交后即时刷新员工状态、角色和权限范围。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '禁用后员工账号不可继续登录。',
        target: '禁用',
        trigger: '禁用',
      },
      {
        current: '禁用',
        note: '启用后员工账号恢复后台访问。',
        target: '启用',
        trigger: '启用',
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
        <ElForm
          class="saas-filter-form"
          :model="filterState"
          label-position="left"
          @submit.prevent="handleFilterSubmit"
        >
          <div class="saas-filter-grid">
            <ElFormItem label="员工姓名">
              <ElInput
                v-model="filterState.name"
                clearable
                placeholder="请输入员工姓名"
              />
            </ElFormItem>

            <ElFormItem label="登录账号">
              <ElInput
                v-model="filterState.account"
                clearable
                placeholder="请输入登录账号"
              />
            </ElFormItem>

            <ElFormItem label="所属部门">
              <ElSelect
                v-model="filterState.department"
                clearable
                filterable
                placeholder="请选择所属部门"
              >
                <ElOption
                  v-for="option in employeeDepartmentOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择状态"
              >
                <ElOption
                  v-for="option in enabledDisabledOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <div class="saas-filter-actions">
              <ElButton
                v-for="action in interactions.actions"
                :key="action.label"
                :type="action.type || 'primary'"
                @click="openAction(action)"
              >
                {{ action.label }}
              </ElButton>
              <ElButton type="primary" native-type="submit">查询</ElButton>
              <ElButton @click="handleFilterReset">重置</ElButton>
            </div>
          </div>
        </ElForm>
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
                :type="getStatusTagType(getEmployeeRow(row).status)"
              >
                {{ getEmployeeRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getEmployeeRow(row), column.key)
              }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="220">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  v-for="action in interactions.rowActions.filter(
                    (item) => item.label !== '禁用',
                  )"
                  :key="action.label"
                  link
                  :type="action.type || 'primary'"
                  @click="handleRowAction(action, row)"
                >
                  {{ action.label }}
                </ElButton>
                <ElButton
                  link
                  :type="getEmployeeStatusAction(getEmployeeRow(row)).type"
                  @click="toggleEmployeeStatus(row)"
                >
                  {{ getEmployeeStatusAction(getEmployeeRow(row)).label }}
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
            :total="filteredEmployees.length"
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
        v-if="selectedEmployee && !hasActionFields && !isDisableMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="员工姓名">
            {{ selectedEmployee.name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="登录账号">
            {{ selectedEmployee.account }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="所属部门">
            {{ selectedEmployee.department }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="角色">
            {{ selectedEmployee.role }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedEmployee.status)">
              {{ selectedEmployee.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权限范围">
            {{ selectedEmployee.permissionScope }}
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

.saas-filter-form {
  width: 100%;
}

.saas-filter-grid {
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr)
    minmax(180px, 1fr) minmax(180px, 1fr);
  gap: 12px 16px;
  align-items: end;
}

.saas-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  grid-column: 1 / -1;
  padding-top: 2px;
}

.saas-filter-panel :deep(.el-form-item) {
  margin-bottom: 12px;
}

.saas-filter-panel :deep(.el-input),
.saas-filter-panel :deep(.el-select) {
  width: 100%;
}

.saas-filter-actions :deep(.el-button) {
  margin-left: 0;
}

@media (max-width: 768px) {
  .saas-filter-grid {
    grid-template-columns: 1fr;
  }
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
