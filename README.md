# 极简记账APP

一个极简风格的记账应用，专注于记录每月的积蓄变化。

## 功能特性

- **月度汇总**：显示本月期初积蓄、本月收入、本月支出、本月结余、本月期末积蓄
- **支出类型管理**：支持新增、编辑、删除支出类型
- **交易记录**：支持添加、编辑、删除收入和支出交易
- **月份切换**：可查看不同月份的账务数据
- **数据存储**：使用 IndexedDB 本地存储，安全可靠
- **数据导出**：支持导出为 CSV 和 JSON 格式

## 技术栈

- **前端框架**：Vue 3
- **状态管理**：Pinia
- **本地存储**：IndexedDB (Dexie.js)
- **构建工具**：Vite

## 项目结构

```
├── src/
│   ├── components/         # 组件
│   │   ├── MonthView.vue       # 首页/月视图
│   │   ├── AddTransaction.vue  # 记一笔
│   │   └── CategoryManagement.vue  # 支出类型管理
│   ├── stores/             # 状态管理
│   │   └── moneyStore.js   # 核心数据管理
│   ├── tests/              # 测试用例
│   │   └── moneyStore.test.js  # 核心功能测试
│   ├── App.vue             # 应用入口
│   ├── database.js         # 数据库配置
│   ├── main.js             # 主文件
│   └── style.css           # 全局样式
├── index.html              # HTML 模板
├── package.json            # 项目配置
└── vite.config.js          # Vite 配置
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 核心账务规则

1. **月度独立**：每个月独立显示本月数据
2. **自动结转**：上个月结余自动结转为下个月的期初积蓄
3. **结转规则**：结转金额不计入下个月的收入，只作为期初余额
4. **结余计算**：本月结余 = 本月收入 - 本月支出
5. **期末积蓄**：本月期末积蓄 = 本月期初积蓄 + 本月结余
6. **级联更新**：修改历史月份的交易后，自动更新后续月份的期初和期末积蓄

## 测试用例

- **测试 1**：验证结余结转不计收入
- **测试 2**：验证修改上月后续月份自动更新
- **测试 3**：验证支出类型自定义功能

## 数据结构

### 交易记录 (Transaction)
- id: 唯一标识符
- date: 交易日期
- amount: 交易金额
- type: 交易类型 (income | expense)
- categoryId: 支出类别ID
- note: 备注

### 支出类型 (Category)
- id: 唯一标识符
- name: 类型名称
- sortOrder: 排序顺序
- deletable: 是否可删除

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 许可证

MIT
