<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  employeeDepartmentOptions,
  employeeRoleOptions,
  enabledDisabledOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建员工',
      type: 'primary',
      description: '创建 SaaS 内部员工账号并归属到对应组织。',
      fields: [
        createTextField({
          field: 'name',
          label: '员工姓名',
          note: '员工展示名称',
          required: true,
        }),
        createTextField({
          field: 'account',
          label: '登录账号',
          note: '员工登录账号',
          required: true,
        }),
        createSelectField({
          field: 'department',
          label: '所属部门',
          note: '组织归属',
          options: employeeDepartmentOptions,
          required: true,
        }),
        createSelectField({
          field: 'role',
          label: '角色',
          note: '用于承接功能权限范围',
          options: employeeRoleOptions,
          required: true,
        }),
      ],
      goal: '建立可登录、可授权的内部员工账号。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量禁用',
      type: 'danger',
      description: '批量禁用员工账号，阻止继续登录系统。',
      goal: '统一处理离岗或暂停使用的员工账号。',
      permissionPoints: ['禁用'],
    },
  ],
  columns: [
    { key: 'name', label: '员工姓名' },
    { key: 'account', label: '登录账号' },
    { key: 'department', label: '所属部门' },
    { key: 'role', label: '角色' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理 SaaS 内部员工账号、组织归属和启停状态。',
  documentNotes: [
    '员工账号页用于维护 SaaS 内部员工资料和组织归属。',
    '员工权限配置应通过功能级权限点进行控制。',
  ],
  exceptions: ['员工权限配置应受功能级权限点控制。'],
  fields: [
    { label: '员工姓名', note: '员工展示名称', required: true },
    { label: '登录账号', note: '员工登录账号', required: true },
    { label: '所属部门', note: '组织归属', required: true },
    { label: '角色', note: '用于承接功能权限范围', required: true },
    { label: '状态', note: '启用 / 禁用' },
  ],
  filters: [
    createTextFilter({ field: 'name', label: '员工姓名' }),
    createTextFilter({ field: 'account', label: '登录账号' }),
    createSelectFilter({
      field: 'department',
      label: '所属部门',
      options: employeeDepartmentOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: enabledDisabledOptions,
    }),
  ],
  pageGoal: '查看与维护 SaaS 内部员工。',
  permissionPoints: ['查看', '新建', '编辑', '禁用', '权限配置'],
  processSteps: [
    '进入员工列表页。',
    '新建或编辑员工。',
    '按需禁用员工。',
    '进入员工权限配置页进行功能授权。',
  ],
  rowActions: [
    {
      label: '编辑',
      description: '修改员工归属、角色或基础资料。',
      goal: '维护员工账号基础信息。',
      permissionPoints: ['编辑'],
    },
    {
      label: '权限配置',
      type: 'warning',
      description: '进入员工权限配置页，勾选功能级权限。',
      goal: '为员工分配明确的功能权限范围。',
      permissionPoints: ['权限配置'],
    },
    {
      label: '禁用',
      type: 'danger',
      description: '停用当前员工账号。',
      goal: '终止员工继续访问后台。',
      permissionPoints: ['禁用'],
    },
  ],
  sampleData: [
    {
      account: 'ops_zhang',
      department: '平台运营部',
      name: '张宁',
      role: '运营经理',
      status: '启用',
      updatedAt: '2026-07-03 18:20',
    },
  ],
  supportActions: [
    {
      label: '新建员工抽屉',
      type: 'drawer',
      description: '抽屉内录入员工账号、组织归属和角色信息。',
      fields: [
        createTextField({
          field: 'name',
          label: '员工姓名',
          note: '员工展示名称',
          required: true,
        }),
        createTextField({
          field: 'account',
          label: '登录账号',
          note: '员工登录账号',
          required: true,
        }),
        createSelectField({
          field: 'department',
          label: '所属部门',
          note: '组织归属',
          options: employeeDepartmentOptions,
          required: true,
        }),
        createSelectField({
          field: 'role',
          label: '角色',
          note: '决定默认权限范围',
          options: employeeRoleOptions,
          required: true,
        }),
      ],
      processSteps: [
        '录入员工基本信息。',
        '选择所属部门与角色。',
        '保存后可继续进行权限配置。',
      ],
      permissionPoints: ['新建'],
    },
    {
      label: '员工权限配置抽屉',
      type: 'drawer',
      description: '在右侧抽屉中对员工进行功能级授权。',
      goal: '在当前页内承载员工权限树配置。',
      permissionPoints: ['权限配置'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
