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
  createSelectField,
  createSelectFilter,
  createTextFilter,
} from '../_shared/field-factory';
import {
  benefitNameOptions,
  benefitStatusOptions,
  sampleStoreOptions,
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
type BenefitStatus = '已关闭' | '已到期' | '生效中';

interface BenefitRecord {
  benefitName: string;
  endAt: string;
  id: string;
  startAt: string;
  status: BenefitStatus;
  storeName: string;
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
  benefitName: '',
  status: '',
  storeName: '',
});
const pageSize = ref(10);
const selectedBenefitId = ref('');
const benefitData = ref<BenefitRecord[]>(
  interactions.sampleData.map((item) => normalizeBenefitRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '门店权益管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P0'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedBenefit = computed(
  () =>
    benefitData.value.find((item) => item.id === selectedBenefitId.value) ??
    null,
);
const isPurchaseMode = computed(() => activeAction.value === '购买权益');
const isRenewMode = computed(
  () => activeAction.value === '续期权益' || activeAction.value === '续期',
);
const isCloseMode = computed(() => activeAction.value === '关闭权益');
const isViewMode = computed(() => activeAction.value === '查看有效期');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(
  () => isPurchaseMode.value || isRenewMode.value,
);
const showSubmitButton = computed(
  () => isPurchaseMode.value || isRenewMode.value || isCloseMode.value,
);
const submitButtonText = computed(() => {
  if (isRenewMode.value) {
    return '确认续期';
  }
  if (isCloseMode.value) {
    return '确认关闭';
  }
  return '保存';
});
const filteredBenefits = computed(() => {
  const storeName = filterState.value.storeName.trim().toLowerCase();
  const benefitName = filterState.value.benefitName;
  const status = filterState.value.status;

  return benefitData.value.filter((item) => {
    const matchStoreName =
      !storeName || item.storeName.toLowerCase().includes(storeName);
    const matchBenefitName = !benefitName || item.benefitName === benefitName;
    const matchStatus = !status || item.status === status;

    return matchStoreName && matchBenefitName && matchStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredBenefits.value.slice(start, end);
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

function buildFilterSchema(fields: readonly SaaSFilterField[]) {
  return fields.map((field, index) => buildFieldSchema(field, index));
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

function normalizeBenefitRecord(record: Record<string, string>): BenefitRecord {
  return {
    benefitName: record.benefitName ?? '',
    endAt: record.endAt ?? '',
    id: record.id ?? `benefit-${Math.random().toString(36).slice(2, 10)}`,
    startAt: record.startAt ?? '',
    status: (record.status as BenefitStatus) ?? '生效中',
    storeName: record.storeName ?? '',
  };
}

function getBenefitRow(row: Record<string, any>): BenefitRecord {
  return normalizeBenefitRecord(row);
}

function getCellValue(row: BenefitRecord, key: string) {
  return row[key as keyof BenefitRecord] ?? '-';
}

function getStatusTagType(status: BenefitStatus) {
  if (status === '生效中') {
    return 'success';
  }
  if (status === '已到期') {
    return 'warning';
  }
  return 'info';
}

function updateBenefitRecord(id: string, patch: Partial<BenefitRecord>) {
  benefitData.value = benefitData.value.map((item) =>
    item.id === id
      ? {
          ...item,
          ...patch,
        }
      : item,
  );
}

function closeDetailDrawer() {
  detailVisible.value = false;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedBenefitId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getBenefitRow(row);
  activeAction.value = action.label;
  selectedBenefitId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '续期') {
    populateInteractionForm({
      benefitName: currentRow.benefitName,
      storeName: currentRow.storeName,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    benefitName: String(values.benefitName ?? '').trim(),
    status: String(values.status ?? '').trim(),
    storeName: String(values.storeName ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    benefitName: '',
    status: '',
    storeName: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isRenewMode.value && selectedBenefit.value) {
    populateInteractionForm({
      benefitName: selectedBenefit.value.benefitName,
      storeName: selectedBenefit.value.storeName,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function purchaseBenefit(values: Record<string, any>) {
  const storeName = String(values.storeName ?? '').trim();
  const benefitName = String(values.benefitName ?? '').trim();
  const startAt = String(values.startAt ?? '').trim();
  const endAt = String(values.endAt ?? '').trim();

  if (!storeName || !benefitName || !startAt || !endAt) {
    ElMessage.warning('请先完善权益信息');
    return;
  }

  if (startAt > endAt) {
    ElMessage.warning('到期时间不能早于生效时间');
    return;
  }

  const duplicated = benefitData.value.some(
    (item) =>
      item.storeName === storeName &&
      item.benefitName === benefitName &&
      item.status === '生效中',
  );
  if (duplicated) {
    ElMessage.warning('当前门店已存在生效中的同类权益');
    return;
  }

  benefitData.value = [
    normalizeBenefitRecord({
      benefitName,
      endAt,
      startAt,
      status: '生效中',
      storeName,
    }),
    ...benefitData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已为 ${storeName} 购买权益：${benefitName}`);
  closeDetailDrawer();
}

async function renewBenefit(values: Record<string, any>) {
  const benefitName = String(values.benefitName ?? '').trim();
  const renewWindow = values.renewWindow as string[] | undefined;

  if (!selectedBenefit.value) {
    ElMessage.warning('未找到当前权益，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (!benefitName || !renewWindow || renewWindow.length !== 2) {
    ElMessage.warning('请先选择续期时间段');
    return;
  }

  const [startAt, endAt] = renewWindow;
  if (!startAt || !endAt || startAt > endAt) {
    ElMessage.warning('续期时间段无效，请重新选择');
    return;
  }

  updateBenefitRecord(selectedBenefit.value.id, {
    benefitName,
    endAt,
    startAt:
      selectedBenefit.value.startAt > startAt
        ? selectedBenefit.value.startAt
        : startAt,
    status: '生效中',
  });
  ElMessage.success(`已续期权益：${selectedBenefit.value.benefitName}`);
  closeDetailDrawer();
}

async function closeBenefit() {
  if (!selectedBenefit.value) {
    ElMessage.warning('未找到当前权益，请重新选择');
    closeDetailDrawer();
    return;
  }

  if (selectedBenefit.value.status === '已关闭') {
    ElMessage.warning('当前权益已关闭，无需重复操作');
    closeDetailDrawer();
    return;
  }

  updateBenefitRecord(selectedBenefit.value.id, {
    status: '已关闭',
  });
  ElMessage.success(`已关闭权益：${selectedBenefit.value.benefitName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isPurchaseMode.value) {
    await purchaseBenefit(values);
    return;
  }

  if (isRenewMode.value) {
    await renewBenefit(values);
  }
}

async function submitActiveAction() {
  if (isCloseMode.value) {
    await closeBenefit();
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
    selectedBenefitId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '购买权益',
        type: 'primary',
        description: '为门店购买指定权益并设置生效与到期时间。',
        fields: [
          createSelectField({
            field: 'storeName',
            label: '所属门店',
            note: '权益绑定门店',
            options: sampleStoreOptions,
            required: true,
          }),
          createSelectField({
            field: 'benefitName',
            label: '权益名称',
            note: '权益标识名称',
            options: benefitNameOptions,
            required: true,
          }),
          {
            field: 'startAt',
            inputType: 'date',
            label: '生效时间',
            note: '权益开始时间',
            required: true,
          },
          {
            field: 'endAt',
            inputType: 'date',
            label: '到期时间',
            note: '权益结束时间',
            required: true,
          },
        ],
        goal: '完成权益购买并开放对应功能入口。',
        permissionPoints: ['购买'],
        processSteps: [
          '选择所属门店和权益名称。',
          '设置生效时间与到期时间。',
          '保存后权益立即进入门店列表。',
        ],
      },
      {
        label: '续期权益',
        type: 'success',
        description: '对已到期或即将到期权益进行叠加续期。',
        fields: [
          createSelectField({
            field: 'benefitName',
            label: '权益名称',
            note: '选择需续期的权益',
            options: benefitNameOptions,
            required: true,
          }),
          {
            field: 'renewWindow',
            inputType: 'daterange',
            label: '续期时间段',
            note: '用于延长权益有效期',
            required: true,
          },
        ],
        documentNotes: ['续期支持叠加购买，延长到期时间。'],
        goal: '延长门店权益有效期。',
        permissionPoints: ['续期'],
      },
      {
        label: '关闭权益',
        type: 'danger',
        description: '手动关闭权益并关闭对应功能入口。',
        goal: '停止门店继续使用某项权益能力。',
        permissionPoints: ['关闭'],
      },
    ],
    columns: [
      { key: 'storeName', label: '所属门店' },
      { key: 'benefitName', label: '权益名称' },
      { key: 'startAt', label: '生效时间' },
      { key: 'endAt', label: '到期时间' },
      { key: 'status', label: '权益状态' },
    ],
    filters: [
      createTextFilter({
        field: 'storeName',
        label: '门店名称',
        placeholder: '请输入门店名称',
      }),
      createSelectFilter({
        field: 'benefitName',
        label: '权益名称',
        options: benefitNameOptions,
      }),
      createSelectFilter({
        field: 'status',
        label: '权益状态',
        options: benefitStatusOptions,
      }),
    ],
    rowActions: [
      {
        label: '查看有效期',
        description: '查看当前权益的生效、到期和状态信息。',
        goal: '掌握权益生命周期。',
        permissionPoints: ['查看'],
      },
      {
        label: '续期',
        type: 'success',
        description: '针对当前权益直接发起续期。',
        fields: [
          createSelectField({
            field: 'benefitName',
            label: '权益名称',
            note: '选择需续期的权益',
            options: benefitNameOptions,
            required: true,
          }),
          {
            field: 'renewWindow',
            inputType: 'daterange',
            label: '续期时间段',
            note: '用于延长权益有效期',
            required: true,
          },
        ],
        goal: '延长当前权益到期时间。',
        permissionPoints: ['续期'],
      },
      {
        label: '关闭权益',
        type: 'danger',
        description: '人工关闭当前权益。',
        goal: '停用指定权益能力。',
        permissionPoints: ['关闭'],
      },
    ],
    sampleData: [
      {
        benefitName: '高级营销权益',
        endAt: '2026-12-31',
        id: 'benefit-001',
        startAt: '2026-01-01',
        status: '生效中',
        storeName: '欢乐谷东区店',
      },
      {
        benefitName: '多门店联营权益',
        endAt: '2026-06-30',
        id: 'benefit-002',
        startAt: '2025-07-01',
        status: '已到期',
        storeName: '海岸线游客中心',
      },
      {
        benefitName: '高级营销权益',
        endAt: '2026-08-31',
        id: 'benefit-003',
        startAt: '2026-03-01',
        status: '已关闭',
        storeName: '欢乐谷西区店',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '管理门店权益购买、续期、关闭和有效期查看，重点覆盖权益生命周期和状态变更。',
    documentNotes: [
      '同一门店同类权益在生效中时，不允许再次重复购买。',
      '续期支持对已到期权益重新激活，也支持对生效中权益延长周期。',
      '关闭权益后，对应功能入口应视为不可继续使用。',
    ],
    exceptions: [
      '生效时间晚于到期时间时不允许保存。',
      '未找到当前权益记录时，续期或关闭动作不能继续。',
      '已关闭权益不允许重复执行关闭动作。',
    ],
    fields: [
      { label: '所属门店', note: '权益绑定的具体门店', required: true },
      { label: '权益名称', note: '用于区分不同权益能力', required: true },
      { label: '生效时间', note: '权益开始生效的日期', required: true },
      { label: '到期时间', note: '权益失效的日期', required: true },
      { label: '权益状态', note: '用于标记当前权益的有效性' },
    ],
    pageGoal: '维护门店权益生命周期，并支持购买、续期、关闭等关键动作。',
    permissionPoints: ['查看', '购买', '续期', '关闭'],
    processSteps: [
      '通过门店名称、权益名称或状态筛选待处理权益。',
      '从列表进入购买、续期、关闭或查看有效期动作。',
      '在抽屉中完成时间设置或确认操作。',
      '提交后即时更新权益状态与有效期。',
    ],
    statusTransitions: [
      {
        current: '已到期',
        note: '续期后重新进入生效状态。',
        target: '生效中',
        trigger: '续期',
      },
      {
        current: '生效中',
        note: '人工关闭后立即停止使用。',
        target: '已关闭',
        trigger: '关闭权益',
      },
      {
        current: '生效中',
        note: '时间自然结束后变为已到期。',
        target: '已到期',
        trigger: '到期',
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
            min-width="150"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getBenefitRow(row).status)"
              >
                {{ getBenefitRow(row).status }}
              </ElTag>
              <span v-else>{{
                getCellValue(getBenefitRow(row), column.key)
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
                    action.label === '关闭权益' &&
                    getBenefitRow(row).status === '已关闭'
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
            :total="filteredBenefits.length"
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

      <div v-if="isViewMode && selectedBenefit" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="所属门店">
            {{ selectedBenefit.storeName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权益名称">
            {{ selectedBenefit.benefitName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权益状态">
            <ElTag :type="getStatusTagType(selectedBenefit.status)">
              {{ selectedBenefit.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="生效时间">
            {{ selectedBenefit.startAt }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="到期时间">
            {{ selectedBenefit.endAt }}
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
