
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  tool: 'cursor' | 'augmentcode' | 'cline' | 'roocode';
  createdAt: string;
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  conversations: Conversation[];
}

export const mockData = {
  projects: [
    {
      id: '1',
      name: 'React Dashboard 项目',
      description: '企业级管理后台系统开发',
      lastUpdated: '2024-01-15T10:30:00Z',
      conversations: [
        {
          id: '1-1',
          title: '实现用户认证功能',
          tool: 'cursor' as const,
          createdAt: '2024-01-15T09:00:00Z',
          messages: [
            {
              id: '1-1-1',
              role: 'user' as const,
              content: '我需要在React项目中实现JWT认证，包括登录、注册和token刷新机制。',
              timestamp: '2024-01-15T09:00:00Z'
            },
            {
              id: '1-1-2',
              role: 'assistant' as const,
              content: `我来帮你实现一个完整的JWT认证系统。这里是实现方案：

## 1. 安装依赖

\`\`\`bash
npm install axios jwt-decode react-router-dom
npm install -D @types/jwt-decode
\`\`\`

## 2. 创建认证服务

\`\`\`typescript
// src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

class AuthService {
  private tokenKey = 'access_token';
  private refreshKey = 'refresh_token';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(\`\${API_BASE_URL}/auth/login\`, credentials);
    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post(\`\${API_BASE_URL}/auth/register\`, data);
    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshKey, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }
}

export default new AuthService();
\`\`\`

这个实现提供了完整的认证流程，包括token存储和管理。`,
              timestamp: '2024-01-15T09:02:00Z'
            }
          ]
        },
        {
          id: '1-2',
          title: '优化组件性能',
          tool: 'cline' as const,
          createdAt: '2024-01-14T14:20:00Z',
          messages: [
            {
              id: '1-2-1',
              role: 'user' as const,
              content: '我的React组件渲染很慢，特别是包含大量数据的列表。如何优化性能？',
              timestamp: '2024-01-14T14:20:00Z'
            },
            {
              id: '1-2-2',
              role: 'assistant' as const,
              content: `React性能优化是个重要话题！我来提供几个关键的优化策略：

## 1. 使用React.memo防止不必要的重渲染

\`\`\`jsx
import React, { memo } from 'react';

const ListItem = memo(({ item, onDelete }) => {
  return (
    <div className="list-item">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <button onClick={() => onDelete(item.id)}>删除</button>
    </div>
  );
});

export default ListItem;
\`\`\`

## 2. 虚拟滚动处理大列表

对于大量数据，推荐使用虚拟滚动：

\`\`\`jsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
\`\`\`

## 3. 使用useMemo和useCallback

\`\`\`jsx
const ExpensiveComponent = ({ data, onFilter }) => {
  const filteredData = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);

  const handleFilter = useCallback((criteria) => {
    onFilter(criteria);
  }, [onFilter]);

  return (
    <div>
      {filteredData.map(item => (
        <ListItem key={item.id} item={item} onFilter={handleFilter} />
      ))}
    </div>
  );
};
\`\`\`

这些优化能显著提升列表性能！`,
              timestamp: '2024-01-14T14:25:00Z'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Node.js API 开发',
      description: 'RESTful API后端服务开发',
      lastUpdated: '2024-01-12T16:45:00Z',
      conversations: [
        {
          id: '2-1',
          title: 'Express.js路由设计',
          tool: 'augmentcode' as const,
          createdAt: '2024-01-12T15:30:00Z',
          messages: [
            {
              id: '2-1-1',
              role: 'user' as const,
              content: '如何设计一个清晰的Express.js路由结构？我的项目有用户管理、产品管理等多个模块。',
              timestamp: '2024-01-12T15:30:00Z'
            },
            {
              id: '2-1-2',
              role: 'assistant' as const,
              content: `良好的路由设计是API项目的基础！我来为你设计一个模块化的路由结构：

## 1. 项目结构

\`\`\`
src/
├── routes/
│   ├── index.js          # 主路由入口
│   ├── auth.js          # 认证相关路由
│   ├── users.js         # 用户管理路由
│   ├── products.js      # 产品管理路由
│   └── orders.js        # 订单管理路由
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── productController.js
└── middleware/
    ├── auth.js
    └── validation.js
\`\`\`

## 2. 主路由入口 (routes/index.js)

\`\`\`javascript
const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const orderRoutes = require('./orders');

// API版本前缀
const API_PREFIX = '/api/v1';

// 注册路由
router.use(\`\${API_PREFIX}/auth\`, authRoutes);
router.use(\`\${API_PREFIX}/users\`, userRoutes);
router.use(\`\${API_PREFIX}/products\`, productRoutes);
router.use(\`\${API_PREFIX}/orders\`, orderRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
\`\`\`

## 3. 用户路由示例 (routes/users.js)

\`\`\`javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

// GET /api/v1/users - 获取用户列表
router.get('/', authMiddleware, userController.getUsers);

// GET /api/v1/users/:id - 获取特定用户
router.get('/:id', authMiddleware, userController.getUserById);

// POST /api/v1/users - 创建用户
router.post('/', authMiddleware, validateUser, userController.createUser);

// PUT /api/v1/users/:id - 更新用户
router.put('/:id', authMiddleware, validateUser, userController.updateUser);

// DELETE /api/v1/users/:id - 删除用户
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
\`\`\`

这种结构清晰、可维护，便于团队协作！`,
              timestamp: '2024-01-12T15:35:00Z'
            }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Python数据分析',
      description: 'pandas和matplotlib数据可视化',
      lastUpdated: '2024-01-10T11:20:00Z',
      conversations: [
        {
          id: '3-1',
          title: 'pandas数据清洗技巧',
          tool: 'roocode' as const,
          createdAt: '2024-01-10T10:00:00Z',
          messages: [
            {
              id: '3-1-1',
              role: 'user' as const,
              content: '我有一个包含缺失值和重复数据的CSV文件，如何用pandas进行数据清洗？',
              timestamp: '2024-01-10T10:00:00Z'
            },
            {
              id: '3-1-2',
              role: 'assistant' as const,
              content: `数据清洗是数据分析的重要步骤！我来提供一个完整的pandas数据清洗流程：

## 1. 导入必要的库

\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# 设置pandas显示选项
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', 100)
\`\`\`

## 2. 数据加载和初步检查

\`\`\`python
# 读取CSV文件
df = pd.read_csv('your_data.csv')

# 基本信息检查
print("数据形状:", df.shape)
print("\\n数据类型:")
print(df.dtypes)
print("\\n前5行数据:")
print(df.head())

# 检查缺失值
print("\\n缺失值统计:")
print(df.isnull().sum())

# 检查重复值
print(f"\\n重复行数量: {df.duplicated().sum()}")
\`\`\`

## 3. 处理缺失值

\`\`\`python
# 删除完全为空的行和列
df = df.dropna(how='all')  # 删除全为NaN的行
df = df.dropna(axis=1, how='all')  # 删除全为NaN的列

# 针对不同列采用不同策略
# 数值列：用均值或中位数填充
numerical_cols = df.select_dtypes(include=[np.number]).columns
for col in numerical_cols:
    if df[col].isnull().sum() > 0:
        # 使用中位数填充（对异常值更鲁棒）
        df[col].fillna(df[col].median(), inplace=True)

# 分类列：用众数填充
categorical_cols = df.select_dtypes(include=['object']).columns
for col in categorical_cols:
    if df[col].isnull().sum() > 0:
        # 使用众数填充
        mode_value = df[col].mode()
        if len(mode_value) > 0:
            df[col].fillna(mode_value[0], inplace=True)
\`\`\`

## 4. 处理重复数据

\`\`\`python
# 删除重复行
print(f"删除前行数: {len(df)}")
df = df.drop_duplicates()
print(f"删除后行数: {len(df)}")

# 基于特定列删除重复（如果有业务主键）
# df = df.drop_duplicates(subset=['id', 'email'])
\`\`\`

## 5. 数据类型转换

\`\`\`python
# 转换日期列
date_columns = ['created_at', 'updated_at']  # 根据实际情况调整
for col in date_columns:
    if col in df.columns:
        df[col] = pd.to_datetime(df[col], errors='coerce')

# 转换分类列为Category类型（节省内存）
low_cardinality_cols = []
for col in categorical_cols:
    if df[col].nunique() < 50:  # 唯一值少于50的列
        df[col] = df[col].astype('category')
        low_cardinality_cols.append(col)
\`\`\`

## 6. 异常值检测和处理

\`\`\`python
# 使用IQR方法检测异常值
def detect_outliers(df, column):
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    outliers = df[(df[column] < lower_bound) | (df[column] > upper_bound)]
    return outliers, lower_bound, upper_bound

# 对数值列检测异常值
for col in numerical_cols:
    outliers, lower, upper = detect_outliers(df, col)
    if len(outliers) > 0:
        print(f"{col} 列异常值数量: {len(outliers)}")
        # 可选：删除异常值或用边界值替换
        # df = df[(df[col] >= lower) & (df[col] <= upper)]
\`\`\`

## 7. 保存清洗后的数据

\`\`\`python
# 保存清洗后的数据
df.to_csv('cleaned_data.csv', index=False)
print("数据清洗完成！")
print(f"最终数据形状: {df.shape}")
\`\`\`

这个流程能处理大部分常见的数据质量问题！`,
              timestamp: '2024-01-10T10:08:00Z'
            }
          ]
        }
      ]
    }
  ]
};
