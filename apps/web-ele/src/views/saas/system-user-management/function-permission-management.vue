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
} from '../_shared/field-factory';
import { moduleScopeOptions, roleNameOptions } from '../_shared/options';

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

interface PermissionRecord {
  id: string;
  moduleScope: string;
  permissionCount: string;
  permissionSet: string;
  roleName: string;
  updatedAt: string;
  updatedBy: string;
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
  moduleScope: '',
  roleName: '',
});
const pageSize = ref(10);
const selectedPermissionId = ref('');
const permissionData = ref<PermissionRecord[]>(
  interactions.sampleData.map((item) => normalizePermissionRecord(item)),
);

const pageTitle = computed(() => String(route.meta.title ?? '功能权限管理'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));
const actionCatalog = computed<InteractionItem[]>(() => [
  ...interactions.actions,
  ...interactions.rowActions,
]);
const activeInteraction = computed(() =>
  actionCatalog.value.find((item) => item.label === activeAction.value),
);
const selectedPermission = computed(
  () =>
    permissionData.value.find(
      (item) => item.id === selectedPermissionId.value,
    ) ?? null,
);
const isSaveMode = computed(() => activeAction.value === '保存权限配置');
const isViewMode = computed(() => activeAction.value === '查看权限');
const isConfigMode = computed(() => activeAction.value === '配置权限');
const hasActionFields = computed(() =>
  Boolean(activeInteraction.value?.fields?.length),
);
const showResetButton = computed(() => isSaveMode.value || isConfigMode.value);
const showSubmitButton = computed(() => isSaveMode.value || isConfigMode.value);
const submitButtonText = computed(() => '保存权限');
const filteredPermissions = computed(() => {
  const roleName = filterState.value.roleName;
  const moduleScope = filterState.value.moduleScope;

  return permissionData.value.filter((item) => {
    const matchRole = !roleName || item.roleName === roleName;
    const matchScope = !moduleScope || item.moduleScope.includes(moduleScope);

    return matchRole && matchScope;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;

  return filteredPermissions.value.slice(start, end);
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

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const hours = `${now.getHours()}`.padStart(2, '0');
  const minutes = `${now.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function normalizePermissionRecord(
  record: Record<string, string>,
): PermissionRecord {
  return {
    id: record.id ?? `permission-${Math.random().toString(36).slice(2, 10)}`,
    moduleScope: record.moduleScope ?? '',
    permissionCount: record.permissionCount ?? '0',
    permissionSet: record.permissionSet ?? '',
    roleName: record.roleName ?? '',
    updatedAt: record.updatedAt ?? getCurrentDateTime(),
    updatedBy: record.updatedBy ?? '',
  };
}

function getPermissionRow(row: Record<string, any>): PermissionRecord {
  return normalizePermissionRecord(row);
}

function getCellValue(row: PermissionRecord, key: string) {
  return row[key as keyof PermissionRecord] ?? '-';
}

function updatePermissionRecord(id: string, patch: Partial<PermissionRecord>) {
  permissionData.value = permissionData.value.map((item) =>
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
  selectedPermissionId.value = '';
  detailVisible.value = true;
  applyInteractionForm(action);
}

function handleRowAction(action: InteractionItem, row: Record<string, any>) {
  const currentRow = getPermissionRow(row);
  activeAction.value = action.label;
  selectedPermissionId.value = currentRow.id;
  detailVisible.value = true;
  applyInteractionForm(action);

  if (action.label === '配置权限') {
    populateInteractionForm({
      moduleScope: currentRow.moduleScope.includes('客户管理')
        ? '客户管理'
        : currentRow.moduleScope,
      permissionSet: currentRow.permissionSet || currentRow.moduleScope,
      roleName: currentRow.roleName,
    });
  }
}

function handleFilterSubmit(values: Record<string, any>) {
  filterState.value = {
    moduleScope: String(values.moduleScope ?? '').trim(),
    roleName: String(values.roleName ?? '').trim(),
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    moduleScope: '',
    roleName: '',
  };
  currentPage.value = 1;
}

function resetActiveForm() {
  if (isConfigMode.value && selectedPermission.value) {
    populateInteractionForm({
      moduleScope: selectedPermission.value.moduleScope.includes('客户管理')
        ? '客户管理'
        : selectedPermission.value.moduleScope,
      permissionSet:
        selectedPermission.value.permissionSet ||
        selectedPermission.value.moduleScope,
      roleName: selectedPermission.value.roleName,
    });
    return;
  }

  applyInteractionForm(activeInteraction.value);
}

async function savePermission(values: Record<string, any>) {
  const roleName = String(values.roleName ?? '').trim();
  const moduleScope = String(values.moduleScope ?? '').trim();
  const permissionSet = String(values.permissionSet ?? '').trim();

  if (!roleName || !moduleScope || !permissionSet) {
    ElMessage.warning('请先完善权限配置');
    return;
  }

  if (selectedPermission.value) {
    updatePermissionRecord(selectedPermission.value.id, {
      moduleScope,
      permissionCount: String(
        permissionSet
          .split('、')
          .map((item) => item.trim())
          .filter(Boolean).length,
      ),
      permissionSet,
      roleName,
      updatedBy: '当前管理员',
    });
    ElMessage.success(`已保存权限配置：${roleName}`);
    closeDetailDrawer();
    return;
  }

  permissionData.value = [
    normalizePermissionRecord({
      moduleScope,
      permissionCount: String(
        permissionSet
          .split('、')
          .map((item) => item.trim())
          .filter(Boolean).length,
      ),
      permissionSet,
      roleName,
      updatedAt: getCurrentDateTime(),
      updatedBy: '当前管理员',
    }),
    ...permissionData.value,
  ];
  currentPage.value = 1;
  ElMessage.success(`已新增权限配置：${roleName}`);
  closeDetailDrawer();
}

async function handleDetailSubmit(values: Record<string, any>) {
  if (isSaveMode.value || isConfigMode.value) {
    await savePermission(values);
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
    selectedPermissionId.value = '';
    applyInteractionForm();
  }
});

function createInteractions(): PageInteractions {
  return {
    actions: [
      {
        label: '保存权限配置',
        type: 'primary',
        description: '保存当前角色或职能的功能级权限配置。',
        fields: [
          createSelectField({
            field: 'roleName',
            label: '角色名称',
            note: '选择需要配置权限的角色',
            options: roleNameOptions,
            required: true,
          }),
          createSelectField({
            field: 'moduleScope',
            label: '模块范围',
            note: '按模块维度配置权限',
            options: moduleScopeOptions,
            required: true,
          }),
          {
            field: 'permissionSet',
            inputType: 'textarea',
            label: '权限点集合',
            note: '填写当前角色已勾选的权限点名称，使用顿号分隔',
            required: true,
            rows: 4,
          },
        ],
        goal: '固化角色权限边界。',
        permissionPoints: ['权限配置'],
        processSteps: [
          '选择角色名称和模块范围。',
          '填写或调整权限点集合。',
          '保存后更新权限点数量和最后修改时间。',
        ],
      },
    ],
    columns: [
      { key: 'roleName', label: '角色名称' },
      { key: 'moduleScope', label: '模块范围' },
      { key: 'permissionCount', label: '权限点数量' },
      { key: 'updatedBy', label: '最后修改人' },
      { key: 'updatedAt', label: '最后修改时间' },
    ],
    filters: [
      createSelectFilter({
        field: 'roleName',
        label: '角色名称',
        options: roleNameOptions,
      }),
      createSelectFilter({
        field: 'moduleScope',
        label: '模块范围',
        options: moduleScopeOptions,
      }),
    ],
    rowActions: [
      {
        label: '查看权限',
        description: '查看当前角色已勾选权限点。',
        goal: '确认角色权限边界。',
        permissionPoints: ['查看'],
      },
      {
        label: '配置权限',
        type: 'primary',
        description: '维护模块级权限点。',
        fields: [
          createSelectField({
            field: 'roleName',
            label: '角色名称',
            note: '选择需要配置权限的角色',
            options: roleNameOptions,
            required: true,
          }),
          createSelectField({
            field: 'moduleScope',
            label: '模块范围',
            note: '按模块维度配置权限',
            options: moduleScopeOptions,
            required: true,
          }),
          {
            field: 'permissionSet',
            inputType: 'textarea',
            label: '权限点集合',
            note: '填写当前角色已勾选的权限点名称，使用顿号分隔',
            required: true,
            rows: 4,
          },
        ],
        goal: '配置角色与模块的功能级权限。',
        permissionPoints: ['权限配置'],
      },
    ],
    sampleData: [
      {
        id: 'permission-001',
        moduleScope: '客户管理 / 应用管理 / 公告管理',
        permissionCount: '28',
        permissionSet: '租户管理、门店管理、应用列表管理、顶部公告、新闻资讯',
        roleName: '平台运营经理',
        updatedAt: '2026-07-05 09:40',
        updatedBy: '李青',
      },
      {
        id: 'permission-002',
        moduleScope: '客户管理 / 平台资源管理',
        permissionCount: '16',
        permissionSet: '门店管理、门店版本管理、设备列表、设备品牌',
        roleName: '客户成功经理',
        updatedAt: '2026-07-04 17:10',
        updatedBy: '张宁',
      },
    ],
    supportActions: [],
  };
}

function createExplanations(): PageExplanations {
  return {
    description:
      '按角色和模块范围管理功能级权限，支持查看权限边界与直接配置权限集合。',
    documentNotes: [
      '权限点应覆盖客户、应用、资源、公告、日志与通知等模块。',
      '权限配置变更后，应同步刷新到对应角色和员工账号。',
      '建议按模块维度维护权限，避免跨模块权限口径不一致。',
    ],
    exceptions: [
      '角色名称、模块范围或权限点集合为空时不允许保存。',
      '未选中配置记录时不能直接覆盖已有权限。',
      '同一角色在多个模块下的权限边界需保持一致性。',
    ],
    fields: [
      { label: '角色名称', note: '权限配置归属角色', required: true },
      { label: '模块范围', note: '当前权限配置对应的业务模块', required: true },
      {
        label: '权限点集合',
        note: '当前角色已勾选的具体权限点',
        required: true,
      },
      { label: '权限点数量', note: '由权限集合自动统计生成' },
    ],
    pageGoal: '维护角色功能权限边界，确保各模块权限点配置清晰、可追踪。',
    permissionPoints: ['查看', '权限配置'],
    processSteps: [
      '通过角色名称和模块范围筛选权限配置。',
      '查看当前权限点集合，确认权限边界。',
      '在抽屉中调整权限配置后保存。',
      '保存后即时更新权限数量和最后修改信息。',
    ],
    statusTransitions: [],
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
              <span>{{ getCellValue(getPermissionRow(row), column.key) }}</span>
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
            :total="filteredPermissions.length"
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

      <div v-if="isViewMode && selectedPermission" class="flex flex-col gap-4">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="角色名称">
            {{ selectedPermission.roleName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="模块范围">
            {{ selectedPermission.moduleScope }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权限点数量">
            {{ selectedPermission.permissionCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="权限点集合">
            {{ selectedPermission.permissionSet || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最后修改人">
            {{ selectedPermission.updatedBy }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最后修改时间">
            {{ selectedPermission.updatedAt }}
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
