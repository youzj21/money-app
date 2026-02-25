<template>
  <div class="app">
    <header class="header">
      <h1>极简记账</h1>
    </header>
    <main class="main">
      <MonthView v-if="currentView === 'month'" />
      <AddTransaction v-else-if="currentView === 'add'" :editingTransaction="editingTransaction" @close="closeAddTransaction" />
      <CategoryManagement v-else-if="currentView === 'categories'" @close="currentView = 'month'" />
    </main>
    <footer class="footer">
      <button class="btn btn-primary" @click="currentView = 'add'">
        + 记一笔
      </button>
      <button class="btn btn-secondary" @click="currentView = 'categories'">
        支出类型
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MonthView from './components/MonthView.vue'
import AddTransaction from './components/AddTransaction.vue'
import CategoryManagement from './components/CategoryManagement.vue'

const currentView = ref('month')
const editingTransaction = ref(null)

const closeAddTransaction = () => {
  currentView.value = 'month'
  editingTransaction.value = null
}

const editTransaction = (transaction) => {
  editingTransaction.value = transaction
  currentView.value = 'add'
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 600px;
  margin: 0 auto;
  background-color: #f5f5f5;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.main {
  flex: 1;
  padding: 1rem;
}

.footer {
  background-color: white;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}
</style>