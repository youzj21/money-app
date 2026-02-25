# 关键计算/级联更新算法

## 1. 按月聚合收入/支出

### 算法描述
根据交易记录，按月分组计算总收入和总支出。

### 伪代码
```javascript
function calculateMonthlyTotals(transactions, year, month) {
  // 过滤出指定月份的交易
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === year && tDate.getMonth() === month - 1;
  });
  
  // 计算收入总额
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // 计算支出总额
  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // 计算本月结余
  const balance = totalIncome - totalExpense;
  
  return {
    totalIncome,
    totalExpense,
    balance
  };
}
```

## 2. 计算期初积蓄与期末积蓄

### 算法描述
从最早的月份开始，依次计算每个月的期初积蓄和期末积蓄。

### 伪代码
```javascript
function calculateMonthlySummary(transactions, year, month) {
  // 1. 获取所有交易并按日期排序
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // 2. 找到最早的交易月份
  let earliestMonth = null;
  if (sortedTransactions.length > 0) {
    const firstDate = new Date(sortedTransactions[0].date);
    earliestMonth = {
      year: firstDate.getFullYear(),
      month: firstDate.getMonth() + 1
    };
  } else {
    // 如果没有交易，返回默认值
    return {
      openingBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      closingBalance: 0
    };
  }
  
  // 3. 从最早月份开始逐月计算
  let currentYear = earliestMonth.year;
  let currentMonth = earliestMonth.month;
  let previousClosingBalance = 0;
  let targetSummary = null;
  
  // 循环直到计算到目标月份
  while (true) {
    // 计算当月收支
    const monthlyTotals = calculateMonthlyTotals(
      sortedTransactions, 
      currentYear, 
      currentMonth
    );
    
    // 计算当月期初和期末积蓄
    const openingBalance = previousClosingBalance;
    const closingBalance = openingBalance + monthlyTotals.balance;
    
    // 检查是否是目标月份
    if (currentYear === year && currentMonth === month) {
      targetSummary = {
        openingBalance,
        ...monthlyTotals,
        closingBalance
      };
      break;
    }
    
    // 移动到下一个月
    previousClosingBalance = closingBalance;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    
    // 防止无限循环
    if (currentYear > year + 1) {
      break;
    }
  }
  
  return targetSummary || {
    openingBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    closingBalance: 0
  };
}
```

## 3. 级联更新算法

### 算法描述
当修改历史交易时，需要从修改月份开始，重新计算后续所有月份的期初和期末积蓄。

### 伪代码
```javascript
function updateCascade(transactions, modifiedTransaction) {
  // 1. 获取修改交易的月份
  const modifiedDate = new Date(modifiedTransaction.date);
  const modifiedYear = modifiedDate.getFullYear();
  const modifiedMonth = modifiedDate.getMonth() + 1;
  
  // 2. 获取所有交易并按日期排序
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // 3. 找到最早的交易月份
  let earliestMonth = null;
  if (sortedTransactions.length > 0) {
    const firstDate = new Date(sortedTransactions[0].date);
    earliestMonth = {
      year: firstDate.getFullYear(),
      month: firstDate.getMonth() + 1
    };
  } else {
    return [];
  }
  
  // 4. 从最早月份开始重新计算所有月份的汇总
  let currentYear = earliestMonth.year;
  let currentMonth = earliestMonth.month;
  let previousClosingBalance = 0;
  const allSummaries = [];
  
  // 计算到当前月份的下一个月
  const currentDate = new Date();
  const maxYear = currentDate.getFullYear() + 1;
  const maxMonth = currentDate.getMonth() + 2;
  
  while (currentYear < maxYear || (currentYear === maxYear && currentMonth <= maxMonth)) {
    // 计算当月收支
    const monthlyTotals = calculateMonthlyTotals(
      sortedTransactions, 
      currentYear, 
      currentMonth
    );
    
    // 计算当月期初和期末积蓄
    const openingBalance = previousClosingBalance;
    const closingBalance = openingBalance + monthlyTotals.balance;
    
    // 保存当月汇总
    allSummaries.push({
      year: currentYear,
      month: currentMonth,
      openingBalance,
      ...monthlyTotals,
      closingBalance
    });
    
    // 移动到下一个月
    previousClosingBalance = closingBalance;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  // 5. 返回从修改月份开始的所有汇总
  return allSummaries.filter(summary => {
    if (summary.year > modifiedYear) return true;
    if (summary.year === modifiedYear && summary.month >= modifiedMonth) return true;
    return false;
  });
}
```

