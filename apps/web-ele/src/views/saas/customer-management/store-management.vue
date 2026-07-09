<script lang="ts" setup>
import type { StoreRecord, StoreStatus } from './store-management-data';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
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
  ElSwitch,
  ElTable,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

import { storeManagementSampleData } from './store-management-data';

interface SaaSColumnItem {
  key: string;
  label: string;
  minWidth?: number;
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
  sampleData: readonly StoreRecord[];
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

function createPasswordField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'password',
  };
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

function createTextareaField(
  input: BaseActionFieldInput & {
    rows?: number;
  },
): SaaSFieldItem {
  return {
    ...input,
    inputType: 'textarea',
  };
}

function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

const sampleTenantOptions = [
  { label: '星河票务集团', value: '星河票务集团' },
  { label: '海岸线文旅', value: '海岸线文旅' },
] as const;

const storeStatusOptions = [
  { label: '启用', value: '启用' },
  { label: '停用', value: '停用' },
  { label: '过期', value: '过期' },
] as const;

const storeTypeOptions = [
  { label: '集团门店', value: '集团门店' },
  { label: '景区门店', value: '景区门店' },
  { label: '零售门店', value: '零售门店' },
  { label: '餐饮门店', value: '餐饮门店' },
  { label: 'PMS', value: 'PMS' },
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
type StoreAppAuthorizationStatus = '已关闭' | '已到期' | '生效中';

interface StoreAppAuthorizationRecord {
  appId: string;
  appName: string;
  endAt: string;
  id: string;
  price: string;
  startAt: string;
  status: StoreAppAuthorizationStatus;
  storeId: string;
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
  storeName: '',
  storeType: '',
  tenantName: '',
});
const pageSize = ref(10);
const paymentChannelVisible = ref(false);
const paymentFeeVisible = ref(false);
const appAuthorizationDialogVisible = ref(false);
const activeAppAuthorizationAction = ref<'开通应用' | '续期授权'>('开通应用');
const maintenanceVersion = ref('');
const selectedAppAuthorizationId = ref('');
const selectedStoreId = ref('');
const storeData = ref<StoreRecord[]>(
  interactions.sampleData.map((item) => normalizeStoreRecord(item)),
);
const paymentChannelForm = ref({
  b2bTerminalNo: 'H1859015',
  cashierTerminalNo: 'H1859024',
  defaultPayment: true,
  enabled: true,
  internalMerchantNo: '30',
  lklMode: 'OP00001021',
  merchantAppId: '800000020021015',
  merchantNo: '82255104733005E',
  miniProgramAppId: 'wxaf71326db6fe3f51',
  miniProgramSecret: '329ba4e853c2e5fd643b370ef1258',
  officialAccountAppId: 'wxd0701fd4cdf2b9fa',
  officialAccountSecret: '',
  paymentConfig: '拉卡拉支付(乐悠游)',
  paymentName: '拉卡拉支付',
  paymentRate: '0',
});
const paymentFeeForm = ref({
  alipayRate: '',
  creditCardRate: '',
  debitCardLimit: '20',
  debitCardRate: '',
  unionQrCreditRate: '',
  unionQrDebitLimit: '20',
  unionQrDebitRate: '',
  wechatRate: '',
  withdrawFee: '',
});
const appAuthorizationForm = ref({
  appId: '',
  dateRange: [] as string[],
});
const availableApplications = [
  {
    appId: 'APP-MEMBER-001',
    appName: '会员营销中心',
    price: '199 元/月',
  },
  {
    appId: 'APP-INSPECTION-002',
    appName: '门店巡检台',
    price: '99 元/月',
  },
  {
    appId: 'APP-ANALYTICS-003',
    appName: '经营分析看板',
    price: '299 元/月',
  },
  {
    appId: 'APP-TICKET-VERIFY-004',
    appName: '票务核销助手',
    price: '149 元/月',
  },
] as const;
const appAuthorizationData = ref<StoreAppAuthorizationRecord[]>([
  {
    appId: 'APP-MEMBER-001',
    appName: '会员营销中心',
    endAt: '2027-06-30',
    id: 'auth-store-001-member',
    price: '199 元/月',
    startAt: '2026-07-01',
    status: '生效中',
    storeId: 'store-001',
  },
  {
    appId: 'APP-ANALYTICS-003',
    appName: '经营分析看板',
    endAt: '2027-06-30',
    id: 'auth-store-001-analytics',
    price: '299 元/月',
    startAt: '2026-07-01',
    status: '生效中',
    storeId: 'store-001',
  },
  {
    appId: 'APP-INSPECTION-002',
    appName: '门店巡检台',
    endAt: '2026-12-31',
    id: 'auth-store-002-inspection',
    price: '99 元/月',
    startAt: '2026-07-02',
    status: '已到期',
    storeId: 'store-002',
  },
  {
    appId: 'APP-TICKET-VERIFY-004',
    appName: '票务核销助手',
    endAt: '2027-03-31',
    id: 'auth-store-003-ticket',
    price: '149 元/月',
    startAt: '2026-07-03',
    status: '已关闭',
    storeId: 'store-003',
  },
]);

