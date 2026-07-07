<script lang="ts" setup>
import {
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  operationActionOptions,
  operationModuleOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '查看日志说明',
      type: 'info',
      description: '查看操作日志记录口径与覆盖范围。',
      documentNotes: [
        '需覆盖租户、门店、版本、权益、联营、应用、资源、公告等关键模块。',
      ],
      goal: '统一理解日志留痕范围。',
      permissionPoints: ['查看日志'],
    },
  ],
  filters: [
    createTextFilter({ field: 'operator', label: '操作人' }),
    createSelectFilter({
      field: 'module',
      label: '所属模块',
      options: operationModuleOptions,
    }),
    createSelectFilter({
      field: 'action',
      label: '操作动作',
      options: operationActionOptions,
    }),
  ],
  columns: [
    { key: 'operator', label: '操作人' },
    { key: 'module', label: '所属模块' },
    { key: 'action', label: '操作动作' },
    { key: 'target', label: '操作对象' },
    { key: 'time', label: '操作时间' },
  ],
  rowActions: [
    {
      label: '查看详情',
      description: '查看单条日志的操作人、对象和动作详情。',
      goal: '追踪具体操作留痕。',
      permissionPoints: ['查看日志'],
    },
  ],
  sampleData: [
    {
      action: '停用',
      module: '门店管理',
      operator: '李青',
      target: '欢乐谷东区店',
      time: '2026-07-06 10:12:22',
    },
  ],
  supportActions: [
    {
      label: '日志详情抽屉',
      type: 'drawer',
      description: '以抽屉形式展示操作留痕详情。',
      fields: [
        createTextField({ field: 'operator', label: '操作人', note: '执行人' }),
        createTextField({
          field: 'module',
          label: '所属模块',
          note: '涉及模块',
        }),
        createTextField({
          field: 'action',
          label: '操作动作',
          note: '如新建、编辑、停用',
        }),
        createTextField({
          field: 'target',
          label: '操作对象',
          note: '被操作数据对象',
        }),
        createTextField({ field: 'time', label: '操作时间', note: '时间戳' }),
      ],
      permissionPoints: ['查看日志'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '查看平台操作留痕。',
  description: '记录 SaaS 后台操作人、操作时间、操作对象和操作动作。',
  documentNotes: [
    '需覆盖租户、门店、版本、权益、联营、应用、资源、公告等关键模块。',
  ],
  processSteps: [
    '进入操作日志页。',
    '按操作人、模块、动作筛选日志。',
    '查看具体留痕详情。',
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
