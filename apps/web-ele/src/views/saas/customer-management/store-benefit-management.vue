<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextFilter,
} from '../_shared/field-factory';
import {
  benefitNameOptions,
  benefitStatusOptions,
  sampleStoreOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '购买权益',
      type: 'primary',
      description: '为门店购买指定权益并设置生效与到期时间。',
      fields: [
        createSelectField({
          field: 'storeName',
          label: '所属门店',
          note: '权益绑定门店',
          options: sampleStoreOptions,
          required: true,
        }),
        createSelectField({
          field: 'benefitName',
          label: '权益名称',
          note: '权益标识名称',
          options: benefitNameOptions,
          required: true,
        }),
        {
          field: 'startAt',
          inputType: 'date',
          label: '生效时间',
          note: '权益开始时间',
          required: true,
        },
        {
          field: 'endAt',
          inputType: 'date',
          label: '到期时间',
          note: '权益结束时间',
          required: true,
        },
      ],
      goal: '完成权益购买并开放对应功能入口。',
      permissionPoints: ['购买'],
    },
    {
      label: '续期权益',
      type: 'success',
      description: '对已到期或即将到期权益进行叠加续期。',
      documentNotes: ['续期支持叠加购买，延长到期时间。'],
      goal: '延长门店权益有效期。',
      permissionPoints: ['续期'],
    },
    {
      label: '关闭权益',
      type: 'danger',
      description: '手动关闭权益并关闭对应功能入口。',
      goal: '停止门店继续使用某项权益能力。',
      permissionPoints: ['关闭'],
    },
  ],
  columns: [
    { key: 'storeName', label: '所属门店' },
    { key: 'benefitName', label: '权益名称' },
    { key: 'startAt', label: '生效时间' },
    { key: 'endAt', label: '到期时间' },
    { key: 'status', label: '权益状态' },
  ],
  description: '管理门店权益绑定、生效时间和到期时间，并支持购买、续期和关闭。',
  documentNotes: [
    '权益状态包括生效中、已到期、已关闭。',
    '权益到期后对应功能入口关闭，续期支持叠加购买。',
  ],
  exceptions: [
    '权益到期后关闭对应功能入口。',
    '续期支持叠加购买，延长到期时间。',
    '手动关闭后权益不可继续使用。',
  ],
  fields: [
    { label: '所属门店', note: '权益绑定门店', required: true },
    { label: '权益名称', note: '权益标识名称', required: true },
    { label: '生效时间', note: '权益开始时间', required: true },
    { label: '到期时间', note: '权益结束时间', required: true },
    { label: '权益状态', note: '系统生成：生效中 / 已到期 / 已关闭' },
  ],
  filters: [
    createTextFilter({ field: 'storeName', label: '门店名称' }),
    createSelectFilter({
      field: 'benefitName',
      label: '权益名称',
      options: benefitNameOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '权益状态',
      options: benefitStatusOptions,
    }),
  ],
  pageGoal: '维护门店权益有效期并处理购买、续期、关闭等关键动作。',
  permissionPoints: ['查看', '购买', '续期', '关闭'],
  processSteps: [
    '进入门店权益管理页。',
    '选择权益并绑定到门店。',
    '设置生效时间与到期时间。',
    '权益生效后开放对应入口。',
    '权益到期后关闭对应入口。',
    '如需续期，支持叠加购买延长到期时间。',
  ],
  rowActions: [
    {
      label: '查看有效期',
      description: '查看当前权益的生效、到期和状态信息。',
      goal: '掌握权益生命周期。',
      permissionPoints: ['查看'],
    },
    {
      label: '续期',
      type: 'success',
      description: '针对当前权益直接发起续期。',
      goal: '延长当前权益到期时间。',
      permissionPoints: ['续期'],
    },
    {
      label: '关闭权益',
      type: 'danger',
      description: '人工关闭当前权益。',
      goal: '停用指定权益能力。',
      permissionPoints: ['关闭'],
    },
  ],
  sampleData: [
    {
      benefitName: '高级营销权益',
      endAt: '2026-12-31',
      startAt: '2026-01-01',
      status: '生效中',
      storeName: '欢乐谷东区店',
    },
    {
      benefitName: '多门店联营权益',
      endAt: '2026-06-30',
      startAt: '2025-07-01',
      status: '已到期',
      storeName: '海岸线游客中心',
    },
  ],
  statusTransitions: [
    {
      current: '生效中',
      note: '对应功能入口关闭',
      target: '已到期',
      trigger: '到期',
    },
    {
      current: '生效中',
      note: '人工关闭权益',
      target: '已关闭',
      trigger: '手动关闭',
    },
    {
      current: '已到期',
      note: '叠加购买用于续期',
      target: '生效中',
      trigger: '续期',
    },
  ],
  supportActions: [
    {
      label: '购买权益抽屉',
      type: 'drawer',
      description: '抽屉内配置门店、权益、生效时间和到期时间。',
      fields: [
        createSelectField({
          field: 'storeName',
          label: '所属门店',
          note: '权益绑定门店',
          options: sampleStoreOptions,
          required: true,
        }),
        createSelectField({
          field: 'benefitName',
          label: '权益名称',
          note: '权益标识名称',
          options: benefitNameOptions,
          required: true,
        }),
        {
          field: 'startAt',
          inputType: 'date',
          label: '生效时间',
          note: '权益开始时间',
          required: true,
        },
        {
          field: 'endAt',
          inputType: 'date',
          label: '到期时间',
          note: '权益结束时间',
          required: true,
        },
      ],
      processSteps: [
        '选择权益并绑定门店。',
        '设置生效时间与到期时间。',
        '保存后开放对应入口。',
      ],
      permissionPoints: ['购买'],
    },
    {
      label: '续期权益抽屉',
      type: 'drawer',
      description: '通过抽屉叠加购买时长，延长现有权益周期。',
      goal: '处理已到期或即将到期的权益续期。',
      fields: [
        createSelectField({
          field: 'benefitName',
          label: '权益名称',
          note: '选择需续期的权益',
          options: benefitNameOptions,
          required: true,
        }),
        {
          field: 'renewWindow',
          inputType: 'daterange',
          label: '续期时间段',
          note: '用于延长权益有效期',
          required: true,
        },
      ],
      permissionPoints: ['续期'],
      statusTransitions: [
        {
          current: '已到期',
          note: '叠加购买用于续期',
          target: '生效中',
          trigger: '续期',
        },
      ],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
