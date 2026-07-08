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
  createPasswordField,
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  sampleTenantOptions,
  storeStatusOptions,
  storeTypeOptions,
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
type StoreStatus = '停用' | '正常' | '注销' | '过期';

interface StoreRecord {
  address: string;
  createdAt: string;
  detailAddress: string;
  id: string;
  managerPhone: string;
  managerUsername: string;
  status: StoreStatus;
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
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedStore = computed(
  () =>
    storeData.value.find((item) => item.id === selectedStoreId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新建门店');
const isViewMode = computed(() => activeAction.value === '查看详情');
const isSwitchVersionMode = computed(() => activeAction.value === '切换版本');
const isDisableMode = computed(() => activeAction.value === '停用');
const isRestoreMode = computed(() => activeAction.value === '恢复门店');
const isCancelMode = computed(() => activeAction.value === '注销门店');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isCreateMode.value || isSwitchVersionMode.value,
);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isSwitchVersionMode.value ||
    isDisableMode.value ||
    isRestoreMode.value ||
    isCancelMode.value,
);
const submitButtonText = computed(() => {
  if (isSwitchVersionMode.value) {
    return '确认切换';
  }
  if (isDisableMode.value) {
    return '确认停用';
  }
  if (isRestoreMode.value) {
    return '确认恢复';
  }
  if (isCancelMode.value) {
    return '确认注销';
  }
  return '保存';
});
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
    content: '重置',
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

function buildFilterSchema(filters: readonly SaaSFilterField[] = []) {
  return filters.map((filter, index) => buildFieldSchema(filter, index));
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

function normalizeStoreRecord(record: Record<string, string>): StoreRecord {
  return {
    address: record.address ?? '待补充地址',
    createdAt: record.createdAt ?? getCurrentDateTime(),
    detailAddress: record.detailAddress ?? '待补充详细地址',
    id: record.id ?? `store-${Math.random().toString(36).slice(2, 10)}`,
    managerPhone: record.managerPhone ?? '',
    managerUsername: record.managerUsername ?? record.managerPhone ?? '',
    status: (record.status as StoreStatus) || '正常',
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
    case '正常':
      return 'success';
    case '注销':
      return 'info';
    case '过期':
      return 'warning';
    case '停用':
    default:
      return 'danger';
  }
}

function openAction(action: InteractionItem, row?: StoreRecord) {
  activeAction.value = action.label;
  selectedStoreId.value = row?.id ?? '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  openAction(action, getStoreRow(row));
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

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    status: String(values.status ?? '').trim(),
    storeName: String(values.storeName ?? '').trim(),
    storeType: String(values.storeType ?? '').trim(),
    tenantName: String(values.tenantName ?? '').trim(),
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
    createdAt: getCurrentDateTime(),
    detailAddress,
    id: `store-${Date.now()}`,
    managerPhone,
    managerUsername,
    status: '正常',
    storeName,
    storeType,
    tenantName,
    version: '基础版',
  });
  currentPage.value = 1;
  ElMessage.success(`已新建门店：${storeName}`);
  closeDetailDrawer();
}

async function switchStoreVersion(values: Record<string, any>) {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  const version = String(values.version ?? '').trim();

  if (!version) {
    ElMessage.warning('请选择要切换的门店版本');
    return;
  }

  updateStoreRecord(selectedStore.value.id, {
    version,
  });
  ElMessage.success(
    `已切换 ${selectedStore.value.storeName} 的版本到 ${version}`,
  );
  closeDetailDrawer();
}

async function disableStore() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  if (selectedStore.value.status === '停用') {
    ElMessage.info('当前门店已是停用状态');
    closeDetailDrawer();
    return;
  }

  if (selectedStore.value.status === '注销') {
    ElMessage.warning('已注销门店不能再执行停用');
    closeDetailDrawer();
    return;
  }

  updateStoreRecord(selectedStore.value.id, {
    status: '停用',
  });
  ElMessage.success(`已停用门店：${selectedStore.value.storeName}`);
  closeDetailDrawer();
}

