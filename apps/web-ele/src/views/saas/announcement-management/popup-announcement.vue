<script lang="ts" setup>
import {
  createDateRangeField,
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { popupStatusOptions, popupTargetOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建弹窗公告',
      type: 'primary',
      description: '新增弹窗公告并定义生效时间段。',
      fields: [
        createTextField({
          field: 'title',
          label: '公告标题',
          note: '弹窗标题',
          required: true,
        }),
        createDateRangeField({
          field: 'effectiveWindow',
          label: '生效时间段',
          note: '控制唯一生效窗口',
          required: true,
        }),
        createSelectField({
          field: 'target',
          label: '目标对象',
          note: '如全部门店、租户管理员',
          options: popupTargetOptions,
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '草稿 / 生效中 / 已下线',
          options: popupStatusOptions,
          required: true,
        }),
      ],
      goal: '创建弹窗公告。',
      permissionPoints: ['新建'],
    },
    {
      label: '替换当前生效公告',
      type: 'warning',
      description: '用新公告替换当前生效中的弹窗公告。',
      documentNotes: ['同一时间仅允许一个弹窗公告生效。'],
      goal: '保证弹窗公告唯一生效。',
      permissionPoints: ['发布'],
    },
  ],
  columns: [
    { key: 'title', label: '公告标题' },
    { key: 'effectiveWindow', label: '生效时间段' },
    { key: 'target', label: '目标对象' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理弹窗公告，控制唯一生效规则与下线操作。',
  documentNotes: ['同一时间仅允许一个弹窗公告生效。'],
  exceptions: ['同一时间仅允许一个弹窗公告生效。'],
  filters: [
    createTextFilter({ field: 'title', label: '公告标题' }),
    createSelectFilter({
      field: 'target',
      label: '目标对象',
      options: popupTargetOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: popupStatusOptions,
    }),
  ],
  pageGoal: '管理弹窗公告。',
  permissionPoints: ['查看', '新建', '编辑', '发布', '下线'],
  processSteps: [
    '进入弹窗公告页。',
    '新建或编辑弹窗公告。',
    '必要时替换当前生效公告。',
    '按需下线公告。',
  ],
  rowActions: [
    {
      label: '编辑',
      description: '修改弹窗公告内容和时间段。',
      goal: '维护弹窗公告内容。',
      permissionPoints: ['编辑'],
    },
    {
      label: '设为生效',
      type: 'warning',
      description: '将当前公告设置为生效中，并替换原公告。',
      goal: '切换当前生效弹窗。',
      permissionPoints: ['发布'],
    },
    {
      label: '下线',
      type: 'danger',
      description: '下线当前弹窗公告。',
      goal: '关闭弹窗展示。',
      permissionPoints: ['下线'],
    },
  ],
  sampleData: [
    {
      effectiveWindow: '2026-07-06 00:00 ~ 2026-07-10 23:59',
      status: '生效中',
      target: '全部门店',
      title: '暑期系统维护通知',
      updatedAt: '2026-07-06 07:00',
    },
  ],
  supportActions: [
    {
      label: '弹窗公告抽屉',
      type: 'drawer',
      description: '抽屉中维护弹窗标题、生效时间段和目标对象。',
      documentNotes: ['同一时间仅允许一个弹窗公告生效。'],
      fields: [
        createTextField({
          field: 'title',
          label: '公告标题',
          note: '弹窗标题',
          required: true,
        }),
        createDateRangeField({
          field: 'effectiveWindow',
          label: '生效时间段',
          note: '控制唯一生效窗口',
          required: true,
        }),
        createSelectField({
          field: 'target',
          label: '目标对象',
          note: '公告接收对象',
          options: popupTargetOptions,
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '草稿 / 生效中 / 已下线',
          options: popupStatusOptions,
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