const pageTitle = computed(() => String(route.meta.title ?? '门店管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P0'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const selectedStore = computed(
  () =>
    storeData.value.find((item) => item.id === selectedStoreId.value) ?? null,
);
const activeInteraction = computed(() => {
  const baseAction = actionCatalog.value.find(
    (item) => item.label === activeAction.value,
  );

  if (!baseAction) {
    return undefined;
  }

  return baseAction;
});
const isCreateMode = computed(() => activeAction.value === '新建门店');
const isDelayMode = computed(() => activeAction.value === '延期');
const isBasicInfoMode = computed(() => activeAction.value === '基础信息');
const isAuthorizationMode = computed(() => activeAction.value === '功能授权');
const isPaymentMode = computed(() => activeAction.value === '支付配置');
const isMaintenanceMode = computed(
  () =>
    isBasicInfoMode.value || isAuthorizationMode.value || isPaymentMode.value,
);
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isDelayMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isDelayMode.value,
);
const submitButtonText = computed(() =>
  isDelayMode.value ? '确认延期' : '保存',
);
const filteredStores = computed(() => {
  const name = filterState.value.storeName.trim().toLowerCase();
  const tenantName = filterState.value.tenantName;
  const storeType = filterState.value.storeType;
  const status = filterState.value.status;

  return storeData.value.filter((item) => {
    const matchName =
      !name ||
      item.storeName.toLowerCase().includes(name) ||
      item.managerPhone.toLowerCase().includes(name) ||
      item.managerUsername.toLowerCase().includes(name);
    const matchTenant = !tenantName || item.tenantName === tenantName;
    const matchType = !storeType || item.storeType === storeType;
    const matchStatus = !status || item.status === status;

    return matchName && matchTenant && matchType && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredStores.value.slice(start, end);
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
const maintenanceFeatureItems = computed(() =>
  getVersionFeatureItems(selectedStore.value?.version ?? ''),
);
const selectedStoreAppAuthorizations = computed(() => {
  if (!selectedStore.value) {
    return [];
  }

  return appAuthorizationData.value.filter(
    (item) => item.storeId === selectedStore.value?.id,
  );
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

function getDefaultAuthorizationExpireAt() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const nextYear = now.getFullYear() + 1;

  return `${nextYear}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function generateStoreCode() {
  const maxNumber = storeData.value.reduce((max, item) => {
    const match = item.storeCode.match(/^ST(\d+)$/);

    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `ST${String(maxNumber + 1).padStart(4, '0')}`;
}

function normalizeStoreRecord(record: StoreRecord): StoreRecord {
  return {
    address: record.address ?? '待补充地址',
    authorizationExpireAt:
      record.authorizationExpireAt ?? getDefaultAuthorizationExpireAt(),
    createdAt: record.createdAt ?? getCurrentDateTime(),
    detailAddress: record.detailAddress ?? '待补充详细地址',
    id: record.id ?? `store-${Math.random().toString(36).slice(2, 10)}`,
    managerPhone: record.managerPhone ?? '',
    managerUsername: record.managerUsername ?? record.managerPhone ?? '',
    payRate: record.payRate ?? '0.60%',
    status: (record.status as StoreStatus) || '启用',
    storeCode: record.storeCode ?? 'ST0000',
    storeName: record.storeName ?? '',
    storeType: record.storeType ?? '',
    tenantName: record.tenantName ?? '',
    version: record.version ?? '基础版',
  };
}

function getStoreRow(row: Record<string, any>) {
  return row as StoreRecord;
}

function getCellValue(row: StoreRecord, key: string) {
  return row[key as keyof StoreRecord] ?? '-';
}

function getStatusTagType(status: StoreStatus) {
  switch (status) {
    case '启用':
      return 'success';
    case '过期':
      return 'warning';
    case '停用':
    default:
      return 'danger';
  }
}

function getAppAuthorizationStatusTagType(status: StoreAppAuthorizationStatus) {
  if (status === '生效中') {
    return 'success';
  }
  if (status === '已到期') {
    return 'warning';
  }
  return 'info';
}

function getVersionFeatureItems(version: string) {
  switch (version) {
    case '专业版':
      return ['标准门店管理', '票务订单管理', '基础数据报表', '消息通知'];
    case '旗舰版':
      return [
        '全量门店管理',
        '高级票务策略',
        '多渠道经营分析',
        '自动化消息通知',
        '专属运营支持',
      ];
    case '基础版':
    default:
      return ['基础门店资料', '基础订单查看', '管理员账号维护'];
  }
}

function openAction(action: InteractionItem, row?: StoreRecord) {
  activeAction.value = action.label;
  selectedStoreId.value = row?.id ?? '';
  maintenanceVersion.value = row?.version ?? '';
  applyInteractionForm(action);

  if (action.label === '延期' && row) {
    detailActionFormApi.resetForm({
      values: {
        newAuthorizationExpireAt: row.authorizationExpireAt,
      },
    });
  }

  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const storeRow = getStoreRow(row);
  openAction(action, storeRow);
}

function openStoreDelayAction(row: StoreRecord) {
  const delayAction = actionCatalog.value.find((item) => item.label === '延期');

  if (delayAction) {
    openAction(delayAction, row);
  }
}

function openPaymentChannelDialog() {
  paymentChannelVisible.value = true;
}

function openPaymentFeeDialog() {
  paymentFeeVisible.value = true;
}

function resetAppAuthorizationForm() {
  appAuthorizationForm.value = {
    appId: '',
    dateRange: [],
  };
}

function openCreateAppAuthorizationDialog() {
  activeAppAuthorizationAction.value = '开通应用';
  selectedAppAuthorizationId.value = '';
  resetAppAuthorizationForm();
  appAuthorizationDialogVisible.value = true;
}

function getAppAuthorizationRow(
  row: Record<string, any>,
): StoreAppAuthorizationRecord {
  return {
    appId: row.appId ?? '',
    appName: row.appName ?? '',
    endAt: row.endAt ?? '',
    id: row.id ?? '',
    price: row.price ?? '',
    startAt: row.startAt ?? '',
    status: row.status ?? '生效中',
    storeId: row.storeId ?? '',
  };
}

function openRenewAppAuthorizationDialog(row: Record<string, any>) {
  const record = getAppAuthorizationRow(row);
  activeAppAuthorizationAction.value = '续期授权';
  selectedAppAuthorizationId.value = record.id;
  appAuthorizationForm.value = {
    appId: record.appId,
    dateRange: [record.startAt, record.endAt],
  };
  appAuthorizationDialogVisible.value = true;
}

function saveAppAuthorization() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  const app = availableApplications.find(
    (item) => item.appId === appAuthorizationForm.value.appId,
  );
  const [startAt, endAt] = appAuthorizationForm.value.dateRange;

  if (!app || !startAt || !endAt) {
    ElMessage.warning('请先选择应用和授权时间');
    return;
  }

  if (startAt > endAt) {
    ElMessage.warning('授权结束时间不能早于开始时间');
    return;
  }

  if (activeAppAuthorizationAction.value === '续期授权') {
    appAuthorizationData.value = appAuthorizationData.value.map((item) =>
      item.id === selectedAppAuthorizationId.value
        ? {
            ...item,
            endAt,
            startAt,
            status: '生效中',
          }
        : item,
    );
    ElMessage.success(`已续期应用授权：${app.appName}`);
  } else {
    const duplicated = appAuthorizationData.value.some(
      (item) =>
        item.storeId === selectedStore.value?.id &&
        item.appId === app.appId &&
        item.status === '生效中',
    );

    if (duplicated) {
      ElMessage.warning('当前门店已存在生效中的同应用授权');
      return;
    }

    appAuthorizationData.value.unshift({
      appId: app.appId,
      appName: app.appName,
      endAt,
      id: `auth-${Date.now()}`,
      price: app.price,
      startAt,
      status: '生效中',
      storeId: selectedStore.value.id,
    });
    ElMessage.success(
      `已为 ${selectedStore.value.storeName} 开通应用：${app.appName}`,
    );
  }

  appAuthorizationDialogVisible.value = false;
  resetAppAuthorizationForm();
}

function closeAppAuthorization(row: Record<string, any>) {
  const record = getAppAuthorizationRow(row);

  if (record.status === '已关闭') {
    ElMessage.info('当前应用授权已关闭');
    return;
  }

  appAuthorizationData.value = appAuthorizationData.value.map((item) =>
    item.id === record.id
      ? {
          ...item,
          status: '已关闭',
        }
      : item,
  );
  ElMessage.success(`已关闭应用授权：${record.appName}`);
}

function savePaymentChannel() {
  if (!paymentChannelForm.value.paymentConfig.trim()) {
    ElMessage.warning('请选择支付配置');
    return;
  }

  if (!paymentChannelForm.value.paymentName.trim()) {
    ElMessage.warning('请输入支付名称');
    return;
  }

  paymentChannelVisible.value = false;
  ElMessage.success('支付通道已保存');
}

function savePaymentFee() {
  paymentFeeVisible.value = false;
  ElMessage.success('费率配置已保存');
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function updateStoreRecord(id: string, patch: Partial<StoreRecord>) {
  const target = storeData.value.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  Object.assign(target, patch);
  return target;
}

function handleFilterSubmit() {
  filterState.value = {
    storeName: filterState.value.storeName.trim(),
    tenantName: filterState.value.tenantName.trim(),
    storeType: filterState.value.storeType.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    status: '',
    storeName: '',
    storeType: '',
    tenantName: '',
  };
  currentPage.value = 1;
}

function isDuplicateStore(storeName: string, managerPhone: string) {
  return storeData.value.some(
    (item) =>
      item.storeName === storeName || item.managerPhone === managerPhone,
  );
}

async function createStore(values: Record<string, any>) {
  const tenantName = String(values.tenantName ?? '').trim();
  const storeType = String(values.storeType ?? '').trim();
  const storeName = String(values.storeName ?? '').trim();
  const address = String(values.address ?? '').trim();
  const detailAddress = String(values.detailAddress ?? '').trim();
  const managerPhone = String(values.phone ?? '').trim();
  const managerUsername = String(values.username ?? '').trim();
  const password = String(values.password ?? '').trim();

  if (
    !tenantName ||
    !storeType ||
    !storeName ||
    !address ||
    !detailAddress ||
    !managerPhone ||
    !managerUsername ||
    !password
  ) {
    ElMessage.warning('请先填写完整的新建门店信息');
    return;
  }

  if (isDuplicateStore(storeName, managerPhone)) {
    ElMessage.warning('门店名称或管理员手机号已存在，请调整后再提交');
    return;
  }

  storeData.value.unshift({
    address,
    authorizationExpireAt: getDefaultAuthorizationExpireAt(),
    createdAt: getCurrentDateTime(),
    detailAddress,
    id: `store-${Date.now()}`,
    managerPhone,
    managerUsername,
    payRate: '0.60%',
    status: '启用',
    storeCode: generateStoreCode(),
    storeName,
    storeType,
    tenantName,
    version: '基础版',
  });
  currentPage.value = 1;
  ElMessage.success(`已新建门店：${storeName}`);
  closeDetailDrawer();
}

function saveMaintenanceVersion() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  const version = maintenanceVersion.value.trim();

  if (!version) {
    ElMessage.warning('请选择要切换的门店版本');
    return;
  }

  if (selectedStore.value.version === version) {
    ElMessage.info('当前已是该门店版本');
    return;
  }

  updateStoreRecord(selectedStore.value.id, { version });
  ElMessage.success(
    `已切换 ${selectedStore.value.storeName} 的版本到 ${version}`,
  );
}

function toggleMaintenanceStatus() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  const targetStatus = selectedStore.value.status === '启用' ? '停用' : '启用';

  updateStoreRecord(selectedStore.value.id, {
    status: targetStatus,
  });
  ElMessage.success(`已${targetStatus}门店：${selectedStore.value.storeName}`);
}

function getMaintenanceStatusButtonText(status: StoreStatus) {
  return status === '启用' ? '停用门店' : '启用门店';
}

function getMaintenanceStatusButtonType(status: StoreStatus) {
  return status === '启用' ? 'danger' : 'success';
}

function getMaintenanceStatusTip(status: StoreStatus) {
  return status === '启用'
    ? '停用后，门店业务能力将暂停使用。'
    : '启用后，门店将继续使用业务能力。';
}

async function delayStore(values: Record<string, any>) {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    closeDetailDrawer();
    return;
  }

  const newAuthorizationExpireAt = String(
    values.newAuthorizationExpireAt ?? '',
  ).trim();

  if (!newAuthorizationExpireAt) {
    ElMessage.warning('请选择新的授权到期日');
    return;
  }

  if (newAuthorizationExpireAt <= selectedStore.value.authorizationExpireAt) {
    ElMessage.warning('新的授权到期日必须晚于当前到期日');
    return;
  }

  const nextStatus =
    selectedStore.value.status === '过期' ? '启用' : selectedStore.value.status;

  updateStoreRecord(selectedStore.value.id, {
    authorizationExpireAt: newAuthorizationExpireAt,
    status: nextStatus,
  });
  ElMessage.success(
    `已延期 ${selectedStore.value.storeName} 至 ${newAuthorizationExpireAt}`,
  );
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createStore(values);
    return;
  }

  if (isDelayMode.value) {
    await delayStore(values);
  }
}

async function submitActiveAction() {
  await detailActionFormApi.validateAndSubmitForm();
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page;
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

watch(detailVisible, (visible) => {
  if (!visible) {
    activeAction.value = '';
    detailExplanationVisible.value = false;
    maintenanceVersion.value = '';
    selectedStoreId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建门店',
        type: 'primary',
        description: '创建门店并同步初始化门店管理员账号。',
        fields: [
          createSelectField({
            field: 'tenantName',
            label: '所属租户',
            note: '归属租户',
            options: sampleTenantOptions,
            required: true,
          }),
          createSelectField({
            field: 'storeType',
            label: '门店类型',
            note: '创建后不可修改',
            options: storeTypeOptions,
            required: true,
          }),
          createTextField({
            field: 'storeName',
            label: '门店名称',
            note: '门店展示名称',
            required: true,
          }),
          createTextField({
            field: 'address',
            label: '地址',
            note: '门店地址',
            required: true,
          }),
          createTextareaField({
            field: 'detailAddress',
            label: '详细地址',
            note: '门店详细地址',
            required: true,
            rows: 3,
          }),
          createTextField({
            field: 'phone',
            label: '手机号',
            note: '门店管理员手机号',
            required: true,
          }),
          createTextField({
            field: 'username',
            label: '用户名',
            note: '门店管理员用户名',
            required: true,
          }),
          createPasswordField({
            field: 'password',
            label: '密码',
            note: '门店管理员初始密码',
            required: true,
          }),
        ],
        goal: '创建门店并为后续版本与应用授权建立基础。',
        permissionPoints: ['新建'],
        processSteps: [
          '点击“新建门店”。',
          '录入门店基础字段与管理员账号信息。',
          '提交后生成门店。',
          '创建成功后继续配置版本和应用授权。',
        ],
      },
    ],
    columns: [
      { key: 'storeCode', label: '门店编号', minWidth: 120 },
      { key: 'storeName', label: '门店名称', minWidth: 160 },
      { key: 'storeType', label: '门店类型', minWidth: 120 },
      { key: 'version', label: '门店版本', minWidth: 120 },
      { key: 'status', label: '门店状态', minWidth: 110 },
      { key: 'authorizationExpireAt', label: '授权到期', minWidth: 130 },
      { key: 'managerUsername', label: '管理员账号', minWidth: 150 },
      { key: 'managerPhone', label: '管理员手机号', minWidth: 140 },
      { key: 'tenantName', label: '所属租户', minWidth: 150 },
      { key: 'createdAt', label: '创建时间', minWidth: 150 },
      { key: 'payRate', label: '支付费率', minWidth: 110 },
    ],
    rowActions: [
      {
        label: '基础信息',
        description: '维护门店基础信息、功能授权、版本和支付信息。',
        goal: '查看门店资料、切换门店版本，并处理门店启停状态。',
        permissionPoints: ['查看', '切换版本'],
        processSteps: [
          '从列表点击“基础信息”。',
          '查看门店资料、管理员账号和地址信息。',
          '按需切换版本或处理停用、启用。',
        ],
      },
      {
        label: '功能授权',
        description: '查看门店授权版本、应用授权、授权到期时间和当前功能。',
        goal: '确认门店版本能力、应用授权和有效期。',
        permissionPoints: ['查看', '开通应用', '续期授权', '关闭授权', '延期'],
        processSteps: [
          '从列表点击“功能授权”。',
          '查看授权版本、授权状态、版本基础功能和门店应用授权。',
          '按需开通应用、续期授权或关闭应用授权。',
          '如需延长门店整体授权有效期，点击“延期”。',
        ],
      },
      {
        label: '支付配置',
        description: '查看门店支付费率、所属租户和管理员手机号等支付关联信息。',
        goal: '确认门店支付配置和结算关联信息。',
        permissionPoints: ['查看'],
        processSteps: [
          '从列表点击“支付配置”。',
          '查看支付费率、所属租户和门店编号。',
          '按需维护支付通道或设置费率。',
        ],
      },
      {
        label: '延期',
        type: 'success',
        description: '延长门店授权到期时间，并在过期门店延期成功后恢复启用。',
        fields: [
          {
            field: 'newAuthorizationExpireAt',
            inputType: 'date',
            label: '新的授权到期日',
            note: '必须晚于当前授权到期日',
            required: true,
          },
          createTextareaField({
            field: 'delayReason',
            label: '延期原因',
            note: '记录本次延期的业务说明',
            rows: 3,
          }),
        ],
        goal: '延长门店授权有效期。',
        permissionPoints: ['延期'],
        processSteps: [
          '从门店列表点击“延期”。',
          '选择晚于当前授权到期日的新日期。',
          '提交后更新授权到期时间；过期门店会恢复为启用。',
        ],
      },
    ],
    sampleData: storeManagementSampleData,
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理门店基础信息、管理员账号、版本、应用授权和状态，覆盖新建、维护、停用和启用等核心动作。',
    documentNotes: [
      '门店类型创建成功后不可修改。',
      '版本切换后，能力边界会立即按新版本生效。',
      '应用授权归属于具体门店，可在功能授权中完成开通、续期和关闭。',
      '停用门店后，门店业务能力将暂停使用；重新启用后可继续使用。',
      '延期时新的授权到期日必须晚于当前授权到期日。',
    ],
    exceptions: [
      '门店名称或管理员手机号重复时，不允许创建。',
      '停用门店前需确认该门店当前允许暂停运营。',
      '启用门店前需确认该门店已满足继续使用条件。',
    ],
    fields: [
      { label: '所属租户', note: '门店归属的 SaaS 租户主体', required: true },
      {
        label: '门店类型',
        note: '集团门店、景区门店、零售门店、餐饮门店或 PMS，创建后不可修改',
        required: true,
      },
      { label: '门店名称', note: '门店展示名称', required: true },
      { label: '地址', note: '门店对外展示地址', required: true },
      { label: '管理员手机号', note: '门店管理员登录手机号', required: true },
      { label: '门店状态', note: '启用、停用或过期' },
    ],
    pageGoal: '查看与筛选门店，并完成门店生命周期内的关键管理动作。',
    permissionPoints: [
      '查看',
      '新建',
      '切换版本',
      '开通应用',
      '续期授权',
      '关闭授权',
      '延期',
      '停用',
      '启用',
    ],
    processSteps: [
      '通过门店名称、所属租户、门店类型和状态筛选目标门店。',
      '从列表操作栏进入基础信息、功能授权、支付信息或延期动作。',
      '在功能授权中完成版本切换、门店应用授权开通、续期、关闭和延期。',
      '在对应抽屉中完成停用或启用。',
      '提交后即时刷新门店状态与版本信息。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '由平台手动触发停用。',
        target: '停用',
        trigger: '停用',
      },
      {
        current: '启用',
        note: '门店整体授权到期后系统自动置为过期。',
        target: '过期',
        trigger: '授权到期',
      },
      {
        current: '停用',
        note: '启用后重新进入可用状态。',
        target: '启用',
        trigger: '启用',
      },
      {
        current: '过期',
        note: '处理续费后可重新启用。',
        target: '启用',
        trigger: '启用',
      },
      {
        current: '过期',
        note: '延期成功后恢复授权可用状态。',
        target: '启用',
        trigger: '延期',
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
            <ElFormItem label="门店名称">
              <ElInput
                v-model="filterState.storeName"
                clearable
                placeholder="请输入门店名称、管理员用户名或手机号"
              />
            </ElFormItem>

            <ElFormItem label="所属租户">
              <ElInput
                v-model="filterState.tenantName"
                clearable
                placeholder="请输入租户名称、用户名或手机号"
              />
            </ElFormItem>

            <ElFormItem label="门店类型">
              <ElSelect
                v-model="filterState.storeType"
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

            <ElFormItem label="门店状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择门店状态"
              >
                <ElOption
                  v-for="option in storeStatusOptions"
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
            :min-width="column.minWidth ?? 140"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getStoreRow(row).status)"
              >
                {{ getStoreRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getStoreRow(row), column.key)
              }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="150">
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

      <div
        v-if="isMaintenanceMode && selectedStore"
        class="flex flex-col gap-4"
      >
        <div class="drawer-summary-card">
          <div class="text-sm font-medium text-[var(--el-text-color-primary)]">
            当前门店
          </div>
          <div class="mt-2 flex items-center gap-3">
            <div class="text-lg font-semibold">
              {{ selectedStore.storeName }}
            </div>
            <ElTag :type="getStatusTagType(selectedStore.status)">
              {{ selectedStore.status }}
            </ElTag>
          </div>
        </div>

        <div v-if="isBasicInfoMode" class="flex flex-col gap-4">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="门店编号">
              {{ selectedStore.storeCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所属租户">
              {{ selectedStore.tenantName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="门店类型">
              {{ selectedStore.storeType }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="管理员账号">
              {{ selectedStore.managerUsername }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="管理员手机号">
              {{ selectedStore.managerPhone }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前版本">
              {{ selectedStore.version }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="创建时间">
              {{ selectedStore.createdAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="门店地址">
              {{ selectedStore.address }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="详细地址">
              {{ selectedStore.detailAddress }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <div class="drawer-section-card">
            <div class="text-sm font-medium">门店状态</div>
            <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
              {{ getMaintenanceStatusTip(selectedStore.status) }}
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <ElTag :type="getStatusTagType(selectedStore.status)">
                {{ selectedStore.status }}
              </ElTag>
              <ElButton
                :type="getMaintenanceStatusButtonType(selectedStore.status)"
                @click="toggleMaintenanceStatus"
              >
                {{ getMaintenanceStatusButtonText(selectedStore.status) }}
              </ElButton>
            </div>
          </div>
        </div>

        <div v-else-if="isAuthorizationMode" class="flex flex-col gap-4">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="授权版本">
              {{ selectedStore.version }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="授权到期">
              {{ selectedStore.authorizationExpireAt }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="授权状态">
              <ElTag :type="getStatusTagType(selectedStore.status)">
                {{ selectedStore.status }}
              </ElTag>
            </ElDescriptionsItem>
          </ElDescriptions>

          <div class="drawer-section-card">
            <div class="text-sm font-medium">切换版本</div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <ElSelect
                v-model="maintenanceVersion"
                class="maintenance-version-select"
                placeholder="请选择目标版本"
              >
                <ElOption label="基础版" value="基础版" />
                <ElOption label="专业版" value="专业版" />
                <ElOption label="旗舰版" value="旗舰版" />
              </ElSelect>
              <ElButton type="primary" @click="saveMaintenanceVersion">
                保存版本
              </ElButton>
            </div>
            <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
              版本切换后，功能授权会按新版本能力边界立即更新。
            </div>
          </div>

          <div class="drawer-section-card">
            <div class="text-sm font-medium">授权延期</div>
            <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
              延期会更新门店授权到期日；若当前门店已过期，延期成功后会恢复启用。
            </div>
            <div class="mt-3">
              <ElButton
                type="success"
                @click="openStoreDelayAction(selectedStore)"
              >
                延期
              </ElButton>
            </div>
          </div>

          <div class="drawer-section-card">
            <div class="text-sm font-medium">版本基础功能</div>
            <ul
              class="mt-2 list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
            >
              <li v-for="feature in maintenanceFeatureItems" :key="feature">
                {{ feature }}
              </li>
            </ul>
          </div>

          <div class="drawer-section-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">门店应用授权</div>
                <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  维护当前门店已开通应用、授权有效期和使用状态。
                </div>
              </div>
              <ElButton
                type="primary"
                @click="openCreateAppAuthorizationDialog"
              >
                开通应用
              </ElButton>
            </div>

            <ElTable
              class="mt-3"
              :data="selectedStoreAppAuthorizations"
              size="small"
              stripe
            >
              <ElTable.TableColumn
                label="应用ID"
                prop="appId"
                min-width="150"
              />
              <ElTable.TableColumn
                label="应用名称"
                prop="appName"
                min-width="150"
              />
              <ElTable.TableColumn label="价格" prop="price" min-width="110" />
              <ElTable.TableColumn
                label="开始时间"
                prop="startAt"
                min-width="120"
              />
              <ElTable.TableColumn
                label="到期时间"
                prop="endAt"
                min-width="120"
              />
              <ElTable.TableColumn label="状态" min-width="100">
                <template #default="{ row }">
                  <ElTag :type="getAppAuthorizationStatusTagType(row.status)">
                    {{ row.status }}
                  </ElTag>
                </template>
              </ElTable.TableColumn>
              <ElTable.TableColumn label="操作" fixed="right" min-width="130">
                <template #default="{ row }">
                  <ElSpace wrap>
                    <ElButton
                      link
                      type="success"
                      @click="openRenewAppAuthorizationDialog(row)"
                    >
                      续期
                    </ElButton>
                    <ElButton
                      v-if="row.status !== '已关闭'"
                      link
                      type="danger"
                      @click="closeAppAuthorization(row)"
                    >
                      关闭
                    </ElButton>
                  </ElSpace>
                </template>
              </ElTable.TableColumn>
            </ElTable>
          </div>
        </div>

        <div v-else-if="isPaymentMode" class="flex flex-col gap-4">
          <div class="drawer-section-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">支付通道</div>
                <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  维护门店收款通道、终端号和小程序/公众号配置。
                </div>
              </div>
              <ElButton type="primary" @click="openPaymentChannelDialog">
                新建通道
              </ElButton>
            </div>
          </div>

          <div class="drawer-section-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-sm font-medium">费率配置</div>
                <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  设置借记卡、微信、支付宝、银联二维码和提现手续费。
                </div>
              </div>
              <ElButton type="primary" @click="openPaymentFeeDialog">
                设置费率
              </ElButton>
            </div>
          </div>

          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="当前支付费率">
              {{ selectedStore.payRate }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所属租户">
              {{ selectedStore.tenantName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="门店名称">
              {{ selectedStore.storeName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="门店编号">
              {{ selectedStore.storeCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="管理员手机号">
              {{ selectedStore.managerPhone }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
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
      v-model="appAuthorizationDialogVisible"
      :title="activeAppAuthorizationAction"
      width="640px"
    >
      <ElForm
        :model="appAuthorizationForm"
        label-position="right"
        label-width="110px"
      >
        <ElFormItem label="授权应用">
          <ElSelect
            v-model="appAuthorizationForm.appId"
            :disabled="activeAppAuthorizationAction === '续期授权'"
            filterable
            placeholder="请选择授权应用"
          >
            <ElOption
              v-for="app in availableApplications"
              :key="app.appId"
              :label="`${app.appName} / ${app.price}`"
              :value="app.appId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="授权时间">
          <ElDatePicker
            v-model="appAuthorizationForm.dateRange"
            end-placeholder="到期时间"
            range-separator="至"
            start-placeholder="开始时间"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="appAuthorizationDialogVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" @click="saveAppAuthorization"> 保存 </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="paymentChannelVisible" title="新建通道" width="760px">
      <ElForm
        class="payment-channel-form"
        :model="paymentChannelForm"
        label-position="right"
        label-width="110px"
      >
        <div class="payment-form-grid">
          <ElFormItem label="支付配置">
            <ElSelect v-model="paymentChannelForm.paymentConfig" filterable>
              <ElOption label="拉卡拉支付(乐悠游)" value="拉卡拉支付(乐悠游)" />
              <ElOption label="微信支付" value="微信支付" />
              <ElOption label="支付宝" value="支付宝" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="支付名称">
            <ElInput v-model="paymentChannelForm.paymentName" />
          </ElFormItem>
          <ElFormItem label="商户编号">
            <ElInput v-model="paymentChannelForm.merchantNo" />
          </ElFormItem>
          <ElFormItem label="支付费率(%)">
            <ElInput v-model="paymentChannelForm.paymentRate" />
          </ElFormItem>
          <ElFormItem label="商户appid">
            <ElInput v-model="paymentChannelForm.merchantAppId" />
          </ElFormItem>
          <ElFormItem label="拉卡拉isv模式">
            <ElInput v-model="paymentChannelForm.lklMode" />
          </ElFormItem>
          <ElFormItem class="payment-form-span" label="内部商户号">
            <ElInput v-model="paymentChannelForm.internalMerchantNo" />
          </ElFormItem>
          <ElFormItem label="收单终端号">
            <ElInput v-model="paymentChannelForm.cashierTerminalNo" />
          </ElFormItem>
          <ElFormItem label="B2B终端号">
            <ElInput v-model="paymentChannelForm.b2bTerminalNo" />
          </ElFormItem>
          <ElFormItem label="公众号Appid">
            <ElInput v-model="paymentChannelForm.officialAccountAppId" />
          </ElFormItem>
          <ElFormItem label="公众号SECRET">
            <ElInput
              v-model="paymentChannelForm.officialAccountSecret"
              placeholder="公众号SECRET"
            />
          </ElFormItem>
          <ElFormItem label="小程序Appid">
            <ElInput v-model="paymentChannelForm.miniProgramAppId" />
          </ElFormItem>
          <ElFormItem label="小程序SECRET">
            <ElInput v-model="paymentChannelForm.miniProgramSecret" />
          </ElFormItem>
          <ElFormItem label="启用状态">
            <ElSwitch v-model="paymentChannelForm.enabled" />
          </ElFormItem>
          <ElFormItem label="默认支付">
            <ElSwitch v-model="paymentChannelForm.defaultPayment" />
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="paymentChannelVisible = false">取消</ElButton>
        <ElButton type="primary" @click="savePaymentChannel">提交</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="paymentFeeVisible" title="设置费率" width="840px">
      <ElForm
        class="payment-fee-form"
        :model="paymentFeeForm"
        label-position="right"
        label-width="150px"
      >
        <div class="payment-form-grid">
          <ElFormItem label="借记卡手续费上限" required>
            <ElInput v-model="paymentFeeForm.debitCardLimit">
              <template #append>元</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="银联二维码借记卡上限" required>
            <ElInput v-model="paymentFeeForm.unionQrDebitLimit">
              <template #append>元</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="借记卡手续费率" required>
            <ElInput
              v-model="paymentFeeForm.debitCardRate"
              placeholder="借记卡手续费率"
            >
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="贷记卡手续费率" required>
            <ElInput
              v-model="paymentFeeForm.creditCardRate"
              placeholder="贷记卡手续费率"
            >
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="微信费率" required>
            <ElInput v-model="paymentFeeForm.wechatRate" placeholder="微信费率">
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="支付宝费率" required>
            <ElInput
              v-model="paymentFeeForm.alipayRate"
              placeholder="支付宝费率"
            >
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="银联二维码借记费率" required>
            <ElInput
              v-model="paymentFeeForm.unionQrDebitRate"
              placeholder="银联二维码借记费率"
            >
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="银联二维码贷记费率" required>
            <ElInput
              v-model="paymentFeeForm.unionQrCreditRate"
              placeholder="银联二维码贷记费率"
            >
              <template #append>%</template>
            </ElInput>
          </ElFormItem>
          <ElFormItem label="提现手续费" required>
            <ElInput
              v-model="paymentFeeForm.withdrawFee"
              placeholder="提现手续费"
            >
              <template #append>元</template>
            </ElInput>
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <ElButton @click="paymentFeeVisible = false">取消</ElButton>
        <ElButton type="primary" @click="savePaymentFee">提交</ElButton>
      </template>
    </ElDialog>

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

.drawer-section-card,
.drawer-summary-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  padding: 16px;
}

.maintenance-version-select {
  width: 220px;
}
</style>
