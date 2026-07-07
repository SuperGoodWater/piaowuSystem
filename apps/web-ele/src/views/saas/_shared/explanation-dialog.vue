<script lang="ts" setup>
import { ElButton, ElDialog, ElTag } from 'element-plus';

defineOptions({ name: 'SaaSExplanationDialog' });

defineProps<{
  title: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

function closeDialog() {
  emit('update:visible', false);
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="`${title}说明`"
    width="760px"
    @update:model-value="(value) => emit('update:visible', value)"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="text-base font-medium">{{ title }}</span>
        <ElTag type="info">查看说明</ElTag>
      </div>
      <div class="max-h-[65vh] overflow-y-auto pr-1">
        <slot></slot>
      </div>
    </div>

    <template #footer>
      <ElButton type="primary" @click="closeDialog">我知道了</ElButton>
    </template>
  </ElDialog>
</template>
