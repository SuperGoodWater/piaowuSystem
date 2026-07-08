export const sampleTenantOptions = [
  { label: '星河票务集团', value: '星河票务集团' },
  { label: '海岸线文旅', value: '海岸线文旅' },
] as const;

export const sampleStoreOptions = [
  { label: '欢乐谷东区店', value: '欢乐谷东区店' },
  { label: '欢乐谷西区店', value: '欢乐谷西区店' },
  { label: '海岸线游客中心', value: '海岸线游客中心' },
] as const;

export const storeTypeOptions = [
  { label: '景区门店', value: '景区门店' },
  { label: '游客中心', value: '游客中心' },
] as const;

export const versionNameOptions = [
  { label: '基础版', value: '基础版' },
  { label: '专业版', value: '专业版' },
  { label: '旗舰版', value: '旗舰版' },
] as const;

export const tenantStatusOptions = [
  { label: '启用', value: '启用' },
  { label: '停用', value: '停用' },
] as const;

export const enabledDisabledOptions = [
  { label: '启用', value: '启用' },
  { label: '禁用', value: '禁用' },
] as const;

export const storeStatusOptions = [
  { label: '正常', value: '正常' },
  { label: '停用', value: '停用' },
  { label: '过期', value: '过期' },
  { label: '注销', value: '注销' },
] as const;

export const publishStatusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发布', value: '已发布' },
  { label: '已下线', value: '已下线' },
] as const;

export const popupStatusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '生效中', value: '生效中' },
  { label: '已下线', value: '已下线' },
] as const;

export const appShelfStatusOptions = [
  { label: '已上架', value: '已上架' },
  { label: '已下架', value: '已下架' },
] as const;

export const notificationChannelOptions = [
  { label: '站内信', value: '站内信' },
  { label: '短信', value: '短信' },
  { label: '邮件', value: '邮件' },
] as const;

export const notificationTargetOptions = [
  { label: '租户管理员', value: '租户管理员' },
  { label: '门店管理员', value: '门店管理员' },
] as const;

export const combinedAnnouncementTargetOptions = [
  { label: '租户管理员', value: '租户管理员' },
  { label: '门店管理员', value: '门店管理员' },
  {
    label: '租户管理员 / 门店管理员',
    value: '租户管理员 / 门店管理员',
  },
] as const;

export const popupTargetOptions = [
  { label: '全部门店', value: '全部门店' },
  ...notificationTargetOptions,
] as const;

export const sendStatusOptions = [
  { label: '待发送', value: '待发送' },
  { label: '已发送', value: '已发送' },
  { label: '失败', value: '失败' },
] as const;

export const jointOperationStatusOptions = [
  { label: '已建立', value: '已建立' },
  { label: '已解除', value: '已解除' },
] as const;

export const bindingStatusOptions = [
  { label: '已绑定', value: '已绑定' },
  { label: '未绑定', value: '未绑定' },
] as const;

export const appTypeOptions = [
  { label: '营销应用', value: '营销应用' },
  { label: '运营应用', value: '运营应用' },
  { label: '数据应用', value: '数据应用' },
] as const;

export const featureModuleOptions = [
  { label: '会员营销', value: '会员营销' },
  { label: '票务能力', value: '票务能力' },
  { label: '联营能力', value: '联营能力' },
] as const;

export const newsCategoryOptions = [
  { label: '平台动态', value: '平台动态' },
  { label: '运营资讯', value: '运营资讯' },
  { label: '产品公告', value: '产品公告' },
] as const;

export const templateTypeOptions = [
  { label: '小票模板', value: '小票模板' },
  { label: '票面模板', value: '票面模板' },
] as const;

export const employeeDepartmentOptions = [
  { label: '平台运营部', value: '平台运营部' },
  { label: '客户成功部', value: '客户成功部' },
  { label: '技术支持部', value: '技术支持部' },
] as const;

export const parentDepartmentOptions = [
  { label: '总部', value: '总部' },
  ...employeeDepartmentOptions,
] as const;

export const employeeRoleOptions = [
  { label: '运营经理', value: '运营经理' },
  { label: '客户成功经理', value: '客户成功经理' },
  { label: '技术支持专员', value: '技术支持专员' },
] as const;

export const roleNameOptions = [
  { label: '平台运营经理', value: '平台运营经理' },
  { label: '客户成功经理', value: '客户成功经理' },
  { label: '技术支持专员', value: '技术支持专员' },
] as const;

export const moduleScopeOptions = [
  { label: '客户管理', value: '客户管理' },
  { label: '公告管理', value: '公告管理' },
  { label: '平台资源管理', value: '平台资源管理' },
] as const;

export const deviceBrandOptions = [
  { label: '票星终端', value: '票星终端' },
  { label: '智票硬件', value: '智票硬件' },
] as const;

export const benefitNameOptions = [
  { label: '高级营销权益', value: '高级营销权益' },
  { label: '多门店联营权益', value: '多门店联营权益' },
] as const;

export const benefitStatusOptions = [
  { label: '生效中', value: '生效中' },
  { label: '已到期', value: '已到期' },
  { label: '已关闭', value: '已关闭' },
] as const;

export const auditModuleOptions = [
  { label: '门店版本管理', value: '门店版本管理' },
  { label: '门店权益管理', value: '门店权益管理' },
  { label: '员工账号管理', value: '员工账号管理' },
] as const;

export const auditRiskLevelOptions = [
  { label: '高', value: '高' },
  { label: '中', value: '中' },
  { label: '低', value: '低' },
] as const;

export const operationModuleOptions = [
  { label: '租户管理', value: '租户管理' },
  { label: '门店管理', value: '门店管理' },
  { label: '公告管理', value: '公告管理' },
] as const;

export const operationActionOptions = [
  { label: '新建', value: '新建' },
  { label: '编辑', value: '编辑' },
  { label: '停用', value: '停用' },
] as const;
