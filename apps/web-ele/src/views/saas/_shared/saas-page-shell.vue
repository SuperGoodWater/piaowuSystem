<script lang="ts" setup>
import type {
  SaaSActionItem,
  SaaSFieldItem,
  SaaSFilterField,
  SaaSInteractionSpec,
  SaaSPageMeta,
  SaaSSupportAction,
} from './page-meta';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElPagination,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

import ExplanationDialog from './explanation-dialog.vue';

defineOptions({ name: 'SaaSPageShell' });

const props = defineProps<{
  meta: SaaSPageMeta;
}>();

const route = useRoute();
const activeAction = ref('');
const detailVisible = ref(false);
const explanationVisible = ref(false);
const [SupportDrawer, supportDrawerApi] = useVbenDrawer({
  closeOnClickModal: false,
});
const [FilterForm, filterFormApi] = useVbenForm({
  actionPosition: 'right',
  actionWrapperClass: 'pt-1',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  compact: true,
  handleSubmit: () => undefined,
  layout: 'vertical',
  resetButtonOptions: {
    content: '重置筛选',
  },
  schema: [],
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
  handleSubmit: () => undefined,
  layout: 'vertical',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});
const [SupportActionForm, supportActionFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  handleSubmit: () => undefined,
  layout: 'vertical',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const pageTitle = computed(() => String(route.meta.title ?? ''));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const tableData = computed(() =>
  props.meta.sampleData.map((item) => ({ ...item })),
);
const actionCatalog = computed<(SaaSActionItem | SaaSSupportAction)[]>(() => [
  ...props.meta.actions,
  ...props.meta.rowActions,
  ...(props.meta.supportActions ?? []),
]);
const activeInteraction = computed(() => {
  return actionCatalog.value.find((item) => item.label === activeAction.value);
});

function openAction(action: SaaSActionItem) {
  activeAction.value = action.label;
  detailVisible.value = true;
}

function handleSupportAction(action: SaaSSupportAction) {
  activeAction.value = action.label;
  supportDrawerApi.setState({ title: action.label });
  supportDrawerApi.open();
}

function getInteractionGoal(interaction?: SaaSInteractionSpec) {
  return interaction?.goal || props.meta.pageGoal;
}

function buildFieldKey(label: string, index: number) {
  return `field_${index}_${label}`;
}

function getFieldName(
  field:
    | Pick<SaaSFieldItem, 'field' | 'label'>
    | Pick<SaaSFilterField, 'field' | 'label'>,
  index: number,
) {
  return field.field ?? buildFieldKey(field.label, index);
}

function getFieldDefaultValue(field: SaaSFieldItem | SaaSFilterField) {
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
  field: SaaSFieldItem | SaaSFilterField,
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

function buildDefaultValues(
  fields: readonly (SaaSFieldItem | SaaSFilterField)[] = [],
) {
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

function buildInteractionSchema(interaction?: SaaSInteractionSpec) {
  return (interaction?.fields ?? []).map((field, index) =>
    buildFieldSchema(field, index, { includeRules: true }),
  );
}

function applyInteractionForm(interaction?: SaaSInteractionSpec) {
  const schema = buildInteractionSchema(interaction);
  const defaults = buildDefaultValues(interaction?.fields ?? []);

  detailActionFormApi.setState({ schema });
  supportActionFormApi.setState({ schema });
  detailActionFormApi.resetForm({ values: defaults });
  supportActionFormApi.resetForm({ values: defaults });
}

watch(
  () => props.meta.filters,
  (filters) => {
    const schema = buildFilterSchema(filters);
    const defaults = buildDefaultValues(filters);
    filterFormApi.setState({ schema });
    filterFormApi.resetForm({ values: defaults });
  },
  { deep: true, immediate: true },
);

watch(
  activeInteraction,
  (interaction) => {
    applyInteractionForm(interaction);
  },
  { immediate: true },
);
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
              v-for="action in meta.actions"
              :key="action.label"
              :type="action.type || 'primary'"
              @click="openAction(action)"
            >
              {{ action.label }}
            </ElButton>
            <ElButton
              v-for="supportAction in meta.supportActions || []"
              :key="supportAction.label"
              plain
              @click="handleSupportAction(supportAction)"
            >
              {{ supportAction.label }}
            </ElButton>
          </template>
        </FilterForm>
      </div>

      <div class="saas-table-panel rounded-md bg-card p-3">
        <ElTable class="saas-data-table" :data="tableData" size="small" stripe>
          <ElTable.TableColumn
            v-for="column in meta.columns"
            :key="column.key"
            :label="column.label"
            :prop="column.key"
            min-width="140"
          />
          <ElTable.TableColumn label="操作" fixed="right" min-width="260">
            <template #default>
              <ElSpace wrap>
                <ElButton
                  v-for="action in meta.rowActions"
                  :key="action.label"
                  link
                  :type="action.type || 'primary'"
                  @click="openAction(action)"
                >
                  {{ action.label }}
                </ElButton>
              </ElSpace>
            </template>
          </ElTable.TableColumn>
        </ElTable>

        <div class="mt-3 flex justify-end">
          <ElPagination
            :current-page="1"
            :page-size="10"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :total="meta.sampleData.length * 10"
          />
        </div>
      </div>
    </div>

    <ExplanationDialog v-model:visible="explanationVisible" :title="pageTitle">
      <div class="flex flex-col gap-4">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="优先级">
            <ElTag :type="pagePriority === 'P0' ? 'danger' : 'warning'">
              {{ pagePriority }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="页面目标">
            {{ meta.pageGoal }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="主要说明">
            {{ meta.description }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div
          v-if="meta.documentNotes && meta.documentNotes.length > 0"
          class="rounded-lg border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)] p-4"
        >
          <div class="mb-2 text-sm font-medium">规则提醒</div>
          <ul
            class="list-disc pl-5 text-sm leading-6 text-[var(--el-text-color-secondary)]"
          >
            <li v-for="note in meta.documentNotes" :key="note">
              {{ note }}
            </li>
          </ul>
        </div>

        <div v-if="meta.fields && meta.fields.length > 0">
          <div class="mb-2 text-sm font-medium">核心字段</div>
          <ElTable :data="meta.fields.map((item) => ({ ...item }))" stripe>
            <ElTable.TableColumn label="字段" prop="label" min-width="180" />
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

        <div v-if="meta.processSteps && meta.processSteps.length > 0">
          <div class="mb-2 text-sm font-medium">关键流程</div>
          <ol
            class="list-decimal pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
          >
            <li v-for="step in meta.processSteps" :key="step">
              {{ step }}
            </li>
          </ol>
        </div>

        <div v-if="meta.statusTransitions && meta.statusTransitions.length > 0">
          <div class="mb-2 text-sm font-medium">状态流转</div>
          <ElTable
            :data="meta.statusTransitions.map((item) => ({ ...item }))"
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
          <div v-if="meta.permissionPoints && meta.permissionPoints.length > 0">
            <div class="mb-2 text-sm font-medium">权限点</div>
            <ul
              class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
            >
              <li v-for="permission in meta.permissionPoints" :key="permission">
                {{ permission }}
              </li>
            </ul>
          </div>

          <div v-if="meta.exceptions && meta.exceptions.length > 0">
            <div class="mb-2 text-sm font-medium">异常与限制</div>
            <ul
              class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
            >
              <li v-for="exception in meta.exceptions" :key="exception">
                {{ exception }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="meta.pendingItems && meta.pendingItems.length > 0">
          <div class="mb-2 text-sm font-medium">待补充项</div>
          <ul
            class="list-disc pl-5 text-sm leading-7 text-[var(--el-text-color-primary)]"
          >
            <li v-for="item in meta.pendingItems" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </ExplanationDialog>

    <ElDrawer v-model="detailVisible" :title="activeAction" size="40%">
      <div class="flex flex-col gap-4">
        <p class="text-sm leading-6 text-[var(--el-text-color-secondary)]">
          {{
            activeInteraction?.description ||
            '当前动作已预留实现位置，后续可在这里接入真实的表单、详情、审核或发布流程。'
          }}
        </p>
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
        </ElDescriptions>

        <div
          v-if="
            activeInteraction?.documentNotes &&
            activeInteraction.documentNotes.length > 0
          "
          class="rounded-lg border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)] p-4"
        >
          <div class="mb-2 text-sm font-medium">动作说明</div>
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
          <div class="mb-2 text-sm font-medium">表单骨架</div>
          <DetailActionForm />
          <div class="flex justify-end gap-3">
            <ElButton
              @click="
                detailActionFormApi.resetForm({
                  values: buildDefaultValues(activeInteraction?.fields ?? []),
                })
              "
            >
              重置
            </ElButton>
            <ElButton type="primary" @click="detailActionFormApi.submitForm">
提交
</ElButton>
          </div>

          <div class="mb-2 text-sm font-medium">涉及字段</div>
          <ElTable
            :data="activeInteraction.fields.map((item) => ({ ...item }))"
            max-height="260"
            stripe
          >
            <ElTable.TableColumn label="字段" prop="label" min-width="140" />
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
              activeInteraction.statusTransitions.map((item) => ({ ...item }))
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
    </ElDrawer>

    <SupportDrawer class="w-150">
      <div class="flex flex-col gap-4 p-1">
        <p class="text-sm leading-6 text-[var(--el-text-color-secondary)]">
          {{
            activeInteraction?.description ||
            '这里作为支撑交互容器，后续可继续扩展为配置抽屉、编辑抽屉、发布抽屉等。'
          }}
        </p>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="页面">
            {{ pageTitle }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前动作">
            {{ activeAction }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="目标">
            {{ getInteractionGoal(activeInteraction) }}
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
          <div class="mb-2 text-sm font-medium">抽屉表单骨架</div>
          <SupportActionForm />
          <div class="flex justify-end gap-3">
            <ElButton
              @click="
                supportActionFormApi.resetForm({
                  values: buildDefaultValues(activeInteraction?.fields ?? []),
                })
              "
            >
              重置
            </ElButton>
            <ElButton type="primary" @click="supportActionFormApi.submitForm">
提交
</ElButton>
          </div>

          <div class="mb-2 text-sm font-medium">配置字段</div>
          <ElTable
            :data="activeInteraction.fields.map((item) => ({ ...item }))"
            max-height="320"
            stripe
          >
            <ElTable.TableColumn label="字段" prop="label" min-width="160" />
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
            activeInteraction?.processSteps &&
            activeInteraction.processSteps.length > 0
          "
          class="flex flex-col gap-2"
        >
          <div class="text-sm font-medium">交互流程</div>
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
          <div class="text-sm font-medium">权限要求</div>
          <ElSpace wrap>
            <ElTag
              v-for="permission in activeInteraction.permissionPoints"
              :key="permission"
              type="warning"
            >
              {{ permission }}
            </ElTag>
          </ElSpace>
        </div>
      </div>
    </SupportDrawer>
  </Page>
</template>

<style scoped>
.saas-filter-panel {
  padding-bottom: 8px;
}

.saas-filter-panel :deep(.grid) {
  row-gap: 4px;
}

.saas-filter-panel :deep(.flex.items-center.gap-3) {
  padding-bottom: 0;
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
