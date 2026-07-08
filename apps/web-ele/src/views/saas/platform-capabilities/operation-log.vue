<script lang="ts" setup>
import type {
  SaaSActionItem,
  SaaSFieldItem,
  SaaSFilterField,
  SaaSPageMeta,
} from '../_shared/page-meta';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElPagination,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

import { createSelectFilter, createTextFilter } from '../_shared/field-factory';
import {
  operationActionOptions,
  operationModuleOptions,
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

interface OperationLogRecord {
  action: string;
  detail: string;
  id: string;
  module: string;
  operator: string;
  target: string;
  time: string;
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
  action: '',
  module: '',
  operator: '',
});
const pageSize = ref(10);
const selectedLogId = ref('');
const logData = ref<OperationLogRecord[]>(
  interactions.sampleData.map((item) => normalizeLogRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '操作日志'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedLog = computed(
  () => logData.value.find((item) => item.id === selectedLogId.value) ?? null,
);
const filteredLogs = computed(() => {
  const operator = filterState.value.operator.trim().toLowerCase();
  const module = filterState.value.module;
  const action = filterState.value.action;

  return logData.value.filter((item) => {
    const matchesOperator =
      !operator || item.operator.toLowerCase().includes(operator);
    const matchesModule = !module || item.module === module;
    const matchesAction = !action || item.action === action;
    return matchesOperator && matchesModule && matchesAction;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredLogs.value.slice(start, start + pageSize.value);
});
const explanationFieldsData = computed(() =>
  (explanations.fields ?? []).map((item) => ({ ...item })),
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

function buildFieldSchema(field: FormFieldItem, index: number): VbenFormSchema {
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
  };
}

function buildFilterSchema(filters: readonly SaaSFilterField[] = []) {
  return filters.map((filter, index) => buildFieldSchema(filter, index));
}

function normalizeLogRecord(
  record: Record<string, string>,
): OperationLogRecord {
  return {
    action: record.action ?? '',
    detail: record.detail ?? '',
    id: record.id ?? `operation-log-${Math.random().toString(36).slice(2, 10)}`,
    module: record.module ?? '',
    operator: record.operator ?? '',
    target: record.target ?? '',
    time: record.time ?? '',
  };
}

function getLogRow(row: Record<string, any>) {
  return row as OperationLogRecord;
}

function getCellValue(row: OperationLogRecord, key: string) {
  return row[key as keyof OperationLogRecord] ?? '-';
}

function getInteractionGoal(interaction?: InteractionItem) {
  return interaction?.goal || explanations.pageGoal;
}

function openAction(action: InteractionItem) {
  activeAction.value = action.label;
  selectedLogId.value = '';
  detailVisible.value = true;
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  activeAction.value = action.label;
  selectedLogId.value = getLogRow(row).id;
  detailVisible.value = true;
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    action: String(values.action ?? '').trim(),
    module: String(values.module ?? '').trim(),
    operator: String(values.operator ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    action: '',
    module: '',
    operator: '',
  };
  currentPage.value = 1;
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page;
}

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '查看日志说明',
        type: 'info',
        description: '查看操作日志记录口径与覆盖范围。',
        goal: '统一理解操作留痕范围。',
        permissionPoints: ['查看日志'],
      },
    ],
    filters: [
      createTextFilter({
        field: 'operator',
        label: '操作人',
        placeholder: '请输入操作人',
      }),
      createSelectFilter({
        field: 'module',
        label: '所属模块',
        options: operationModuleOptions,
      }),
      createSelectFilter({
        field: 'action',
        label: '操作动作',
        options: operationActionOptions,
      }),
    ],
    columns: [
      { key: 'operator', label: '操作人' },
      { key: 'module', label: '所属模块' },
      { key: 'action', label: '操作动作' },
      { key: 'target', label: '操作对象' },
      { key: 'time', label: '操作时间' },
    ],
    rowActions: [
      {
        label: '查看详情',
        description: '查看单条日志的具体操作内容和上下文。',
        goal: '追踪具体操作留痕。',
        permissionPoints: ['查看日志'],
      },
    ],
    sampleData: [
      {
        action: '停用',
        detail: '停用门店后，同步关闭门店员工登录权限并记录通知发送结果。',
        id: 'operation-log-001',
        module: '门店管理',
        operator: '李青',
        target: '欢乐谷东区店',
        time: '2026-07-06 10:12:22',
      },
      {
        action: '编辑',
        detail:
          '调整顶部公告的通知对象，从租户管理员扩大到租户管理员 / 门店管理员。',
        id: 'operation-log-002',
        module: '公告管理',
        operator: '周敏',
        target: '暑期票务保障公告',
        time: '2026-07-06 14:08:03',
      },
      {
        action: '新建',
        detail: '创建新的租户档案，并初始化顶级管理员账号与初始密码。',
        id: 'operation-log-003',
        module: '租户管理',
        operator: '陈嘉',
        target: '云上乐园',
        time: '2026-07-07 09:16:45',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '查看平台操作留痕，支持问题定位和操作追溯。',
    description:
      '记录 SaaS 后台各业务模块的操作人、操作动作、操作对象和发生时间。',
    documentNotes: [
      '操作日志重点覆盖租户、门店、版本、权益、应用、公告等业务模块。',
      '该页面以只读查看为主，不提供编辑类交互。',
    ],
    fields: [
      { label: '操作人', note: '执行该动作的后台账号' },
      { label: '所属模块', note: '动作发生的业务模块' },
      { label: '操作动作', note: '例如新建、编辑、停用' },
      { label: '操作对象', note: '被影响的数据对象名称' },
      { label: '操作时间', note: '留痕写入时间' },
    ],
    processSteps: [
      '通过操作人、模块、动作筛选日志记录。',
      '在列表中定位目标日志并进入详情抽屉。',
      '查看操作描述和影响对象，辅助排查问题。',
    ],
    permissionPoints: ['查看日志'],
    exceptions: ['操作日志仅用于查看，不支持手工修改或删除。'],
  };
}
</script>

<template>
  <Page :description="undefined" :title="undefined">
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
              <span>{{ getCellValue(getLogRow(row), column.key) }}</span>
            </template>
          </ElTable.TableColumn>

          <ElTable.TableColumn label="操作" fixed="right" min-width="160">
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
            :total="filteredLogs.length"
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
                <ElTable.TableColumn label="说明" prop="note" min-width="360" />
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

      <div v-if="selectedLog" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="操作人">
            {{ selectedLog.operator }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="所属模块">
            {{ selectedLog.module }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作动作">
            {{ selectedLog.action }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作对象">
            {{ selectedLog.target }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作时间">
            {{ selectedLog.time }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="日志详情">
            {{ selectedLog.detail }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <ElEmpty
        v-else
        description="当前操作没有明细内容，请点击“查看说明”了解处理规则。"
      />

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="detailVisible = false">关闭</ElButton>
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
