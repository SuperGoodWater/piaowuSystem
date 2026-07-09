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
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

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
type StoreStatus = '停用' | '启用' | '过期';

interface StoreRecord {
  address: string;
  authorizationExpireAt: string;
  createdAt: string;
  detailAddress: string;
  id: string;
  managerPhone: string;
  managerUsername: string;
  payRate: string;
  status: StoreStatus;
  storeCode: string;
  storeName: string;
  storeType: string;
  tenantName: string;
  version: string;
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
const maintenanceActiveTab = ref('basic');
const maintenanceVersion = ref('');
const selectedStoreId = ref('');
const storeData = ref<StoreRecord[]>(
  interactions.sampleData.map((item) => normalizeStoreRecord(item)),
);

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
const isMaintenanceMode = computed(() => activeAction.value === '维护');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value);
const showSubmitButton = computed(() => isCreateMode.value);
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

function normalizeStoreRecord(record: Record<string, string>): StoreRecord {
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
  maintenanceActiveTab.value = 'basic';
  maintenanceVersion.value = row?.version ?? '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const storeRow = getStoreRow(row);
  openAction(action, storeRow);
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

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createStore(values);
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
    maintenanceActiveTab.value = 'basic';
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
        goal: '创建门店并为后续版本与权益配置建立基础。',
        permissionPoints: ['新建'],
        processSteps: [
          '点击“新建门店”。',
          '录入门店基础字段与管理员账号信息。',
          '提交后生成门店。',
          '创建成功后继续配置版本和权益。',
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
        label: '维护',
        description: '维护门店基础信息、功能授权、版本和支付信息。',
        goal: '集中维护门店当前配置与状态。',
        permissionPoints: ['查看', '切换版本'],
        processSteps: [
          '进入维护抽屉。',
          '在基础信息中查看门店资料、切换版本，并处理停用或启用。',
          '在功能授权和支付信息中确认当前配置。',
        ],
      },
    ],
    sampleData: [
      {
        address: '深圳市南山区欢乐谷园区主入口',
        authorizationExpireAt: '2027-06-30',
        createdAt: '2026-07-01 10:30',
        detailAddress: '欢乐谷东区 1 号服务中心',
        id: 'store-001',
        managerPhone: '13600009999',
        managerUsername: 'happy_valley_east',
        payRate: '0.55%',
        status: '启用',
        storeCode: 'ST0001',
        storeName: '欢乐谷东区店',
        storeType: '景区门店',
        tenantName: '星河票务集团',
        version: '旗舰版',
      },
      {
        address: '青岛市市南区海岸线游客中心',
        authorizationExpireAt: '2026-12-31',
        createdAt: '2026-07-02 15:00',
        detailAddress: '海岸线游客中心 2 楼',
        id: 'store-002',
        managerPhone: '13700008888',
        managerUsername: 'coast_visitor_center',
        payRate: '0.68%',
        status: '过期',
        storeCode: 'ST0002',
        storeName: '海岸线游客中心',
        storeType: '零售门店',
        tenantName: '海岸线文旅',
        version: '基础版',
      },
      {
        address: '广州市番禺区欢乐谷西区',
        authorizationExpireAt: '2027-03-31',
        createdAt: '2026-07-03 09:15',
        detailAddress: '欢乐谷西区售票处旁',
        id: 'store-003',
        managerPhone: '13800007777',
        managerUsername: 'happy_valley_west',
        payRate: '0.60%',
        status: '停用',
        storeCode: 'ST0003',
        storeName: '欢乐谷西区店',
        storeType: '景区门店',
        tenantName: '星河票务集团',
        version: '专业版',
      },
      {
        address: '上海市浦东新区星河集团总部',
        authorizationExpireAt: '2028-07-04',
        createdAt: '2026-07-04 11:20',
        detailAddress: '星河总部 3 楼运营中心',
        id: 'store-004',
        managerPhone: '13900006666',
        managerUsername: 'galaxy_hq_store',
        payRate: '0.45%',
        status: '启用',
        storeCode: 'ST0004',
        storeName: '星河总部旗舰店',
        storeType: '集团门店',
        tenantName: '星河票务集团',
        version: '旗舰版',
      },
      {
        address: '深圳市南山区欢乐谷美食街',
        authorizationExpireAt: '2027-07-05',
        createdAt: '2026-07-05 13:45',
        detailAddress: '欢乐谷美食街 A12 档口',
        id: 'store-005',
        managerPhone: '13500005555',
        managerUsername: 'happy_food_a12',
        payRate: '0.72%',
        status: '启用',
        storeCode: 'ST0005',
        storeName: '欢乐谷美食街店',
        storeType: '餐饮门店',
        tenantName: '星河票务集团',
        version: '专业版',
      },
      {
        address: '厦门市思明区海岸线度假酒店',
        authorizationExpireAt: '2027-10-31',
        createdAt: '2026-07-06 08:50',
        detailAddress: '酒店前厅 PMS 服务台',
        id: 'store-006',
        managerPhone: '13400004444',
        managerUsername: 'coast_hotel_pms',
        payRate: '0.58%',
        status: '启用',
        storeCode: 'ST0006',
        storeName: '海岸线度假酒店 PMS',
        storeType: 'PMS',
        tenantName: '海岸线文旅',
        version: '专业版',
      },
      {
        address: '青岛市崂山区海岸线礼品中心',
        authorizationExpireAt: '2027-01-15',
        createdAt: '2026-07-07 16:10',
        detailAddress: '礼品中心 1 层收银区',
        id: 'store-007',
        managerPhone: '13300003333',
        managerUsername: 'coast_gift_shop',
        payRate: '0.70%',
        status: '停用',
        storeCode: 'ST0007',
        storeName: '海岸线礼品中心',
        storeType: '零售门店',
        tenantName: '海岸线文旅',
        version: '基础版',
      },
      {
        address: '杭州市西湖区星河城市会客厅',
        authorizationExpireAt: '2026-11-30',
        createdAt: '2026-07-08 10:05',
        detailAddress: '城市会客厅 B 区综合服务台',
        id: 'store-008',
        managerPhone: '13200002222',
        managerUsername: 'galaxy_city_lounge',
        payRate: '0.62%',
        status: '过期',
        storeCode: 'ST0008',
        storeName: '星河城市会客厅',
        storeType: '集团门店',
        tenantName: '星河票务集团',
        version: '基础版',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理门店基础信息、管理员账号、版本和状态，覆盖新建、维护、停用和启用等核心动作。',
    documentNotes: [
      '门店类型创建成功后不可修改。',
      '版本切换后，能力边界会立即按新版本生效。',
      '停用门店后，门店业务能力将暂停使用；重新启用后可继续使用。',
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
    permissionPoints: ['查看', '新建', '切换版本', '停用', '启用'],
    processSteps: [
      '通过门店名称、所属租户、门店类型和状态筛选目标门店。',
      '从列表进入维护动作。',
      '在维护抽屉中查看基础信息、功能授权和支付信息，并完成版本切换、停用或启用。',
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
        note: '权益到期后系统自动置为过期。',
        target: '过期',
        trigger: '权益到期',
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

          <ElTable.TableColumn label="操作" fixed="right" min-width="320">
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

        <ElTabs v-model="maintenanceActiveTab" class="maintenance-tabs">
          <ElTabPane label="基础信息" name="basic">
            <div class="flex flex-col gap-4">
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
          </ElTabPane>

          <ElTabPane label="功能授权" name="authorization">
            <div class="flex flex-col gap-4">
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
                <div class="text-sm font-medium">已授权功能</div>
                <ul
                  class="mt-2 list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
                >
                  <li v-for="feature in maintenanceFeatureItems" :key="feature">
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
          </ElTabPane>

          <ElTabPane label="支付信息" name="payment">
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="支付费率">
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
          </ElTabPane>
        </ElTabs>
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
            保存
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

.drawer-section-card,
.drawer-summary-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  padding: 16px;
}

.maintenance-tabs :deep(.el-tabs__content) {
  padding-top: 4px;
}

.maintenance-version-select {
  width: 220px;
}
</style>
