<script lang="ts" setup>
import {
  createSelectField,
  createSelectFilter,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  bindingStatusOptions,
  deviceBrandOptions,
  sampleStoreOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '注册设备',
      type: 'primary',
      description: '录入设备基础信息并注册到平台。',
      fields: [
        createTextField({
          field: 'deviceName',
          label: '设备名称',
          note: '设备展示名称',
          required: true,
        }),
        createTextField({
          field: 'deviceCode',
          label: '设备编码',
          note: '唯一设备标识',
          required: true,
        }),
        createSelectField({
          field: 'brand',
          label: '设备品牌',
          note: '品牌归属',
          options: deviceBrandOptions,
          required: true,
        }),
        createSelectField({
          field: 'storeName',
          label: '绑定门店',
          note: '可为空，后续绑定',
          options: sampleStoreOptions,
        }),
      ],
      goal: '建立设备平台档案。',
      permissionPoints: ['新建'],
    },
    {
      label: '批量绑定',
      type: 'success',
      description: '将多台设备批量绑定到门店。',
      goal: '提升设备分配效率。',
      permissionPoints: ['绑定'],
    },
  ],
  columns: [
    { key: 'deviceName', label: '设备名称' },
    { key: 'deviceCode', label: '设备编码' },
    { key: 'brand', label: '设备品牌' },
    { key: 'bindingStatus', label: '绑定状态' },
    { key: 'storeName', label: '绑定门店' },
    { key: 'updatedAt', label: '更新时间' },
  ],
  description: '管理设备注册、绑定和基础信息维护。',
  documentNotes: [
    '设备列表页用于管理设备注册、绑定和编辑。',
    '设备可先注册，后续再绑定门店。',
  ],
  fields: [
    { label: '设备名称', note: '设备展示名称', required: true },
    { label: '设备编码', note: '唯一设备标识', required: true },
    { label: '设备品牌', note: '品牌归属', required: true },
    { label: '绑定门店', note: '可为空，后续绑定' },
    { label: '绑定状态', note: '已绑定 / 未绑定' },
  ],
  permissionPoints: ['查看', '新建', '编辑', '绑定'],
  processSteps: [
    '进入设备列表页。',
    '注册设备。',
    '查看绑定状态。',
    '编辑设备信息。',
  ],
  filters: [
    createTextFilter({ field: 'deviceName', label: '设备名称' }),
    createTextFilter({ field: 'deviceCode', label: '设备编码' }),
    createSelectFilter({
      field: 'bindingStatus',
      label: '绑定状态',
      options: bindingStatusOptions,
    }),
    createTextFilter({ field: 'storeName', label: '门店名称' }),
  ],
  pageGoal: '管理平台设备并查看绑定状态。',
  rowActions: [
    {
      label: '编辑',
      description: '维护设备名称、品牌和基础资料。',
      goal: '更新设备档案信息。',
      permissionPoints: ['编辑'],
    },
    {
      label: '查看绑定',
      description: '查看当前设备绑定门店和状态。',
      goal: '确认设备归属。',
      permissionPoints: ['查看'],
    },
    {
      label: '解绑',
      type: 'danger',
      description: '解除设备与门店的绑定关系。',
      goal: '释放设备供重新分配。',
      permissionPoints: ['绑定'],
    },
  ],
  sampleData: [
    {
      bindingStatus: '已绑定',
      brand: '票星终端',
      deviceCode: 'DEV-202607-001',
      deviceName: '东区检票闸机-01',
      storeName: '欢乐谷东区店',
      updatedAt: '2026-07-06 10:00',
    },
  ],
  supportActions: [
    {
      label: '设备编辑抽屉',
      type: 'drawer',
      description: '在抽屉中维护设备资料与绑定信息。',
      fields: [
        createTextField({
          field: 'deviceName',
          label: '设备名称',
          note: '设备展示名称',
          required: true,
        }),
        createTextField({
          field: 'deviceCode',
          label: '设备编码',
          note: '唯一设备标识',
          required: true,
        }),
        createSelectField({
          field: 'brand',
          label: '设备品牌',
          note: '品牌归属',
          options: deviceBrandOptions,
          required: true,
        }),
        createSelectField({
          field: 'storeName',
          label: '绑定门店',
          note: '用于设备分配',
          options: sampleStoreOptions,
        }),
      ],
      permissionPoints: ['新建', '编辑', '绑定'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
