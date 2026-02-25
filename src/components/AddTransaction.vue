<template>
  <div class="add-transaction">
    <header class="modal-header">
      <h2>{{ editingTransaction ? '编辑交易' : '记一笔' }}</h2>
      <button class="btn btn-close" @click="$emit('close')">&times;</button>
    </header>
    
    <div class="modal-content">
      <!-- 交易类型选择 -->
      <div class="type-selector">
        <button 
          :class="['btn', type === 'income' ? 'btn-primary' : 'btn-secondary']"
          @click="type = 'income'"
        >
          收入
        </button>
        <button 
          :class="['btn', type === 'expense' ? 'btn-primary' : 'btn-secondary']"
          @click="type = 'expense'"
        >
          支出
        </button>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="saveTransaction">
        <!-- 金额 -->
        <div class="form-group">
          <label for="amount">金额</label>
          <input 
            type="number" 
            id="amount" 
            v-model.number="form.amount" 
            placeholder="请输入金额" 
            step="0.01" 
            min="0" 
            required
          />
        </div>

        <!-- 日期 -->
        <div class="form-group">
          <label for="date">日期</label>
          <input 
            type="date" 
            id="date" 
            v-model="form.date" 
            required
          />
        </div>

        <!-- 类型（支出必选） -->
        <div class="form-group" v-if="type === 'expense'">
          <label for="category">类型</label>
          <select 
            id="category" 
            v-model="form.categoryId" 
            required
          >
            <option value="">请选择支出类型</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- 备注 -->
        <div class="form-group">
          <label for="note">备注（可选）</label>
          <textarea 
            id="note" 
            v-model="form.note" 
            placeholder="请输入备注"
            rows="3"
          ></textarea>
        </div>

        <!-- 按钮组 -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button type="submit" class="btn btn-primary">
            {{ editingTransaction ? '更新' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMoneyStore } from '../stores/moneyStore'

const props = defineProps({
  editingTransaction: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const moneyStore = useMoneyStore()

// 交易类型
const type = ref('expense')

// 表单数据
const form = ref({
  amount: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
  note: ''
})

// 支出类型
const categories = computed(() => moneyStore.categories)

// 初始化
onMounted(() => {
  if (props.editingTransaction) {
    // 编辑模式
    const transaction = props.editingTransaction
    type.value = transaction.type
    form.value = {
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId || '',
      note: transaction.note || ''
    }
  }
})

// 保存交易
const saveTransaction = async () => {
  try {
    if (props.editingTransaction) {
      // 更新交易
      await moneyStore.updateTransaction({
        id: props.editingTransaction.id,
        amount: form.value.amount,
        date: form.value.date,
        type: type.value,
        categoryId: type.value === 'expense' ? form.value.categoryId : null,
        note: form.value.note
      })
    } else {
      // 新增交易
      await moneyStore.addTransaction({
        amount: form.value.amount,
        date: form.value.date,
        type: type.value,
        categoryId: type.value === 'expense' ? form.value.categoryId : null,
        note: form.value.note
      })
    }
    emit('close')
  } catch (error) {
    alert('保存失败，请重试')
    console.error('Save transaction error:', error)
  }
}
</script>

<style scoped>
.add-transaction {
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.type-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-selector .btn {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions .btn {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
}
</style>