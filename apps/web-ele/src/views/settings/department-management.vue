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

interface DepartmentRecord {
  id: string;
  manager: string;
  name: string;
  parent: string;
  status: '停用' | '启用';
}

const route = useRoute();
const pageTitle = computed(() => String(route.meta.title ?? '部门管理'));
const drawerVisible = ref(false);
const editingDepartmentId = ref('');
const keyword = ref('');
const departmentForm = ref({
  manager: '',
  name: '',
  parent: '集团总部',
  status: '启用' as DepartmentRecord['status'],
});

const departmentData = ref<DepartmentRecord[]>([
  {
    id: 'dept-001',
    manager: '张宁',
    name: '集团总部',
    parent: '-',
    status: '启用',
  },
  {
    id: 'dept-002',
    manager: '李安',
    name: '财务部',
    parent: '集团总部',
    status: '启用',
  },
  {
    id: 'dept-003',
    manager: '王晨',
    name: '运营部',
    parent: '集团总部',
    status: '启用',
  },
]);

const parentOptions = computed(() =>
  departmentData.value.map((item) => ({
    label: item.name,
    value: item.name,
  })),
);
const filteredDepartments = computed(() => {
  const value = keyword.value.trim().toLowerCase();

  if (!value) {
    return departmentData.value;
  }

  return departmentData.value.filter(
    (item) =>
      item.name.toLowerCase().includes(value) ||
      item.manager.toLowerCase().includes(value),
  );
});

function getDepartmentRow(row: Record<string, any>) {
  return row as DepartmentRecord;
}

function resetForm() {
  editingDepartmentId.value = '';
  departmentForm.value = {
    manager: '',
    name: '',
    parent: '集团总部',
    status: '启用',
  };
}

function openCreateDrawer() {
  resetForm();
  drawerVisible.value = true;
}

function openEditDrawer(row: DepartmentRecord) {
  editingDepartmentId.value = row.id;
  departmentForm.value = {
    manager: row.manager,
    name: row.name,
    parent: row.parent === '-' ? '集团总部' : row.parent,
    status: row.status,
  };
  drawerVisible.value = true;
}

function saveDepartment() {
  const name = departmentForm.value.name.trim();
  const manager = departmentForm.value.manager.trim();
  const parent = departmentForm.value.parent.trim();

  if (!name || !manager || !parent) {
    ElMessage.warning('请完整填写部门名称、负责人和上级部门');
    return;
  }

  const duplicated = departmentData.value.some(
    (item) => item.id !== editingDepartmentId.value && item.name === name,
  );

  if (duplicated) {
    ElMessage.warning('部门名称已存在');
    return;
  }

  if (editingDepartmentId.value) {
    departmentData.value = departmentData.value.map((item) =>
      item.id === editingDepartmentId.value
        ? {
            ...item,
            manager,
            name,
            parent,
            status: departmentForm.value.status,
          }
        : item,
    );
    ElMessage.success(`已更新部门：${name}`);
  } else {
    departmentData.value.unshift({
      id: `dept-${Date.now()}`,
      manager,
      name,
      parent,
      status: departmentForm.value.status,
    });
    ElMessage.success(`已新增部门：${name}`);
  }

  drawerVisible.value = false;
}

async function removeDepartment(row: DepartmentRecord) {
  const childCount = departmentData.value.filter(
    (item) => item.parent === row.name,
  ).length;

  if (childCount > 0) {
    ElMessage.warning('当前部门下仍有子部门，不能删除');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '删除后，该部门不再可被账号授权选择。',
      '删除部门',
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

  departmentData.value = departmentData.value.filter(
    (item) => item.id !== row.id,
  );
  ElMessage.success(`已删除部门：${row.name}`);
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
          placeholder="搜索部门名称或负责人"
        />
        <ElButton type="primary" @click="openCreateDrawer">新增部门</ElButton>
      </div>

      <ElTable :data="filteredDepartments" size="small" stripe>
        <ElTable.TableColumn label="部门名称" prop="name" min-width="160" />
        <ElTable.TableColumn label="上级部门" prop="parent" min-width="160" />
        <ElTable.TableColumn label="负责人" prop="manager" min-width="130" />
        <ElTable.TableColumn label="状态" min-width="100">
          <template #default="{ row }">
            <ElTag
              :type="
                getDepartmentRow(row).status === '启用' ? 'success' : 'info'
              "
            >
              {{ getDepartmentRow(row).status }}
            </ElTag>
          </template>
        </ElTable.TableColumn>
        <ElTable.TableColumn label="操作" fixed="right" min-width="140">
          <template #default="{ row }">
            <ElSpace wrap>
              <ElButton
                link
                type="primary"
                @click="openEditDrawer(getDepartmentRow(row))"
              >
                编辑
              </ElButton>
              <ElButton
                link
                type="danger"
                @click="removeDepartment(getDepartmentRow(row))"
              >
                删除
              </ElButton>
            </ElSpace>
          </template>
        </ElTable.TableColumn>
      </ElTable>
    </div>

    <ElDrawer v-model="drawerVisible" size="520px" title="维护部门">
      <ElForm :model="departmentForm" label-position="top">
        <ElFormItem label="部门名称">
          <ElInput
            v-model="departmentForm.name"
            clearable
            placeholder="请输入部门名称"
          />
        </ElFormItem>
        <ElFormItem label="上级部门">
          <ElSelect v-model="departmentForm.parent" filterable>
            <ElOption
              v-for="item in parentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="负责人">
          <ElInput
            v-model="departmentForm.manager"
            clearable
            placeholder="请输入负责人"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="departmentForm.status">
            <ElOption label="启用" value="启用" />
            <ElOption label="停用" value="停用" />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton type="primary" @click="saveDepartment">保存</ElButton>
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
