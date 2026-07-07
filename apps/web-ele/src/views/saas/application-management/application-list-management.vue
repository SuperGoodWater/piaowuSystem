<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { appShelfStatusOptions, appTypeOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新增应用',
      type: 'primary',
      description: '登记新的附加应用并定义可见范围。',
      fields: [
        createTextField({
          field: 'appName',
          label: '应用名称',
          note: '展示名称',
          required: true,
        }),
        createSelectField({
          field: 'appType',
          label: '应用类型',
          note: '如营销应用、运营应用',
          options: appTypeOptions,
          required: true,
        }),
        createTextareaField({
          field: 'visibility',
          label: '可见范围',
          note: '如按版本可见',
          required: true,
          rows: 3,
        }),
        createSelectField({
          field: 'status',
          label: '上架状态',
          note: '已上架 / 已下架',
          options: appShelfStatusOptions,
          required: true,
        }),
      ],
      goal: '建立应用基础档案。',
      permissionPoints: ['查看'],
    },
    {
      label: '批量上架',
      type: 'success',
      description: '批量开放应用开通入口。',
      goal: '快速上架多个应用。',
      permissionPoints: ['上架'],
    },
    {
      label: '批量下架',
      type: 'warning',
      description: '批量关闭应用开通入口，但不影响已开通门店。',
      documentNotes: ['应用下架不影响已开通门店，仅关闭开通入口。'],
      goal: '统一下架多个应用。',
      permissionPoints: ['下架'],
    },
  ],
  columns: [
    { key: 'appName', label: '应用名称' },
    { key: 'appType', label: '应用类型' },
    { key: 'visibility', label: '可见范围' },
    { key: 'status', label: '上架状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理附加应用的上架、下架和可见性，不影响已开通门店的已购能力。',
  documentNotes: ['应用下架不影响已开通门店，仅关闭开通入口。'],
  exceptions: ['应用下架不影响已开通门店，仅关闭开通入口。'],
  fields: [
    { label: '应用名称', note: '展示名称', required: true },
    {
      label: '应用类型',
      note: '如营销应用、运营应用、数据应用',
      required: true,
    },
    {
      label: '可见范围',
      note: '按版本、门店类型或租户范围控制',
      required: true,
    },
    { label: '上架状态', note: '已上架 / 已下架', required: true },
  ],
  filters: [
    createTextFilter({ field: 'appName', label: '应用名称' }),
    createSelectFilter({
      field: 'appType',
      label: '应用类型',
      options: appTypeOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '上架状态',
      options: appShelfStatusOptions,
    }),
  ],
  pageGoal: '查看并管理附加应用。',
  permissionPoints: ['查看', '上架', '下架', '设置可见性'],
  processSteps: ['进入应用列表页。', '上架或下架应用。', '设置应用可见性。'],
  rowActions: [
    {
      label: '编辑',
      description: '修改应用名称、类型或描述信息。',
      goal: '维护应用基础资料。',
      permissionPoints: ['查看'],
    },
    {
      label: '设置可见性',
      type: 'warning',
      description: '设置哪些版本或门店类型可以看到该应用。',
      goal: '控制应用开通范围。',
      permissionPoints: ['设置可见性'],
    },
    {
      label: '下架',
      type: 'danger',
      description: '下架当前应用的开通入口。',
      goal: '停止新门店继续开通该应用。',
      permissionPoints: ['下架'],
    },
  ],
  sampleData: [
    {
      appName: '会员营销中心',
      appType: '营销应用',
      status: '已上架',
      updatedAt: '2026-07-02 12:15',
      visibility: '旗舰版可见',
    },
  ],
  supportActions: [
    {
      label: '应用可见性抽屉',
      type: 'drawer',
      description: '在抽屉中配置应用的可见版本、门店类型或租户范围。',
      fields: [
        createTextareaField({
          field: 'visibleVersions',
          label: '可见版本',
          note: '如基础版、旗舰版',
          rows: 3,
        }),
        createTextareaField({
          field: 'visibleStoreTypes',
          label: '可见门店类型',
          note: '按门店类型控制',
          rows: 3,
        }),
        createSelectField({
          field: 'status',
          label: '上架状态',
          note: '控制是否展示开通入口',
          options: appShelfStatusOptions,
          required: true,
        }),
      ],
      permissionPoints: ['设置可见性'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
