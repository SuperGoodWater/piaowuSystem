<script lang="ts" setup>
import {
  createPasswordField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { tenantStatusOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const interactions = {
  actions: [
    {
      label: '新建租户',
      type: 'primary',
      description: '创建租户并同步生成唯一顶级管理员账号。',
      fields: [
        createTextField({
          field: 'phone',
          label: '手机号',
          note: '租户顶级管理员手机号',
          required: true,
        }),
        createTextField({
          field: 'username',
          label: '用户名',
          note: '租户顶级管理员登录用户名',
          required: true,
        }),
        createPasswordField({
          field: 'password',
          label: '密码',
          note: '租户顶级管理员初始密码',
          required: true,
        }),
      ],
      goal: '完成租户创建并生成初始管理员账号。',
      processSteps: [
        '点击“新建租户”。',
        '输入手机号、用户名、密码。',
        '系统校验手机号和用户名唯一性。',
        '创建租户并生成顶级管理员账号。',
      ],
      permissionPoints: ['新建'],
    },
  ],
  filters: [
    createTextFilter({
      field: 'keyword',
      label: '关键词',
      placeholder: '请输入租户名称、管理员账号或手机号',
    }),
    createSelectFilter({
      field: 'status',
      label: '租户状态',
      options: tenantStatusOptions,
    }),
  ],
  columns: [
    { key: 'tenantName', label: '租户名称' },
    { key: 'username', label: '管理员账号' },
    { key: 'phone', label: '手机号' },
    { key: 'storeCount', label: '门店数' },
    { key: 'status', label: '租户状态' },
    { key: 'createdAt', label: '创建时间' },
  ],
  rowActions: [
    {
      label: '查看详情',
      description: '查看租户基础信息、顶级管理员信息和关联门店列表。',
      goal: '快速了解租户当前配置与关联数据。',
      permissionPoints: ['查看'],
    },
    {
      label: '重置密码',
      type: 'warning',
      description: '重置租户顶级管理员密码，不改变租户状态。',
      goal: '恢复管理员账号的登录能力。',
      permissionPoints: ['重置密码'],
    },
    {
      label: '停用',
      type: 'danger',
      description: '停用当前租户，并同步停用其下门店和员工。',
      documentNotes: ['停用属于强影响动作，需明确二次确认。'],
      goal: '停止当前租户继续使用 SaaS 平台。',
      permissionPoints: ['停用'],
    },
  ],
  sampleData: [
    {
      createdAt: '2026-07-01 10:00',
      phone: '13800001111',
      status: '启用',
      storeCount: '12',
      tenantName: '星河票务集团',
      username: 'xinghe_admin',
    },
    {
      createdAt: '2026-07-02 14:30',
      phone: '13900002222',
      status: '停用',
      storeCount: '4',
      tenantName: '海岸线文旅',
      username: 'coast_admin',
    },
  ],
  supportActions: [
    {
      label: '新建租户抽屉',
      type: 'drawer',
      description:
        '以右侧抽屉方式承载新建租户表单，默认仅收口创建所需最小字段。',
      fields: [
        createTextField({
          field: 'phone',
          label: '手机号',
          note: '租户顶级管理员手机号',
          required: true,
        }),
        createTextField({
          field: 'username',
          label: '用户名',
          note: '租户顶级管理员登录用户名',
          required: true,
        }),
        createPasswordField({
          field: 'password',
          label: '密码',
          note: '初始密码，提交前需校验非空',
          required: true,
        }),
      ],
      processSteps: [
        '输入手机号、用户名、密码。',
        '系统校验必填项和唯一性。',
        '提交后生成租户与顶级管理员账号。',
        '返回列表继续配置门店。',
      ],
      permissionPoints: ['新建'],
    },
    {
      label: '租户详情抽屉',
      type: 'drawer',
      description:
        '从列表打开右侧抽屉，查看租户信息、管理员信息和门店关联情况。',
      goal: '在当前页内承载租户详情信息展示。',
      permissionPoints: ['查看'],
    },
  ],
} as const;

const explanations = {
  pageGoal: '查看与筛选租户，并处理租户生命周期管理。',
  description:
    '管理租户和顶级管理员，覆盖启用、停用、重置密码、更换手机号等关键动作。',
  documentNotes: [
    '租户停用后，其下所有门店与员工同步停用。',
    '新建租户需填写手机号、用户名、密码，且手机号或用户名冲突时不可创建。',
  ],
  fields: [
    { label: '手机号', note: '租户顶级管理员手机号', required: true },
    { label: '用户名', note: '租户顶级管理员登录用户名', required: true },
    { label: '密码', note: '租户顶级管理员初始密码', required: true },
    { label: '租户状态', note: '系统生成，启用 / 停用' },
  ],
  processSteps: [
    '进入租户列表页。',
    '点击“新建租户”。',
    '输入手机号、用户名、密码。',
    '系统校验信息完整性。',
    '创建租户并生成唯一顶级管理员账号。',
    '按配置进入初始状态。',
    '返回租户列表，可继续配置门店。',
  ],
  permissionPoints: [
    '查看',
    '新建',
    '启用',
    '停用',
    '重置密码',
    '更换手机号',
    '禁用账号',
  ],
  exceptions: [
    '手机号为空时不可提交。',
    '用户名为空时不可提交。',
    '密码为空时不可提交。',
    '手机号或用户名与现有规则冲突时不可创建。',
  ],
  statusTransitions: [
    {
      current: '启用',
      note: '停用后其下所有门店与员工同步停用',
      target: '停用',
      trigger: '停用',
    },
    {
      current: '停用',
      note: '恢复租户正常使用',
      target: '启用',
      trigger: '启用',
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
