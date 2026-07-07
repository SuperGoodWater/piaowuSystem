<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { enabledDisabledOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新增品牌',
      type: 'primary',
      description: '新增设备品牌并定义品牌编码。',
      fields: [
        createTextField({
          field: 'brandName',
          label: '品牌名称',
          note: '品牌展示名称',
          required: true,
        }),
        createTextField({
          field: 'brandCode',
          label: '品牌编码',
          note: '品牌唯一编码',
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
      goal: '维护设备品牌基础档案。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量禁用',
      type: 'warning',
      description: '批量禁用不再使用的设备品牌。',
      goal: '清理无效品牌范围。',
      permissionPoints: ['禁用'],
    },
  ],
  columns: [
    { key: 'brandName', label: '品牌名称' },
    { key: 'brandCode', label: '品牌编码' },
    { key: 'deviceCount', label: '设备数量' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理设备品牌及其可用状态。',
  documentNotes: [
    '设备品牌页用于维护品牌档案，并控制品牌是否可继续被设备引用。',
  ],
  fields: [
    { label: '品牌名称', note: '品牌展示名称', required: true },
    { label: '品牌编码', note: '品牌唯一编码', required: true },
    { label: '状态', note: '启用 / 禁用', required: true },
  ],
  permissionPoints: ['查看', '新建', '编辑', '禁用'],
  processSteps: [
    '进入设备品牌页。',
    '新增品牌。',
    '编辑品牌。',
    '按需禁用品牌。',
  ],
  filters: [
    createTextFilter({ field: 'brandName', label: '品牌名称' }),
    createTextFilter({ field: 'brandCode', label: '品牌编码' }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: enabledDisabledOptions,
    }),
  ],
  pageGoal: '管理设备品牌。',
  rowActions: [
    {
      label: '编辑',
      description: '修改品牌名称、编码或状态。',
      goal: '维护品牌资料。',
      permissionPoints: ['编辑'],
    },
    {
      label: '禁用',
      type: 'danger',
      description: '停用当前品牌。',
      goal: '阻止后续设备继续引用该品牌。',
      permissionPoints: ['禁用'],
    },
  ],
  sampleData: [
    {
      brandCode: 'PX',
      brandName: '票星终端',
      deviceCount: '48',
      status: '启用',
      updatedAt: '2026-07-05 15:10',
    },
  ],
  supportActions: [
    {
      label: '品牌编辑抽屉',
      type: 'drawer',
      description: '抽屉中维护品牌档案与状态。',
      fields: [
        createTextField({
          field: 'brandName',
          label: '品牌名称',
          note: '品牌展示名称',
          required: true,
        }),
        createTextField({
          field: 'brandCode',
          label: '品牌编码',
          note: '品牌唯一编码',
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
      permissionPoints: ['新建', '编辑'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
