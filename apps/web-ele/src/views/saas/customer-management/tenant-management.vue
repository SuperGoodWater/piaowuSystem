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

interface BaseFieldInput {
  defaultValue?: FieldValue;
  field: string;
  label: string;
  required?: boolean;
}

interface BaseActionFieldInput extends BaseFieldInput {
  note: string;
}

function createPasswordField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'password',
  };
}

function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

const tenantStatusOptions = [
  { label: '启用', value: '启用' },
  { label: '停用', value: '停用' },
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
type TenantStatus = '停用' | '启用';

interface TenantRecord {
  createdAt: string;
  id: string;
  lastLoginAt: string;
  passwordUpdatedAt: string;
  phone: string;
  status: TenantStatus;
  storeCount: string;
  tenantName: string;
  username: string;
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
  keyword: '',
  status: '',
});
const pageSize = ref(10);
const selectedTenantId = ref('');
const tenantData = ref<TenantRecord[]>(
  interactions.sampleData.map((item) => normalizeTenantRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '租户管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P0'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const selectedTenant = computed(
  () =>
    tenantData.value.find((item) => item.id === selectedTenantId.value) ?? null,
);
const activeInteraction = computed(() => {
  const baseAction = actionCatalog.value.find(
    (item) =>
      item.label ===
      (activeAction.value === '启用' ? '停用' : activeAction.value),
  );

  if (!baseAction) {
    return undefined;
  }

  if (activeAction.value === '启用') {
    return createTenantStatusAction(baseAction, '停用');
  }

  return baseAction;
});
const isCreateMode = computed(() => activeAction.value === '新建租户');
const isViewMode = computed(() => activeAction.value === '查看详情');
const isResetPasswordMode = computed(() => activeAction.value === '重置密码');
const isToggleStatusMode = computed(
  () => activeAction.value === '停用' || activeAction.value === '启用',
);
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isCreateMode.value || isResetPasswordMode.value,
);
const showSubmitButton = computed(
  () =>
    isCreateMode.value || isResetPasswordMode.value || isToggleStatusMode.value,
);
const submitButtonText = computed(() => {
  if (isToggleStatusMode.value) {
    return activeAction.value === '启用' ? '确认启用' : '确认停用';
  }
  if (isResetPasswordMode.value) {
    return '确认重置';
  }
  return '保存';
});
const filteredTenants = computed(() => {
  const keyword = filterState.value.keyword.trim().toLowerCase();
  const status = filterState.value.status;

  return tenantData.value.filter((item) => {
    const matchesKeyword =
      keyword.length === 0 ||
      item.tenantName.toLowerCase().includes(keyword) ||
      item.username.toLowerCase().includes(keyword) ||
      item.phone.toLowerCase().includes(keyword);
    const matchesStatus = !status || item.status === status;

    return matchesKeyword && matchesStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredTenants.value.slice(start, end);
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
  const placeholder = `${field.inputType === 'select' ? '请选择' : '请输入'}${field.label}`;

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
    buildFieldSchema(field, index, { includeRules: true }),
  );
}

function applyInteractionForm(interaction?: InteractionItem) {
  const schema = buildInteractionSchema(interaction);
  const defaults = buildDefaultValues(interaction?.fields ?? []);

  detailActionFormApi.setState({ schema });
  detailActionFormApi.resetForm({ values: defaults });
  void detailActionFormApi.resetValidate();
}

function resetActiveForm() {
  detailActionFormApi.resetForm({
    values: buildDefaultValues(activeInteraction.value?.fields ?? []),
  });
  void detailActionFormApi.resetValidate();
}

function getCurrentDateTime() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function normalizeTenantRecord(record: Record<string, string>): TenantRecord {
  return {
    createdAt: record.createdAt ?? getCurrentDateTime(),
    id: record.id ?? `tenant-${Math.random().toString(36).slice(2, 10)}`,
    lastLoginAt: record.lastLoginAt ?? '2026-07-07 09:30',
    passwordUpdatedAt:
      record.passwordUpdatedAt ?? record.createdAt ?? getCurrentDateTime(),
    phone: record.phone ?? '',
    status: (record.status as TenantStatus) || '启用',
    storeCount: record.storeCount ?? '0',
    tenantName: record.tenantName ?? '',
    username: record.username ?? '',
  };
}

function getCellValue(row: TenantRecord, key: string) {
  return row[key as keyof TenantRecord] ?? '-';
}

function getStatusTagType(status: TenantStatus) {
  return status === '启用' ? 'success' : 'info';
}

function getTenantRow(row: Record<string, any>) {
  return row as TenantRecord;
}

function createTenantStatusAction(
  action: InteractionItem,
  status: TenantStatus,
): InteractionItem {
  if (action.label !== '停用') {
    return action;
  }

  if (status === '停用') {
    return {
      ...action,
      description: '启用后，当前租户下的门店和员工将恢复正常使用。',
      documentNotes: ['启用前应确认当前租户及其门店已满足恢复使用条件。'],
      goal: '恢复当前租户继续使用 SaaS 平台。',
      label: '启用',
      permissionPoints: ['启用'],
      type: 'success',
    };
  }

  return action;
}

function getToggleActionLabel(row: TenantRecord) {
  return row.status === '停用' ? '启用' : '停用';
}

function getToggleActionType(action: InteractionItem, row: TenantRecord) {
  return createTenantStatusAction(action, row.status).type || 'primary';
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const tenantRow = getTenantRow(row);
  openAction(createTenantStatusAction(action, tenantRow.status), tenantRow);
}

function openAction(action: InteractionItem, row?: TenantRecord) {
  activeAction.value = action.label;
  selectedTenantId.value = row?.id ?? '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function updateTenantRecord(id: string, patch: Partial<TenantRecord>) {
  const target = tenantData.value.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  Object.assign(target, patch);
  return target;
}

function isDuplicateTenant(
  tenantName: string,
  username: string,
  phone: string,
) {
  return tenantData.value.some(
    (item) =>
      item.tenantName === tenantName ||
      item.username === username ||
      item.phone === phone,
  );
}

function handleFilterSubmit() {
  filterState.value = {
    keyword: filterState.value.keyword.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    keyword: '',
    status: '',
  };
  currentPage.value = 1;
}

async function createTenant(values: Record<string, any>) {
  const tenantName = String(values.tenantName ?? '').trim();
  const username = String(values.username ?? '').trim();
  const phone = String(values.phone ?? '').trim();
  const password = String(values.password ?? '').trim();

  if (!tenantName || !username || !phone || !password) {
    ElMessage.warning('请先填写完整的新建租户信息');
    return;
  }

  if (isDuplicateTenant(tenantName, username, phone)) {
    ElMessage.warning('租户名称、管理员账号或手机号已存在，请调整后再提交');
    return;
  }

  const now = getCurrentDateTime();

  tenantData.value.unshift({
    createdAt: now,
    id: `tenant-${Date.now()}`,
    lastLoginAt: '从未登录',
    passwordUpdatedAt: now,
    phone,
    status: '启用',
    storeCount: '0',
    tenantName,
    username,
  });
  currentPage.value = 1;
  ElMessage.success(`已新建租户：${tenantName}`);
  closeDetailDrawer();
}

async function resetTenantPassword(values: Record<string, any>) {
  if (!selectedTenant.value) {
    ElMessage.warning('未找到当前租户，请重新选择');
    return;
  }

  const password = String(values.password ?? '').trim();
  const confirmPassword = String(values.confirmPassword ?? '').trim();

  if (!password || !confirmPassword) {
    ElMessage.warning('请填写完整的新密码信息');
    return;
  }

  if (password !== confirmPassword) {
    ElMessage.warning('两次输入的密码不一致，请重新确认');
    return;
  }

  updateTenantRecord(selectedTenant.value.id, {
    passwordUpdatedAt: getCurrentDateTime(),
  });
  ElMessage.success(`已重置 ${selectedTenant.value.tenantName} 的管理员密码`);
  closeDetailDrawer();
}

async function toggleTenantStatus() {
  if (!selectedTenant.value) {
    ElMessage.warning('未找到当前租户，请重新选择');
    return;
  }

  const nextStatus: TenantStatus =
    selectedTenant.value.status === '停用' ? '启用' : '停用';

  updateTenantRecord(selectedTenant.value.id, {
    status: nextStatus,
  });
  ElMessage.success(`已${nextStatus}租户：${selectedTenant.value.tenantName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createTenant(values);
    return;
  }

  if (isResetPasswordMode.value) {
    await resetTenantPassword(values);
  }
}

async function submitActiveAction() {
  if (isToggleStatusMode.value) {
    await toggleTenantStatus();
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
    selectedTenantId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建租户',
        type: 'primary',
        description: '创建新的租户，并生成对应的顶级管理员账号。',
        fields: [
          createTextField({
            field: 'tenantName',
            label: '租户名称',
            note: '用于在 SaaS 后台区分租户主体',
            required: true,
          }),
          createTextField({
            field: 'username',
            label: '管理员账号',
            note: '租户顶级管理员登录账号',
            required: true,
          }),
          createTextField({
            field: 'phone',
            label: '手机号',
            note: '租户顶级管理员手机号',
            required: true,
          }),
          createPasswordField({
            field: 'password',
            label: '初始密码',
            note: '用于首次登录的管理员密码',
            required: true,
          }),
        ],
        goal: '完成租户创建并生成初始管理员账号。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写租户名称、管理员账号、手机号和初始密码。',
          '系统校验租户名称、管理员账号和手机号是否重复。',
          '提交成功后生成一条新的租户记录，并默认置为启用状态。',
        ],
      },
    ],
    columns: [
      { key: 'tenantName', label: '租户名称' },
      { key: 'username', label: '管理员账号' },
      { key: 'phone', label: '手机号' },
      { key: 'storeCount', label: '门店数' },
      { key: 'status', label: '租户状态' },
      { key: 'createdAt', label: '创建时间' },
    ],
    rowActions: [
      {
        label: '查看详情',
        description: '查看当前租户的基础信息、管理员账号和最近操作信息。',
        goal: '快速了解租户当前配置与使用状态。',
        permissionPoints: ['查看'],
      },
      {
        label: '重置密码',
        type: 'warning',
        description: '重置租户顶级管理员密码，不影响租户状态。',
        fields: [
          createPasswordField({
            field: 'password',
            label: '新密码',
            note: '请输入新的管理员登录密码',
            required: true,
          }),
          createPasswordField({
            field: 'confirmPassword',
            label: '确认密码',
            note: '再次输入新密码，需与上方保持一致',
            required: true,
          }),
        ],
        goal: '恢复管理员账号的登录能力。',
        permissionPoints: ['重置密码'],
        processSteps: [
          '输入新密码和确认密码。',
          '系统校验两次输入是否一致。',
          '提交成功后更新该租户最近重置密码时间。',
        ],
      },
      {
        label: '停用',
        type: 'danger',
        description: '停用后，当前租户下的门店和员工将同步受到影响。',
        documentNotes: [
          '停用属于高影响动作，应确认当前租户及其门店均允许暂停使用。',
        ],
        goal: '停止当前租户继续使用 SaaS 平台。',
        permissionPoints: ['停用'],
      },
    ],
    sampleData: [
      {
        createdAt: '2026-07-01 10:00',
        id: 'tenant-001',
        lastLoginAt: '2026-07-07 09:30',
        passwordUpdatedAt: '2026-07-05 11:20',
        phone: '13800001111',
        status: '启用',
        storeCount: '12',
        tenantName: '星河票务集团',
        username: 'xinghe_admin',
      },
      {
        createdAt: '2026-07-02 14:30',
        id: 'tenant-002',
        lastLoginAt: '2026-07-06 18:10',
        passwordUpdatedAt: '2026-07-03 08:45',
        phone: '13900002222',
        status: '停用',
        storeCount: '4',
        tenantName: '海岸线文旅',
        username: 'coast_admin',
      },
      {
        createdAt: '2026-07-03 09:15',
        id: 'tenant-003',
        lastLoginAt: '2026-07-07 08:20',
        passwordUpdatedAt: '2026-07-04 16:00',
        phone: '13700003333',
        status: '启用',
        storeCount: '7',
        tenantName: '云上乐园',
        username: 'cloudpark_admin',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理租户与顶级管理员账号，覆盖搜索、新建、查看详情、重置密码和停用等核心动作。',
    documentNotes: [
      '关键词搜索统一覆盖租户名称、管理员账号和手机号。',
      '停用租户后，相关门店与员工账号会同步受到影响，应在执行前明确业务确认。',
      '新建租户时，租户名称、管理员账号和手机号均不允许重复。',
    ],
    exceptions: [
      '租户名称、管理员账号或手机号重复时，不允许创建。',
      '重置密码时，两次输入的新密码不一致则不能提交。',
      '已停用租户不允许重复执行停用动作。',
    ],
    fields: [
      {
        label: '租户名称',
        note: '租户主体名称，用于区分不同客户',
        required: true,
      },
      { label: '管理员账号', note: '租户顶级管理员登录账号', required: true },
      { label: '手机号', note: '租户顶级管理员手机号', required: true },
      {
        label: '初始密码',
        note: '新建租户时生成管理员登录凭据',
        required: true,
      },
      { label: '租户状态', note: '当前租户是否处于启用或停用状态' },
    ],
    pageGoal: '查看与筛选租户，并完成租户生命周期内的关键管理动作。',
    permissionPoints: ['查看', '新建', '重置密码', '停用', '启用'],
    processSteps: [
      '通过关键词或状态筛选需要处理的租户。',
      '从列表进入新建、详情、重置密码或停用动作。',
      '在抽屉内完成表单填写或确认操作。',
      '提交后即时刷新当前列表数据与状态。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '停用后，租户下的门店和员工登录将同步受限。',
        target: '停用',
        trigger: '停用',
      },
      {
        current: '停用',
        note: '启用后，租户及其门店、员工将恢复正常使用。',
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
            <ElFormItem label="关键词">
              <ElInput
                v-model="filterState.keyword"
                clearable
                placeholder="输入租户名、管理员账号或手机号"
              />
            </ElFormItem>

            <ElFormItem label="租户状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择租户状态"
              >
                <ElOption
                  v-for="option in tenantStatusOptions"
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
            min-width="140"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getTenantRow(row).status)"
              >
                {{ getTenantRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getTenantRow(row), column.key)
              }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="240">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  v-for="action in interactions.rowActions"
                  :key="action.label"
                  link
                  :type="
                    action.label === '停用'
                      ? getToggleActionType(action, getTenantRow(row))
                      : action.type || 'primary'
                  "
                  @click="handleRowAction(action, row)"
                >
                  {{
                    action.label === '停用'
                      ? getToggleActionLabel(getTenantRow(row))
                      : action.label
                  }}
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
            :total="filteredTenants.length"
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

            <div v-if="explanations.fields && explanations.fields.length > 0">
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

            <div
              v-if="
                explanations.statusTransitions &&
                explanations.statusTransitions.length > 0
              "
            >
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

      <div v-if="isViewMode && selectedTenant" class="flex flex-col gap-4">
        <div class="drawer-summary-card">
          <div class="text-sm font-medium text-[var(--el-text-color-primary)]">
            当前租户
          </div>
          <div class="mt-2 flex items-center gap-3">
            <div class="text-lg font-semibold">
              {{ selectedTenant.tenantName }}
            </div>
            <ElTag :type="getStatusTagType(selectedTenant.status)">
              {{ selectedTenant.status }}
            </ElTag>
          </div>
        </div>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="管理员账号">
            {{ selectedTenant.username }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机号">
            {{ selectedTenant.phone }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="门店数">
            {{ selectedTenant.storeCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ selectedTenant.createdAt }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最近登录">
            {{ selectedTenant.lastLoginAt }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最近重置密码">
            {{ selectedTenant.passwordUpdatedAt }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div
        v-else-if="isToggleStatusMode && selectedTenant"
        class="flex flex-col gap-4"
      >
        <div class="drawer-warning-card">
          <div
            class="text-sm font-medium"
            :class="
              activeAction === '启用'
                ? 'text-[var(--el-color-success)]'
                : 'text-[var(--el-color-danger)]'
            "
          >
            {{
              activeAction === '启用'
                ? '启用后该租户下的门店和员工将恢复正常登录'
                : '停用后将同步影响该租户下的门店和员工登录'
            }}
          </div>
          <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
            {{
              activeAction === '启用'
                ? '请确认当前租户已满足恢复使用条件，再点击底部“确认启用”。'
                : '请确认当前操作对象无误，再点击底部“确认停用”。'
            }}
          </div>
        </div>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="租户名称">
            {{ selectedTenant.tenantName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="管理员账号">
            {{ selectedTenant.username }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机号">
            {{ selectedTenant.phone }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前状态">
            <ElTag :type="getStatusTagType(selectedTenant.status)">
              {{ selectedTenant.status }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-else-if="hasActionFields" class="flex flex-col gap-4">
        <DetailActionForm />
      </div>

      <ElEmpty
        v-else
        description="当前操作没有可展示的内容，请关闭后重新进入。"
      />

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton v-if="showResetButton" @click="resetActiveForm">
            重置
          </ElButton>
          <ElButton @click="closeDetailDrawer">
            {{ showSubmitButton ? '取消' : '关闭' }}
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

            <div
              v-if="
                activeInteraction?.fields && activeInteraction.fields.length > 0
              "
            >
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
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(
      180px,
      1fr
    ) minmax(180px, 1fr) minmax(180px, 1fr);
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

.drawer-summary-card,
.drawer-warning-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  padding: 16px;
}

.drawer-warning-card {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}
</style>
