import Dexie from 'dexie'

export class MoneyDatabase extends Dexie {
  constructor() {
    super('MoneyDatabase')
    
    // 定义数据库架构
    this.version(1).stores({
      transactions: 'id, date, amount, type, categoryId, note',
      categories: 'id, name, sortOrder, deletable'
    })
    
    // 定义表
    this.transactions = this.table('transactions')
    this.categories = this.table('categories')
  }
}
