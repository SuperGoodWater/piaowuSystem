<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

type StoreStatus = '停用' | '筹备中' | '营业中';
type StoreType = '加盟门店' | '游客中心' | '直营网点';

interface CurrentStoreProfile {
  address: string;
  adminPhone: string;
  businessHours: string;
  contactName: string;
  description: string;
  id: string;
  name: string;
  shortName: string;
  status: StoreStatus;
  type: StoreType;
}

const storeTypeOptions = [
  { label: '直营网点', value: '直营网点' },
  { label: '加盟门店', value: '加盟门店' },
  { label: '游客中心', value: '游客中心' },
] as const;

const storeStatusOptions = [
  { label: '营业中', value: '营业中' },
  { label: '筹备中', value: '筹备中' },
  { label: '停用', value: '停用' },
] as const;

const route = useRoute();
const explanationVisible = ref(false);
const originalStore = ref<CurrentStoreProfile>({
  address: '上海市浦东新区欢乐谷东入口游客服务中心',
  adminPhone: '13800010001',
  businessHours: '09:00-21:00',
  contactName: '张楠',
  description: '负责景区东区入口售票、游客咨询和零售联动服务。',
  id: 'STORE-10001',
  name: '欢乐谷东区店',
  shortName: '东区店',
  status: '营业中',
  type: '直营网点',
});
const storeForm = ref<CurrentStoreProfile>({ ...originalStore.value });

const pageTitle = computed(() => String(route.meta.title ?? '门店设置'));
const pagePriority = computed(() => String(route.meta.priority ?? 'P1'));

function getStatusTagType(status: StoreStatus) {
  if (status === '营业中') return 'success';
  if (status === '筹备中') return 'warning';
  return 'info';
}

function resetStoreForm() {
  storeForm.value = { ...originalStore.value };
}

function saveStoreProfile() {
  const name = storeForm.value.name.trim();
  const adminPhone = storeForm.value.adminPhone.trim();
  const address = storeForm.value.address.trim();

  if (!name || !adminPhone || !address) {
    ElMessage.warning('请先完善门店名称、管理员电话和门店地址');
    return;
  }

  originalStore.value = {
    ...storeForm.value,
    address,
    adminPhone,
    businessHours: storeForm.value.businessHours.trim(),
    contactName: storeForm.value.contactName.trim(),
    description: storeForm.value.description.trim(),
    name,
    shortName: storeForm.value.shortName.trim(),
  };
  storeForm.value = { ...originalStore.value };
  ElMessage.success('已保存当前门店资料');
}
</script>

<template>
  <Page :title="pageTitle">
    <template #title>
      <div class="mb-2 flex items-center gap-3">
        <div class="text-lg font-semibold">
          {{ pageTitle }}
        </div>
        <ElButton link type="primary" @click="explanationVisible = true">
          查看说明
        </ElButton>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div class="rounded-md bg-card p-3">
        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="门店ID">
            {{ originalStore.id }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前门店">
            {{ originalStore.name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="门店状态">
            <ElTag :type="getStatusTagType(originalStore.status)">
              {{ originalStore.status }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <div class="rounded-md bg-card p-3">
        <ElForm
          class="store-settings-form"
          :model="storeForm"
          label-position="top"
          @submit.prevent="saveStoreProfile"
        >
          <div class="store-settings-grid">
            <ElFormItem label="门店ID">
              <ElInput v-model="storeForm.id" disabled />
            </ElFormItem>

            <ElFormItem label="门店名称" required>
              <ElInput
                v-model="storeForm.name"
                clearable
                placeholder="请输入门店名称"
              />
            </ElFormItem>

            <ElFormItem label="门店简称">
              <ElInput
                v-model="storeForm.shortName"
                clearable
                placeholder="请输入门店简称"
              />
            </ElFormItem>

            <ElFormItem label="门店类型">
              <ElSelect v-model="storeForm.type" placeholder="请选择门店类型">
                <ElOption
                  v-for="option in storeTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="联系人">
              <ElInput
                v-model="storeForm.contactName"
                clearable
                placeholder="请输入联系人"
              />
            </ElFormItem>

            <ElFormItem label="管理员电话" required>
              <ElInput
                v-model="storeForm.adminPhone"
                clearable
                placeholder="请输入管理员电话"
              />
            </ElFormItem>

            <ElFormItem label="营业时间">
              <ElInput
                v-model="storeForm.businessHours"
                clearable
                placeholder="例如 09:00-21:00"
              />
            </ElFormItem>

            <ElFormItem label="门店状态">
              <ElSelect v-model="storeForm.status" placeholder="请选择门店状态">
                <ElOption
                  v-for="option in storeStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
          </div>

          <ElFormItem label="门店地址" required>
            <ElInput
              v-model="storeForm.address"
              clearable
              placeholder="请输入门店地址"
            />
          </ElFormItem>

          <ElFormItem label="门店介绍">
            <ElInput
              v-model="storeForm.description"
              :autosize="{ minRows: 4, maxRows: 8 }"
              placeholder="请输入门店介绍"
              type="textarea"
            />
          </ElFormItem>

          <div class="flex justify-end gap-3">
            <ElButton @click="resetStoreForm">重置</ElButton>
            <ElButton type="primary" native-type="submit">保存</ElButton>
          </div>
        </ElForm>
      </div>
    </div>

    <ElDialog
      v-model="explanationVisible"
      :title="`${pageTitle}说明`"
      width="720px"
    >
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="优先级">
          <ElTag :type="pagePriority === 'P0' ? 'danger' : 'warning'">
            {{ pagePriority }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="页面目标">
          维护当前门店的基础资料、联系方式、地址、营业时间和营业状态。
        </ElDescriptionsItem>
        <ElDescriptionsItem label="页面边界">
          当前页面只维护当前登录门店资料，不用于管理集团下属门店列表。
        </ElDescriptionsItem>
        <ElDescriptionsItem label="必填字段">
          门店名称、管理员电话、门店地址。
        </ElDescriptionsItem>
      </ElDescriptions>

      <template #footer>
        <ElButton type="primary" @click="explanationVisible = false">
          我知道了
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
.store-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
</style>
