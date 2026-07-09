<script lang="ts" setup>
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
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

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

const auditModuleOptions = [
  { label: '门店版本管理', value: '门店版本管理' },
  { label: '门店权益管理', value: '门店权益管理' },
  { label: '员工账号管理', value: '员工账号管理' },
] as const;

const auditRiskLevelOptions = [
  { label: '高', value: '高' },
  { label: '中', value: '中' },
  { label: '低', value: '低' },
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
type RiskLevel = '中' | '低' | '高';

interface AuditLogRecord {
  beforeAfter: string;
  detail: string;
  id: string;
  module: string;
  operator: string;
  riskLevel: RiskLevel;
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
  module: '',
  operator: '',
  riskLevel: '',
});
const pageSize = ref(10);
const selectedLogId = ref('');
const logData = ref<AuditLogRecord[]>(
  interactions.sampleData.map((item) => normalizeLogRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '审计日志'));
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
  const riskLevel = filterState.value.riskLevel;

  return logData.value.filter((item) => {
    const matchesOperator =
      !operator || item.operator.toLowerCase().includes(operator);
    const matchesModule = !module || item.module === module;
    const matchesRiskLevel = !riskLevel || item.riskLevel === riskLevel;
    return matchesOperator && matchesModule && matchesRiskLevel;
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

function normalizeLogRecord(record: Record<string, string>): AuditLogRecord {
  return {
    beforeAfter: record.beforeAfter ?? '',
    detail: record.detail ?? '',
    id: record.id ?? `audit-log-${Math.random().toString(36).slice(2, 10)}`,
    module: record.module ?? '',
    operator: record.operator ?? '',
    riskLevel: (record.riskLevel as RiskLevel) ?? '中',
    time: record.time ?? '',
  };
}

function getLogRow(row: Record<string, any>) {
  return row as AuditLogRecord;
}

function getCellValue(row: AuditLogRecord, key: string) {
  return row[key as keyof AuditLogRecord] ?? '-';
}

function getRiskTagType(level: RiskLevel) {
  if (level === '高') {
    return 'danger';
  }
  if (level === '中') {
    return 'warning';
  }
  return 'info';
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

function handleFilterSubmit() {
  filterState.value = {
    operator: filterState.value.operator.trim(),
    module: filterState.value.module.trim(),
    riskLevel: filterState.value.riskLevel.trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    module: '',
    operator: '',
    riskLevel: '',
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
        label: '查看审计规则',
        type: 'info',
        description: '查看关键审计记录的采集口径和风险级别判定方式。',
        goal: '理解审计日志用于追踪高风险变更的规则。',
        permissionPoints: ['查看日志'],
      },
    ],
    columns: [
      { key: 'operator', label: '操作人' },
      { key: 'module', label: '模块' },
      { key: 'beforeAfter', label: '变更摘要' },
      { key: 'riskLevel', label: '风险等级' },
      { key: 'time', label: '审计时间' },
    ],
    rowActions: [
      {
        label: '查看详情',
        description: '查看关键记录的前后变更内容和审计说明。',
        goal: '支持问题追溯与审计核查。',
        permissionPoints: ['查看日志'],
      },
    ],
    sampleData: [
      {
        beforeAfter: '门店版本：基础版 -> 旗舰版',
        detail:
          '调整版本后，门店可见应用范围由营销应用扩大到营销应用 / 数据应用。',
        id: 'audit-log-001',
        module: '门店版本管理',
        operator: '张宁',
        riskLevel: '高',
        time: '2026-07-06 09:02:18',
      },
      {
        beforeAfter: '权益有效期：2026-07-31 -> 2026-10-31',
        detail: '为重点客户完成权益续期，同时保留原续费审批记录。',
        id: 'audit-log-002',
        module: '门店权益管理',
        operator: '林越',
        riskLevel: '中',
        time: '2026-07-06 16:25:10',
      },
      {
        beforeAfter: '账号状态：启用 -> 停用',
        detail: '停用离职员工账号，回收其功能权限和数据访问范围。',
        id: 'audit-log-003',
        module: '员工账号管理',
        operator: '王璇',
        riskLevel: '高',
        time: '2026-07-07 11:40:02',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    pageGoal: '查看关键敏感操作的前后变更记录。',
    description:
      '审计日志用于记录高风险、敏感操作的变更摘要与审计详情，服务于平台治理和问题追溯。',
    documentNotes: [
      '重点记录影响权限、版本、权益、账号等关键资源的敏感操作。',
      '审计日志为只读数据，不支持直接编辑。',
    ],
    fields: [
      { label: '操作人', note: '执行敏感操作的后台账号' },
      { label: '模块', note: '发生变更的业务模块' },
      { label: '变更摘要', note: '记录关键字段的前后变化' },
      { label: '风险等级', note: '区分高、中、低风险动作' },
      { label: '审计时间', note: '日志写入时间' },
    ],
    processSteps: [
      '通过操作人、模块、风险等级筛选审计记录。',
      '在列表中定位目标记录并进入详情抽屉。',
      '查看前后变更内容和影响说明。',
    ],
    permissionPoints: ['查看日志'],
    exceptions: ['审计日志用于留痕和审计，不支持手工修改。'],
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
            <ElFormItem label="操作人">
              <ElInput
                v-model="filterState.operator"
                clearable
                placeholder="请输入操作人"
              />
            </ElFormItem>

            <ElFormItem label="模块">
              <ElSelect
                v-model="filterState.module"
                clearable
                filterable
                placeholder="请选择模块"
              >
                <ElOption
                  v-for="option in auditModuleOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="风险等级">
              <ElSelect
                v-model="filterState.riskLevel"
                clearable
                filterable
                placeholder="请选择风险等级"
              >
                <ElOption
                  v-for="option in auditRiskLevelOptions"
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
                v-if="column.key === 'riskLevel'"
                :type="getRiskTagType(getLogRow(row).riskLevel)"
              >
                {{ getLogRow(row).riskLevel }}
              </ElTag>
              <span v-else>{{ getCellValue(getLogRow(row), column.key) }}</span>
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
          <ElDescriptionsItem label="模块">
            {{ selectedLog.module }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="风险等级">
            <ElTag :type="getRiskTagType(selectedLog.riskLevel)">
              {{ selectedLog.riskLevel }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="变更摘要">
            {{ selectedLog.beforeAfter }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审计时间">
            {{ selectedLog.time }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="审计详情">
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
