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

const storeTypeOptions = [
  { label: '景区门店', value: '景区门店' },
  { label: '零售门店', value: '零售门店' },
] as const;

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
type VersionStatus = '停用' | '启用';

interface VersionRecord {
  featureScope: string;
  id: string;
  status: VersionStatus;
  storeType: string;
  updatedAt: string;
  versionDesc: string;
  versionName: string;
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
  storeType: '',
  versionName: '',
});
const pageSize = ref(10);
const selectedVersionId = ref('');
const versionData = ref<VersionRecord[]>(
  interactions.sampleData.map((item) => normalizeVersionRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '门店版本管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P0'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedVersion = computed(
  () =>
    versionData.value.find((item) => item.id === selectedVersionId.value) ??
    null,
);
const isCreateMode = computed(() => activeAction.value === '新建版本');
const isMaintainMode = computed(() => activeAction.value === '版本说明维护');
const isViewMode = computed(() => activeAction.value === '查看版本');
const isEditMode = computed(() => activeAction.value === '编辑版本');
const isDisableMode = computed(() => activeAction.value === '停用');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isCreateMode.value || isMaintainMode.value || isEditMode.value,
);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isMaintainMode.value ||
    isEditMode.value ||
    isDisableMode.value,
);
const submitButtonText = computed(() => {
  if (isDisableMode.value) {
    return '确认停用';
  }
  if (isMaintainMode.value) {
    return '确认维护';
  }
  return '保存';
});
const filteredVersions = computed(() => {
  const versionName = filterState.value.versionName.trim().toLowerCase();
  const storeType = filterState.value.storeType;
  const status = filterState.value.status;

  return versionData.value.filter((item) => {
    const matchVersionName =
      !versionName ||
      item.versionName.toLowerCase().includes(versionName) ||
      item.versionDesc.toLowerCase().includes(versionName);
    const matchStoreType = !storeType || item.storeType === storeType;
    const matchStatus = !status || item.status === status;

    return matchVersionName && matchStoreType && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredVersions.value.slice(start, end);
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

function normalizeVersionRecord(record: Record<string, string>): VersionRecord {
  return {
    featureScope: record.featureScope ?? '',
    id: record.id ?? `version-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as VersionStatus) ?? '启用',
    storeType: record.storeType ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
    versionDesc: record.versionDesc ?? record.featureScope ?? '',
    versionName: record.versionName ?? '',
  };
}

function getVersionRow(row: Record<string, any>): VersionRecord {
  return normalizeVersionRecord(row);
}

function getCellValue(row: VersionRecord, key: string) {
  return row[key as keyof VersionRecord] ?? '-';
}

function getStatusTagType(status: VersionStatus) {
  return status === '启用' ? 'success' : 'info';
}

function updateVersionRecord(id: string, patch: Partial<VersionRecord>) {
  versionData.value = versionData.value.map((item) =>
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
  selectedVersionId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getVersionRow(row);
  activeAction.value = action.label;
  selectedVersionId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑版本' || action.label === '版本说明维护') {
    populateInteractionForm({
      featureScope: currentRow.featureScope,
      status: currentRow.status,
      storeType: currentRow.storeType,
      versionDesc: currentRow.versionDesc,
      versionName: currentRow.versionName,
    });
  }
}

function handleFilterSubmit() {
  filterState.value = {
    versionName: filterState.value.versionName.trim(),
    storeType: filterState.value.storeType.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    status: '',
    storeType: '',
    versionName: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value || isMaintainMode.value) {
    const currentVersion = selectedVersion.value;
    if (!currentVersion) {
      applyInteractionForm(activeInteraction.value);
      return;
    }

    populateInteractionForm({
      featureScope: currentVersion.featureScope,
      status: currentVersion.status,
      storeType: currentVersion.storeType,
      versionDesc: currentVersion.versionDesc,
      versionName: currentVersion.versionName,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createVersion(values: Record<string, any>) {
  const storeType = String(values.storeType ?? '').trim();
  const versionName = String(values.versionName ?? '').trim();
  const versionDesc = String(values.versionDesc ?? '').trim();
  const featureScope = String(values.featureScope ?? '').trim();
  const status = String(values.status ?? '启用').trim() as VersionStatus;

  if (!storeType || !versionName || !featureScope || !status) {
    ElMessage.warning('请先完善版本信息');
    return;
  }

  const duplicated = versionData.value.some(
    (item) => item.storeType === storeType && item.versionName === versionName,
  );
  if (duplicated) {
    ElMessage.warning('同一门店类型下已存在同名版本');
    return;
  }

  versionData.value = [
    normalizeVersionRecord({
      featureScope,
      status,
      storeType,
      updatedAt: getCurrentDateTime(),
      versionDesc: versionDesc || featureScope,
      versionName,
    }),
    ...versionData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建版本：${versionName}`);
  closeDetailDrawer();
}

async function updateVersion(values: Record<string, any>, successText: string) {
  if (!selectedVersion.value) {
    ElMessage.warning('未找到当前版本，请重新选择');
    closeDetailDrawer();
    return;
  }

  const storeType = String(values.storeType ?? '').trim();
  const versionName = String(values.versionName ?? '').trim();
  const versionDesc = String(values.versionDesc ?? '').trim();
  const featureScope = String(values.featureScope ?? '').trim();
  const status = String(
    values.status ?? selectedVersion.value.status,
  ).trim() as VersionStatus;

  if (!storeType || !versionName || !featureScope || !status) {
    ElMessage.warning('请先完善版本信息');
    return;
  }

  const duplicated = versionData.value.some(
    (item) =>
      item.id !== selectedVersion.value?.id &&
      item.storeType === storeType &&
      item.versionName === versionName,
  );
  if (duplicated) {
    ElMessage.warning('同一门店类型下已存在同名版本');
    return;
  }

  updateVersionRecord(selectedVersion.value.id, {
    featureScope,
    status,
    storeType,
    versionDesc: versionDesc || featureScope,
    versionName,
  });
  ElMessage.success(successText);
  closeDetailDrawer();
}

async function disableVersion() {
  if (!selectedVersion.value) {
    ElMessage.warning('未找到当前版本，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedVersion.value.status === '停用') {
    ElMessage.warning('当前版本已停用，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateVersionRecord(selectedVersion.value.id, {
    status: '停用',
  });
  ElMessage.success(`已停用版本：${selectedVersion.value.versionName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createVersion(values);
    return;
  }

  if (isMaintainMode.value) {
    await updateVersion(values, '版本说明维护完成');
    return;
  }

  if (isEditMode.value) {
    await updateVersion(values, '版本信息已更新');
  }
}

async function submitActiveAction() {
  if (isDisableMode.value) {
    await disableVersion();
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
    selectedVersionId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建版本',
        type: 'primary',
        description: '为指定门店类型创建新的版本能力包。',
        fields: [
          createSelectField({
            field: 'storeType',
            label: '适用门店类型',
            note: '不同类型可配置不同版本',
            options: storeTypeOptions,
            required: true,
          }),
          createTextField({
            field: 'versionName',
            label: '版本名称',
            note: '例如基础版、专业版、旗舰版',
            required: true,
          }),
          createTextareaField({
            field: 'versionDesc',
            label: '版本说明',
            note: '用于概述版本定位和差异',
            rows: 3,
          }),
          createTextareaField({
            field: 'featureScope',
            label: '功能边界说明',
            note: '版本包含的功能范围说明',
            required: true,
            rows: 4,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用后可被门店切换使用',
            options: tenantStatusOptions,
            required: true,
          }),
        ],
        goal: '建立可供门店切换使用的版本配置。',
        permissionPoints: ['配置'],
        processSteps: [
          '选择适用门店类型。',
          '填写版本名称、版本说明和功能边界。',
          '确认状态后保存，版本进入列表。',
        ],
      },
      {
        label: '版本说明维护',
        type: 'info',
        description: '维护版本说明和功能边界说明，帮助门店切换时明确差异。',
        fields: [
          createSelectField({
            field: 'storeType',
            label: '适用门店类型',
            note: '用于定位需要维护的版本',
            options: storeTypeOptions,
            required: true,
          }),
          createTextField({
            field: 'versionName',
            label: '版本名称',
            note: '建议与线上版本名称保持一致',
            required: true,
          }),
          createTextareaField({
            field: 'versionDesc',
            label: '版本说明',
            note: '帮助业务快速理解版本定位',
            rows: 3,
          }),
          createTextareaField({
            field: 'featureScope',
            label: '功能边界说明',
            note: '明确版本包含的功能范围',
            required: true,
            rows: 4,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '同步维护版本启停状态',
            options: tenantStatusOptions,
            required: true,
          }),
        ],
        goal: '保持版本文档和配置口径一致。',
        permissionPoints: ['配置'],
      },
    ],
    columns: [
      { key: 'versionName', label: '版本名称' },
      { key: 'storeType', label: '适用门店类型' },
      { key: 'featureScope', label: '功能边界说明' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '查看版本',
        description: '查看版本能力边界与适用门店类型。',
        goal: '确认版本范围是否满足业务需求。',
        permissionPoints: ['查看'],
      },
      {
        label: '编辑版本',
        type: 'warning',
        description: '更新版本说明、状态或功能边界。',
        fields: [
          createSelectField({
            field: 'storeType',
            label: '适用门店类型',
            note: '不同类型可配置不同版本',
            options: storeTypeOptions,
            required: true,
          }),
          createTextField({
            field: 'versionName',
            label: '版本名称',
            note: '建议与业务命名保持一致',
            required: true,
          }),
          createTextareaField({
            field: 'versionDesc',
            label: '版本说明',
            note: '用于概述版本定位和差异',
            rows: 3,
          }),
          createTextareaField({
            field: 'featureScope',
            label: '功能边界说明',
            note: '版本包含的功能范围说明',
            required: true,
            rows: 4,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '启用后可被门店切换使用',
            options: tenantStatusOptions,
            required: true,
          }),
        ],
        goal: '持续维护版本能力定义。',
        permissionPoints: ['配置'],
      },
      {
        label: '停用',
        type: 'danger',
        description: '停用版本后该版本不可再被新增配置。',
        documentNotes: [
          '停用不会删除历史绑定记录，但新门店将不能继续选择该版本。',
        ],
        goal: '关闭不再维护的版本。',
        permissionPoints: ['配置'],
      },
    ],
    sampleData: [
      {
        featureScope: '支持票务、核销、会员、营销活动',
        id: 'version-001',
        status: '启用',
        storeType: '景区门店',
        updatedAt: '2026-07-04 16:20',
        versionDesc: '适合大型景区门店的完整经营版本',
        versionName: '旗舰版',
      },
      {
        featureScope: '支持票务、核销、基础报表',
        id: 'version-002',
        status: '停用',
        storeType: '游客中心',
        updatedAt: '2026-07-03 09:10',
        versionDesc: '适合游客中心的轻量版本',
        versionName: '基础版',
      },
      {
        featureScope: '支持票务、核销、会员、数据看板',
        id: 'version-003',
        status: '启用',
        storeType: '景区门店',
        updatedAt: '2026-07-05 13:45',
        versionDesc: '适合标准化景区门店的增强版本',
        versionName: '专业版',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理不同门店类型下的版本能力配置，覆盖版本新建、查看、编辑、停用和说明维护等动作。',
    documentNotes: [
      '同一门店类型下不允许创建同名版本。',
      '停用版本后，新的门店配置不可再选中该版本。',
      '版本说明和功能边界需保持一致，避免门店理解偏差。',
    ],
    exceptions: [
      '适用门店类型、版本名称、功能边界说明缺失时不允许保存。',
      '已停用版本不允许重复执行停用操作。',
      '同一门店类型下版本名称重复时不能提交。',
    ],
    fields: [
      {
        label: '适用门店类型',
        note: '版本只对选定门店类型生效',
        required: true,
      },
      { label: '版本名称', note: '用于区分不同能力层级版本', required: true },
      { label: '版本说明', note: '帮助业务理解版本定位' },
      { label: '功能边界说明', note: '明确版本包含的功能范围', required: true },
      { label: '状态', note: '决定版本是否可被门店继续配置', required: true },
    ],
    pageGoal: '维护门店版本配置，并确保版本能力边界清晰、状态准确。',
    permissionPoints: ['查看', '配置'],
    processSteps: [
      '通过版本名称、门店类型或状态筛选需要处理的版本。',
      '从列表进入新建、编辑、停用或查看版本动作。',
      '在抽屉内维护版本信息并提交。',
      '保存后实时更新版本状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '启用',
        note: '停用后新门店不允许再选择该版本。',
        target: '停用',
        trigger: '停用',
      },
      {
        current: '停用',
        note: '当前页面暂未提供重新启用动作。',
        target: '停用',
        trigger: '查看版本',
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
            <ElFormItem label="版本名称">
              <ElInput
                v-model="filterState.versionName"
                clearable
                placeholder="请输入版本名称或版本说明"
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

            <ElFormItem label="状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择状态"
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
            min-width="150"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getVersionRow(row).status)"
              >
                {{ getVersionRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getVersionRow(row), column.key)
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
                    getVersionRow(row).status === '停用'
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
            :total="filteredVersions.length"
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

            <div
              v-if="
                explanations.pendingItems &&
                explanations.pendingItems.length > 0
              "
            >
              <div class="mb-2 text-sm font-medium">待补充项</div>
              <ul
                class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
              >
                <li v-for="item in explanations.pendingItems" :key="item">
                  {{ item }}
                </li>
              </ul>
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

      <div v-if="isViewMode && selectedVersion" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="版本名称">
            {{ selectedVersion.versionName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="适用门店类型">
            {{ selectedVersion.storeType }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedVersion.status)">
              {{ selectedVersion.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="版本说明">
            {{ selectedVersion.versionDesc || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="功能边界说明">
            {{ selectedVersion.featureScope }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedVersion.updatedAt }}
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
</style>
