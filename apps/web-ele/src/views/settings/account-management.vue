<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

interface AccountRecord {
  account: string;
  departments: string[];
  id: string;
  name: string;
  phone: string;
  roles: string[];
  stores: string[];
  status: '启用' | '禁用';
}

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title ?? '账号管理'));
const filterKeyword = ref('');
const authDrawerVisible = ref(false);
const selectedAccountIds = ref<string[]>([]);
const authForm = ref({
  departments: [] as string[],
  roles: [] as string[],
  stores: [] as string[],
});

const roleOptions = ['集团管理员', '财务主管', '门店运营', '票务客服'];
const storeOptions = [
  '欢乐谷东区店',
  '欢乐谷西区店',
  '海岸线游客中心',
  '西湖城市合作店',
];
const departmentOptions = ['集团总部', '财务部', '运营部', '游客服务部'];

const accountData = ref<AccountRecord[]>([
  {
    account: 'admin_zhang',
    departments: ['集团总部'],
    id: 'account-001',
    name: '张宁',
    phone: '13800010001',
    roles: ['集团管理员'],
    status: '启用',
    stores: ['欢乐谷东区店', '欢乐谷西区店'],
  },
  {
    account: 'finance_li',
    departments: ['财务部'],
    id: 'account-002',
    name: '李安',
    phone: '13800010002',
    roles: ['财务主管'],
    status: '启用',
    stores: ['海岸线游客中心'],
  },
  {
    account: 'ops_wang',
    departments: ['运营部', '游客服务部'],
    id: 'account-003',
    name: '王晨',
    phone: '13800010003',
    roles: ['门店运营', '票务客服'],
    status: '启用',
    stores: ['西湖城市合作店'],
  },
]);

const filteredAccounts = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return accountData.value;
  }

  return accountData.value.filter(
    (item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.account.toLowerCase().includes(keyword) ||
      item.phone.includes(keyword),
  );
});

function getAccountRow(row: Record<string, any>) {
  return row as AccountRecord;
}

function handleSelectionChange(rows: AccountRecord[]) {
  selectedAccountIds.value = rows.map((item) => item.id);
}

function openBatchAuthDrawer() {
  if (selectedAccountIds.value.length === 0) {
    ElMessage.warning('请先选择需要调整的账号');
    return;
  }

  authForm.value = {
    departments: [],
    roles: [],
    stores: [],
  };
  authDrawerVisible.value = true;
}

function openSingleAuthDrawer(row: AccountRecord) {
  selectedAccountIds.value = [row.id];
  authForm.value = {
    departments: [...row.departments],
    roles: [...row.roles],
    stores: [...row.stores],
  };
  authDrawerVisible.value = true;
}

function saveAuthorization() {
  if (
    authForm.value.roles.length === 0 ||
    authForm.value.stores.length === 0 ||
    authForm.value.departments.length === 0
  ) {
    ElMessage.warning('请完整选择角色、门店和部门');
    return;
  }

  accountData.value = accountData.value.map((item) =>
    selectedAccountIds.value.includes(item.id)
      ? {
          ...item,
          departments: [...authForm.value.departments],
          roles: [...authForm.value.roles],
          stores: [...authForm.value.stores],
        }
      : item,
  );

  ElMessage.success(`已调整 ${selectedAccountIds.value.length} 个账号授权`);
  authDrawerVisible.value = false;
}
</script>

<template>
  <Page :title="pageTitle">
    <div class="settings-page">
      <div class="filter-panel">
        <ElInput
          v-model="filterKeyword"
          class="search-input"
          clearable
          placeholder="搜索姓名、账号或手机号"
        />
        <ElButton type="primary" @click="openBatchAuthDrawer">
          批量调整授权
        </ElButton>
      </div>

      <ElTable
        :data="filteredAccounts"
        size="small"
        stripe
        @selection-change="handleSelectionChange"
      >
        <ElTable.TableColumn type="selection" width="48" />
        <ElTable.TableColumn label="姓名" prop="name" min-width="120" />
        <ElTable.TableColumn label="登录账号" prop="account" min-width="140" />
        <ElTable.TableColumn label="手机号" prop="phone" min-width="140" />
        <ElTable.TableColumn label="授权角色" min-width="220">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag
                v-for="role in getAccountRow(row).roles"
                :key="role"
                size="small"
              >
                {{ role }}
              </ElTag>
            </ElSpace>
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="授权门店" min-width="260">
          <template #default="{ row }">
            {{ getAccountRow(row).stores.join('、') }}
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="部门" min-width="180">
          <template #default="{ row }">
            {{ getAccountRow(row).departments.join('、') }}
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="状态" min-width="90">
          <template #default="{ row }">
            <ElTag
              :type="getAccountRow(row).status === '启用' ? 'success' : 'info'"
            >
              {{ getAccountRow(row).status }}
            </ElTag>
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="操作" fixed="right" min-width="110">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click="openSingleAuthDrawer(getAccountRow(row))"
            >
              授权管理
            </ElButton>
          </template>
        </ElTable.TableColumn>
      </ElTable>
    </div>

    <ElDrawer v-model="authDrawerVisible" size="520px" title="授权管理">
      <ElForm :model="authForm" label-position="top">
        <ElFormItem label="授权角色">
          <ElSelect v-model="authForm.roles" multiple placeholder="请选择角色">
            <ElOption
              v-for="item in roleOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="授权门店">
          <ElSelect v-model="authForm.stores" multiple placeholder="请选择门店">
            <ElOption
              v-for="item in storeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="所属部门">
          <ElSelect
            v-model="authForm.departments"
            multiple
            placeholder="请选择部门"
          >
            <ElOption
              v-for="item in departmentOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="authDrawerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveAuthorization">保存</ElButton>
      </template>
    </ElDrawer>
  </Page>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-bg-color);
}

.search-input {
  max-width: 360px;
}

:deep(.el-select) {
  width: 100%;
}
</style>
