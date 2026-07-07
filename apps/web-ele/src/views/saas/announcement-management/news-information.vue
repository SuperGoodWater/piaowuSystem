<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import { newsCategoryOptions, publishStatusOptions } from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建资讯',
      type: 'primary',
      description: '新增资讯内容并进入发布流程。',
      fields: [
        createTextField({
          field: 'title',
          label: '资讯标题',
          note: '内容标题',
          required: true,
        }),
        createSelectField({
          field: 'category',
          label: '分类',
          note: '如平台动态、运营资讯',
          options: newsCategoryOptions,
          required: true,
        }),
        createTextField({
          field: 'author',
          label: '作者',
          note: '内容发布人',
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '发布状态',
          note: '草稿 / 已发布 / 已下线',
          options: publishStatusOptions,
          required: true,
        }),
      ],
      goal: '创建资讯内容。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量发布',
      type: 'success',
      description: '批量发布资讯。',
      goal: '快速上线多篇内容。',
      permissionPoints: ['发布'],
    },
    {
      label: '批量下线',
      type: 'warning',
      description: '批量下线资讯。',
      goal: '快速关闭多篇内容展示。',
      permissionPoints: ['下线'],
    },
  ],
  columns: [
    { key: 'title', label: '资讯标题' },
    { key: 'category', label: '分类' },
    { key: 'status', label: '发布状态' },
    { key: 'author', label: '作者' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理资讯内容，支持新建、编辑、发布和下线。',
  documentNotes: [
    '新闻资讯页承载平台资讯内容维护。',
    '支持新建、编辑、发布、下线资讯。',
  ],
  fields: [
    { label: '资讯标题', note: '内容标题', required: true },
    { label: '分类', note: '如平台动态、运营资讯、产品公告', required: true },
    { label: '作者', note: '内容发布人', required: true },
    { label: '发布状态', note: '草稿 / 已发布 / 已下线', required: true },
  ],
  permissionPoints: ['查看', '新建', '编辑', '发布', '下线'],
  processSteps: ['进入新闻资讯页。', '新建或编辑资讯。', '发布或下线资讯。'],
  filters: [
    createTextFilter({ field: 'title', label: '资讯标题' }),
    createSelectFilter({
      field: 'category',
      label: '分类',
      options: newsCategoryOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '状态',
      options: publishStatusOptions,
      placeholder: '请选择发布状态',
    }),
  ],
  pageGoal: '管理资讯内容。',
  rowActions: [
    {
      label: '编辑',
      description: '维护资讯标题、分类和内容。',
      goal: '调整资讯内容。',
      permissionPoints: ['编辑'],
    },
    {
      label: '发布',
      type: 'success',
      description: '将资讯从草稿状态发布上线。',
      goal: '对外展示资讯内容。',
      permissionPoints: ['发布'],
    },
    {
      label: '下线',
      type: 'danger',
      description: '将资讯下线停止展示。',
      goal: '关闭内容展示。',
      permissionPoints: ['下线'],
    },
  ],
  sampleData: [
    {
      author: '运营中心',
      category: '平台动态',
      status: '已发布',
      title: '暑期景区流量预测与应对建议',
      updatedAt: '2026-07-05 17:25',
    },
  ],
  supportActions: [
    {
      label: '资讯编辑抽屉',
      type: 'drawer',
      description: '在抽屉中维护资讯标题、分类和内容状态。',
      fields: [
        createTextField({
          field: 'title',
          label: '资讯标题',
          note: '内容标题',
          required: true,
        }),
        createSelectField({
          field: 'category',
          label: '分类',
          note: '内容分类',
          options: newsCategoryOptions,
          required: true,
        }),
        createTextField({
          field: 'author',
          label: '作者',
          note: '内容归属作者',
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '状态',
          note: '草稿 / 已发布 / 已下线',
          options: publishStatusOptions,
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