## 4. 支出类型占比计算

### 算法描述
计算每个支出类型的金额和占总支出的百分比。

### 伪代码
```javascript
function calculateExpenseCategories(transactions, year, month) {
  // 1. 过滤出指定月份的支出交易
  const expenseTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === year && 
           tDate.getMonth() === month - 1 && 
           t.type === 'expense';
  });
  
  // 2. 按类别分组计算
  const categoryMap = {};
  let totalExpense = 0;
  
  expenseTransactions.forEach(t => {
    const categoryId = t.categoryId;
    if (!categoryMap[categoryId]) {
      categoryMap[categoryId] = 0;
    }
    categoryMap[categoryId] += t.amount;
    totalExpense += t.amount;
  });
  
  // 3. 转换为数组并计算占比
  const categories = Object.entries(categoryMap).map(([categoryId, amount]) => ({
    categoryId,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : '0.0'
  }));
  
  // 4. 按金额降序排序
  categories.sort((a, b) => b.amount - a.amount);
  
  return {
    categories,
    totalExpense
  };
}
```

## 5. 月份切换逻辑

### 算法描述
处理月份的前后切换，确保正确计算每个月的数据。

### 伪代码
```javascript
function getPreviousMonth(year, month) {
  let prevMonth = month - 1;
  let prevYear = year;
  
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }
  
  return { year: prevYear, month: prevMonth };
}

function getNextMonth(year, month) {
  let nextMonth = month + 1;
  let nextYear = year;
  
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  
  return { year: nextYear, month: nextMonth };
}

function getCurrentMonth() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}
```

## 6. 数据导出算法

### 算法描述
将交易数据导出为 CSV 或 JSON 格式。

### 伪代码
```javascript
function exportToCSV(transactions, categories) {
  // 1. 构建 CSV 头部
  const headers = ['ID', 'Date', 'Amount', 'Type', 'Category', 'Note'];
  
  // 2. 构建 CSV 行
  const rows = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId);
    return [
      t.id,
      t.date,
      t.amount,
      t.type === 'income' ? 'Income' : 'Expense',
      category ? category.name : '',
      t.note || ''
    ];
  });
  
  // 3. 组合成 CSV 字符串
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // 4. 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJSON(transactions, categories) {
  // 1. 丰富交易数据，包含类别名称
  const enrichedTransactions = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId);
    return {
      ...t,
      categoryName: category ? category.name : null
    };
  });
  
  // 2. 构建导出数据
  const exportData = {
    transactions: enrichedTransactions,
    categories,
    exportDate: new Date().toISOString()
  };
  
  // 3. 创建下载链接
  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)], 
    { type: 'application/json;charset=utf-8;' }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

## 7. 初始化默认数据

### 算法描述
初始化系统默认的支出类型。

### 伪代码
```javascript
function initializeDefaultCategories() {
  return [
    { id: 'cat_1', name: '餐饮', sortOrder: 1, deletable: false },
    { id: 'cat_2', name: '交通', sortOrder: 2, deletable: false },
    { id: 'cat_3', name: '房租', sortOrder: 3, deletable: false },
    { id: 'cat_4', name: '娱乐', sortOrder: 4, deletable: false },
    { id: 'cat_5', name: '学习', sortOrder: 5, deletable: false }
  ];
}

function initializeSampleData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // 生成上个月的数据
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }
  
  return {
    transactions: [
      // 上个月的数据
      {
        id: 'tx_1',
        date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-10`,
        amount: 5000,
        type: 'income',
        categoryId: null,
        note: '工资'
      },
      {
        id: 'tx_2',
        date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-15`,
        amount: 1000,
        type: 'expense',
        categoryId: 'cat_1',
        note: '餐饮'
      },
      {
        id: 'tx_3',
        date: `${prevYear}-${prevMonth.toString().padStart(2, '0')}-20`,
        amount: 1500,
        type: 'expense',
        categoryId: 'cat_3',
        note: '房租'
      },
      // 当月的数据
      {
        id: 'tx_4',
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-10`,
        amount: 6000,
        type: 'income',
        categoryId: null,
        note: '工资'
      },
      {
        id: 'tx_5',
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
        amount: 1200,
        type: 'expense',
        categoryId: 'cat_1',
        note: '餐饮'
      },
      {
        id: 'tx_6',
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-18`,
        amount: 800,
        type: 'expense',
        categoryId: 'cat_4',
        note: '娱乐'
      }
    ],
    categories: initializeDefaultCategories()
  };
}
```