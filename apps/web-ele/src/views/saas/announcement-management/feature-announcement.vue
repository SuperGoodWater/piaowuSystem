<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  featureModuleOptions,
  publishStatusOptions,
  versionNameOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建上新通知',
      type: 'primary',
      description: '新增功能上新通知并指定目标版本。',
      fields: [
        createTextField({
          field: 'title',
          label: '标题',
          note: '上新通知标题',
          required: true,
        }),
        createSelectField({
          field: 'featureModule',
          label: '功能模块',
          note: '如会员营销、票务能力',
          options: featureModuleOptions,
          required: true,
        }),
        createSelectField({
          field: 'targetVersion',
          label: '目标版本',
          note: '通知适用的版本范围',
          options: versionNameOptions,
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
      goal: '创建功能上新通知。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量发布',
      type: 'success',
      description: '批量发布功能上新通知。',
      goal: '快速同步功能更新信息。',
      permissionPoints: ['发布'],
    },
  ],
  columns: [
    { key: 'title', label: '标题' },
    { key: 'featureModule', label: '功能模块' },
    { key: 'targetVersion', label: '目标版本' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理功能上新通知，向租户或门店传达新增能力。',
  documentNotes: [
    '功能上新页用于向租户或门店同步新增能力。',
    '支持新建、编辑、发布、下线上新通知。',
  ],
  fields: [
    { label: '标题', note: '上新通知标题', required: true },
    {
      label: '功能模块',
      note: '如会员营销、票务能力、联营能力',
      required: true,
    },
    { label: '目标版本', note: '通知适用的版本范围', required: true },
    { label: '状态', note: '草稿 / 已发布 / 已下线', required: true },
  ],
  permissionPoints: ['查看', '新建', '编辑', '发布', '下线'],
  processSteps: [
    '进入功能上新页。',
    '新建或编辑上新通知。',
    '发布或下线上新通知。',
  ],
  filters: [
    createTextFilter({ field: 'title', label: '标题' }),
    createSelectFilter({
      field: 'featureModule',
      label: '功能模块',
      options: featureModuleOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: publishStatusOptions,
    }),
  ],
  pageGoal: '管理功能上新通知。',
  rowActions: [
    {
      label: '编辑',
      description: '修改上新通知内容和目标版本。',
      goal: '维护通知内容准确性。',
      permissionPoints: ['编辑'],
    },
    {
      label: '发布',
      type: 'success',
      description: '发布当前上新通知。',
      goal: '对租户或门店同步功能变化。',
      permissionPoints: ['发布'],
    },
    {
      label: '下线',
      type: 'danger',
      description: '下线当前上新通知。',
      goal: '关闭通知展示。',
      permissionPoints: ['下线'],
    },
  ],
  sampleData: [
    {
      featureModule: '会员营销',
      status: '草稿',
      targetVersion: '旗舰版',
      title: '新增会员积分兑换活动',
      updatedAt: '2026-07-06 08:40',
    },
  ],
  supportActions: [
    {
      label: '上新通知抽屉',
      type: 'drawer',
      description: '抽屉中维护上新标题、功能模块和目标版本。',
      fields: [
        createTextField({
          field: 'title',
          label: '标题',
          note: '上新通知标题',
          required: true,
        }),
        createSelectField({
          field: 'featureModule',
          label: '功能模块',
          note: '对应上新功能模块',
          options: featureModuleOptions,
          required: true,
        }),
        createSelectField({
          field: 'targetVersion',
          label: '目标版本',
          note: '通知适用范围',
          options: versionNameOptions,
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
      permissionPoints: ['新建', '编辑', '发布', '下线'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
