import { useMoneyStore } from '../stores/moneyStore'

// 测试用例
describe('Money Store Tests', () => {
  let moneyStore

  beforeEach(async () => {
    moneyStore = useMoneyStore()
    await moneyStore.init()
  })

  // 测试 1: 验证结余结转不计收入
  test('结余结转不计收入', async () => {
    // 清理现有数据
    moneyStore.transactions = []
    
    // 添加上个月的交易
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthYear = lastMonth.getFullYear()
    const lastMonthNum = lastMonth.getMonth() + 1
    
    await moneyStore.addTransaction({
      date: `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-10`,
      amount: 5000,
      type: 'income',
      categoryId: null,
      note: '工资'
    })
    
    await moneyStore.addTransaction({
      date: `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-15`,
      amount: 2000,
      type: 'expense',
      categoryId: 'cat_1',
      note: '餐饮'
    })
    
    // 计算上个月的结余
    const lastMonthSummary = moneyStore.calculateMonthSummary(lastMonthYear, lastMonthNum)
    const lastMonthBalance = lastMonthSummary.balance // 应该是 3000
    
    // 检查当月的期初余额
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentMonthSummary = moneyStore.calculateMonthSummary(currentYear, currentMonth)
    
    // 验证当月的期初余额等于上个月的结余
    expect(currentMonthSummary.openingBalance).toBe(lastMonthBalance)
    // 验证当月的收入不包含结转金额
    expect(currentMonthSummary.totalIncome).toBe(0) // 当月还没有收入
  })

  // 测试 2: 验证修改上月后续月份自动更新
  test('修改上月后续月份自动更新', async () => {
    // 清理现有数据
    moneyStore.transactions = []
    
    // 添加上个月的交易
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthYear = lastMonth.getFullYear()
    const lastMonthNum = lastMonth.getMonth() + 1
    
    await moneyStore.addTransaction({
      id: 'test_tx_1',
      date: `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-10`,
      amount: 5000,
      type: 'income',
      categoryId: null,
      note: '工资'
    })
    
    // 添加当月的交易
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    await moneyStore.addTransaction({
      date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-10`,
      amount: 1000,
      type: 'expense',
      categoryId: 'cat_1',
      note: '餐饮'
    })
    
    // 获取当前月份的期初余额
    const initialCurrentMonthSummary = moneyStore.calculateMonthSummary(currentYear, currentMonth)
    const initialOpeningBalance = initialCurrentMonthSummary.openingBalance
    
    // 修改上个月的交易
    await moneyStore.updateTransaction({
      id: 'test_tx_1',
      date: `${lastMonthYear}-${lastMonthNum.toString().padStart(2, '0')}-10`,
      amount: 6000, // 从 5000 改为 6000
      type: 'income',
      categoryId: null,
      note: '工资'
    })
    
    // 获取更新后的当前月份期初余额
    const updatedCurrentMonthSummary = moneyStore.calculateMonthSummary(currentYear, currentMonth)
    const updatedOpeningBalance = updatedCurrentMonthSummary.openingBalance
    
    // 验证期初余额已更新
    expect(updatedOpeningBalance).toBe(initialOpeningBalance + 1000) // 增加了 1000
  })

  // 测试 3: 验证支出类型自定义
  test('支出类型自定义', async () => {
    // 记录初始类型数量
    const initialCategoryCount = moneyStore.categories.length
    
    // 添加新类型
    await moneyStore.addCategory({
      name: '测试类型'
    })
    
    // 验证类型已添加
    expect(moneyStore.categories.length).toBe(initialCategoryCount + 1)
    const newCategory = moneyStore.categories.find(c => c.name === '测试类型')
    expect(newCategory).toBeTruthy()
    expect(newCategory.deletable).toBe(true)
    
    // 编辑类型
    await moneyStore.updateCategory({
      ...newCategory,
      name: '修改后的测试类型'
    })
    
    // 验证类型已更新
    const updatedCategory = moneyStore.categories.find(c => c.id === newCategory.id)
    expect(updatedCategory.name).toBe('修改后的测试类型')
    
    // 删除类型
    await moneyStore.deleteCategory(newCategory.id)
    
    // 验证类型已删除
    expect(moneyStore.categories.find(c => c.id === newCategory.id)).toBeFalsy()
    expect(moneyStore.categories.length).toBe(initialCategoryCount)
  })

  // 测试 4: 验证月度结余计算
  test('月度结余计算', async () => {
    // 清理现有数据
    moneyStore.transactions = []
    
    // 添加当月的交易
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    await moneyStore.addTransaction({
      date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-10`,
      amount: 5000,
      type: 'income',
      categoryId: null,
      note: '工资'
    })
    
    await moneyStore.addTransaction({
      date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
      amount: 2000,
      type: 'expense',
      categoryId: 'cat_1',
      note: '餐饮'
    })
    
    await moneyStore.addTransaction({
      date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`,
      amount: 1000,
      type: 'expense',
      categoryId: 'cat_2',
      note: '交通'
    })
    
    // 获取月度汇总
    const monthSummary = moneyStore.calculateMonthSummary(currentYear, currentMonth)
    
    // 验证计算结果
    expect(monthSummary.totalIncome).toBe(5000)
    expect(monthSummary.totalExpense).toBe(3000)
    expect(monthSummary.balance).toBe(2000) // 5000 - 3000
    expect(monthSummary.openingBalance).toBe(0) // 期初余额为 0
    expect(monthSummary.closingBalance).toBe(2000) // 0 + 2000
  })
})
