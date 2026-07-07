<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  storeTypeOptions,
  templateTypeOptions,
  tenantStatusOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '新建模板',
      type: 'primary',
      description: '新增打印模板并定义适用范围。',
      fields: [
        createTextField({
          field: 'templateName',
          label: '模板名称',
          note: '模板展示名称',
          required: true,
        }),
        createSelectField({
          field: 'templateType',
          label: '模板类型',
          note: '如小票模板、票面模板',
          options: templateTypeOptions,
          required: true,
        }),
        createSelectField({
          field: 'scope',
          label: '适用范围',
          note: '如景区门店、游客中心',
          options: storeTypeOptions,
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 停用',
          options: tenantStatusOptions,
          required: true,
        }),
      ],
      goal: '建立可供门店选择的打印模板。',
      permissionPoints: ['新建'],
    },
    {
      label: '模板预览',
      type: 'info',
      description: '查看模板示意与排版效果。',
      goal: '确认模板输出效果。',
      permissionPoints: ['查看'],
    },
  ],
  filters: [
    createTextFilter({ field: 'templateName', label: '模板名称' }),
    createSelectFilter({
      field: 'templateType',
      label: '模板类型',
      options: templateTypeOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: tenantStatusOptions,
    }),
  ],
  columns: [
    { key: 'templateName', label: '模板名称' },
    { key: 'templateType', label: '模板类型' },
    { key: 'scope', label: '适用范围' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  rowActions: [
    {
      label: '编辑',
      description: '修改模板配置和适用范围。',
      goal: '维护模板资料。',
      permissionPoints: ['编辑'],
    },
    {
      label: '预览',
      description: '预览当前模板样式。',
      goal: '校验模板内容与版式。',
      permissionPoints: ['查看'],
    },
    {
      label: '停用',
      type: 'danger',
      description: '停用当前模板。',
      goal: '关闭模板继续被配置使用。',
      permissionPoints: ['停用'],
    },
  ],
  sampleData: [
    {
      scope: '景区门店',
      status: '启用',
      templateName: '标准核销小票模板',
      templateType: '小票模板',
      updatedAt: '2026-07-04 20:10',
    },
  ],
  supportActions: [
    {
      label: '模板编辑抽屉',
      type: 'drawer',
      description: '抽屉中维护模板名称、类型和适用范围。',
      fields: [
        createTextField({
          field: 'templateName',
          label: '模板名称',
          note: '模板展示名称',
          required: true,
        }),
        createSelectField({
          field: 'templateType',
          label: '模板类型',
          note: '模板类型',
          options: templateTypeOptions,
          required: true,
        }),
        createSelectField({
          field: 'scope',
          label: '适用范围',
          note: '控制门店可选范围',
          options: storeTypeOptions,
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 停用',
          options: tenantStatusOptions,
          required: true,
        }),
      ],
      permissionPoints: ['新建', '编辑'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '管理打印模板。',
  description: '管理打印模板，支持新建、编辑、预览和停用。',
  documentNotes: [
    '打印模板页用于管理模板新建、编辑、预览和停用。',
    '模板适用范围可按门店类型控制。',
  ],
  fields: [
    { label: '模板名称', note: '模板展示名称', required: true },
    { label: '模板类型', note: '如小票模板、票面模板', required: true },
    { label: '适用范围', note: '如景区门店、游客中心', required: true },
    { label: '状态', note: '启用 / 停用', required: true },
  ],
  processSteps: [
    '进入打印模板页。',
    '新建模板。',
    '编辑模板。',
    '按需停用模板。',
  ],
  permissionPoints: ['查看', '新建', '编辑', '停用'],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
