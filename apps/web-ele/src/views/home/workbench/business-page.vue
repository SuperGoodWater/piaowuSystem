<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTag,
} from 'element-plus';

interface ColumnItem {
  key: string;
  label: string;
  minWidth?: number;
}

interface PageConfig {
  actionLabel: string;
  columns: ColumnItem[];
  description: string;
  filterPlaceholder: string;
  sampleData: Record<string, string>[];
  statusOptions: readonly { label: string; value: string }[];
}

const productStatusOptions = [
  { label: '销售中', value: '销售中' },
  { label: '待上架', value: '待上架' },
  { label: '已下架', value: '已下架' },
] as const;

const orderStatusOptions = [
  { label: '待支付', value: '待支付' },
  { label: '已支付', value: '已支付' },
  { label: '已核销', value: '已核销' },
  { label: '已退款', value: '已退款' },
] as const;

const channelStatusOptions = [
  { label: '合作中', value: '合作中' },
  { label: '待开通', value: '待开通' },
  { label: '已停用', value: '已停用' },
] as const;

const configStatusOptions = [
  { label: '启用', value: '启用' },
  { label: '草稿', value: '草稿' },
  { label: '停用', value: '停用' },
] as const;

const financeStatusOptions = [
  { label: '正常', value: '正常' },
  { label: '处理中', value: '处理中' },
  { label: '已关闭', value: '已关闭' },
] as const;

const reportStatusOptions = [
  { label: '已发布', value: '已发布' },
  { label: '更新中', value: '更新中' },
  { label: '草稿', value: '草稿' },
] as const;

