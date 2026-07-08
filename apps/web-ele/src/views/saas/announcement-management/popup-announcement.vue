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

function createDateRangeField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'daterange',
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

const popupStatusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '生效中', value: '生效中' },
  { label: '已下线', value: '已下线' },
] as const;

const notificationTargetOptions = [
  { label: '租户管理员', value: '租户管理员' },
  { label: '门店管理员', value: '门店管理员' },
] as const;

const popupTargetOptions = [
  { label: '全部门店', value: '全部门店' },
  ...notificationTargetOptions,
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
type PopupStatus = '已下线' | '生效中' | '草稿';

interface PopupAnnouncementRecord {
  effectiveWindow: string;
  id: string;
  status: PopupStatus;
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
const selectedPopupId = ref('');
const popupData = ref<PopupAnnouncementRecord[]>(
  interactions.sampleData.map((item) => normalizePopupRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '弹窗公告'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedPopup = computed(
  () =>
    popupData.value.find((item) => item.id === selectedPopupId.value) ?? null,
);
const isCreateMode = computed(
  () =>
    activeAction.value === '新建弹窗公告' ||
    activeAction.value === '替换当前生效公告',
);
const isEditMode = computed(() => activeAction.value === '编辑');
const isActivateMode = computed(() => activeAction.value === '设为生效');
const isOfflineMode = computed(() => activeAction.value === '下线');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isActivateMode.value ||
    isOfflineMode.value,
);
const submitButtonText = computed(() => {
  if (isActivateMode.value) {
    return '确认生效';
  }
  if (isOfflineMode.value) {
    return '确认下线';
  }
  return '保存';
});
const filteredPopups = computed(() => {
  const title = filterState.value.title.trim().toLowerCase();
  const target = filterState.value.target;
  const status = filterState.value.status;

  return popupData.value.filter((item) => {
    const matchesTitle = !title || item.title.toLowerCase().includes(title);
    const matchesTarget = !target || item.target === target;
    const matchesStatus = !status || item.status === status;

    return matchesTitle && matchesTarget && matchesStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredPopups.value.slice(start, start + pageSize.value);
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
  { includeRules = false }: { includeRules?: boolean } = {},
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

function normalizePopupRecord(
  record: Record<string, string>,
): PopupAnnouncementRecord {
  return {
    effectiveWindow: record.effectiveWindow ?? '',
    id: record.id ?? `popup-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as PopupStatus) ?? '草稿',
    target: record.target ?? '',
    title: record.title ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getPopupRow(row: Record<string, any>) {
  return row as PopupAnnouncementRecord;
}

function getCellValue(row: PopupAnnouncementRecord, key: string) {
  return row[key as keyof PopupAnnouncementRecord] ?? '-';
}

function getStatusTagType(status: PopupStatus) {
  if (status === '生效中') {
    return 'success';
  }
  if (status === '已下线') {
    return 'info';
  }
  return 'warning';
}

function updatePopupRecord(
  id: string,
  patch: Partial<PopupAnnouncementRecord>,
) {
  popupData.value = popupData.value.map((item) =>
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
  selectedPopupId.value = '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getPopupRow(row);
  activeAction.value = action.label;
  selectedPopupId.value = currentRow.id;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      effectiveWindow: currentRow.effectiveWindow
        .split(' ~ ')
        .map((item) => item.trim()),
      status: currentRow.status,
      target: currentRow.target,
      title: currentRow.title,
    });
  }

  detailVisible.value = true;
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
  if (isEditMode.value && selectedPopup.value) {
    populateInteractionForm({
      effectiveWindow: selectedPopup.value.effectiveWindow
        .split(' ~ ')
        .map((item) => item.trim()),
      status: selectedPopup.value.status,
      target: selectedPopup.value.target,
      title: selectedPopup.value.title,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

function ensureSingleActivePopup(excludeId = '') {
  popupData.value = popupData.value.map((item) =>
    item.id !== excludeId && item.status === '生效中'
      ? { ...item, status: '已下线', updatedAt: getCurrentDateTime() }
      : item,
  );
}

async function createPopup(values: Record<string, any>) {
  const title = String(values.title ?? '').trim();
  const target = String(values.target ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PopupStatus;
  const effectiveWindowValue = Array.isArray(values.effectiveWindow)
    ? values.effectiveWindow
    : [];

  if (!title || !target || effectiveWindowValue.length !== 2) {
    ElMessage.warning('请先完善弹窗公告信息');
    return;
  }

  const effectiveWindow = `${effectiveWindowValue[0]} ~ ${effectiveWindowValue[1]}`;

  if (status === '生效中') {
    ensureSingleActivePopup();
  }

  popupData.value = [
    normalizePopupRecord({
      effectiveWindow,
      status,
      target,
      title,
      updatedAt: getCurrentDateTime(),
    }),
    ...popupData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已保存弹窗公告：${title}`);
  closeDetailDrawer();
}

async function updatePopup(values: Record<string, any>) {
  if (!selectedPopup.value) {
    ElMessage.warning('未找到当前弹窗公告，请重新选择');
    closeDetailDrawer();
    return;
  }

  const title = String(values.title ?? '').trim();
  const target = String(values.target ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PopupStatus;
  const effectiveWindowValue = Array.isArray(values.effectiveWindow)
    ? values.effectiveWindow
    : [];

  if (!title || !target || effectiveWindowValue.length !== 2) {
    ElMessage.warning('请先完善弹窗公告信息');
    return;
  }

  if (status === '生效中') {
    ensureSingleActivePopup(selectedPopup.value.id);
  }

  updatePopupRecord(selectedPopup.value.id, {
    effectiveWindow: `${effectiveWindowValue[0]} ~ ${effectiveWindowValue[1]}`,
    status,
    target,
    title,
  });
  ElMessage.success(`已更新弹窗公告：${title}`);
  closeDetailDrawer();
}

async function activatePopup() {
  if (!selectedPopup.value) {
    ElMessage.warning('未找到当前弹窗公告，请重新选择');
    closeDetailDrawer();
    return;
  }

  ensureSingleActivePopup(selectedPopup.value.id);
  updatePopupRecord(selectedPopup.value.id, { status: '生效中' });
  ElMessage.success(`已将弹窗公告设为生效：${selectedPopup.value.title}`);
  closeDetailDrawer();
}

async function offlinePopup() {
  if (!selectedPopup.value) {
    ElMessage.warning('未找到当前弹窗公告，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedPopup.value.status === '已下线') {
    ElMessage.info('当前弹窗公告已下线');
    closeDetailDrawer();
    return;
  }

  updatePopupRecord(selectedPopup.value.id, { status: '已下线' });
  ElMessage.success(`已下线弹窗公告：${selectedPopup.value.title}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createPopup(values);
    return;
  }

  if (isEditMode.value) {
    await updatePopup(values);
  }
}

async function submitActiveAction() {
  if (isActivateMode.value) {
    await activatePopup();
    return;
  }

  if (isOfflineMode.value) {
    await offlinePopup();
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
    selectedPopupId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建弹窗公告',
        type: 'primary',
        description: '新增弹窗公告并定义生效时间段。',
        fields: [
          createTextField({
            field: 'title',
            label: '公告标题',
            note: '弹窗标题',
            required: true,
          }),
          createDateRangeField({
            field: 'effectiveWindow',
            label: '生效时间段',
            note: '控制唯一生效窗口',
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '目标对象',
            note: '如全部门店、租户管理员',
            options: popupTargetOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '草稿 / 生效中 / 已下线',
            options: popupStatusOptions,
            required: true,
          }),
        ],
        goal: '创建弹窗公告。',
        permissionPoints: ['新建'],
      },
      {
        label: '替换当前生效公告',
        type: 'warning',
        description: '用新公告替换当前生效中的弹窗公告。',
        fields: [
          createTextField({
            field: 'title',
            label: '公告标题',
            note: '新弹窗标题',
            required: true,
          }),
          createDateRangeField({
            field: 'effectiveWindow',
            label: '生效时间段',
            note: '替换后立即进入新的生效窗口',
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '目标对象',
            note: '默认为全部门店或指定角色',
            options: popupTargetOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '提交后建议直接设为生效中',
            options: popupStatusOptions,
            required: true,
            defaultValue: '生效中',
          }),
        ],
        documentNotes: ['同一时间仅允许一个弹窗公告生效。'],
        goal: '保证弹窗公告唯一生效。',
        permissionPoints: ['发布'],
      },
    ],
    filters: [
      createTextFilter({
        field: 'title',
        label: '公告标题',
        placeholder: '请输入公告标题',
      }),
      createSelectFilter({
        field: 'target',
        label: '目标对象',
        options: popupTargetOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '状态',
        options: popupStatusOptions,
      }),
    ],
    columns: [
      { key: 'title', label: '公告标题' },
      { key: 'effectiveWindow', label: '生效时间段' },
      { key: 'target', label: '目标对象' },
      { key: 'status', label: '状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '修改弹窗公告内容和时间段。',
        fields: [
          createTextField({
            field: 'title',
            label: '公告标题',
            note: '弹窗标题',
            required: true,
          }),
          createDateRangeField({
            field: 'effectiveWindow',
            label: '生效时间段',
            note: '控制弹窗出现时间',
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '目标对象',
            note: '公告接收对象',
            options: popupTargetOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '草稿 / 生效中 / 已下线',
            options: popupStatusOptions,
            required: true,
          }),
        ],
        goal: '维护弹窗公告内容。',
        permissionPoints: ['编辑'],
      },
      {
        label: '设为生效',
        type: 'warning',
        description: '将当前公告设置为生效中，并替换原公告。',
        goal: '切换当前生效弹窗。',
        permissionPoints: ['发布'],
      },
      {
        label: '下线',
        type: 'danger',
        description: '下线当前弹窗公告。',
        goal: '关闭弹窗展示。',
        permissionPoints: ['下线'],
      },
    ],
    sampleData: [
      {
        effectiveWindow: '2026-07-06 ~ 2026-07-10',
        id: 'popup-001',
        status: '生效中',
        target: '全部门店',
        title: '暑期系统维护通知',
        updatedAt: '2026-07-06 07:00',
      },
      {
        effectiveWindow: '2026-07-11 ~ 2026-07-20',
        id: 'popup-002',
        status: '草稿',
        target: '租户管理员',
        title: '新版本上线预告',
        updatedAt: '2026-07-07 09:30',
      },
      {
        effectiveWindow: '2026-06-20 ~ 2026-06-25',
        id: 'popup-003',
        status: '已下线',
        target: '门店管理员',
        title: '门店巡检提醒',
        updatedAt: '2026-06-25 18:00',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '管理平台弹窗公告的创建、生效与下线。',
    description:
      '用于向租户管理员、门店管理员或全部门店展示阶段性提醒和重要通知。',
    documentNotes: [
      '同一时间仅允许一个弹窗公告处于生效中状态。',
      '替换当前生效公告时，应自动使原生效公告下线。',
    ],
    fields: [
      {
        label: '公告标题',
        note: '弹窗顶部标题，用于概括通知主题',
        required: true,
      },
      {
        label: '生效时间段',
        note: '控制弹窗从何时开始、何时结束展示',
        required: true,
      },
      { label: '目标对象', note: '决定公告面向的用户范围', required: true },
      {
        label: '状态',
        note: '控制公告是草稿、生效中还是已下线',
        required: true,
      },
    ],
    processSteps: [
      '通过公告标题、目标对象、状态筛选需要处理的弹窗公告。',
      '在抽屉中完成新建、编辑或替换当前生效公告。',
      '通过设为生效或下线动作管理弹窗展示状态。',
    ],
    permissionPoints: ['新建', '编辑', '发布', '下线'],
    exceptions: [
      '公告标题、目标对象或生效时间段缺失时，不允许保存。',
      '将一条公告设为生效时，系统会自动处理其他生效中的弹窗公告。',
    ],
    statusTransitions: [
      {
        current: '草稿',
        trigger: '设为生效',
        target: '生效中',
        note: '草稿公告通过发布后进入生效状态。',
      },
      {
        current: '生效中',
        trigger: '下线',
        target: '已下线',
        note: '下线后前台不再展示该弹窗公告。',
      },
      {
        current: '生效中',
        trigger: '替换当前生效公告',
        target: '已下线',
        note: '原公告会被新的生效公告自动替换。',
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
                :type="getStatusTagType(getPopupRow(row).status)"
              >
                {{ getPopupRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getPopupRow(row), column.key)
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
            :total="filteredPopups.length"
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
        v-if="
          selectedPopup && !hasActionFields && !isActivateMode && !isOfflineMode
        "
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="公告标题">
            {{ selectedPopup.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="目标对象">
            {{ selectedPopup.target }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="getStatusTagType(selectedPopup.status)">
              {{ selectedPopup.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="生效时间段">
            {{ selectedPopup.effectiveWindow }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedPopup.updatedAt }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div v-else-if="hasActionFields" class="flex flex-col gap-4">
        <DetailActionForm />
      </div>

      <div
        v-else-if="selectedPopup"
        class="rounded-lg border border-dashed border-[var(--el-border-color)] p-4 text-sm leading-7"
      >
        <div>当前公告：{{ selectedPopup.title }}</div>
        <div>当前状态：{{ selectedPopup.status }}</div>
        <div>目标对象：{{ selectedPopup.target }}</div>
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
