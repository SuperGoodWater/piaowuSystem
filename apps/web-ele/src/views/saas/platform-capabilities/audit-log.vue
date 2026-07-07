<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { auditModuleOptions, auditRiskLevelOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '查看审计规则',
      type: 'info',
      description: '查看审计日志记录口径，重点关注敏感操作前后变化。',
      goal: '理解审计日志用途与记录范围。',
      permissionPoints: ['查看日志'],
    },
  ],
  filters: [
    createTextFilter({ field: 'operator', label: '操作人' }),
    createSelectFilter({
      field: 'module',
      label: '模块',
      options: auditModuleOptions,
    }),
    createSelectFilter({
      field: 'riskLevel',
      label: '风险等级',
      options: auditRiskLevelOptions,
    }),
  ],
  columns: [
    { key: 'operator', label: '操作人' },
    { key: 'module', label: '模块' },
    { key: 'beforeAfter', label: '变更摘要' },
    { key: 'riskLevel', label: '风险等级' },
    { key: 'time', label: '审计时间' },
  ],
  rowActions: [
    {
      label: '查看详情',
      description: '查看单条审计记录的变更前后内容。',
      goal: '支持问题追溯与平台治理。',
      permissionPoints: ['查看日志'],
    },
  ],
  sampleData: [
    {
      beforeAfter: '门店版本：基础版 -> 旗舰版',
      module: '门店版本管理',
      operator: '张宁',
      riskLevel: '高',
      time: '2026-07-06 09:02:18',
    },
  ],
  supportActions: [
    {
      label: '审计详情抽屉',
      type: 'drawer',
      description: '在抽屉中展示敏感操作的前后变化摘要。',
      fields: [
        createTextField({
          field: 'operator',
          label: '操作人',
          note: '执行敏感动作的人员',
        }),
        createTextField({
          field: 'module',
          label: '模块',
          note: '发生变化的模块',
        }),
        createTextareaField({
          field: 'beforeAfter',
          label: '变更摘要',
          note: '前后变化内容',
          rows: 3,
        }),
        createSelectField({
          field: 'riskLevel',
          label: '风险等级',
          note: '高 / 中 / 低',
          options: auditRiskLevelOptions,
        }),
        createTextField({ field: 'time', label: '审计时间', note: '记录时间' }),
      ],
      permissionPoints: ['查看日志'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '查看关键审计记录。',
  description: '记录关键敏感动作的前后变化内容，用于追溯和平台治理。',
  documentNotes: [
    '审计日志用于记录关键敏感动作的前后变化内容。',
    '重点服务于后续问题追溯与平台治理场景。',
  ],
  processSteps: [
    '进入审计日志页。',
    '按模块和风险等级筛选。',
    '查看前后变化详情。',
  ],
  permissionPoints: ['查看日志'],
} as const;

const meta = {
  ...interactions,
  ...explanations,
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
