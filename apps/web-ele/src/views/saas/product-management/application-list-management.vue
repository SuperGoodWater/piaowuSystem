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

const appShelfStatusOptions = [
  { label: '已上架', value: '已上架' },
  { label: '已下架', value: '已下架' },
  { label: '已停用', value: '已停用' },
] as const;

const appTypeOptions = [
  { label: '营销应用', value: '营销应用' },
  { label: '运营应用', value: '运营应用' },
  { label: '数据应用', value: '数据应用' },
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
type AppShelfStatus = '已上架' | '已下架' | '已停用';

interface AppRecord {
  appIcon: string;
  appId: string;
  appIntro: string;
  appName: string;
  appType: string;
  appUrl: string;
  id: string;
  landingPageUrl: string;
  permissionApiFields: string;
  price: string;
  status: AppShelfStatus;
  updatedAt: string;
  visibility: string;
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
  appName: '',
  appType: '',
  status: '',
});
const pageSize = ref(10);
const selectedAppId = ref('');
const appData = ref<AppRecord[]>(
  interactions.sampleData.map((item) => normalizeAppRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '应用管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedApp = computed(
  () => appData.value.find((item) => item.id === selectedAppId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新增应用');
const isEditMode = computed(() => activeAction.value === '编辑');
const isOnlineMode = computed(() => activeAction.value === '上架');
const isOfflineMode = computed(() => activeAction.value === '下架');
const isEnableMode = computed(() => activeAction.value === '启用');
const isDisabledMode = computed(() => activeAction.value === '停用');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isOnlineMode.value ||
    isOfflineMode.value ||
    isEnableMode.value ||
    isDisabledMode.value,
);
const submitButtonText = computed(() => {
  if (isOnlineMode.value) {
    return '确认上架';
  }
  if (isOfflineMode.value) {
    return '确认下架';
  }
  if (isEnableMode.value) {
    return '确认启用';
  }
  if (isDisabledMode.value) {
    return '确认停用';
  }
  return '保存';
});
const filteredApps = computed(() => {
  const appName = filterState.value.appName.trim().toLowerCase();
  const appType = filterState.value.appType;
  const status = filterState.value.status;

  return appData.value.filter((item) => {
    const matchesName =
      !appName ||
      item.appName.toLowerCase().includes(appName) ||
      item.appId.toLowerCase().includes(appName);
    const matchesType = !appType || item.appType === appType;
    const matchesStatus = !status || item.status === status;
    return matchesName && matchesType && matchesStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredApps.value.slice(start, start + pageSize.value);
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
  wrapperClass: 'grid-cols-1',
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
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function normalizeAppRecord(record: Record<string, string>): AppRecord {
  return {
    appIcon: record.appIcon ?? '',
    appId: record.appId ?? '',
    appIntro: record.appIntro ?? '',
    appName: record.appName ?? '',
    appType: record.appType ?? '',
    appUrl: record.appUrl ?? '',
    id: record.id ?? `app-${Math.random().toString(36).slice(2, 10)}`,
    landingPageUrl: record.landingPageUrl ?? '',
    permissionApiFields: record.permissionApiFields ?? '',
    price: record.price ?? '',
    status: (record.status as AppShelfStatus) ?? '已下架',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
    visibility: record.visibility ?? '',
  };
}

function getAppRow(row: Record<string, any>) {
  return row as AppRecord;
}

function getCellValue(row: AppRecord, key: string) {
  return row[key as keyof AppRecord] ?? '-';
}

function getStatusTagType(status: AppShelfStatus) {
  if (status === '已上架') {
    return 'success';
  }
  if (status === '已停用') {
    return 'danger';
  }
  return 'info';
}

function getAppIconText(appIcon: string, appName: string) {
  return appIcon.trim() || appName.trim().slice(0, 2) || '应用';
}

function getStateActionTip() {
  if (isOnlineMode.value) {
    return '上架后，符合可见范围的企业可以重新开通该应用。';
  }
  if (isOfflineMode.value) {
    return '下架后仅关闭新企业的开通入口，不影响已开通企业继续使用。';
  }
  if (isEnableMode.value) {
    return '启用后，应用恢复为已上架状态，企业可以重新查看、开通和使用。';
  }
  if (isDisabledMode.value) {
    return '停用后，全部企业都将不再能够查看该应用，无法开通、无法使用。';
  }
  return '';
}

function getVisibleRowActions(row: AppRecord) {
  return interactions.rowActions.filter((action) => {
    if (action.label === '上架') {
      return row.status === '已下架';
    }
    if (action.label === '下架') {
      return row.status === '已上架';
    }
    if (action.label === '启用') {
      return row.status === '已停用';
    }
    if (action.label === '停用') {
      return row.status !== '已停用';
    }
    return true;
  });
}

function updateAppRecord(id: string, patch: Partial<AppRecord>) {
  appData.value = appData.value.map((item) =>
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
  selectedAppId.value = '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getAppRow(row);
  activeAction.value = action.label;
  selectedAppId.value = currentRow.id;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm(buildAppFormValues(currentRow));
  }

  detailVisible.value = true;
}

function handleFilterSubmit() {
  filterState.value = {
    appName: filterState.value.appName.trim(),
    appType: filterState.value.appType.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    appName: '',
    appType: '',
    status: '',
  };
  currentPage.value = 1;
}

function buildAppFormValues(app: AppRecord) {
  return {
    appIcon: app.appIcon,
    appId: app.appId,
    appIntro: app.appIntro,
    appName: app.appName,
    appType: app.appType,
    appUrl: app.appUrl,
    landingPageUrl: app.landingPageUrl,
    permissionApiFields: app.permissionApiFields,
    price: app.price,
    status: app.status,
    visibility: app.visibility,
  };
}

function resetActiveForm() {
  if (isEditMode.value && selectedApp.value) {
    populateInteractionForm(buildAppFormValues(selectedApp.value));
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createApp(values: Record<string, any>) {
  const appIcon = String(values.appIcon ?? '').trim();
  const appId = String(values.appId ?? '').trim();
  const appIntro = String(values.appIntro ?? '').trim();
  const appName = String(values.appName ?? '').trim();
  const appType = String(values.appType ?? '').trim();
  const appUrl = String(values.appUrl ?? '').trim();
  const landingPageUrl = String(values.landingPageUrl ?? '').trim();
  const permissionApiFields = String(values.permissionApiFields ?? '').trim();
  const price = String(values.price ?? '').trim();
  const visibility = String(values.visibility ?? '').trim();
  const status = String(values.status ?? '已下架').trim() as AppShelfStatus;

  if (
    !appName ||
    !appId ||
    !appType ||
    !appIcon ||
    !appIntro ||
    !price ||
    !landingPageUrl ||
    !appUrl ||
    !permissionApiFields ||
    !visibility
  ) {
    ElMessage.warning('请先完善应用信息');
    return;
  }

  const duplicated = appData.value.some(
    (item) => item.appName === appName || item.appId === appId,
  );
  if (duplicated) {
    ElMessage.warning('已存在同名或同 ID 应用，请调整后再提交');
    return;
  }

  appData.value = [
    normalizeAppRecord({
      appIcon,
      appId,
      appIntro,
      appName,
      appType,
      appUrl,
      landingPageUrl,
      permissionApiFields,
      price,
      status,
      updatedAt: getCurrentDateTime(),
      visibility,
    }),
    ...appData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新增应用：${appName}`);
  closeDetailDrawer();
}

async function editApp(values: Record<string, any>) {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  const appIcon = String(values.appIcon ?? '').trim();
  const appId = String(values.appId ?? '').trim();
  const appIntro = String(values.appIntro ?? '').trim();
  const appName = String(values.appName ?? '').trim();
  const appType = String(values.appType ?? '').trim();
  const appUrl = String(values.appUrl ?? '').trim();
  const landingPageUrl = String(values.landingPageUrl ?? '').trim();
  const permissionApiFields = String(values.permissionApiFields ?? '').trim();
  const price = String(values.price ?? '').trim();
  const visibility = String(values.visibility ?? '').trim();
  const status = String(values.status ?? '已下架').trim() as AppShelfStatus;

  if (
    !appName ||
    !appId ||
    !appType ||
    !appIcon ||
    !appIntro ||
    !price ||
    !landingPageUrl ||
    !appUrl ||
    !permissionApiFields ||
    !visibility
  ) {
    ElMessage.warning('请先完善应用信息');
    return;
  }

  const duplicated = appData.value.some(
    (item) =>
      item.id !== selectedApp.value?.id &&
      (item.appName === appName || item.appId === appId),
  );
  if (duplicated) {
    ElMessage.warning('已存在同名或同 ID 应用，请调整后再提交');
    return;
  }

  updateAppRecord(selectedApp.value.id, {
    appIcon,
    appId,
    appIntro,
    appName,
    appType,
    appUrl,
    landingPageUrl,
    permissionApiFields,
    price,
    status,
    visibility,
  });
  ElMessage.success(`已更新应用：${appName}`);
  closeDetailDrawer();
}

async function onlineApp() {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已上架') {
    ElMessage.info('当前应用已上架');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已停用') {
    ElMessage.warning('已停用应用请先执行启用');
    closeDetailDrawer();
    return;
  }

  updateAppRecord(selectedApp.value.id, { status: '已上架' });
  ElMessage.success(`已上架应用：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function offlineApp() {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已下架') {
    ElMessage.info('当前应用已下架');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已停用') {
    ElMessage.warning('已停用应用请先执行启用');
    closeDetailDrawer();
    return;
  }

  updateAppRecord(selectedApp.value.id, { status: '已下架' });
  ElMessage.success(`已下架应用：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function enableApp() {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status !== '已停用') {
    ElMessage.info('当前应用无需启用');
    closeDetailDrawer();
    return;
  }

  updateAppRecord(selectedApp.value.id, { status: '已上架' });
  ElMessage.success(`已启用应用：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function disableApp() {
  if (!selectedApp.value) {
    ElMessage.warning('未找到当前应用，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedApp.value.status === '已停用') {
    ElMessage.info('当前应用已停用');
    closeDetailDrawer();
    return;
  }

  updateAppRecord(selectedApp.value.id, { status: '已停用' });
  ElMessage.success(`已停用应用：${selectedApp.value.appName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createApp(values);
    return;
  }

  if (isEditMode.value) {
    await editApp(values);
    return;
  }
}

async function submitActiveAction() {
  if (isOnlineMode.value) {
    await onlineApp();
    return;
  }

  if (isOfflineMode.value) {
    await offlineApp();
    return;
  }

  if (isEnableMode.value) {
    await enableApp();
    return;
  }

  if (isDisabledMode.value) {
    await disableApp();
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
    selectedAppId.value = '';
    applyInteractionForm();
  }
});

function createAppFormFields(statusNote: string): SaaSFieldItem[] {
  return [
    createTextField({
      field: 'appId',
      label: '应用ID',
      note: '应用唯一业务标识，建议使用稳定编码',
      required: true,
    }),
    createTextField({
      field: 'appName',
      label: '应用名称',
      note: '应用展示名称',
      required: true,
    }),
    createTextField({
      field: 'appIcon',
      label: '应用图标',
      note: '用于原型展示的图标文案或图标地址',
      required: true,
    }),
    createSelectField({
      field: 'appType',
      label: '应用类型',
      note: '营销应用 / 运营应用 / 数据应用',
      options: appTypeOptions,
      required: true,
    }),
    createTextareaField({
      field: 'appIntro',
      label: '应用介绍',
      note: '应用能力、适用场景和核心价值',
      required: true,
      rows: 4,
    }),
    createTextField({
      field: 'price',
      label: '应用价格',
      note: '如 199 元/月、按门店计费或联系商务',
      required: true,
    }),
    createTextField({
      field: 'landingPageUrl',
      label: '落地页地址',
      note: '应用介绍页、营销页或帮助页地址',
      required: true,
    }),
    createTextField({
      field: 'appUrl',
      label: '应用地址',
      note: '应用入口地址',
      required: true,
    }),
    createTextareaField({
      field: 'permissionApiFields',
      label: '应用权限接口字段维护',
      note: '维护权限字段、接口标识或权限码映射',
      required: true,
      rows: 5,
    }),
    createTextareaField({
      field: 'visibility',
      label: '可见范围',
      note: '如旗舰版可见、景区门店可见',
      required: true,
      rows: 3,
    }),
    createSelectField({
      field: 'status',
      label: '应用状态',
      note: statusNote,
      options: appShelfStatusOptions,
      required: true,
    }),
  ];
}

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新增应用',
        type: 'primary',
        description: '登记新的 SaaS 应用，并配置资料、价格、入口和权限字段。',
        fields: createAppFormFields('已上架 / 已下架 / 已停用'),
        goal: '建立新的应用档案。',
        permissionPoints: ['新增应用'],
      },
    ],
    columns: [
      { key: 'appId', label: '应用ID' },
      { key: 'appIcon', label: '应用图标' },
      { key: 'appName', label: '应用名称' },
      { key: 'appType', label: '应用类型' },
      { key: 'price', label: '应用价格' },
      { key: 'visibility', label: '可见范围' },
      { key: 'status', label: '应用状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改应用资料、价格、入口地址、权限字段和状态。',
        fields: createAppFormFields('应用当前状态'),
        goal: '维护应用基础信息。',
        permissionPoints: ['编辑应用'],
      },
      {
        label: '上架',
        type: 'success',
        description: '将已下架应用重新上架，恢复新企业开通入口。',
        goal: '恢复已下架应用的新开通能力。',
        permissionPoints: ['上架应用'],
      },
      {
        label: '下架',
        type: 'danger',
        description: '关闭当前应用的开通入口，不影响已开通门店。',
        goal: '停止新门店继续开通该应用。',
        permissionPoints: ['下架应用'],
      },
      {
        label: '启用',
        type: 'success',
        description:
          '将已停用应用恢复为已上架状态，重新允许企业查看、开通和使用。',
        goal: '恢复已停用应用的展示、开通和使用能力。',
        permissionPoints: ['启用应用'],
      },
      {
        label: '停用',
        type: 'danger',
        description:
          '停用后，全部企业都将不再能够查看该应用，无法开通、无法使用。',
        goal: '立即关闭该应用对所有企业的展示和使用能力。',
        permissionPoints: ['停用应用'],
      },
    ],
    sampleData: [
      {
        appIcon: '会员',
        appId: 'APP-MEMBER-001',
        appIntro:
          '面向景区、零售和餐饮门店的会员分层、储值、优惠券和活动运营工具。',
        appName: '会员营销中心',
        appType: '营销应用',
        appUrl: 'https://saas.example.com/apps/member-marketing',
        id: 'app-001',
        landingPageUrl: 'https://saas.example.com/landing/member-marketing',
        permissionApiFields:
          'member.coupon.create\nmember.level.update\nmember.campaign.publish',
        price: '199 元/月',
        status: '已上架',
        updatedAt: '2026-07-02 12:15',
        visibility: '旗舰版可见',
      },
      {
        appIcon: '巡检',
        appId: 'APP-INSPECTION-002',
        appIntro: '支持门店巡检任务、问题拍照、整改跟进和巡检结果汇总。',
        appName: '门店巡检台',
        appType: '运营应用',
        appUrl: 'https://saas.example.com/apps/store-inspection',
        id: 'app-002',
        landingPageUrl: 'https://saas.example.com/landing/store-inspection',
        permissionApiFields:
          'inspection.task.create\ninspection.issue.update\ninspection.report.view',
        price: '99 元/月',
        status: '已下架',
        updatedAt: '2026-07-05 16:40',
        visibility: '全部门店可见',
      },
      {
        appIcon: '分析',
        appId: 'APP-ANALYTICS-003',
        appIntro:
          '沉淀经营数据、票务数据和支付数据，提供趋势、来源和门店对比分析。',
        appName: '经营分析看板',
        appType: '数据应用',
        appUrl: 'https://saas.example.com/apps/business-analytics',
        id: 'app-003',
        landingPageUrl: 'https://saas.example.com/landing/business-analytics',
        permissionApiFields:
          'analytics.dashboard.view\nanalytics.report.export\nanalytics.metric.config',
        price: '299 元/月',
        status: '已上架',
        updatedAt: '2026-07-06 18:10',
        visibility: '专业版 / 旗舰版可见',
      },
      {
        appIcon: '核销',
        appId: 'APP-TICKET-VERIFY-004',
        appIntro: '为票务场景提供快速核销、异常订单提示和核销记录追踪。',
        appName: '票务核销助手',
        appType: '运营应用',
        appUrl: 'https://saas.example.com/apps/ticket-verify',
        id: 'app-004',
        landingPageUrl: 'https://saas.example.com/landing/ticket-verify',
        permissionApiFields:
          'ticket.verify.create\nticket.verify.rollback\nticket.verify.log.view',
        price: '149 元/月',
        status: '已停用',
        updatedAt: '2026-07-08 09:20',
        visibility: '景区门店可见',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '管理应用档案、价格、入口、权限字段和应用状态。',
    description:
      '用于维护 SaaS 应用的基础资料、价格、落地页、应用入口、权限接口字段以及上下架和停用状态。',
    documentNotes: [
      '应用下架仅关闭新的开通入口，不影响已开通门店继续使用。',
      '应用停用后，全部企业都将不再能够查看该应用，无法开通、无法使用。',
      '可见范围需要和业务版本、门店类型保持一致。',
    ],
    fields: [
      { label: '应用ID', note: '应用唯一业务标识', required: true },
      { label: '应用名称', note: '应用在后台与前台展示的名称', required: true },
      {
        label: '应用图标',
        note: '应用列表与应用入口展示的图标',
        required: true,
      },
      {
        label: '应用类型',
        note: '区分营销、运营、数据等应用类型',
        required: true,
      },
      {
        label: '应用介绍',
        note: '说明应用能力、适用场景和核心价值',
        required: true,
      },
      { label: '应用价格', note: '应用售卖价格或计费方式', required: true },
      { label: '落地页地址', note: '应用介绍页或营销页地址', required: true },
      { label: '应用地址', note: '应用实际访问入口地址', required: true },
      {
        label: '应用权限接口字段维护',
        note: '维护应用权限码、接口标识或字段映射',
        required: true,
      },
      {
        label: '可见范围',
        note: '定义哪些版本或门店类型可看到该应用',
        required: true,
      },
      {
        label: '应用状态',
        note: '控制应用开通、展示和使用状态',
        required: true,
      },
    ],
    processSteps: [
      '通过应用名称、类型、应用状态筛选应用。',
      '在抽屉中完成新增或编辑应用资料。',
      '通过上架和下架管理应用的新开通入口。',
      '通过下架动作关闭当前应用的新开通入口。',
      '通过启用和停用管理应用对企业的展示与使用能力。',
      '通过停用动作关闭当前应用对所有企业的展示、开通和使用。',
    ],
    permissionPoints: [
      '新增应用',
      '编辑应用',
      '上架应用',
      '下架应用',
      '启用应用',
      '停用应用',
    ],
    exceptions: [
      '同名应用不允许重复创建。',
      '应用ID、图标、介绍、价格、地址、权限字段或可见范围为空时，不允许保存应用。',
      '已上架应用不需要重复执行上架操作。',
      '已下架应用不需要重复执行下架操作。',
      '非停用状态应用不需要执行启用操作。',
      '已停用应用不需要重复执行停用操作。',
    ],
    statusTransitions: [
      {
        current: '已上架',
        trigger: '下架',
        target: '已下架',
        note: '下架后不再允许新的门店开通该应用。',
      },
      {
        current: '已下架',
        trigger: '上架',
        target: '已上架',
        note: '重新上架后，符合可见范围的门店可再次开通。',
      },
      {
        current: '已上架 / 已下架',
        trigger: '停用',
        target: '已停用',
        note: '停用后所有企业均不可查看、开通或使用该应用。',
      },
      {
        current: '已停用',
        trigger: '启用',
        target: '已上架',
        note: '启用后恢复为已上架状态，重新允许企业查看、开通和使用。',
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
            <ElFormItem label="应用名称/ID">
              <ElInput
                v-model="filterState.appName"
                clearable
                placeholder="请输入应用名称或应用ID"
              />
            </ElFormItem>

            <ElFormItem label="应用类型">
              <ElSelect
                v-model="filterState.appType"
                clearable
                filterable
                placeholder="请选择应用类型"
              >
                <ElOption
                  v-for="option in appTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="应用状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择应用状态"
              >
                <ElOption
                  v-for="option in appShelfStatusOptions"
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
              <div v-if="column.key === 'appIcon'" class="app-icon-cell">
                {{
                  getAppIconText(getAppRow(row).appIcon, getAppRow(row).appName)
                }}
              </div>
              <ElTag
                v-else-if="column.key === 'status'"
                :type="getStatusTagType(getAppRow(row).status)"
              >
                {{ getAppRow(row).status }}
              </ElTag>
              <span v-else>{{ getCellValue(getAppRow(row), column.key) }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="220">
            <template #default="{ row }">
              <ElSpace wrap>
                <ElButton
                  v-for="action in getVisibleRowActions(getAppRow(row))"
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
            :total="filteredApps.length"
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
                <ElTag type="warning">{{ pagePriority }}</ElTag>
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
          selectedApp &&
          !hasActionFields &&
          !isOnlineMode &&
          !isOfflineMode &&
          !isEnableMode &&
          !isDisabledMode
        "
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="应用ID">
            {{ selectedApp.appId }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用图标">
            {{ selectedApp.appIcon }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用名称">
            {{ selectedApp.appName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用类型">
            {{ selectedApp.appType }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用价格">
            {{ selectedApp.price }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用介绍">
            {{ selectedApp.appIntro }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="可见范围">
            {{ selectedApp.visibility }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="落地页地址">
            {{ selectedApp.landingPageUrl }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用地址">
            {{ selectedApp.appUrl }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用权限接口字段">
            <pre class="permission-api-preview">{{
              selectedApp.permissionApiFields
            }}</pre>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="应用状态">
            <ElTag :type="getStatusTagType(selectedApp.status)">
              {{ selectedApp.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedApp.updatedAt }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-else-if="hasActionFields" class="flex flex-col gap-4">
        <DetailActionForm />
      </div>

      <div
        v-else-if="selectedApp"
        class="rounded-lg border border-dashed border-[var(--el-border-color)] p-4 text-sm leading-7"
      >
        <div>当前应用：{{ selectedApp.appName }}</div>
        <div>应用ID：{{ selectedApp.appId }}</div>
        <div>当前状态：{{ selectedApp.status }}</div>
        <div>{{ getStateActionTip() }}</div>
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

.app-icon-cell {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}

.permission-api-preview {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.6;
}
</style>
