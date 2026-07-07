<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { storeTypeOptions, tenantStatusOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建版本',
      type: 'primary',
      description: '为指定门店类型创建新的版本能力包。',
      fields: [
        createSelectField({
          field: 'storeType',
          label: '适用门店类型',
          note: '不同类型可配置不同版本',
          options: storeTypeOptions,
          required: true,
        }),
        createTextField({
          field: 'versionName',
          label: '版本名称',
          note: '例如基础版、专业版、旗舰版',
          required: true,
        }),
        createTextareaField({
          field: 'versionDesc',
          label: '版本说明',
          note: '版本简介',
          rows: 3,
        }),
        createTextareaField({
          field: 'featureScope',
          label: '功能边界说明',
          note: '版本包含的功能范围说明',
          required: true,
          rows: 4,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用 / 停用',
          options: tenantStatusOptions,
          required: true,
        }),
      ],
      goal: '建立可供门店切换使用的版本配置。',
      permissionPoints: ['配置'],
    },
    {
      label: '版本说明维护',
      type: 'info',
      description: '维护版本说明和功能边界说明，帮助门店切换时明确差异。',
      goal: '保持版本文档和配置口径一致。',
      permissionPoints: ['配置'],
    },
  ],
  columns: [
    { key: 'versionName', label: '版本名称' },
    { key: 'storeType', label: '适用门店类型' },
    { key: 'featureScope', label: '功能边界说明' },
    { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '维护不同门店类型下的版本能力边界，为门店版本切换提供基础配置。',
  documentNotes: [
    '版本配置需基于门店类型进行维护。',
    '若某门店类型下无可用版本，应明确提示无可选版本。',
  ],
  exceptions: [
    '若门店未创建，不允许配置版本。',
    '若门店类型下无可用版本，应提示无可选版本。',
    '版本切换后按新版本边界即时生效。',
  ],
  fields: [
    { label: '适用门店类型', note: '不同类型可配置不同版本', required: true },
    { label: '版本名称', note: '例如基础版、专业版、旗舰版', required: true },
    { label: '版本说明', note: '版本简介' },
    { label: '功能边界说明', note: '版本包含的功能范围说明', required: true },
    { label: '状态', note: '启用 / 停用', required: true },
  ],
  filters: [
    createTextFilter({ field: 'versionName', label: '版本名称' }),
    createSelectFilter({
      field: 'storeType',
      label: '门店类型',
      options: storeTypeOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: tenantStatusOptions,
    }),
  ],
  pageGoal: '维护门店版本并管理版本说明、启停和切换边界。',
  permissionPoints: ['查看', '配置', '切换版本'],
  processSteps: [
    '进入门店详情页。',
    '选择当前门店所属类型下可用版本。',
    '保存版本配置。',
    '版本按新边界即时生效。',
    '被新版本屏蔽的功能直接不可见或不可用。',
  ],
  rowActions: [
    {
      label: '查看版本',
      description: '查看版本能力边界与适用门店类型。',
      goal: '确认版本范围是否满足业务需求。',
      permissionPoints: ['查看'],
    },
    {
      label: '编辑版本',
      type: 'warning',
      description: '更新版本说明、状态或功能边界。',
      goal: '持续维护版本能力定义。',
      permissionPoints: ['配置'],
    },
    {
      label: '停用',
      type: 'danger',
      description: '停用版本后该版本不可再被新增配置。',
      goal: '关闭不再维护的版本。',
      permissionPoints: ['配置'],
    },
  ],
  sampleData: [
    {
      featureScope: '支持票务、核销、会员、营销活动',
      status: '启用',
      storeType: '景区门店',
      updatedAt: '2026-07-04 16:20',
      versionName: '旗舰版',
    },
    {
      featureScope: '支持票务、核销、基础报表',
      status: '停用',
      storeType: '游客中心',
      updatedAt: '2026-07-03 09:10',
      versionName: '基础版',
    },
  ],
  statusTransitions: [
    {
      current: '启用',
      note: '手动停用后不可再被配置',
      target: '停用',
      trigger: '停用',
    },
    {
      current: '停用',
      note: '重新开放可配置能力',
      target: '启用',
      trigger: '启用',
    },
  ],
  supportActions: [
    {
      label: '新建版本抽屉',
      type: 'drawer',
      description: '通过抽屉填写门店类型、版本名称、功能边界说明等配置。',
      fields: [
        createSelectField({
          field: 'storeType',
          label: '适用门店类型',
          note: '不同类型可配置不同版本',
          options: storeTypeOptions,
          required: true,
        }),
        createTextField({
          field: 'versionName',
          label: '版本名称',
          note: '建议体现层级差异',
          required: true,
        }),
        createTextareaField({
          field: 'featureScope',
          label: '功能边界说明',
          note: '必须明确可见、可用范围',
          required: true,
          rows: 4,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '启用后可被门店配置',
          options: tenantStatusOptions,
          required: true,
        }),
      ],
      processSteps: [
        '选择适用门店类型。',
        '填写版本名称和功能边界说明。',
        '保存后进入版本列表。',
      ],
      permissionPoints: ['配置'],
    },
    {
      label: '版本编辑抽屉',
      type: 'drawer',
      description: '调整现有版本的功能边界和启停状态。',
      goal: '维护版本配置的持续有效性。',
      permissionPoints: ['配置', '切换版本'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