async function restoreStore() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  if (selectedStore.value.status === '注销') {
    ElMessage.warning('已注销门店不能恢复');
    closeDetailDrawer();
    return;
  }

  updateStoreRecord(selectedStore.value.id, {
    status: '正常',
  });
  ElMessage.success(`已恢复门店：${selectedStore.value.storeName}`);
  closeDetailDrawer();
}

async function cancelStore() {
  if (!selectedStore.value) {
    ElMessage.warning('未找到当前门店，请重新选择');
    return;
  }

  updateStoreRecord(selectedStore.value.id, {
    status: '注销',
  });
  ElMessage.success(`已注销门店：${selectedStore.value.storeName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createStore(values);
    return;
  }

  if (isSwitchVersionMode.value) {
    await switchStoreVersion(values);
  }
}

async function submitActiveAction() {
  if (isDisableMode.value) {
    await disableStore();
    return;
  }

  if (isRestoreMode.value) {
    await restoreStore();
    return;
  }

  if (isCancelMode.value) {
    await cancelStore();
    return;
  }

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
      { key: 'storeName', label: '门店名称' },
      { key: 'tenantName', label: '所属租户' },
      { key: 'storeType', label: '门店类型' },
      { key: 'version', label: '门店版本' },
      { key: 'status', label: '门店状态' },
      { key: 'managerPhone', label: '管理员手机号' },
    ],
    filters: [
      createTextFilter({
        field: 'storeName',
        label: '门店名称',
        placeholder: '请输入门店名称、管理员用户名或手机号',
      }),
      createSelectFilter({
        field: 'tenantName',
        label: '所属租户',
        options: sampleTenantOptions,
      }),
      createSelectFilter({
        field: 'storeType',
        label: '门店类型',
        options: storeTypeOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '门店状态',
        options: storeStatusOptions,
      }),
    ],
    rowActions: [
      {
        label: '查看详情',
        description: '查看门店基础信息、版本、权益和管理员情况。',
        goal: '快速了解门店当前配置与状态。',
        permissionPoints: ['查看'],
      },
      {
        label: '切换版本',
        type: 'warning',
        description: '切换门店当前使用版本，立即按新版本能力边界生效。',
        documentNotes: ['版本切换后，被新版本屏蔽的功能将不可见或不可用。'],
        fields: [
          createSelectField({
            field: 'version',
            label: '目标版本',
            note: '切换后立即生效',
            options: [
              { label: '基础版', value: '基础版' },
              { label: '专业版', value: '专业版' },
              { label: '旗舰版', value: '旗舰版' },
            ],
            required: true,
          }),
        ],
        goal: '调整门店功能边界。',
        permissionPoints: ['切换版本'],
        processSteps: [
          '选择门店需要切换到的目标版本。',
          '系统立即按新版本能力边界生效。',
          '受新版本限制的功能将同步变化。',
        ],
      },
      {
        label: '停用',
        type: 'danger',
        description: '手动将门店置为停用状态。',
        goal: '停止门店继续使用业务能力。',
        permissionPoints: ['停用'],
      },
      {
        label: '恢复门店',
        type: 'success',
        description: '将停用或过期门店恢复到正常状态。',
        goal: '恢复门店正常使用。',
        permissionPoints: ['恢复'],
      },
      {
        label: '注销门店',
        type: 'danger',
        description: '注销后门店不可恢复，请谨慎操作。',
        goal: '彻底终止门店使用。',
        permissionPoints: ['注销'],
      },
    ],
    sampleData: [
      {
        address: '深圳市南山区欢乐谷园区主入口',
        createdAt: '2026-07-01 10:30',
        detailAddress: '欢乐谷东区 1 号服务中心',
        id: 'store-001',
        managerPhone: '13600009999',
        managerUsername: 'happy_valley_east',
        status: '正常',
        storeName: '欢乐谷东区店',
        storeType: '景区门店',
        tenantName: '星河票务集团',
        version: '旗舰版',
      },
      {
        address: '青岛市市南区海岸线游客中心',
        createdAt: '2026-07-02 15:00',
        detailAddress: '海岸线游客中心 2 楼',
        id: 'store-002',
        managerPhone: '13700008888',
        managerUsername: 'coast_visitor_center',
        status: '过期',
        storeName: '海岸线游客中心',
        storeType: '游客中心',
        tenantName: '海岸线文旅',
        version: '基础版',
      },
      {
        address: '广州市番禺区欢乐谷西区',
        createdAt: '2026-07-03 09:15',
        detailAddress: '欢乐谷西区售票处旁',
        id: 'store-003',
        managerPhone: '13800007777',
        managerUsername: 'happy_valley_west',
        status: '停用',
        storeName: '欢乐谷西区店',
        storeType: '景区门店',
        tenantName: '星河票务集团',
        version: '专业版',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理门店基础信息、管理员账号、版本和状态，覆盖新建、查看详情、切换版本、停用、恢复和注销等核心动作。',
    documentNotes: [
      '门店类型创建成功后不可修改。',
      '版本切换后，能力边界会立即按新版本生效。',
      '注销门店属于不可逆操作，应谨慎执行。',
    ],
    exceptions: [
      '门店名称或管理员手机号重复时，不允许创建。',
      '已注销门店不能恢复或继续停用。',
      '停用门店前需确认该门店当前允许暂停运营。',
    ],
    fields: [
      { label: '所属租户', note: '门店归属的 SaaS 租户主体', required: true },
      {
        label: '门店类型',
        note: '景区门店或游客中心，创建后不可修改',
        required: true,
      },
      { label: '门店名称', note: '门店展示名称', required: true },
      { label: '地址', note: '门店对外展示地址', required: true },
      { label: '管理员手机号', note: '门店管理员登录手机号', required: true },
      { label: '门店状态', note: '正常、停用、过期或注销' },
    ],
    pageGoal: '查看与筛选门店，并完成门店生命周期内的关键管理动作。',
    permissionPoints: ['查看', '新建', '切换版本', '停用', '恢复', '注销'],
    processSteps: [
      '通过门店名称、所属租户、门店类型和状态筛选目标门店。',
      '从列表进入查看详情、切换版本、停用、恢复或注销动作。',
      '在抽屉中完成表单填写或确认操作。',
      '提交后即时刷新门店状态与版本信息。',
    ],
    statusTransitions: [
      {
        current: '正常',
        note: '由平台手动触发停用。',
        target: '停用',
        trigger: '停用',
      },
      {
        current: '正常',
        note: '权益到期后系统自动置为过期。',
        target: '过期',
        trigger: '权益到期',
      },
      {
        current: '停用',
        note: '恢复后重新进入正常状态。',
        target: '正常',
        trigger: '恢复门店',
      },
      {
        current: '过期',
        note: '处理续费或恢复后重新启用。',
        target: '正常',
        trigger: '恢复门店',
      },
      {
        current: '正常 / 停用 / 过期',
        note: '注销后不可恢复。',
        target: '注销',
        trigger: '注销门店',
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
            min-width="140"
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
                  :disabled="
                    (action.label === '停用' &&
                      getStoreRow(row).status === '注销') ||
                    (action.label === '恢复门店' &&
                      getStoreRow(row).status === '注销')
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

      <div v-if="isViewMode && selectedStore" class="flex flex-col gap-4">
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

        <ElDescriptions :column="1" border>
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
      </div>

      <div
        v-else-if="
          (isDisableMode || isRestoreMode || isCancelMode) && selectedStore
        "
        class="flex flex-col gap-4"
      >
        <div class="drawer-warning-card">
          <div class="text-sm font-medium text-[var(--el-color-danger)]">
            {{
              isDisableMode
                ? '停用后门店将暂停使用业务能力'
                : isRestoreMode
                  ? '恢复后门店将重新回到正常使用状态'
                  : '注销后门店不可恢复，请谨慎确认'
            }}
          </div>
          <div class="mt-2 text-sm text-[var(--el-text-color-secondary)]">
            请确认当前操作对象无误，再点击底部按钮完成处理。
          </div>
        </div>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="门店名称">
            {{ selectedStore.storeName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="所属租户">
            {{ selectedStore.tenantName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前状态">
            <ElTag :type="getStatusTagType(selectedStore.status)">
              {{ selectedStore.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前版本">
            {{ selectedStore.version }}
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
