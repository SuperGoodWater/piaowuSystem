<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  enabledDisabledOptions,
  parentDepartmentOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '新增部门',
      type: 'primary',
      description: '新增 SaaS 内部组织部门。',
      fields: [
        createTextField({
          field: 'departmentName',
          label: '部门名称',
          note: '组织名称',
          required: true,
        }),
        createSelectField({
          field: 'parentDepartment',
          label: '上级部门',
          note: '用于组织归属结构',
          options: parentDepartmentOptions,
        }),
        createTextField({
          field: 'manager',
          label: '负责人',
          note: '部门负责人',
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 禁用',
          options: enabledDisabledOptions,
          required: true,
        }),
      ],
      goal: '建立可供员工归属选择的组织结构。',
      permissionPoints: ['新增'],
    },
    {
      label: '组织排序',
      type: 'info',
      description: '调整部门展示顺序或层级。',
      goal: '优化组织结构展示。',
      permissionPoints: ['编辑'],
    },
  ],
  filters: [
    createTextFilter({ field: 'departmentName', label: '部门名称' }),
    createTextFilter({ field: 'manager', label: '负责人' }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: enabledDisabledOptions,
    }),
  ],
  columns: [
    { key: 'departmentName', label: '部门名称' },
    { key: 'parentDepartment', label: '上级部门' },
    { key: 'manager', label: '负责人' },
    { key: 'employeeCount', label: '员工数' },
    { key: 'status', label: '状态' },
  ],
  rowActions: [
    {
      label: '编辑',
      description: '修改部门负责人、上级归属或启停状态。',
      goal: '维护组织结构与归属信息。',
      permissionPoints: ['编辑'],
    },
    {
      label: '禁用',
      type: 'danger',
      description: '禁用部门后，不再允许新员工选择该部门。',
      goal: '关闭不再使用的组织单元。',
      permissionPoints: ['禁用'],
    },
  ],
  sampleData: [
    {
      departmentName: '平台运营部',
      employeeCount: '18',
      manager: '李青',
      parentDepartment: '总部',
      status: '启用',
    },
  ],
  supportActions: [
    {
      label: '部门编辑抽屉',
      type: 'drawer',
      description: '在抽屉中维护部门基础信息与组织归属。',
      fields: [
        createTextField({
          field: 'departmentName',
          label: '部门名称',
          note: '组织名称',
          required: true,
        }),
        createSelectField({
          field: 'parentDepartment',
          label: '上级部门',
          note: '用于组织归属结构',
          options: parentDepartmentOptions,
        }),
        createTextField({
          field: 'manager',
          label: '负责人',
          note: '部门负责人',
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 禁用',
          options: enabledDisabledOptions,
          required: true,
        }),
      ],
      permissionPoints: ['新增', '编辑'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '维护部门信息并支持新增、编辑、禁用。',
  description: '维护 SaaS 平台内部组织结构与归属关系。',
  documentNotes: ['部门管理页用于维护组织归属关系，支撑员工账号的部门选择。'],
  fields: [
    { label: '部门名称', note: '组织名称', required: true },
    { label: '上级部门', note: '用于组织归属结构' },
    { label: '负责人', note: '部门负责人', required: true },
    { label: '状态', note: '启用 / 禁用', required: true },
  ],
  processSteps: [
    '进入部门管理页。',
    '新增部门。',
    '编辑部门。',
    '按需禁用部门。',
  ],
  permissionPoints: ['查看', '新增', '编辑', '禁用'],
  exceptions: ['部门禁用后需同步限制组织归属选择。'],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
