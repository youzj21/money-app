<template>
  <div class="category-management">
    <header class="modal-header">
      <h2>支出类型管理</h2>
      <button class="btn btn-close" @click="$emit('close')">&times;</button>
    </header>

    <div class="modal-content">
      <!-- 类型列表 -->
      <div class="card">
        <h3>所有支出类型</h3>
        <ul v-if="categories.length > 0">
          <li v-for="category in categories" :key="category.id" class="category-item">
            <span class="category-name">{{ category.name }}</span>
            <div class="category-actions">
              <button class="btn btn-sm" @click="editCategory(category)">
                编辑
              </button>
              <button 
                class="btn btn-sm btn-danger" 
                @click="deleteCategory(category)"
                :disabled="!category.deletable"
              >
                删除
              </button>
            </div>
          </li>
        </ul>
        <div v-else class="empty">
          暂无支出类型
        </div>
      </div>

      <!-- 新增类型 -->
      <div class="card">
        <h3>新增支出类型</h3>
        <form @submit.prevent="addCategory">
          <input 
            type="text" 
            v-model="newCategoryName" 
            placeholder="请输入类型名称" 
            required
          />
          <button type="submit" class="btn btn-primary">
            添加
          </button>
        </form>
      </div>

      <!-- 编辑类型弹窗 -->
      <div v-if="editingCategory" class="modal-overlay">
        <div class="modal-dialog">
          <h3>编辑支出类型</h3>
          <form @submit.prevent="updateCategory">
            <input 
              type="text" 
              v-model="editingCategory.name" 
              placeholder="请输入类型名称" 
              required
            />
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="editingCategory = null">
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMoneyStore } from '../stores/moneyStore'

const emit = defineEmits(['close'])

const moneyStore = useMoneyStore()

// 支出类型
const categories = computed(() => moneyStore.categories)

// 新增类型名称
const newCategoryName = ref('')

// 编辑中的类型
const editingCategory = ref(null)

// 添加类型
const addCategory = async () => {
  if (newCategoryName.value.trim()) {
    await moneyStore.addCategory({
      name: newCategoryName.value.trim()
    })
    newCategoryName.value = ''
  }
}

// 编辑类型
const editCategory = (category) => {
  editingCategory.value = { ...category }
}

// 更新类型
const updateCategory = async () => {
  if (editingCategory.value) {
    await moneyStore.updateCategory(editingCategory.value)
    editingCategory.value = null
  }
}

// 删除类型
const deleteCategory = async (category) => {
  if (!category.deletable) {
    alert('系统默认类型不可删除')
    return
  }

  if (confirm('确定要删除这个支出类型吗？\n删除后，使用该类型的交易将被标记为未知类型。')) {
    await moneyStore.deleteCategory(category.id)
  }
}
</script>

<style scoped>
.category-management {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.category-item:last-child {
  border-bottom: none;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.modal-dialog {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
}

.modal-dialog .form-actions {
  margin-top: 2rem;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn-danger:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>