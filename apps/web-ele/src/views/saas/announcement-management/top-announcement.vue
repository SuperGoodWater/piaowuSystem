<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  combinedAnnouncementTargetOptions,
  tenantStatusOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '新建公告',
      type: 'primary',
      description: '新增顶部公告并配置通知对象与发布时间。',
      fields: [
        createTextField({
          field: 'title',
          label: '公告标题',
          note: '顶部公告标题',
          required: true,
        }),
        createSelectField({
          field: 'target',
          label: '通知对象',
          note: '租户管理员 / 门店管理员',
          options: combinedAnnouncementTargetOptions,
          required: true,
        }),
        {
          field: 'publishTime',
          inputType: 'date',
          label: '发布时间',
          note: '公告展示时间',
        },
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 停用',
          options: tenantStatusOptions,
          required: true,
        }),
      ],
      goal: '发布面向平台用户的顶部公告。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量启停',
      type: 'warning',
      description: '统一调整顶部公告启停状态。',
      goal: '批量控制顶部公告展示。',
      permissionPoints: ['发布', '下线'],
    },
  ],
  filters: [
    createTextFilter({ field: 'title', label: '公告标题' }),
    createSelectFilter({
      field: 'target',
      label: '通知对象',
      options: combinedAnnouncementTargetOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: tenantStatusOptions,
    }),
  ],
  columns: [
    { key: 'title', label: '公告标题' },
    { key: 'target', label: '通知对象' },
    { key: 'status', label: '状态' },
    { key: 'publishTime', label: '发布时间' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  rowActions: [
    {
      label: '编辑',
      description: '调整顶部公告内容或通知对象。',
      goal: '维护顶部公告内容。',
      permissionPoints: ['编辑'],
    },
    {
      label: '启停',
      type: 'warning',
      description: '控制公告是否在顶部展示。',
      goal: '启用或下线顶部公告。',
      permissionPoints: ['发布', '下线'],
    },
  ],
  sampleData: [
    {
      publishTime: '2026-07-06 09:00',
      status: '启用',
      target: '租户管理员 / 门店管理员',
      title: '暑期票务高峰保障公告',
      updatedAt: '2026-07-06 09:00',
    },
  ],
  supportActions: [
    {
      label: '公告编辑抽屉',
      type: 'drawer',
      description: '抽屉中维护顶部公告标题、对象和启停状态。',
      fields: [
        createTextField({
          field: 'title',
          label: '公告标题',
          note: '顶部公告标题',
          required: true,
        }),
        createSelectField({
          field: 'target',
          label: '通知对象',
          note: '租户管理员 / 门店管理员',
          options: combinedAnnouncementTargetOptions,
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
      permissionPoints: ['新建', '编辑', '发布', '下线'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '管理顶部公告。',
  description: '管理顶部公告，支持新建、编辑和启停。',
  documentNotes: ['顶部公告面向租户管理员、门店管理员进行通知展示。'],
  fields: [
    { label: '公告标题', note: '顶部公告标题', required: true },
    { label: '通知对象', note: '租户管理员 / 门店管理员', required: true },
    { label: '发布时间', note: '公告展示时间' },
    { label: '状态', note: '启用 / 停用', required: true },
  ],
  processSteps: ['进入顶部公告页。', '新建或编辑公告。', '按需启停公告。'],
  permissionPoints: ['查看', '新建', '编辑', '发布', '下线'],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
