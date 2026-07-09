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
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSpace,
  ElTable,
  ElTag,
} from 'element-plus';

interface RoleRecord {
  id: string;
  name: string;
  note: string;
  permissions: string[];
}

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title ?? '角色管理'));
const drawerVisible = ref(false);
const editingRoleId = ref('');
const keyword = ref('');
const permissionOptions = [
  '工作台',
  '销售渠道',
  '客户管理',
  '财务中心',
  '统计',
  '应用中心',
  '设置',
  'SaaS管理',
];

const roleForm = ref({
  name: '',
  note: '',
  permissions: [] as string[],
});

const roleData = ref<RoleRecord[]>([
  {
    id: 'role-001',
    name: '集团管理员',
    note: '集团全局管理权限组',
    permissions: ['工作台', '客户管理', '财务中心', '设置'],
  },
  {
    id: 'role-002',
    name: '门店运营',
    note: '门店日常运营权限组',
    permissions: ['工作台', '销售渠道', '应用中心'],
  },
  {
    id: 'role-003',
    name: '财务主管',
    note: '资金、发票和对账相关权限组',
    permissions: ['财务中心', '统计'],
  },
]);

const filteredRoles = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  if (!value) {
    return roleData.value;
  }

  return roleData.value.filter(
    (item) =>
      item.name.toLowerCase().includes(value) ||
      item.note.toLowerCase().includes(value),
  );
});

function getRoleRow(row: Record<string, any>) {
  return row as RoleRecord;
}

function resetForm() {
  editingRoleId.value = '';
  roleForm.value = {
    name: '',
    note: '',
    permissions: [],
  };
}

function openCreateDrawer() {
  resetForm();
  drawerVisible.value = true;
}

function openEditDrawer(row: RoleRecord) {
  editingRoleId.value = row.id;
  roleForm.value = {
    name: row.name,
    note: row.note,
    permissions: [...row.permissions],
  };
  drawerVisible.value = true;
}

function saveRole() {
  const name = roleForm.value.name.trim();
  const note = roleForm.value.note.trim();

  if (!name || roleForm.value.permissions.length === 0) {
    ElMessage.warning('请填写角色名称并选择权限组');
    return;
  }

  const duplicated = roleData.value.some(
    (item) => item.id !== editingRoleId.value && item.name === name,
  );

  if (duplicated) {
    ElMessage.warning('角色名称已存在');
    return;
  }

  if (editingRoleId.value) {
    roleData.value = roleData.value.map((item) =>
      item.id === editingRoleId.value
        ? { ...item, name, note, permissions: [...roleForm.value.permissions] }
        : item,
    );
    ElMessage.success(`已更新角色：${name}`);
  } else {
    roleData.value.unshift({
      id: `role-${Date.now()}`,
      name,
      note,
      permissions: [...roleForm.value.permissions],
    });
    ElMessage.success(`已新增角色：${name}`);
  }

  drawerVisible.value = false;
}

async function removeRole(row: RoleRecord) {
  try {
    await ElMessageBox.confirm(
      '删除后，已授权账号将不再引用该角色。',
      '删除角色',
      {
        cancelButtonText: '取消',
        center: true,
        confirmButtonText: '确认删除',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  roleData.value = roleData.value.filter((item) => item.id !== row.id);
  ElMessage.success(`已删除角色：${row.name}`);
}
</script>

<template>
  <Page :title="pageTitle">
    <div class="settings-page">
      <div class="filter-panel">
        <ElInput
          v-model="keyword"
          class="search-input"
          clearable
          placeholder="搜索角色名称或说明"
        />
        <ElButton type="primary" @click="openCreateDrawer">新增角色</ElButton>
      </div>

      <ElTable :data="filteredRoles" size="small" stripe>
        <ElTable.TableColumn label="角色名称" prop="name" min-width="160" />
        <ElTable.TableColumn label="说明" prop="note" min-width="220" />
        <ElTable.TableColumn label="权限组" min-width="320">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElTag
                v-for="item in getRoleRow(row).permissions"
                :key="item"
                size="small"
              >
                {{ item }}
              </ElTag>
            </ElSpace>
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="操作" fixed="right" min-width="140">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElButton
                link
                type="primary"
                @click="openEditDrawer(getRoleRow(row))"
              >
                编辑
              </ElButton>
              <ElButton link type="danger" @click="removeRole(getRoleRow(row))">
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTable.TableColumn>
      </ElTable>
    </div>

    <ElDrawer v-model="drawerVisible" size="520px" title="维护角色">
      <ElForm :model="roleForm" label-position="top">
        <ElFormItem label="角色名称">
          <ElInput
            v-model="roleForm.name"
            clearable
            placeholder="请输入角色名称"
          />
        </ElFormItem>
        <ElFormItem label="角色说明">
          <ElInput
            v-model="roleForm.note"
            clearable
            placeholder="请输入角色说明"
          />
        </ElFormItem>
        <ElFormItem label="权限组">
          <ElSelect
            v-model="roleForm.permissions"
            multiple
            placeholder="请选择权限组"
          >
            <ElOption
              v-for="item in permissionOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveRole">保存</ElButton>
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
