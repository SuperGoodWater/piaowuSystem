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

function createTextField(input: BaseActionFieldInput): SaaSFieldItem {
  return {
    ...input,
    inputType: 'text',
  };
}

const bindingStatusOptions = [
  { label: '已绑定', value: '已绑定' },
  { label: '未绑定', value: '未绑定' },
] as const;

const deviceBrandOptions = [
  { label: '票星终端', value: '票星终端' },
  { label: '智票硬件', value: '智票硬件' },
] as const;

const sampleStoreOptions = [
  { label: '欢乐谷东区店', value: '欢乐谷东区店' },
  { label: '欢乐谷西区店', value: '欢乐谷西区店' },
  { label: '海岸线游客中心', value: '海岸线游客中心' },
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
type DeviceBindingStatus = '已绑定' | '未绑定';

interface DeviceRecord {
  bindingStatus: DeviceBindingStatus;
  brand: string;
  deviceCode: string;
  deviceName: string;
  id: string;
  storeName: string;
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
  bindingStatus: '',
  deviceCode: '',
  deviceName: '',
  storeName: '',
});
const pageSize = ref(10);
const selectedDeviceId = ref('');
const deviceData = ref<DeviceRecord[]>(
  interactions.sampleData.map((item) => normalizeDeviceRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '设备列表'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedDevice = computed(
  () =>
    deviceData.value.find((item) => item.id === selectedDeviceId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '注册设备');
const isEditMode = computed(() => activeAction.value === '编辑');
const isViewMode = computed(() => activeAction.value === '查看绑定');
const isUnbindMode = computed(() => activeAction.value === '解绑');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isEditMode.value || isUnbindMode.value,
);
const submitButtonText = computed(() => {
  if (isUnbindMode.value) {
    return '确认解绑';
  }
  return '保存';
});
const filteredDevices = computed(() => {
  const deviceName = filterState.value.deviceName.trim().toLowerCase();
  const deviceCode = filterState.value.deviceCode.trim().toLowerCase();
  const bindingStatus = filterState.value.bindingStatus;
  const storeName = filterState.value.storeName.trim().toLowerCase();

  return deviceData.value.filter((item) => {
    const matchName =
      !deviceName || item.deviceName.toLowerCase().includes(deviceName);
    const matchCode =
      !deviceCode || item.deviceCode.toLowerCase().includes(deviceCode);
    const matchStatus = !bindingStatus || item.bindingStatus === bindingStatus;
    const matchStore =
      !storeName || item.storeName.toLowerCase().includes(storeName);

    return matchName && matchCode && matchStatus && matchStore;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredDevices.value.slice(start, end);
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

function normalizeDeviceRecord(record: Record<string, string>): DeviceRecord {
  return {
    bindingStatus: (record.bindingStatus as DeviceBindingStatus) ?? '未绑定',
    brand: record.brand ?? '',
    deviceCode: record.deviceCode ?? '',
    deviceName: record.deviceName ?? '',
    id: record.id ?? `device-${Math.random().toString(36).slice(2, 10)}`,
    storeName: record.storeName ?? '未绑定',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getDeviceRow(row: Record<string, any>): DeviceRecord {
  return normalizeDeviceRecord(row);
}

function getCellValue(row: DeviceRecord, key: string) {
  return row[key as keyof DeviceRecord] ?? '-';
}

function getStatusTagType(status: DeviceBindingStatus) {
  return status === '已绑定' ? 'success' : 'info';
}

function updateDeviceRecord(id: string, patch: Partial<DeviceRecord>) {
  deviceData.value = deviceData.value.map((item) =>
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
  selectedDeviceId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getDeviceRow(row);
  activeAction.value = action.label;
  selectedDeviceId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      brand: currentRow.brand,
      deviceCode: currentRow.deviceCode,
      deviceName: currentRow.deviceName,
      storeName: currentRow.storeName === '未绑定' ? '' : currentRow.storeName,
    });
  }
}

function handleFilterSubmit() {
  filterState.value = {
    deviceName: filterState.value.deviceName.trim(),
    deviceCode: filterState.value.deviceCode.trim(),
    bindingStatus: filterState.value.bindingStatus.trim(),
    storeName: filterState.value.storeName.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    bindingStatus: '',
    deviceCode: '',
    deviceName: '',
    storeName: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedDevice.value) {
    populateInteractionForm({
      brand: selectedDevice.value.brand,
      deviceCode: selectedDevice.value.deviceCode,
      deviceName: selectedDevice.value.deviceName,
      storeName:
        selectedDevice.value.storeName === '未绑定'
          ? ''
          : selectedDevice.value.storeName,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function createDevice(values: Record<string, any>) {
  const deviceName = String(values.deviceName ?? '').trim();
  const deviceCode = String(values.deviceCode ?? '').trim();
  const brand = String(values.brand ?? '').trim();
  const storeName = String(values.storeName ?? '').trim();

  if (!deviceName || !deviceCode || !brand) {
    ElMessage.warning('请先完善设备信息');
    return;
  }

  const duplicated = deviceData.value.some(
    (item) => item.deviceCode === deviceCode,
  );
  if (duplicated) {
    ElMessage.warning('设备编码已存在，请重新填写');
    return;
  }

  deviceData.value = [
    normalizeDeviceRecord({
      bindingStatus: storeName ? '已绑定' : '未绑定',
      brand,
      deviceCode,
      deviceName,
      storeName: storeName || '未绑定',
      updatedAt: getCurrentDateTime(),
    }),
    ...deviceData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已注册设备：${deviceName}`);
  closeDetailDrawer();
}

async function updateDevice(values: Record<string, any>) {
  if (!selectedDevice.value) {
    ElMessage.warning('未找到当前设备，请重新选择');
    closeDetailDrawer();
    return;
  }

  const deviceName = String(values.deviceName ?? '').trim();
  const deviceCode = String(values.deviceCode ?? '').trim();
  const brand = String(values.brand ?? '').trim();
  const storeName = String(values.storeName ?? '').trim();

  if (!deviceName || !deviceCode || !brand) {
    ElMessage.warning('请先完善设备信息');
    return;
  }

  const duplicated = deviceData.value.some(
    (item) =>
      item.id !== selectedDevice.value?.id && item.deviceCode === deviceCode,
  );
  if (duplicated) {
    ElMessage.warning('设备编码已存在，请重新填写');
    return;
  }

  updateDeviceRecord(selectedDevice.value.id, {
    bindingStatus: storeName ? '已绑定' : '未绑定',
    brand,
    deviceCode,
    deviceName,
    storeName: storeName || '未绑定',
  });
  ElMessage.success(`已更新设备：${deviceName}`);
  closeDetailDrawer();
}

async function unbindDevice() {
  if (!selectedDevice.value) {
    ElMessage.warning('未找到当前设备，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedDevice.value.bindingStatus === '未绑定') {
    ElMessage.warning('当前设备未绑定，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateDeviceRecord(selectedDevice.value.id, {
    bindingStatus: '未绑定',
    storeName: '未绑定',
  });
  ElMessage.success(`已解绑设备：${selectedDevice.value.deviceName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createDevice(values);
    return;
  }

  if (isEditMode.value) {
    await updateDevice(values);
  }
}

async function submitActiveAction() {
  if (isUnbindMode.value) {
    await unbindDevice();
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
    selectedDeviceId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '注册设备',
        type: 'primary',
        description: '录入设备基础信息并注册到平台。',
        fields: [
          createTextField({
            field: 'deviceName',
            label: '设备名称',
            note: '设备展示名称',
            required: true,
          }),
          createTextField({
            field: 'deviceCode',
            label: '设备编码',
            note: '唯一设备标识',
            required: true,
          }),
          createSelectField({
            field: 'brand',
            label: '设备品牌',
            note: '品牌归属',
            options: deviceBrandOptions,
            required: true,
          }),
          createSelectField({
            field: 'storeName',
            label: '绑定门店',
            note: '可为空，后续绑定',
            options: sampleStoreOptions,
          }),
        ],
        goal: '建立设备平台档案。',
        permissionPoints: ['新建'],
        processSteps: [
          '录入设备名称、设备编码和品牌。',
          '根据需要选择绑定门店。',
          '保存后设备进入平台资源列表。',
        ],
      },
    ],
    columns: [
      { key: 'deviceName', label: '设备名称' },
      { key: 'deviceCode', label: '设备编码' },
      { key: 'brand', label: '设备品牌' },
      { key: 'bindingStatus', label: '绑定状态' },
      { key: 'storeName', label: '绑定门店' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '维护设备名称、品牌和基础资料。',
        fields: [
          createTextField({
            field: 'deviceName',
            label: '设备名称',
            note: '设备展示名称',
            required: true,
          }),
          createTextField({
            field: 'deviceCode',
            label: '设备编码',
            note: '唯一设备标识',
            required: true,
          }),
          createSelectField({
            field: 'brand',
            label: '设备品牌',
            note: '品牌归属',
            options: deviceBrandOptions,
            required: true,
          }),
          createSelectField({
            field: 'storeName',
            label: '绑定门店',
            note: '用于设备分配',
            options: sampleStoreOptions,
          }),
        ],
        goal: '更新设备档案信息。',
        permissionPoints: ['编辑'],
      },
      {
        label: '查看绑定',
        description: '查看当前设备绑定门店和状态。',
        goal: '确认设备归属。',
        permissionPoints: ['查看'],
      },
      {
        label: '解绑',
        type: 'danger',
        description: '解除设备与门店的绑定关系。',
        goal: '释放设备供重新分配。',
        permissionPoints: ['绑定'],
      },
    ],
    sampleData: [
      {
        bindingStatus: '已绑定',
        brand: '票星终端',
        deviceCode: 'DEV-202607-001',
        deviceName: '东区检票闸机-01',
        id: 'device-001',
        storeName: '欢乐谷东区店',
        updatedAt: '2026-07-06 10:00',
      },
      {
        bindingStatus: '未绑定',
        brand: '智票硬件',
        deviceCode: 'DEV-202607-002',
        deviceName: '便携验票机-02',
        id: 'device-002',
        storeName: '未绑定',
        updatedAt: '2026-07-05 16:30',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理设备注册、编辑、查看绑定和解绑等动作，覆盖设备档案与门店绑定关系维护。',
    documentNotes: [
      '设备编码在平台内必须唯一，不允许重复。',
      '设备可先注册后绑定，也可在注册时直接指定门店。',
      '解绑设备后，应视为可重新分配的闲置设备。',
    ],
    exceptions: [
      '设备名称、设备编码或品牌为空时不允许保存。',
      '设备编码重复时不允许创建或编辑。',
      '未绑定设备不允许重复执行解绑动作。',
    ],
    fields: [
      { label: '设备名称', note: '设备显示名称', required: true },
      { label: '设备编码', note: '设备唯一识别码', required: true },
      { label: '设备品牌', note: '设备所属品牌', required: true },
      { label: '绑定门店', note: '设备当前归属门店，可为空' },
      { label: '绑定状态', note: '标记设备当前是否已分配门店' },
    ],
    pageGoal: '维护平台设备档案和门店绑定关系，确保设备可追踪、可分配。',
    permissionPoints: ['新建', '编辑', '查看', '绑定'],
    processSteps: [
      '通过设备名称、编码、绑定状态或门店筛选设备。',
      '从列表进入注册、编辑、查看绑定或解绑动作。',
      '在抽屉中完成设备信息填写或解绑确认。',
      '提交后即时刷新设备绑定状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '未绑定',
        note: '指定门店后设备进入已绑定状态。',
        target: '已绑定',
        trigger: '注册设备 / 编辑',
      },
      {
        current: '已绑定',
        note: '解绑后设备重新回到可分配状态。',
        target: '未绑定',
        trigger: '解绑',
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
            <ElFormItem label="设备名称">
              <ElInput
                v-model="filterState.deviceName"
                clearable
                placeholder="请输入设备名称"
              />
            </ElFormItem>

            <ElFormItem label="设备编码">
              <ElInput
                v-model="filterState.deviceCode"
                clearable
                placeholder="请输入设备编码"
              />
            </ElFormItem>

            <ElFormItem label="绑定状态">
              <ElSelect
                v-model="filterState.bindingStatus"
                clearable
                filterable
                placeholder="请选择绑定状态"
              >
                <ElOption
                  v-for="option in bindingStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="门店名称">
              <ElInput
                v-model="filterState.storeName"
                clearable
                placeholder="请输入门店名称"
              />
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
                v-if="column.key === 'bindingStatus'"
                :type="getStatusTagType(getDeviceRow(row).bindingStatus)"
              >
                {{ getDeviceRow(row).bindingStatus }}
              </ElTag>
              <span v-else>{{
                getCellValue(getDeviceRow(row), column.key)
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
                    action.label === '解绑' &&
                    getDeviceRow(row).bindingStatus === '未绑定'
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
            :total="filteredDevices.length"
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

      <div v-if="isViewMode && selectedDevice" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="设备名称">
            {{ selectedDevice.deviceName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="设备编码">
            {{ selectedDevice.deviceCode }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="设备品牌">
            {{ selectedDevice.brand }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="绑定状态">
            <ElTag :type="getStatusTagType(selectedDevice.bindingStatus)">
              {{ selectedDevice.bindingStatus }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="绑定门店">
            {{ selectedDevice.storeName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedDevice.updatedAt }}
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
