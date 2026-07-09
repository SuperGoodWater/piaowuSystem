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

const newsCategoryOptions = [
  { label: '平台动态', value: '平台动态' },
  { label: '运营资讯', value: '运营资讯' },
  { label: '产品公告', value: '产品公告' },
] as const;

const publishStatusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发布', value: '已发布' },
  { label: '已下线', value: '已下线' },
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
type PublishStatus = '已下线' | '已发布' | '草稿';

interface NewsRecord {
  author: string;
  category: string;
  id: string;
  status: PublishStatus;
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
  category: '',
  status: '',
  title: '',
});
const pageSize = ref(10);
const selectedNewsId = ref('');
const newsData = ref<NewsRecord[]>(
  interactions.sampleData.map((item) => normalizeNewsRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '新闻资讯'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedNews = computed(
  () => newsData.value.find((item) => item.id === selectedNewsId.value) ?? null,
);
const isCreateMode = computed(() => activeAction.value === '新建资讯');
const isEditMode = computed(() => activeAction.value === '编辑');
const isPublishMode = computed(() => activeAction.value === '发布');
const isOfflineMode = computed(() => activeAction.value === '下线');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isCreateMode.value || isEditMode.value);
const showSubmitButton = computed(
  () =>
    isCreateMode.value ||
    isEditMode.value ||
    isPublishMode.value ||
    isOfflineMode.value,
);
const submitButtonText = computed(() => {
  if (isPublishMode.value) return '确认发布';
  if (isOfflineMode.value) return '确认下线';
  return '保存';
});
const filteredNews = computed(() => {
  const title = filterState.value.title.trim().toLowerCase();
  const category = filterState.value.category;
  const status = filterState.value.status;

  return newsData.value.filter((item) => {
    const matchTitle = !title || item.title.toLowerCase().includes(title);
    const matchCategory = !category || item.category === category;
    const matchStatus = !status || item.status === status;
    return matchTitle && matchCategory && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredNews.value.slice(start, end);
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
  commonConfig: { componentProps: { class: 'w-full' } },
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
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.inputType === 'switch') return false;
  if (field.inputType === 'daterange') return [];
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
    case 'text':
    default:
      return {
        component: 'Input',
        componentProps: { placeholder },
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
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function normalizeNewsRecord(record: Record<string, string>): NewsRecord {
  return {
    author: record.author ?? '',
    category: record.category ?? '',
    id: record.id ?? `news-${Math.random().toString(36).slice(2, 10)}`,
    status: (record.status as PublishStatus) ?? '草稿',
    title: record.title ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
  };
}

function getNewsRow(row: Record<string, any>): NewsRecord {
  return normalizeNewsRecord(row);
}

function getCellValue(row: NewsRecord, key: string) {
  return row[key as keyof NewsRecord] ?? '-';
}

function getStatusTagType(status: PublishStatus) {
  if (status === '已发布') return 'success';
  if (status === '草稿') return 'info';
  return 'warning';
}

function updateNewsRecord(id: string, patch: Partial<NewsRecord>) {
  newsData.value = newsData.value.map((item) =>
    item.id === id
      ? { ...item, ...patch, updatedAt: getCurrentDateTime() }
      : item,
  );
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedNewsId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getNewsRow(row);
  activeAction.value = action.label;
  selectedNewsId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '编辑') {
    populateInteractionForm({
      author: currentRow.author,
      category: currentRow.category,
      status: currentRow.status,
      title: currentRow.title,
    });
  }
}

function handleFilterSubmit() {
  filterState.value = {
    title: filterState.value.title.trim(),
    category: filterState.value.category.trim(),
    status: filterState.value.status.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = { category: '', status: '', title: '' };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isEditMode.value && selectedNews.value) {
    populateInteractionForm({
      author: selectedNews.value.author,
      category: selectedNews.value.category,
      status: selectedNews.value.status,
      title: selectedNews.value.title,
    });
    return;
  }
  applyInteractionForm(activeInteraction.value);
}

async function createNews(values: Record<string, any>) {
  const title = String(values.title ?? '').trim();
  const category = String(values.category ?? '').trim();
  const author = String(values.author ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PublishStatus;

  if (!title || !category || !author || !status) {
    ElMessage.warning('请先完善资讯信息');
    return;
  }

  newsData.value = [
    normalizeNewsRecord({
      author,
      category,
      status,
      title,
      updatedAt: getCurrentDateTime(),
    }),
    ...newsData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新建资讯：${title}`);
  closeDetailDrawer();
}

async function updateNews(values: Record<string, any>) {
  if (!selectedNews.value) {
    ElMessage.warning('未找到当前资讯，请重新选择');
    closeDetailDrawer();
    return;
  }

  const title = String(values.title ?? '').trim();
  const category = String(values.category ?? '').trim();
  const author = String(values.author ?? '').trim();
  const status = String(values.status ?? '草稿').trim() as PublishStatus;

  if (!title || !category || !author || !status) {
    ElMessage.warning('请先完善资讯信息');
    return;
  }

  updateNewsRecord(selectedNews.value.id, { author, category, status, title });
  ElMessage.success(`已更新资讯：${title}`);
  closeDetailDrawer();
}

async function publishNews() {
  if (!selectedNews.value) {
    ElMessage.warning('未找到当前资讯，请重新选择');
    closeDetailDrawer();
    return;
  }
  if (selectedNews.value.status === '已发布') {
    ElMessage.warning('当前资讯已发布，无需重复操作');
    closeDetailDrawer();
    return;
  }
  updateNewsRecord(selectedNews.value.id, { status: '已发布' });
  ElMessage.success(`已发布资讯：${selectedNews.value.title}`);
  closeDetailDrawer();
}

async function offlineNews() {
  if (!selectedNews.value) {
    ElMessage.warning('未找到当前资讯，请重新选择');
    closeDetailDrawer();
    return;
  }
  if (selectedNews.value.status === '已下线') {
    ElMessage.warning('当前资讯已下线，无需重复操作');
    closeDetailDrawer();
    return;
  }
  updateNewsRecord(selectedNews.value.id, { status: '已下线' });
  ElMessage.success(`已下线资讯：${selectedNews.value.title}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isCreateMode.value) {
    await createNews(values);
    return;
  }
  if (isEditMode.value) {
    await updateNews(values);
  }
}

async function submitActiveAction() {
  if (isPublishMode.value) {
    await publishNews();
    return;
  }
  if (isOfflineMode.value) {
    await offlineNews();
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
    selectedNewsId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '新建资讯',
        type: 'primary',
        description: '新增资讯内容并进入发布流程。',
        fields: [
          createTextField({
            field: 'title',
            label: '资讯标题',
            note: '内容标题',
            required: true,
          }),
          createSelectField({
            field: 'category',
            label: '分类',
            note: '如平台动态、运营资讯',
            options: newsCategoryOptions,
            required: true,
          }),
          createTextField({
            field: 'author',
            label: '作者',
            note: '内容发布人',
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '发布状态',
            note: '草稿 / 已发布 / 已下线',
            options: publishStatusOptions,
            required: true,
          }),
        ],
        goal: '创建资讯内容。',
        permissionPoints: ['新建'],
        processSteps: [
          '填写资讯标题、分类和作者。',
          '设置当前发布状态。',
          '保存后资讯进入资讯列表。',
        ],
      },
    ],
    columns: [
      { key: 'title', label: '资讯标题' },
      { key: 'category', label: '分类' },
      { key: 'status', label: '发布状态' },
      { key: 'author', label: '作者' },
      { key: 'updatedAt', label: '更新时间' },
    ],
    rowActions: [
      {
        label: '编辑',
        description: '维护资讯标题、分类和内容。',
        fields: [
          createTextField({
            field: 'title',
            label: '资讯标题',
            note: '内容标题',
            required: true,
          }),
          createSelectField({
            field: 'category',
            label: '分类',
            note: '内容分类',
            options: newsCategoryOptions,
            required: true,
          }),
          createTextField({
            field: 'author',
            label: '作者',
            note: '内容归属作者',
            required: true,
          }),
          createSelectField({
            field: 'status',
            label: '状态',
            note: '草稿 / 已发布 / 已下线',
            options: publishStatusOptions,
            required: true,
          }),
        ],
        goal: '调整资讯内容。',
        permissionPoints: ['编辑'],
      },
      {
        label: '发布',
        type: 'success',
        description: '将资讯从草稿状态发布上线。',
        goal: '对外展示资讯内容。',
        permissionPoints: ['发布'],
      },
      {
        label: '下线',
        type: 'danger',
        description: '将资讯下线停止展示。',
        goal: '关闭内容展示。',
        permissionPoints: ['下线'],
      },
    ],
    sampleData: [
      {
        author: '运营中心',
        category: '平台动态',
        id: 'news-001',
        status: '已发布',
        title: '暑期景区流量预测与应对建议',
        updatedAt: '2026-07-05 17:25',
      },
      {
        author: '产品团队',
        category: '产品公告',
        id: 'news-002',
        status: '草稿',
        title: '票务对账能力升级说明',
        updatedAt: '2026-07-06 10:15',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理资讯内容的创建、编辑、发布和下线，确保平台资讯内容及时、准确地对外展示。',
    documentNotes: [
      '资讯发布后应进入对外可见状态。',
      '下线资讯后不应继续在资讯入口展示。',
      '分类应尽量保持统一，避免内容归档混乱。',
    ],
    exceptions: [
      '资讯标题、分类、作者或状态为空时不允许保存。',
      '已发布资讯不允许重复执行发布动作。',
      '已下线资讯不允许重复执行下线动作。',
    ],
    fields: [
      { label: '资讯标题', note: '资讯内容主标题', required: true },
      { label: '分类', note: '用于资讯归档分类', required: true },
      { label: '作者', note: '资讯内容归属人', required: true },
      { label: '发布状态', note: '控制资讯是否对外展示', required: true },
    ],
    pageGoal: '维护资讯内容与发布状态，确保资讯展示与下线管理有序。',
    permissionPoints: ['新建', '编辑', '发布', '下线'],
    processSteps: [
      '通过资讯标题、分类或状态筛选资讯。',
      '从列表进入新建、编辑、发布或下线动作。',
      '在抽屉中完成资讯信息填写或状态确认。',
      '提交后即时刷新资讯状态和更新时间。',
    ],
    statusTransitions: [
      {
        current: '草稿',
        note: '发布后资讯开始对外展示。',
        target: '已发布',
        trigger: '发布',
      },
      {
        current: '已发布',
        note: '下线后资讯停止展示。',
        target: '已下线',
        trigger: '下线',
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
            <ElFormItem label="资讯标题">
              <ElInput
                v-model="filterState.title"
                clearable
                placeholder="请输入资讯标题"
              />
            </ElFormItem>

            <ElFormItem label="分类">
              <ElSelect
                v-model="filterState.category"
                clearable
                filterable
                placeholder="请选择分类"
              >
                <ElOption
                  v-for="option in newsCategoryOptions"
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
                placeholder="请选择发布状态"
              >
                <ElOption
                  v-for="option in publishStatusOptions"
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
                :type="getStatusTagType(getNewsRow(row).status)"
              >
                {{ getNewsRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getNewsRow(row), column.key)
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
            :total="filteredNews.length"
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
          selectedNews && !hasActionFields && !isPublishMode && !isOfflineMode
        "
        class="flex flex-col gap-4"
      >
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="资讯标题">
            {{ selectedNews.title }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="分类">
            {{ selectedNews.category }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="作者">
            {{ selectedNews.author }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发布状态">
            <ElTag :type="getStatusTagType(selectedNews.status)">
              {{ selectedNews.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ selectedNews.updatedAt }}
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
