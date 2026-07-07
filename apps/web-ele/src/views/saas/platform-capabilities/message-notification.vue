<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  notificationChannelOptions,
  notificationTargetOptions,
  sendStatusOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建通知',
      type: 'primary',
      description: '新增一条平台通知，指定通知对象和触达方式。',
      fields: [
        createTextField({
          field: 'title',
          label: '通知标题',
          note: '通知主题',
          required: true,
        }),
        createSelectField({
          field: 'channel',
          label: '通知方式',
          note: '站内信 / 短信 / 邮件',
          options: notificationChannelOptions,
          required: true,
        }),
        createSelectField({
          field: 'target',
          label: '通知对象',
          note: '租户管理员 / 门店管理员',
          options: notificationTargetOptions,
          required: true,
        }),
        createSelectField({
          field: 'status',
          label: '发送状态',
          note: '待发送 / 已发送 / 失败',
          options: sendStatusOptions,
          required: true,
        }),
      ],
      goal: '建立通知触达内容。',
      permissionPoints: ['查看通知'],
    },
    {
      label: '通知规则说明',
      type: 'info',
      description: '查看通知对象、通知方式和当前待补充项。',
      documentNotes: [
        '文档已明确通知对象为租户管理员、门店管理员。',
        '通知方式包括站内信、短信、邮件，具体触发场景后续可继续补充。',
      ],
      goal: '统一消息通知口径。',
      permissionPoints: ['查看通知'],
    },
  ],
  columns: [
    { key: 'title', label: '通知标题' },
    { key: 'channel', label: '通知方式' },
    { key: 'target', label: '通知对象' },
    { key: 'status', label: '发送状态' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理站内信、短信、邮件等通知触达配置和消息查看。',
  documentNotes: [
    '文档已明确通知对象为租户管理员、门店管理员。',
    '通知方式包括站内信、短信、邮件，具体触发场景后续可继续补充。',
  ],
  exceptions: [
    '消息通知的具体触发场景和文案范围后续仍可继续补充。',
    '当前文档未要求报表下载或打印能力。',
  ],
  filters: [
    createTextFilter({ field: 'title', label: '通知标题' }),
    createSelectFilter({
      field: 'channel',
      label: '通知方式',
      options: notificationChannelOptions,
    }),
    createSelectFilter({
      field: 'target',
      label: '通知对象',
      options: notificationTargetOptions,
    }),
  ],
  pageGoal: '管理通知触达和消息查看。',
  pendingItems: [
    '消息通知具体触发场景。',
    '消息通知各场景文案范围。',
    '是否需要列表打印或报表下载类能力。',
  ],
  permissionPoints: ['查看通知'],
  processSteps: [
    '进入消息通知页。',
    '查看通知对象与通知方式。',
    '按需查看详情或重新发送。',
  ],
  rowActions: [
    {
      label: '查看详情',
      description: '查看通知内容、对象和发送状态。',
      goal: '确认通知触达结果。',
      permissionPoints: ['查看通知'],
    },
    {
      label: '重新发送',
      type: 'warning',
      description: '对失败或需要补发的通知再次发送。',
      goal: '补齐消息触达。',
      permissionPoints: ['查看通知'],
    },
  ],
  sampleData: [
    {
      channel: '站内信 / 短信',
      status: '已发送',
      target: '租户管理员',
      title: '门店权益即将到期提醒',
      updatedAt: '2026-07-06 08:15',
    },
  ],
  supportActions: [
    {
      label: '通知详情抽屉',
      type: 'drawer',
      description: '抽屉中查看通知内容、对象、通道和发送结果。',
      fields: [
        createTextField({
          field: 'title',
          label: '通知标题',
          note: '通知主题',
        }),
        createSelectField({
          field: 'channel',
          label: '通知方式',
          note: '站内信 / 短信 / 邮件',
          options: notificationChannelOptions,
        }),
        createSelectField({
          field: 'target',
          label: '通知对象',
          note: '租户管理员 / 门店管理员',
          options: notificationTargetOptions,
        }),
        createSelectField({
          field: 'status',
          label: '发送状态',
          note: '已发送 / 失败 / 待发送',
          options: sendStatusOptions,
        }),
      ],
      permissionPoints: ['查看通知'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
