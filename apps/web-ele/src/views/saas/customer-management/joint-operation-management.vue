<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  jointOperationStatusOptions,
  sampleStoreOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '发起联营',
      type: 'primary',
      description: '选择发起门店与关联门店，建立联营关系。',
      fields: [
        createSelectField({
          field: 'initiatorStore',
          label: '发起门店',
          note: '联营发起方',
          options: sampleStoreOptions,
          required: true,
        }),
        createTextareaField({
          field: 'relatedStores',
          label: '关联门店',
          note: '被关联门店，可多选',
          required: true,
          rows: 3,
        }),
        createTextareaField({
          field: 'dataScope',
          label: '可查看数据范围',
          note: '固定为订单、营收、会员',
          rows: 2,
        }),
      ],
      goal: '建立门店间数据联营关系。',
      permissionPoints: ['建立'],
    },
    {
      label: '解除联营',
      type: 'danger',
      description: '解除门店联营关系，并关闭联营数据查看范围。',
      documentNotes: ['解除前需校验管理员权限。'],
      goal: '终止门店间联营关系。',
      permissionPoints: ['解除'],
    },
  ],
  filters: [
    createTextFilter({ field: 'initiatorStore', label: '发起门店' }),
    createTextFilter({ field: 'relatedStores', label: '关联门店' }),
    createSelectFilter({
      field: 'status',
      label: '联营状态',
      options: jointOperationStatusOptions,
    }),
  ],
  columns: [
    { key: 'initiatorStore', label: '发起门店' },
    { key: 'relatedStores', label: '关联门店' },
    { key: 'dataScope', label: '数据范围' },
    { key: 'status', label: '联营状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  rowActions: [
    {
      label: '查看范围',
      description: '查看联营后可共享的数据范围。',
      goal: '确认联营数据边界。',
      permissionPoints: ['查看'],
    },
    {
      label: '解除联营',
      type: 'danger',
      description: '对单条联营关系执行解除操作。',
      goal: '关闭当前联营关系。',
      permissionPoints: ['解除'],
    },
  ],
  sampleData: [
    {
      dataScope: '订单、营收、会员',
      initiatorStore: '欢乐谷东区店',
      relatedStores: '欢乐谷西区店、欢乐谷南门店',
      status: '已建立',
      updatedAt: '2026-07-05 11:30',
    },
  ],
  supportActions: [
    {
      label: '发起联营抽屉',
      type: 'drawer',
      description: '抽屉内完成发起门店、关联门店选择以及范围确认。',
      fields: [
        createSelectField({
          field: 'initiatorStore',
          label: '发起门店',
          note: '联营发起方',
          options: sampleStoreOptions,
          required: true,
        }),
        createTextareaField({
          field: 'relatedStores',
          label: '关联门店',
          note: '支持多选',
          required: true,
          rows: 3,
        }),
      ],
      processSteps: [
        '选择发起门店。',
        '勾选关联门店。',
        '确认可查看数据范围。',
        '提交后建立联营关系。',
      ],
      permissionPoints: ['建立'],
    },
    {
      label: '解除联营抽屉',
      type: 'drawer',
      description: '以右侧抽屉形式承载解除联营确认和影响说明。',
      documentNotes: ['解除前需校验管理员权限。'],
      goal: '确保联营解除动作被明确确认。',
      permissionPoints: ['解除'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '管理门店联营关系的建立、解除和数据范围。',
  description: '建立和解除门店联营关系，并查看联营后的数据可见范围。',
  documentNotes: [
    '联营解除需要校验管理员权限。',
    '联营可查看的数据范围固定为订单、营收、会员。',
  ],
  fields: [
    { label: '发起门店', note: '联营发起方', required: true },
    { label: '关联门店', note: '被关联门店，可多选', required: true },
    { label: '建立状态', note: '系统生成：已建立 / 已解除' },
    { label: '可查看数据范围', note: '固定为订单、营收、会员' },
  ],
  processSteps: [
    '进入联营关系管理页。',
    '选择发起门店与关联门店。',
    '发起联营建立。',
    '建立成功后可查看订单、营收、会员数据。',
    '任一侧管理员可发起解除。',
    '系统校验管理员权限后解除联营。',
  ],
  permissionPoints: ['查看', '建立', '解除'],
  exceptions: ['联营解除前需校验管理员权限。'],
  statusTransitions: [
    {
      current: '已建立',
      note: '管理员发起解除并通过权限校验',
      target: '已解除',
      trigger: '解除联营',
    },
  ],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
