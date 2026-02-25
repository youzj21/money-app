import { defineStore } from 'pinia'
import { MoneyDatabase } from '../database'

// 生成唯一ID
const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 初始化默认支出类型
const defaultCategories = [
  { id: 'cat_1', name: '餐饮', sortOrder: 1, deletable: false },
  { id: 'cat_2', name: '交通', sortOrder: 2, deletable: false },
  { id: 'cat_3', name: '房租', sortOrder: 3, deletable: false },
  { id: 'cat_4', name: '娱乐', sortOrder: 4, deletable: false },
  { id: 'cat_5', name: '学习', sortOrder: 5, deletable: false }
]

export const useMoneyStore = defineStore('money', {
  state: () => ({
    db: null,
    transactions: [],
    categories: [],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentMonthSummary: {
      openingBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      closingBalance: 0
    },
    expenseCategories: [],
    currentMonthTransactions: []
  }),

  actions: {
    // 初始化数据库
    async init() {
      this.db = new MoneyDatabase()
      await this.loadData()
    },

    // 加载数据
    async loadData() {
      // 加载支出类型
      this.categories = await this.db.categories.toArray()
      
      // 如果没有类型，添加默认类型
      if (this.categories.length === 0) {
        await this.db.categories.bulkAdd(defaultCategories)
        this.categories = defaultCategories
      }

      // 加载交易记录
      this.transactions = await this.db.transactions.toArray()
      
      // 初始化示例数据
      if (this.transactions.length === 0) {
        await this.initSampleData()
      }

      // 更新当前月份数据
      this.updateMonthData()
    },

    // 初始化示例数据
    async initSampleData() {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      // 上个月
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

      const sampleTransactions = [
        // 上个月的数据
        {
          id: generateId(),
          date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-10`,
          amount: 5000,
          type: 'income',
          categoryId: null,
          note: '工资'
        },
        {
          id: generateId(),
          date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-15`,
          amount: 1000,
          type: 'expense',
          categoryId: 'cat_1',
          note: '餐饮'
        },
        {
          id: generateId(),
          date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-20`,
          amount: 1500,
          type: 'expense',
          categoryId: 'cat_3',
          note: '房租'
        },
        // 当月的数据
        {
          id: generateId(),
          date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-10`,
          amount: 6000,
          type: 'income',
          categoryId: null,
          note: '工资'
        },
        {
          id: generateId(),
          date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
          amount: 1200,
          type: 'expense',
          categoryId: 'cat_1',
          note: '餐饮'
        },
        {
          id: generateId(),
          date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-18`,
          amount: 800,
          type: 'expense',
          categoryId: 'cat_4',
          note: '娱乐'
        }
      ]

      await this.db.transactions.bulkAdd(sampleTransactions)
      this.transactions = sampleTransactions
    },

    // 设置当前月份
    setCurrentMonth(year, month) {
      this.currentYear = year
      this.currentMonth = month
      this.updateMonthData()
    },

    // 更新月度数据
    updateMonthData() {
      // 计算当前月份汇总
      this.currentMonthSummary = this.calculateMonthSummary(this.currentYear, this.currentMonth)
      
      // 计算支出类型汇总
      this.expenseCategories = this.calculateExpenseCategories(this.currentYear, this.currentMonth)
      
      // 获取当前月份交易
      this.currentMonthTransactions = this.getMonthTransactions(this.currentYear, this.currentMonth)
    },

    // 计算月度汇总
    calculateMonthSummary(year, month) {
      // 获取所有交易并按日期排序
      const sortedTransactions = [...this.transactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
      
      // 找到最早的交易月份
      let earliestMonth = null
      if (sortedTransactions.length > 0) {
        const firstDate = new Date(sortedTransactions[0].date)
        earliestMonth = {
          year: firstDate.getFullYear(),
          month: firstDate.getMonth() + 1
        }
      } else {
        return {
          openingBalance: 0,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          closingBalance: 0
        }
      }
      
      // 从最早月份开始逐月计算
      let currentYear = earliestMonth.year
      let currentMonth = earliestMonth.month
      let previousClosingBalance = 0
      let targetSummary = null
      
      // 计算到目标月份
      while (true) {
        // 计算当月收支
        const monthlyTotals = this.calculateMonthlyTotals(sortedTransactions, currentYear, currentMonth)
        
        // 计算当月期初和期末积蓄
        const openingBalance = previousClosingBalance
        const closingBalance = openingBalance + monthlyTotals.balance
        
        // 检查是否是目标月份
        if (currentYear === year && currentMonth === month) {
          targetSummary = {
            openingBalance,
            ...monthlyTotals,
            closingBalance
          }
          break
        }
        
        // 移动到下一个月
        previousClosingBalance = closingBalance
        currentMonth++
        if (currentMonth > 12) {
          currentMonth = 1
          currentYear++
        }
        
        // 防止无限循环
        if (currentYear > year + 1) {
          break
        }
      }
      
      return targetSummary || {
        openingBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        closingBalance: 0
      }
    },

    // 计算月度收支
    calculateMonthlyTotals(transactions, year, month) {
      // 过滤出指定月份的交易
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === year && tDate.getMonth() === month - 1
      })
      
      // 计算收入总额
      const totalIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      // 计算支出总额
      const totalExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      
      // 计算本月结余
      const balance = totalIncome - totalExpense
      
      return {
        totalIncome,
        totalExpense,
        balance
      }
    },

    // 计算支出类型汇总
    calculateExpenseCategories(year, month) {
      // 过滤出指定月份的支出交易
      const expenseTransactions = this.transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === year && 
               tDate.getMonth() === month - 1 && 
               t.type === 'expense'
      })
      
      // 按类别分组计算
      const categoryMap = {}
      let totalExpense = 0
      
      expenseTransactions.forEach(t => {
        const categoryId = t.categoryId
        if (!categoryMap[categoryId]) {
          categoryMap[categoryId] = 0
        }
        categoryMap[categoryId] += t.amount
        totalExpense += t.amount
      })
      
      // 转换为数组并计算占比
      const categories = Object.entries(categoryMap).map(([categoryId, amount]) => {
        const category = this.categories.find(c => c.id === categoryId)
        return {
          categoryId,
          categoryName: category ? category.name : '未知',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : '0.0'
        }
      })
      
      // 按金额降序排序
      categories.sort((a, b) => b.amount - a.amount)
      
      return categories
    },

    // 获取月度交易
    getMonthTransactions(year, month) {
      return this.transactions.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === year && tDate.getMonth() === month - 1
      }).sort((a, b) => new Date(b.date) - new Date(a.date))
    },

    // 添加交易
    async addTransaction(transaction) {
      const newTransaction = {
        id: generateId(),
        ...transaction
      }
      
      await this.db.transactions.add(newTransaction)
      this.transactions.push(newTransaction)
      this.updateMonthData()
      
      // 级联更新后续月份
      this.cascadeUpdate(new Date(transaction.date))
    },

    // 更新交易
    async updateTransaction(transaction) {
      await this.db.transactions.put(transaction)
      const index = this.transactions.findIndex(t => t.id === transaction.id)
      if (index !== -1) {
        this.transactions[index] = transaction
      }
      this.updateMonthData()
      
      // 级联更新后续月份
      this.cascadeUpdate(new Date(transaction.date))
    },

    // 删除交易
    async deleteTransaction(transactionId) {
      await this.db.transactions.delete(transactionId)
      this.transactions = this.transactions.filter(t => t.id !== transactionId)
      this.updateMonthData()
      
      // 级联更新后续月份
      this.cascadeUpdate(new Date())
    },

    // 级联更新后续月份
    cascadeUpdate(modifiedDate) {
      const modifiedYear = modifiedDate.getFullYear()
      const modifiedMonth = modifiedDate.getMonth() + 1
      
      // 如果修改的是当前月份或之前的月份，需要更新当前月份数据
      if (modifiedYear < this.currentYear || 
          (modifiedYear === this.currentYear && modifiedMonth <= this.currentMonth)) {
        this.updateMonthData()
      }
    },

    // 添加支出类型
    async addCategory(category) {
      const newCategory = {
        id: generateId(),
        ...category,
        sortOrder: this.categories.length + 1,
        deletable: true
      }
      
      await this.db.categories.add(newCategory)
      this.categories.push(newCategory)
    },

    // 更新支出类型
    async updateCategory(category) {
      await this.db.categories.put(category)
      const index = this.categories.findIndex(c => c.id === category.id)
      if (index !== -1) {
        this.categories[index] = category
      }
    },

    // 删除支出类型
    async deleteCategory(categoryId) {
      await this.db.categories.delete(categoryId)
      this.categories = this.categories.filter(c => c.id !== categoryId)
    },

    // 导出数据
    exportData(format) {
      if (format === 'csv') {
        this.exportToCSV()
      } else if (format === 'json') {
        this.exportToJSON()
      }
    },

    // 导出为CSV
    exportToCSV() {
      // 构建 CSV 头部
      const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Note']
      
      // 构建 CSV 行
      const rows = this.transactions.map(t => {
        const category = this.categories.find(c => c.id === t.categoryId)
        return [
          t.id,
          t.date,
          t.amount,
          t.type === 'income' ? 'Income' : 'Expense',
          category ? category.name : '',
          t.note || ''
        ]
      })
      
      // 组合成 CSV 字符串
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    // 导出为JSON
    exportToJSON() {
      // 丰富交易数据，包含类别名称
      const enrichedTransactions = this.transactions.map(t => {
        const category = this.categories.find(c => c.id === t.categoryId)
        return {
          ...t,
          categoryName: category ? category.name : null
        }
      })
      
      // 构建导出数据
      const exportData = {
        transactions: enrichedTransactions,
        categories: this.categories,
        exportDate: new Date().toISOString()
      }
      
      // 创建下载链接
      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)], 
        { type: 'application/json;charset=utf-8;' }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
})
