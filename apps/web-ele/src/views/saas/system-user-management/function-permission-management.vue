<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
} from '../_shared/field-factory';
import { moduleScopeOptions, roleNameOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '保存权限配置',
      type: 'primary',
      description: '保存当前角色或职能的功能级权限配置。',
      goal: '固化角色权限边界。',
      permissionPoints: ['权限配置'],
    },
    {
      label: '刷新权限树',
      type: 'info',
      description: '刷新权限树，确保与最新模块结构保持一致。',
      goal: '同步权限点定义。',
      permissionPoints: ['查看'],
    },
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
  columns: [
    { key: 'roleName', label: '角色名称' },
    { key: 'moduleScope', label: '模块范围' },
    { key: 'permissionCount', label: '权限点数量' },
    { key: 'updatedBy', label: '最后修改人' },
    { key: 'updatedAt', label: '最后修改时间' },
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
      description: '进入权限配置抽屉或页签，维护模块级权限点。',
      goal: '配置角色与模块的功能级权限。',
      permissionPoints: ['权限配置'],
    },
  ],
  sampleData: [
    {
      moduleScope: '客户管理 / 应用管理 / 公告管理',
      permissionCount: '28',
      roleName: '平台运营经理',
      updatedAt: '2026-07-05 09:40',
      updatedBy: '李青',
    },
  ],
  supportActions: [
    {
      label: '权限配置抽屉',
      type: 'drawer',
      description:
        '通过抽屉展示权限树，覆盖客户、应用、资源、公告、日志等模块权限点。',
      documentNotes: [
        '需要覆盖租户、门店、版本、权益、联营、应用、资源、公告、日志与通知等权限点。',
      ],
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
      ],
      processSteps: ['选择角色。', '勾选权限树。', '保存配置。'],
      permissionPoints: ['权限配置'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '配置功能级权限并保存权限边界。',
  description: '按角色或职能配置功能级权限，承接文档中的权限点规格。',
  documentNotes: [
    '需要覆盖租户、门店、版本、权益、联营、应用、资源、公告、日志与通知等权限点。',
  ],
  processSteps: ['进入员工权限配置页。', '勾选功能权限。', '保存配置。'],
  permissionPoints: ['查看', '权限配置'],
  exceptions: ['保存权限配置前需确保角色与模块范围合法。'],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