const pageConfigs: Record<string, PageConfig> = {
  WorkbenchRetailProductManagement: {
    actionLabel: '新增零售产品',
    columns: [
      { key: 'productId', label: '产品ID', minWidth: 130 },
      { key: 'productName', label: '产品名称', minWidth: 180 },
      { key: 'category', label: '零售分类', minWidth: 130 },
      { key: 'salePrice', label: '销售价', minWidth: 110 },
      { key: 'stock', label: '库存', minWidth: 100 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护门店零售商品、价格、库存和上下架状态。',
    filterPlaceholder: '请输入产品ID或产品名称',
    sampleData: [
      {
        category: '文创周边',
        productId: 'RP-10001',
        productName: '景区纪念徽章',
        salePrice: '29.00',
        status: '销售中',
        stock: '320',
        updatedAt: '2026-07-09 10:20',
      },
      {
        category: '饮品',
        productId: 'RP-10002',
        productName: '夏日限定冷饮券',
        salePrice: '18.00',
        status: '待上架',
        stock: '500',
        updatedAt: '2026-07-09 14:10',
      },
    ],
    statusOptions: productStatusOptions,
  },
  WorkbenchTicketOrder: {
    actionLabel: '导出门票订单',
    columns: [
      { key: 'orderId', label: '订单号', minWidth: 160 },
      { key: 'productName', label: '门票产品', minWidth: 180 },
      { key: 'visitor', label: '游客', minWidth: 120 },
      { key: 'quantity', label: '数量', minWidth: 90 },
      { key: 'amount', label: '订单金额', minWidth: 120 },
      { key: 'status', label: '订单状态', minWidth: 120 },
      { key: 'createdAt', label: '下单时间', minWidth: 160 },
    ],
    description: '查询门票订单、支付状态、核销状态和退款状态。',
    filterPlaceholder: '请输入订单号、产品或游客',
    sampleData: [
      {
        amount: '198.00',
        createdAt: '2026-07-09 09:25',
        orderId: 'TO-202607090001',
        productName: '成人单日票',
        quantity: '2',
        status: '已支付',
        visitor: '张先生',
      },
      {
        amount: '99.00',
        createdAt: '2026-07-09 11:40',
        orderId: 'TO-202607090002',
        productName: '儿童优惠票',
        quantity: '1',
        status: '已核销',
        visitor: '李女士',
      },
    ],
    statusOptions: orderStatusOptions,
  },
  WorkbenchTicketProductManagement: {
    actionLabel: '新增门票产品',
    columns: [
      { key: 'productId', label: '产品ID', minWidth: 130 },
      { key: 'productName', label: '产品名称', minWidth: 180 },
      { key: 'ticketType', label: '票种', minWidth: 120 },
      { key: 'salePrice', label: '销售价', minWidth: 110 },
      { key: 'validity', label: '有效期', minWidth: 170 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护门票产品、票种、价格、有效期和上下架状态。',
    filterPlaceholder: '请输入产品ID或产品名称',
    sampleData: [
      {
        productId: 'TP-10001',
        productName: '成人单日票',
        salePrice: '99.00',
        status: '销售中',
        ticketType: '普通门票',
        updatedAt: '2026-07-09 09:00',
        validity: '购票当日有效',
      },
      {
        productId: 'TP-10002',
        productName: '夜场畅玩票',
        salePrice: '69.00',
        status: '待上架',
        ticketType: '夜场票',
        updatedAt: '2026-07-09 13:30',
        validity: '指定日期有效',
      },
    ],
    statusOptions: productStatusOptions,
  },
  WorkbenchTimeTicketOrder: {
    actionLabel: '导出计时票订单',
    columns: [
      { key: 'orderId', label: '订单号', minWidth: 160 },
      { key: 'productName', label: '计时票产品', minWidth: 180 },
      { key: 'visitor', label: '游客', minWidth: 120 },
      { key: 'duration', label: '计时时长', minWidth: 120 },
      { key: 'amount', label: '订单金额', minWidth: 120 },
      { key: 'status', label: '订单状态', minWidth: 120 },
      { key: 'createdAt', label: '下单时间', minWidth: 160 },
    ],
    description: '查询按时长计费的门票订单和核销状态。',
    filterPlaceholder: '请输入订单号、产品或游客',
    sampleData: [
      {
        amount: '48.00',
        createdAt: '2026-07-09 10:05',
        duration: '2小时',
        orderId: 'TTO-202607090001',
        productName: '亲子乐园计时票',
        status: '已支付',
        visitor: '王先生',
      },
      {
        amount: '88.00',
        createdAt: '2026-07-09 12:15',
        duration: '4小时',
        orderId: 'TTO-202607090002',
        productName: '水世界计时票',
        status: '待支付',
        visitor: '赵女士',
      },
    ],
    statusOptions: orderStatusOptions,
  },
  WorkbenchPackageTicketOrder: {
    actionLabel: '导出套票订单',
    columns: [
      { key: 'orderId', label: '订单号', minWidth: 160 },
      { key: 'productName', label: '套票产品', minWidth: 180 },
      { key: 'visitor', label: '游客', minWidth: 120 },
      { key: 'packageItems', label: '套票内容', minWidth: 220 },
      { key: 'amount', label: '订单金额', minWidth: 120 },
      { key: 'status', label: '订单状态', minWidth: 120 },
      { key: 'createdAt', label: '下单时间', minWidth: 160 },
    ],
    description: '查询套票订单、套票内容和履约状态。',
    filterPlaceholder: '请输入订单号、产品或游客',
    sampleData: [
      {
        amount: '268.00',
        createdAt: '2026-07-09 09:45',
        orderId: 'PTO-202607090001',
        packageItems: '门票 + 观光车 + 餐券',
        productName: '亲子畅玩套票',
        status: '已支付',
        visitor: '陈女士',
      },
      {
        amount: '398.00',
        createdAt: '2026-07-09 15:20',
        orderId: 'PTO-202607090002',
        packageItems: '双人票 + 演出票',
        productName: '双人演艺套票',
        status: '已退款',
        visitor: '刘先生',
      },
    ],
    statusOptions: orderStatusOptions,
  },
  WorkbenchAnnualCardOrder: {
    actionLabel: '导出年卡订单',
    columns: [
      { key: 'orderId', label: '订单号', minWidth: 160 },
      { key: 'cardName', label: '年卡名称', minWidth: 180 },
      { key: 'holder', label: '持卡人', minWidth: 120 },
      { key: 'validity', label: '有效期', minWidth: 180 },
      { key: 'amount', label: '订单金额', minWidth: 120 },
      { key: 'status', label: '订单状态', minWidth: 120 },
      { key: 'createdAt', label: '下单时间', minWidth: 160 },
    ],
    description: '查询年卡购买订单、持卡人和有效期。',
    filterPlaceholder: '请输入订单号、年卡或持卡人',
    sampleData: [
      {
        amount: '699.00',
        cardName: '家庭畅玩年卡',
        createdAt: '2026-07-09 08:50',
        holder: '周女士',
        orderId: 'ACO-202607090001',
        status: '已支付',
        validity: '2026-07-09 至 2027-07-08',
      },
      {
        amount: '399.00',
        cardName: '个人年卡',
        createdAt: '2026-07-09 16:05',
        holder: '吴先生',
        orderId: 'ACO-202607090002',
        status: '已核销',
        validity: '2026-07-09 至 2027-07-08',
      },
    ],
    statusOptions: orderStatusOptions,
  },
  SalesChannelTravelAgencyManagement: {
    actionLabel: '新增旅行社',
    columns: [
      { key: 'channelId', label: '渠道ID', minWidth: 130 },
      { key: 'channelName', label: '旅行社名称', minWidth: 180 },
      { key: 'manager', label: '负责人', minWidth: 120 },
      { key: 'settlementRule', label: '结算方式', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护旅行社渠道档案、负责人和结算合作状态。',
    filterPlaceholder: '请输入渠道ID或旅行社名称',
    sampleData: [
      {
        channelId: 'TA-10001',
        channelName: '山海旅行社',
        manager: '何经理',
        settlementRule: '月结',
        status: '合作中',
        updatedAt: '2026-07-10 09:20',
      },
      {
        channelId: 'TA-10002',
        channelName: '远行假期',
        manager: '周经理',
        settlementRule: '单笔结算',
        status: '待开通',
        updatedAt: '2026-07-10 11:40',
      },
    ],
    statusOptions: channelStatusOptions,
  },
  SalesChannelOTAManagement: {
    actionLabel: '新增OTA渠道',
    columns: [
      { key: 'channelId', label: '渠道ID', minWidth: 130 },
      { key: 'channelName', label: 'OTA名称', minWidth: 180 },
      { key: 'dockingMode', label: '对接方式', minWidth: 140 },
      { key: 'rebateRule', label: '返佣规则', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护 OTA 渠道对接方式、返佣规则和合作状态。',
    filterPlaceholder: '请输入渠道ID或OTA名称',
    sampleData: [
      {
        channelId: 'OTA-20001',
        channelName: '携程',
        dockingMode: 'API直连',
        rebateRule: '按订单比例',
        status: '合作中',
        updatedAt: '2026-07-10 10:10',
      },
      {
        channelId: 'OTA-20002',
        channelName: '美团',
        dockingMode: '人工导单',
        rebateRule: '固定返佣',
        status: '待开通',
        updatedAt: '2026-07-10 13:20',
      },
    ],
    statusOptions: channelStatusOptions,
  },
  SalesChannelUniversalDistribution: {
    actionLabel: '新增分销员',
    columns: [
      { key: 'channelId', label: '分销ID', minWidth: 130 },
      { key: 'channelName', label: '分销主体', minWidth: 180 },
      { key: 'manager', label: '联系人', minWidth: 120 },
      { key: 'settlementRule', label: '佣金规则', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护人人分销主体、联系人和佣金规则。',
    filterPlaceholder: '请输入分销ID或分销主体',
    sampleData: [
      {
        channelId: 'RD-30001',
        channelName: '乐园合伙人A组',
        manager: '王芳',
        settlementRule: '按订单佣金',
        status: '合作中',
        updatedAt: '2026-07-10 09:50',
      },
      {
        channelId: 'RD-30002',
        channelName: '校园分销计划',
        manager: '李晨',
        settlementRule: '阶梯佣金',
        status: '已停用',
        updatedAt: '2026-07-10 15:05',
      },
    ],
    statusOptions: channelStatusOptions,
  },
  SalesChannelMiniProgram: {
    actionLabel: '新增小程序渠道',
    columns: [
      { key: 'channelId', label: '渠道ID', minWidth: 130 },
      { key: 'channelName', label: '小程序名称', minWidth: 180 },
      { key: 'manager', label: '负责人', minWidth: 120 },
      { key: 'settlementRule', label: '支付配置', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护小程序售卖渠道、负责人和支付配置状态。',
    filterPlaceholder: '请输入渠道ID或小程序名称',
    sampleData: [
      {
        channelId: 'MP-40001',
        channelName: '官方购票小程序',
        manager: '张楠',
        settlementRule: '微信支付',
        status: '合作中',
        updatedAt: '2026-07-10 08:40',
      },
      {
        channelId: 'MP-40002',
        channelName: '城市文旅联营小程序',
        manager: '陈露',
        settlementRule: '微信支付 + 分账',
        status: '待开通',
        updatedAt: '2026-07-10 16:10',
      },
    ],
    statusOptions: channelStatusOptions,
  },
  CustomerCenterVisitorList: {
    actionLabel: '导出游客列表',
    columns: [
      { key: 'visitorId', label: '游客ID', minWidth: 130 },
      { key: 'visitorName', label: '游客姓名', minWidth: 140 },
      { key: 'phone', label: '手机号', minWidth: 140 },
      { key: 'sourceChannel', label: '来源渠道', minWidth: 140 },
      { key: 'lastConsume', label: '最近消费', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
    ],
    description: '查看游客基本信息、来源渠道和最近消费情况。',
    filterPlaceholder: '请输入游客ID、姓名或手机号',
    sampleData: [
      {
        lastConsume: '2026-07-08',
        phone: '13800050001',
        sourceChannel: '官方小程序',
        status: '启用',
        visitorId: 'VIS-10001',
        visitorName: '赵晴',
      },
      {
        lastConsume: '2026-07-09',
        phone: '13800050002',
        sourceChannel: '携程',
        status: '停用',
        visitorId: 'VIS-10002',
        visitorName: '孙涛',
      },
    ],
    statusOptions: configStatusOptions,
  },
  CustomerCenterMemberSettings: {
    actionLabel: '新增会员规则',
    columns: [
      { key: 'settingName', label: '规则名称', minWidth: 180 },
      { key: 'memberLevel', label: '会员等级', minWidth: 120 },
      { key: 'currentValue', label: '当前配置', minWidth: 180 },
      { key: 'scope', label: '适用范围', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护会员等级、升级条件和适用范围。',
    filterPlaceholder: '请输入规则名称或会员等级',
    sampleData: [
      {
        currentValue: '消费满1000升级银卡',
        memberLevel: '银卡',
        scope: '全部门店',
        settingName: '银卡升级规则',
        status: '启用',
        updatedAt: '2026-07-10 09:15',
      },
      {
        currentValue: '生日月95折',
        memberLevel: '金卡',
        scope: '直营网点',
        settingName: '金卡权益规则',
        status: '草稿',
        updatedAt: '2026-07-10 14:00',
      },
    ],
    statusOptions: configStatusOptions,
  },
  CustomerCenterStoredValueSettings: {
    actionLabel: '新增储值方案',
    columns: [
      { key: 'schemeName', label: '方案名称', minWidth: 180 },
      { key: 'rechargeRule', label: '充值规则', minWidth: 180 },
      { key: 'bonusRule', label: '赠送规则', minWidth: 180 },
      { key: 'scope', label: '适用范围', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护会员储值方案、充值门槛和赠送规则。',
    filterPlaceholder: '请输入方案名称或适用范围',
    sampleData: [
      {
        bonusRule: '充500送50',
        rechargeRule: '单次最低100',
        schemeName: '夏季储值活动',
        scope: '景区直营组',
        status: '启用',
        updatedAt: '2026-07-10 10:30',
      },
      {
        bonusRule: '充1000送150',
        rechargeRule: '单次最低500',
        schemeName: '黄金会员储值',
        scope: '全部门店',
        status: '草稿',
        updatedAt: '2026-07-10 15:20',
      },
    ],
    statusOptions: configStatusOptions,
  },
  CustomerCenterPointsManagement: {
    actionLabel: '新增积分规则',
    columns: [
      { key: 'ruleName', label: '规则名称', minWidth: 180 },
      { key: 'earnScenario', label: '获取场景', minWidth: 160 },
      { key: 'useScenario', label: '使用场景', minWidth: 160 },
      { key: 'scope', label: '适用范围', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护会员积分获取、消耗和适用场景。',
    filterPlaceholder: '请输入规则名称或场景',
    sampleData: [
      {
        earnScenario: '购票每消费1元积1分',
        ruleName: '门票消费积分',
        scope: '全部门店',
        status: '启用',
        updatedAt: '2026-07-10 08:55',
        useScenario: '积分抵扣门票',
      },
      {
        earnScenario: '储值赠送积分',
        ruleName: '储值加赠积分',
        scope: '直营网点',
        status: '停用',
        updatedAt: '2026-07-10 13:45',
        useScenario: '积分兑换礼品',
      },
    ],
    statusOptions: configStatusOptions,
  },
  CustomerCenterGiftPackageManagement: {
    actionLabel: '新增礼包',
    columns: [
      { key: 'packageName', label: '礼包名称', minWidth: 180 },
      { key: 'packageContent', label: '礼包内容', minWidth: 220 },
      { key: 'claimCondition', label: '领取条件', minWidth: 180 },
      { key: 'scope', label: '适用范围', minWidth: 140 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护会员礼包内容、领取条件和适用范围。',
    filterPlaceholder: '请输入礼包名称或领取条件',
    sampleData: [
      {
        claimCondition: '新会员注册领取',
        packageContent: '门票优惠券 + 饮品券',
        packageName: '新会员欢迎礼包',
        scope: '全部门店',
        status: '启用',
        updatedAt: '2026-07-10 09:35',
      },
      {
        claimCondition: '金卡会员生日月领取',
        packageContent: '餐券 + 文创折扣券',
        packageName: '生日尊享礼包',
        scope: '华东大区',
        status: '草稿',
        updatedAt: '2026-07-10 16:00',
      },
    ],
    statusOptions: configStatusOptions,
  },
  FinanceCenterMyAccount: {
    actionLabel: '查看账户明细',
    columns: [
      { key: 'accountType', label: '账户类型', minWidth: 140 },
      { key: 'availableBalance', label: '可用余额', minWidth: 130 },
      { key: 'frozenBalance', label: '冻结金额', minWidth: 130 },
      { key: 'totalIncome', label: '累计收入', minWidth: 130 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看账户余额、冻结金额和累计收入概况。',
    filterPlaceholder: '请输入账户类型',
    sampleData: [
      {
        accountType: '门票结算账户',
        availableBalance: '286,000.00',
        frozenBalance: '12,000.00',
        status: '正常',
        totalIncome: '1,286,000.00',
        updatedAt: '2026-07-10 09:00',
      },
      {
        accountType: '零售结算账户',
        availableBalance: '98,200.00',
        frozenBalance: '3,600.00',
        status: '正常',
        totalIncome: '462,000.00',
        updatedAt: '2026-07-10 09:00',
      },
    ],
    statusOptions: financeStatusOptions,
  },
  FinanceCenterFundStatistics: {
    actionLabel: '导出资金统计',
    columns: [
      { key: 'statDate', label: '统计日期', minWidth: 130 },
      { key: 'income', label: '收入', minWidth: 120 },
      { key: 'expense', label: '支出', minWidth: 120 },
      { key: 'withdrawal', label: '提现', minWidth: 120 },
      { key: 'splitAmount', label: '分账金额', minWidth: 130 },
      { key: 'status', label: '状态', minWidth: 110 },
    ],
    description: '查看收入、支出、提现和分账统计结果。',
    filterPlaceholder: '请输入统计日期',
    sampleData: [
      {
        expense: '42,800.00',
        income: '186,500.00',
        splitAmount: '36,000.00',
        statDate: '2026-07-09',
        status: '正常',
        withdrawal: '20,000.00',
      },
      {
        expense: '38,600.00',
        income: '175,300.00',
        splitAmount: '31,500.00',
        statDate: '2026-07-08',
        status: '正常',
        withdrawal: '18,000.00',
      },
    ],
    statusOptions: financeStatusOptions,
  },
  FinanceCenterFundLog: {
    actionLabel: '导出资金日志',
    columns: [
      { key: 'logId', label: '日志ID', minWidth: 150 },
      { key: 'bizType', label: '业务类型', minWidth: 130 },
      { key: 'amount', label: '金额', minWidth: 110 },
      { key: 'direction', label: '收支方向', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'createdAt', label: '发生时间', minWidth: 160 },
    ],
    description: '查看资金流水明细和处理状态。',
    filterPlaceholder: '请输入日志ID或业务类型',
    sampleData: [
      {
        amount: '9,800.00',
        bizType: '门票结算',
        createdAt: '2026-07-10 09:12',
        direction: '收入',
        logId: 'FL-10001',
        status: '正常',
      },
      {
        amount: '3,200.00',
        bizType: '退款处理',
        createdAt: '2026-07-10 10:45',
        direction: '支出',
        logId: 'FL-10002',
        status: '处理中',
      },
    ],
    statusOptions: financeStatusOptions,
  },
  FinanceCenterSettlementRules: {
    actionLabel: '新增分账规则',
    columns: [
      { key: 'ruleName', label: '规则名称', minWidth: 180 },
      { key: 'channel', label: '适用渠道', minWidth: 140 },
      { key: 'receiver', label: '分账对象', minWidth: 140 },
      { key: 'ratio', label: '分账比例', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '维护不同销售渠道的分账对象和分账比例。',
    filterPlaceholder: '请输入规则名称或适用渠道',
    sampleData: [
      {
        channel: 'OTA',
        ratio: '平台 15% / 景区 85%',
        receiver: '平台 / 景区',
        ruleName: 'OTA门票分账',
        status: '正常',
        updatedAt: '2026-07-10 09:40',
      },
      {
        channel: '小程序',
        ratio: '集团 10% / 门店 90%',
        receiver: '集团 / 门店',
        ruleName: '小程序直营分账',
        status: '已关闭',
        updatedAt: '2026-07-10 12:30',
      },
    ],
    statusOptions: financeStatusOptions,
  },
  FinanceCenterElectronicInvoice: {
    actionLabel: '发起开票',
    columns: [
      { key: 'invoiceNo', label: '发票号', minWidth: 150 },
      { key: 'title', label: '抬头', minWidth: 200 },
      { key: 'amount', label: '金额', minWidth: 120 },
      { key: 'invoiceType', label: '发票类型', minWidth: 130 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'issuedAt', label: '开票时间', minWidth: 160 },
    ],
    description: '查看电子发票申请、开票金额和开票状态。',
    filterPlaceholder: '请输入发票号或抬头',
    sampleData: [
      {
        amount: '980.00',
        invoiceNo: 'INV-202607100001',
        invoiceType: '电子普通发票',
        issuedAt: '2026-07-10 09:55',
        status: '正常',
        title: '上海山海旅游有限公司',
      },
      {
        amount: '1,280.00',
        invoiceNo: 'INV-202607100002',
        invoiceType: '电子专用发票',
        issuedAt: '2026-07-10 14:35',
        status: '处理中',
        title: '杭州城市文旅发展有限公司',
      },
    ],
    statusOptions: financeStatusOptions,
  },
  StatisticsDataCenterOverview: {
    actionLabel: '导出总览数据',
    columns: [
      { key: 'metricName', label: '指标', minWidth: 180 },
      { key: 'currentValue', label: '当前值', minWidth: 130 },
      { key: 'monthOnMonth', label: '环比', minWidth: 120 },
      { key: 'yearOnYear', label: '同比', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看工作台核心经营指标总览。',
    filterPlaceholder: '请输入指标名称',
    sampleData: [
      {
        currentValue: '286,000',
        metricName: '总订单量',
        monthOnMonth: '+12.6%',
        status: '已发布',
        updatedAt: '2026-07-10 09:00',
        yearOnYear: '+18.2%',
      },
      {
        currentValue: '1,286,000.00',
        metricName: '总销售额',
        monthOnMonth: '+9.4%',
        status: '更新中',
        updatedAt: '2026-07-10 09:00',
        yearOnYear: '+16.8%',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsDataCenterScenic: {
    actionLabel: '导出景区数据',
    columns: [
      { key: 'metricName', label: '景区指标', minWidth: 180 },
      { key: 'currentValue', label: '当前值', minWidth: 130 },
      { key: 'monthOnMonth', label: '环比', minWidth: 120 },
      { key: 'yearOnYear', label: '同比', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看景区业务的订单量、客流和销售数据。',
    filterPlaceholder: '请输入景区指标',
    sampleData: [
      {
        currentValue: '58,000',
        metricName: '景区接待人次',
        monthOnMonth: '+15.0%',
        status: '已发布',
        updatedAt: '2026-07-10 09:10',
        yearOnYear: '+21.5%',
      },
      {
        currentValue: '620,000.00',
        metricName: '景区门票销售额',
        monthOnMonth: '+11.8%',
        status: '已发布',
        updatedAt: '2026-07-10 09:10',
        yearOnYear: '+19.7%',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsDataCenterCatering: {
    actionLabel: '导出餐饮数据',
    columns: [
      { key: 'metricName', label: '餐饮指标', minWidth: 180 },
      { key: 'currentValue', label: '当前值', minWidth: 130 },
      { key: 'monthOnMonth', label: '环比', minWidth: 120 },
      { key: 'yearOnYear', label: '同比', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看餐饮业务的销售额、客单价和订单量。',
    filterPlaceholder: '请输入餐饮指标',
    sampleData: [
      {
        currentValue: '186,000.00',
        metricName: '餐饮销售额',
        monthOnMonth: '+8.7%',
        status: '已发布',
        updatedAt: '2026-07-10 09:20',
        yearOnYear: '+13.4%',
      },
      {
        currentValue: '42.60',
        metricName: '餐饮客单价',
        monthOnMonth: '+3.2%',
        status: '已发布',
        updatedAt: '2026-07-10 09:20',
        yearOnYear: '+5.6%',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsDataCenterRetail: {
    actionLabel: '导出零售数据',
    columns: [
      { key: 'metricName', label: '零售指标', minWidth: 180 },
      { key: 'currentValue', label: '当前值', minWidth: 130 },
      { key: 'monthOnMonth', label: '环比', minWidth: 120 },
      { key: 'yearOnYear', label: '同比', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看零售业务的销量、库存周转和销售数据。',
    filterPlaceholder: '请输入零售指标',
    sampleData: [
      {
        currentValue: '96,800.00',
        metricName: '零售销售额',
        monthOnMonth: '+10.1%',
        status: '已发布',
        updatedAt: '2026-07-10 09:30',
        yearOnYear: '+12.7%',
      },
      {
        currentValue: '3.8',
        metricName: '库存周转天数',
        monthOnMonth: '-4.5%',
        status: '更新中',
        updatedAt: '2026-07-10 09:30',
        yearOnYear: '-6.0%',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsDataCenterAccommodation: {
    actionLabel: '导出住宿数据',
    columns: [
      { key: 'metricName', label: '住宿指标', minWidth: 180 },
      { key: 'currentValue', label: '当前值', minWidth: 130 },
      { key: 'monthOnMonth', label: '环比', minWidth: 120 },
      { key: 'yearOnYear', label: '同比', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看住宿业务的入住率、房晚和销售额。',
    filterPlaceholder: '请输入住宿指标',
    sampleData: [
      {
        currentValue: '82%',
        metricName: '入住率',
        monthOnMonth: '+5.0%',
        status: '已发布',
        updatedAt: '2026-07-10 09:40',
        yearOnYear: '+7.3%',
      },
      {
        currentValue: '228,000.00',
        metricName: '住宿销售额',
        monthOnMonth: '+9.8%',
        status: '已发布',
        updatedAt: '2026-07-10 09:40',
        yearOnYear: '+14.2%',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterFavorites: {
    actionLabel: '新增收藏报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'reportType', label: '报表类型', minWidth: 140 },
      { key: 'owner', label: '收藏人', minWidth: 120 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看已收藏报表和常用报表入口。',
    filterPlaceholder: '请输入报表名称或报表类型',
    sampleData: [
      {
        cycle: '日',
        owner: '运营中心',
        reportName: '景区经营日报',
        reportType: '经营报表',
        status: '已发布',
        updatedAt: '2026-07-10 08:30',
      },
      {
        cycle: '月',
        owner: '财务中心',
        reportName: '套票销售月报',
        reportType: '套票',
        status: '已发布',
        updatedAt: '2026-07-10 08:45',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterOperation: {
    actionLabel: '导出经营报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'dimension', label: '统计维度', minWidth: 140 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'owner', label: '负责人', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看经营分析类报表和更新状态。',
    filterPlaceholder: '请输入报表名称或统计维度',
    sampleData: [
      {
        cycle: '日',
        dimension: '门店',
        owner: '经营分析组',
        reportName: '景区经营日报',
        status: '已发布',
        updatedAt: '2026-07-10 09:10',
      },
      {
        cycle: '周',
        dimension: '渠道',
        owner: '经营分析组',
        reportName: '渠道经营周报',
        status: '更新中',
        updatedAt: '2026-07-10 10:20',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterTicket: {
    actionLabel: '导出门票报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'dimension', label: '统计维度', minWidth: 140 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'owner', label: '负责人', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看门票业务报表和数据更新状态。',
    filterPlaceholder: '请输入报表名称或统计维度',
    sampleData: [
      {
        cycle: '日',
        dimension: '票种',
        owner: '票务中心',
        reportName: '门票销量日报',
        status: '已发布',
        updatedAt: '2026-07-10 09:25',
      },
      {
        cycle: '月',
        dimension: '渠道',
        owner: '票务中心',
        reportName: '门票渠道月报',
        status: '草稿',
        updatedAt: '2026-07-10 11:35',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterCatering: {
    actionLabel: '导出餐饮报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'dimension', label: '统计维度', minWidth: 140 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'owner', label: '负责人', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看餐饮业务报表和数据更新状态。',
    filterPlaceholder: '请输入报表名称或统计维度',
    sampleData: [
      {
        cycle: '日',
        dimension: '档口',
        owner: '餐饮运营组',
        reportName: '餐饮销售日报',
        status: '已发布',
        updatedAt: '2026-07-10 09:40',
      },
      {
        cycle: '周',
        dimension: '门店',
        owner: '餐饮运营组',
        reportName: '餐饮客单价周报',
        status: '更新中',
        updatedAt: '2026-07-10 12:10',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterRetail: {
    actionLabel: '导出零售报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'dimension', label: '统计维度', minWidth: 140 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'owner', label: '负责人', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看零售业务报表和库存周转相关数据。',
    filterPlaceholder: '请输入报表名称或统计维度',
    sampleData: [
      {
        cycle: '日',
        dimension: '品类',
        owner: '零售运营组',
        reportName: '零售销量日报',
        status: '已发布',
        updatedAt: '2026-07-10 09:55',
      },
      {
        cycle: '月',
        dimension: '单品',
        owner: '零售运营组',
        reportName: '零售爆品月报',
        status: '草稿',
        updatedAt: '2026-07-10 15:00',
      },
    ],
    statusOptions: reportStatusOptions,
  },
  StatisticsReportCenterPackage: {
    actionLabel: '导出套票报表',
    columns: [
      { key: 'reportName', label: '报表名称', minWidth: 200 },
      { key: 'dimension', label: '统计维度', minWidth: 140 },
      { key: 'cycle', label: '统计周期', minWidth: 130 },
      { key: 'owner', label: '负责人', minWidth: 120 },
      { key: 'status', label: '状态', minWidth: 110 },
      { key: 'updatedAt', label: '更新时间', minWidth: 160 },
    ],
    description: '查看套票业务报表和套票组合销售表现。',
    filterPlaceholder: '请输入报表名称或统计维度',
    sampleData: [
      {
        cycle: '日',
        dimension: '套票组合',
        owner: '票务中心',
        reportName: '套票销量日报',
        status: '已发布',
        updatedAt: '2026-07-10 10:05',
      },
      {
        cycle: '周',
        dimension: '渠道',
        owner: '票务中心',
        reportName: '套票渠道周报',
        status: '更新中',
        updatedAt: '2026-07-10 13:25',
      },
    ],
    statusOptions: reportStatusOptions,
  },
};

const route = useRoute();
const currentPage = ref(1);
const pageSize = ref(10);
const filterState = ref({
  keyword: '',
  status: '',
});
const defaultPageConfig: PageConfig =
  pageConfigs.WorkbenchTicketProductManagement!;

const pageTitle = computed(() => String(route.meta.title ?? '工作台'));
const pageConfig = computed<PageConfig>(
  () => pageConfigs[String(route.name)] ?? defaultPageConfig,
);
const filteredData = computed(() => {
  const keyword = filterState.value.keyword.trim().toLowerCase();
  const status = filterState.value.status;

  return pageConfig.value.sampleData.filter((item) => {
    const matchesKeyword =
      !keyword ||
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(keyword),
      );
    const matchesStatus = !status || item.status === status;

    return matchesKeyword && matchesStatus;
  });
});
const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

function getStatusTagType(status: string) {
  if (
    ['合作中', '启用', '已发布', '已支付', '已核销', '正常', '销售中'].includes(
      status,
    )
  ) {
    return 'success';
  }
  if (
    ['处理中', '待上架', '待开通', '待支付', '更新中', '草稿'].includes(status)
  ) {
    return 'warning';
  }
  if (['停用', '已下架', '已停用', '已关闭', '已退款'].includes(status)) {
    return 'info';
  }
  return 'primary';
}

function getCellValue(row: Record<string, string>, key: string) {
  return row[key] || '-';
}

function handleFilterSubmit() {
  filterState.value = {
    keyword: filterState.value.keyword.trim(),
    status: filterState.value.status,
  };
  currentPage.value = 1;
}

function handleFilterReset() {
  filterState.value = {
    keyword: '',
    status: '',
  };
  currentPage.value = 1;
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentPageChange(page: number) {
  currentPage.value = page;
}

watch(
  () => route.name,
  () => {
    handleFilterReset();
  },
);
</script>

<template>
  <Page :title="pageTitle">
    <div class="flex flex-col gap-4">
      <div class="rounded-md bg-card p-3">
        <div class="mb-3 text-sm text-[var(--el-text-color-secondary)]">
          {{ pageConfig.description }}
        </div>
        <ElForm
          class="workbench-filter-form"
          :model="filterState"
          label-position="left"
          @submit.prevent="handleFilterSubmit"
        >
          <div class="workbench-filter-grid">
            <ElFormItem label="关键字">
              <ElInput
                v-model="filterState.keyword"
                clearable
                :placeholder="pageConfig.filterPlaceholder"
              />
            </ElFormItem>
            <ElFormItem label="状态">
              <ElSelect
                v-model="filterState.status"
                clearable
                filterable
                placeholder="请选择状态"
              >
                <ElOption
                  v-for="option in pageConfig.statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <div class="workbench-filter-actions">
              <ElButton type="primary">{{ pageConfig.actionLabel }}</ElButton>
              <ElButton type="primary" native-type="submit">查询</ElButton>
              <ElButton @click="handleFilterReset">重置</ElButton>
            </div>
          </div>
        </ElForm>
      </div>

      <div class="rounded-md bg-card p-3">
        <ElTable :data="tableData" size="small" stripe>
          <ElTable.TableColumn
            v-for="column in pageConfig.columns"
            :key="column.key"
            :label="column.label"
            :min-width="column.minWidth || 150"
          >
            <template #default="{ row }">
              <ElTag
                v-if="column.key === 'status'"
                :type="getStatusTagType(getCellValue(row, column.key))"
              >
                {{ getCellValue(row, column.key) }}
              </ElTag>
              <span v-else>{{ getCellValue(row, column.key) }}</span>
            </template>
          </ElTable.TableColumn>
        </ElTable>

        <div class="mt-3 flex justify-end">
          <ElPagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :total="filteredData.length"
            @current-change="handleCurrentPageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.workbench-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: flex-start;
}

.workbench-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 32px;
}
</style>
