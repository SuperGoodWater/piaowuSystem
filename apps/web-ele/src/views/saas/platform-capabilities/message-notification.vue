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

const notificationChannelOptions = [
  { label: '站内信', value: '站内信' },
  { label: '短信', value: '短信' },
  { label: '邮件', value: '邮件' },
] as const;

const notificationTargetOptions = [
  { label: '租户管理员', value: '租户管理员' },
  { label: '门店管理员', value: '门店管理员' },
] as const;

const sendStatusOptions = [
  { label: '待发送', value: '待发送' },
  { label: '已发送', value: '已发送' },
  { label: '失败', value: '失败' },
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
type SendStatus = '失败' | '已发送' | '待发送';

interface NotificationRecord {
  channel: string;
  id: string;
  status: SendStatus;
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
  channel: '',
  target: '',
  title: '',
});
const pageSize = ref(10);
const selectedNotificationId = ref('');
const notificationData = ref<NotificationRecord[]>(
  interactions.sampleData.map((item) => normalizeNotificationRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '消息通知'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedNotification = computed(
  () =>
    notificationData.value.find(
      (item) => item.id === selectedNotificationId.value,
    ) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新建通知');
const isResendMode = computed(() => activeAction.value === '重新发送');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value);
const showSubmitButton = computed(
  () => isCreateMode.value || isResendMode.value,
);
const submitButtonText = computed(() =>
  isResendMode.value ? '确认发送' : '保存',
);
const filteredNotifications = computed(() => {
  const title = filterState.value.title.trim().toLowerCase();
  const channel = filterState.value.channel;
  const target = filterState.value.target;

  return notificationData.value.filter((item) => {
    const matchesTitle = !title || item.title.toLowerCase().includes(title);
    const matchesChannel = !channel || item.channel === channel;
    const matchesTarget = !target || item.target === target;
    return matchesTitle && matchesChannel && matchesTarget;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredNotifications.value.slice(start, start + pageSize.value);
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
  { includeRules = false }: { includeRules?: boolean } = {},
): VbenFormSchema {
  const fieldName = getFieldName(field, index);
  const placeholder =
    'placeholder' in field && field.placeholder
      ? field.placeholder
      : `${field.inputType === 'select' ? '请选择' : '请输入'}${field.label}`;

  if (field.inputType === 'select') {
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
  }

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

function normalizeNotificationRecord(
  record: Record<string, string>,
): NotificationRecord {
  return {
    channel: record.channel ?? '',
    id: record.id ?? `notification-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as SendStatus) ?? '待发送',
    target: record.target ?? '',
    title: record.title ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getNotificationRow(row: Record<string, any>) {
  return row as NotificationRecord;
}

function getCellValue(row: NotificationRecord, key: string) {
  return row[key as keyof NotificationRecord] ?? '-';
}

function getStatusTagType(status: SendStatus) {
  if (status === '已发送') {
    return 'success';
  }
  if (status === '失败') {
    return 'danger';
  }
  return 'warning';
}

function updateNotificationRecord(
  id: string,
  patch: Partial<NotificationRecord>,
) {
  notificationData.value = notificationData.value.map((item) =>
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
  selectedNotificationId.value = '';
  applyInteractionForm(action);
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getNotificationRow(row);
  activeAction.value = action.label;
  selectedNotificationId.value = currentRow.id;
  applyInteractionForm(action);

  if (action.label === '重新发送') {
    populateInteractionForm({
      channel: currentRow.channel,
      status: '已发送',
      target: currentRow.target,
      title: currentRow.title,
    });
  }

  detailVisible.value = true;
}

function handleFilterSubmit() {
  filterState.value = {
    title: filterState.value.title.trim(),
    channel: filterState.value.channel.trim(),
    target: filterState.value.target.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    channel: '',
    target: '',
    title: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  applyInteractionForm(activeInteraction.value);
}

async function createNotification(values: Record<string, any>) {
  const title = String(values.title ?? '').trim();
  const channel = String(values.channel ?? '').trim();
  const target = String(values.target ?? '').trim();
  const status = String(values.status ?? '待发送').trim() as SendStatus;

  if (!title || !channel || !target) {
    ElMessage.warning('请先完善通知信息');
    return;
  }

  notificationData.value = [
    normalizeNotificationRecord({
      channel,
      status,
      target,
      title,
      updatedAt: getCurrentDateTime(),
    }),
    ...notificationData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已创建通知：${title}`);
  closeDetailDrawer();
}

async function resendNotification(values: Record<string, any>) {
  if (!selectedNotification.value) {
    ElMessage.warning('未找到当前通知，请重新选择');
    closeDetailDrawer();
    return;
  }

  updateNotificationRecord(selectedNotification.value.id, {
    channel: String(
      values.channel ?? selectedNotification.value.channel,
    ).trim(),
    status: '已发送',
    target: String(values.target ?? selectedNotification.value.target).trim(),
    title: String(values.title ?? selectedNotification.value.title).trim(),
  });
  ElMessage.success(`已重新发送通知：${selectedNotification.value.title}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createNotification(values);
    return;
  }

  if (isResendMode.value) {
    await resendNotification(values);
  }
}

async function submitActiveAction() {
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
    selectedNotificationId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建通知',
        type: 'primary',
        description: '新增一条平台通知，指定目标对象和发送方式。',
        fields: [
          createTextField({
            field: 'title',
            label: '通知标题',
            note: '消息主题',
            required: true,
          }),
          createSelectField({
            field: 'channel',
            label: '通知方式',
            note: '站内信 / 短信 / 邮件',
            options: notificationChannelOptions,
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '通知对象',
            note: '租户管理员 / 门店管理员',
            options: notificationTargetOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '发送状态',
            note: '待发送 / 已发送 / 失败',
            options: sendStatusOptions,
            required: true,
          }),
        ],
        goal: '建立新的消息通知。',
        permissionPoints: ['新建通知'],
      },
      {
        label: '通知规则说明',
        type: 'info',
        description: '查看通知对象、通知方式与发送规则说明。',
        goal: '统一消息通知口径。',
        permissionPoints: ['查看通知'],
      },
    ],
    columns: [
      { key: 'title', label: '通知标题' },
      { key: 'channel', label: '通知方式' },
      { key: 'target', label: '通知对象' },
      { key: 'status', label: '发送状态' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '查看详情',
        description: '查看通知内容、发送对象和当前发送状态。',
        goal: '确认通知发送情况。',
        permissionPoints: ['查看通知'],
      },
      {
        label: '重新发送',
        type: 'warning',
        description: '对失败或需要补发的通知重新发送。',
        fields: [
          createTextField({
            field: 'title',
            label: '通知标题',
            note: '发送前可调整标题',
            required: true,
          }),
          createSelectField({
            field: 'channel',
            label: '通知方式',
            note: '重新确认发送通道',
            options: notificationChannelOptions,
            required: true,
          }),
          createSelectField({
            field: 'target',
            label: '通知对象',
            note: '重新确认接收对象',
            options: notificationTargetOptions,
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '发送状态',
            note: '重发后一般更新为已发送',
            options: sendStatusOptions,
            required: true,
          }),
        ],
        goal: '补发消息通知。',
        permissionPoints: ['重新发送'],
      },
    ],
    sampleData: [
      {
        channel: '站内信 / 短信',
        id: 'notification-001',
        status: '已发送',
        target: '租户管理员',
        title: '门店权益即将到期提醒',
        updatedAt: '2026-07-06 08:15',
      },
      {
        channel: '邮件',
        id: 'notification-002',
        status: '失败',
        target: '门店管理员',
        title: '打印模板发布通知',
        updatedAt: '2026-07-06 11:20',
      },
      {
        channel: '站内信',
        id: 'notification-003',
        status: '待发送',
        target: '租户管理员',
        title: '版本升级窗口提醒',
        updatedAt: '2026-07-07 10:05',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '管理平台通知的创建、查看与补发。',
    description:
      '用于管理站内信、短信、邮件等通知内容与发送状态，支撑租户和门店的消息触达。',
    documentNotes: [
      '通知对象当前主要覆盖租户管理员和门店管理员。',
      '发送失败的消息应支持重新发送并记录状态变化。',
    ],
    fields: [
      { label: '通知标题', note: '用于概括通知主题', required: true },
      {
        label: '通知方式',
        note: '消息通道，例如站内信、短信、邮件',
        required: true,
      },
      { label: '通知对象', note: '决定消息接收角色', required: true },
      { label: '发送状态', note: '区分待发送、已发送、失败', required: true },
    ],
    processSteps: [
      '通过通知标题、通知方式、通知对象筛选待处理通知。',
      '在抽屉中完成新建通知或重新发送。',
      '通过详情抽屉查看消息当前的发送状态。',
    ],
    permissionPoints: ['查看通知', '新建通知', '重新发送'],
    exceptions: [
      '通知标题、通知方式或通知对象为空时，不允许保存。',
      '重新发送只更新当前通知状态，不生成新的导航页面。',
    ],
    statusTransitions: [
      {
        current: '待发送',
        trigger: '发送成功',
        target: '已发送',
        note: '消息正常送达后进入已发送状态。',
      },
      {
        current: '失败',
        trigger: '重新发送',
        target: '已发送',
        note: '补发成功后将失败状态更新为已发送。',
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
            <ElFormItem label="通知标题">
              <ElInput
                v-model="filterState.title"
                clearable
                placeholder="请输入通知标题"
              />
            </ElFormItem>

            <ElFormItem label="通知方式">
              <ElSelect
                v-model="filterState.channel"
                clearable
                filterable
                placeholder="请选择通知方式"
              >
                <ElOption
                  v-for="option in notificationChannelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="通知对象">
              <ElSelect
                v-model="filterState.target"
                clearable
                filterable
                placeholder="请选择通知对象"
              >
                <ElOption
                  v-for="option in notificationTargetOptions"
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
                :type="getStatusTagType(getNotificationRow(row).status)"
              >
                {{ getNotificationRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getNotificationRow(row), column.key)
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
            :total="filteredNotifications.length"
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
        v-if="selectedNotification && !hasActionFields && !isResendMode"
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="通知标题">
            {{ selectedNotification.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="通知方式">
            {{ selectedNotification.channel }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="通知对象">
            {{ selectedNotification.target }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发送状态">
            <ElTag :type="getStatusTagType(selectedNotification.status)">
              {{ selectedNotification.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedNotification.updatedAt }}
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
