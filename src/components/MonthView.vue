<template>
  <div class="month-view">
    <!-- 月份导航 -->
    <div class="month-nav">
      <button class="btn btn-secondary" @click="previousMonth">
        &lt; 上月
      </button>
      <h2>{{ currentYear }}年{{ currentMonth }}月</h2>
      <button class="btn btn-secondary" @click="nextMonth">
        下月 &gt;
      </button>
    </div>

    <!-- 月度汇总卡片 -->
    <div class="card summary-card">
      <div class="summary-item">
        <span class="label">期初积蓄</span>
        <span class="value">¥{{ formatNumber(monthSummary.openingBalance) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">本月收入</span>
        <span class="value income">¥{{ formatNumber(monthSummary.totalIncome) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">本月支出</span>
        <span class="value expense">¥{{ formatNumber(monthSummary.totalExpense) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">本月结余</span>
        <span class="value">{{ monthSummary.balance >= 0 ? '+' : '' }}¥{{ formatNumber(Math.abs(monthSummary.balance)) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">期末积蓄</span>
        <span class="value">{{ monthSummary.closingBalance >= 0 ? '+' : '' }}¥{{ formatNumber(Math.abs(monthSummary.closingBalance)) }}</span>
      </div>
    </div>

    <!-- 支出类型汇总 -->
    <div class="card">
      <h3>支出类型汇总</h3>
      <ul v-if="expenseCategories.length > 0">
        <li v-for="category in expenseCategories" :key="category.categoryId" class="category-item">
          <span class="category-name">{{ getCategoryName(category.categoryId) }}</span>
          <span class="category-amount expense">¥{{ formatNumber(category.amount) }}</span>
          <span class="category-percentage">{{ category.percentage }}%</span>
        </li>
      </ul>
      <div v-else class="empty">
        本月暂无支出
      </div>
    </div>

    <!-- 本月交易记录 -->
    <div class="card">
      <h3>本月交易</h3>
      <ul v-if="monthTransactions.length > 0">
        <li v-for="transaction in monthTransactions" :key="transaction.id" class="transaction-item">
          <div class="transaction-info">
            <span class="transaction-date">{{ transaction.date }}</span>
            <span class="transaction-note">{{ transaction.note || '-' }}</span>
          </div>
          <div class="transaction-amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatNumber(transaction.amount) }}
          </div>
          <div class="transaction-actions">
            <button class="btn btn-sm" @click="editTransaction(transaction)">编辑</button>
            <button class="btn btn-sm btn-danger" @click="deleteTransaction(transaction.id)">删除</button>
          </div>
        </li>
      </ul>
      <div v-else class="empty">
        本月暂无交易
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMoneyStore } from '../stores/moneyStore'

const moneyStore = useMoneyStore()

// 当前月份
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

// 初始化
onMounted(async () => {
  await moneyStore.init()
  updateMonthData()
})

// 监听月份变化
watch([currentYear, currentMonth], () => {
  updateMonthData()
})

// 更新月度数据
const updateMonthData = () => {
  moneyStore.setCurrentMonth(currentYear.value, currentMonth.value)
}

// 计算属性
const monthSummary = computed(() => moneyStore.currentMonthSummary)
const expenseCategories = computed(() => moneyStore.expenseCategories)
const monthTransactions = computed(() => moneyStore.currentMonthTransactions)

// 方法
const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const formatNumber = (number) => {
  return number.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getCategoryName = (categoryId) => {
  if (!categoryId) return '其他'
  const category = moneyStore.categories.find(c => c.id === categoryId)
  return category ? category.name : '未知'
}

const editTransaction = (transaction) => {
  // 触发父组件的编辑方法
  const emit = defineEmits(['edit'])
  emit('edit', transaction)
}

const deleteTransaction = async (transactionId) => {
  if (confirm('确定要删除这笔交易吗？')) {
    await moneyStore.deleteTransaction(transactionId)
    updateMonthData()
  }
}
</script>

<style scoped>
.month-view {
  padding-bottom: 80px;
}

.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.month-nav h2 {
  margin: 0;
  font-size: 1.25rem;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.summary-item .value {
  font-size: 1.1rem;
  font-weight: bold;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-percentage {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.transaction-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.transaction-date {
  color: #7f8c8d;
}

.transaction-amount {
  font-weight: bold;
  font-size: 1.1rem;
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}
</style>