<script lang="ts" setup>
import {
  createPasswordField,
  createSelectField,
  createSelectFilter,
  createTextareaField,
  createTextField,
  createTextFilter,
} from '../_shared/field-factory';
import {
  sampleTenantOptions,
  storeStatusOptions,
  storeTypeOptions,
} from '../_shared/options';
import SaaSPageShell from '../_shared/saas-page-shell.vue';

const meta = {
  actions: [
    {
      label: '新建门店',
      type: 'primary',
      description: '创建门店并同步初始化门店管理员账号。',
      fields: [
        createSelectField({
          field: 'tenantName',
          label: '所属租户',
          note: '归属租户',
          options: sampleTenantOptions,
          required: true,
        }),
        createSelectField({
          field: 'storeType',
          label: '门店类型',
          note: '创建后不可修改',
          options: storeTypeOptions,
          required: true,
        }),
        createTextField({
          field: 'storeName',
          label: '门店名称',
          note: '门店展示名称',
          required: true,
        }),
        createTextField({
          field: 'address',
          label: '地址',
          note: '门店地址',
          required: true,
        }),
        createTextareaField({
          field: 'detailAddress',
          label: '详细地址',
          note: '门店详细地址',
          required: true,
          rows: 3,
        }),
        createTextField({
          field: 'phone',
          label: '手机号',
          note: '门店管理员手机号',
          required: true,
        }),
        createTextField({
          field: 'username',
          label: '用户名',
          note: '门店管理员用户名',
          required: true,
        }),
        createPasswordField({
          field: 'password',
          label: '密码',
          note: '门店管理员初始密码',
          required: true,
        }),
      ],
      goal: '创建门店并为后续版本与权益配置建立基础。',
      processSteps: [
        '点击“新建门店”。',
        '录入门店基础字段与管理员账号信息。',
        '提交后生成门店。',
        '创建成功后继续配置版本和权益。',
      ],
      permissionPoints: ['新建'],
    },
    {
      label: '批量停用',
      type: 'warning',
      description: '批量将门店置为停用状态。',
      goal: '快速处置异常门店或临时停运门店。',
      permissionPoints: ['停用'],
    },
    {
      label: '批量恢复',
      type: 'success',
      description: '批量恢复已停用门店。',
      goal: '统一恢复门店正常使用。',
      permissionPoints: ['恢复'],
    },
  ],
  columns: [
    { key: 'storeName', label: '门店名称' },
    { key: 'tenantName', label: '所属租户' },
    { key: 'storeType', label: '门店类型' },
    { key: 'version', label: '门店版本' },
    { key: 'status', label: '门店状态' },
    { key: 'managerPhone', label: '管理员手机号' },
  ],
  description: '管理门店基础信息、状态流转和版本切换，并提供门店详情查看入口。',
  documentNotes: [
    '门店类型创建后不可修改。',
    '门店状态支持正常、停用、过期、注销，注销后不可逆。',
  ],
  exceptions: [
    '门店类型必填。',
    '门店名称必填。',
    '门店类型创建成功后不可修改。',
    '门店注销后不可逆。',
  ],
  fields: [
    { label: '所属租户', note: '归属租户', required: true },
    { label: '门店类型', note: '创建后不可修改', required: true },
    { label: '门店名称', note: '门店展示名称', required: true },
    { label: '地址', note: '门店地址', required: true },
    { label: '详细地址', note: '门店详细地址', required: true },
    { label: '手机号', note: '门店管理员手机号', required: true },
    { label: '用户名', note: '门店管理员用户名', required: true },
    { label: '密码', note: '门店管理员初始密码', required: true },
    { label: '门店状态', note: '系统生成：正常 / 停用 / 过期 / 注销' },
    { label: '门店版本', note: '创建后可配置' },
  ],
  filters: [
    createTextFilter({ field: 'storeName', label: '门店名称' }),
    createSelectFilter({
      field: 'tenantName',
      label: '所属租户',
      options: sampleTenantOptions,
    }),
    createSelectFilter({
      field: 'storeType',
      label: '门店类型',
      options: storeTypeOptions,
    }),
    createSelectFilter({
      field: 'status',
      label: '门店状态',
      options: storeStatusOptions,
    }),
  ],
  pageGoal: '查看和筛选门店，处理停用、恢复、注销、切换版本等操作。',
  permissionPoints: ['查看', '新建', '停用', '恢复', '注销'],
  processSteps: [
    '在租户下进入门店列表。',
    '点击“新建门店”。',
    '输入门店类型、名称、地址、详细地址、手机号、用户名、密码。',
    '提交后生成门店。',
    '创建成功后允许继续设置门店版本。',
  ],
  rowActions: [
    {
      label: '查看详情',
      description: '查看门店基础信息、版本、权益、联营关系和员工情况。',
      goal: '进入门店详情页查看完整配置。',
      permissionPoints: ['查看'],
    },
    {
      label: '切换版本',
      type: 'warning',
      description: '切换门店当前使用版本，立即按新版本能力边界生效。',
      documentNotes: ['版本切换后，被新版本屏蔽的功能直接不可见或不可用。'],
      goal: '调整门店功能边界。',
      permissionPoints: ['切换版本'],
    },
    {
      label: '停用',
      type: 'danger',
      description: '手动将门店置为停用状态。',
      goal: '停止门店继续使用业务能力。',
      permissionPoints: ['停用'],
    },
  ],
  sampleData: [
    {
      managerPhone: '13600009999',
      status: '正常',
      storeName: '欢乐谷东区店',
      storeType: '景区门店',
      tenantName: '星河票务集团',
      version: '旗舰版',
    },
    {
      managerPhone: '13700008888',
      status: '过期',
      storeName: '海岸线游客中心',
      storeType: '游客中心',
      tenantName: '海岸线文旅',
      version: '基础版',
    },
  ],
  statusTransitions: [
    {
      current: '正常',
      note: '由SaaS方手动触发',
      target: '停用',
      trigger: '手动停用',
    },
    {
      current: '正常',
      note: '系统自动触发',
      target: '过期',
      trigger: '权益到期',
    },
    {
      current: '停用',
      note: '恢复正常使用',
      target: '正常',
      trigger: '手动恢复',
    },
    {
      current: '过期',
      note: '权益续费后恢复',
      target: '正常',
      trigger: '续费恢复',
    },
    {
      current: '过期',
      note: '延长期限后恢复',
      target: '正常',
      trigger: '延期',
    },
    {
      current: '正常 / 停用 / 过期',
      note: '注销后不可逆',
      target: '注销',
      trigger: '注销',
    },
  ],
  supportActions: [
    {
      label: '新建门店抽屉',
      type: 'drawer',
      description:
        '以右侧抽屉方式承载门店创建表单，覆盖门店与门店管理员初始化字段。',
      fields: [
        createSelectField({
          field: 'tenantName',
          label: '所属租户',
          note: '归属租户',
          options: sampleTenantOptions,
          required: true,
        }),
        createSelectField({
          field: 'storeType',
          label: '门店类型',
          note: '创建后不可修改',
          options: storeTypeOptions,
          required: true,
        }),
        createTextField({
          field: 'storeName',
          label: '门店名称',
          note: '门店展示名称',
          required: true,
        }),
        createTextField({
          field: 'phone',
          label: '手机号',
          note: '门店管理员手机号',
          required: true,
        }),
        createTextField({
          field: 'username',
          label: '用户名',
          note: '门店管理员用户名',
          required: true,
        }),
        createPasswordField({
          field: 'password',
          label: '密码',
          note: '门店管理员初始密码',
          required: true,
        }),
      ],
      processSteps: [
        '录入门店和管理员基本信息。',
        '校验必填项。',
        '提交后生成门店。',
        '继续配置版本与权益。',
      ],
      permissionPoints: ['新建'],
    },
    {
      label: '门店详情抽屉',
      type: 'drawer',
      description: '从列表打开右侧抽屉，查看门店全量配置与状态信息。',
      goal: '在当前页内承载门店详情完整视图。',
      permissionPoints: ['查看'],
    },
  ],
} as const;
</script>

<template>
  <SaaSPageShell :meta="meta" />
</template>
