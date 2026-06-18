# StarUML 领域类图 .mdj 文件生成指南

> 本指南详细说明如何通过 JSON 生成 StarUML 可直接打开的领域类图 `.mdj` 文件。
> 适用于任何 AI 根据需求自动生图。

---

## Phase 0: 类分析（最关键步骤）

> ⚠️ **在写任何 JSON 之前，必须先完成类分析。**

### 0.1 分析依据

| 来源 | 提取内容 |
|------|----------|
| **需求描述文本** | 用户故事、功能说明、业务流程描述 |
| **代码文件** | Entity、Service、Repository、DTO 等类 |
| **数据库表** | 表名、字段、外键关系 |

### 0.2 领域类识别规则

#### 实体类（Entity）— 持久化数据对象
- ✅ 对应数据库表，`@Entity`、`@Table` 注解类
- ✅ 主要包含数据字段

#### 服务类（Service）— 业务逻辑编排层
- ✅ `@Service`、`@Component` 注解类
- ✅ 调用 Repository/其他 Service

#### 数据访问类（Repository）— 封装数据库操作
- ✅ `@Repository` 接口，继承 `JpaRepository`

#### DTO（数据传输对象）— 层间数据传输
- ✅ `*Request`、`*Response` 类，不持久化

### 0.3 分析输出模板

```markdown
### 类分析结果

| 序号 | 类名 | 类型(Entity/Service/Repository/DTO) | 来源 | 职责说明 |
|------|------|--------------------------------------|------|----------|
| 1 | User | Entity | Java: User.java | 用户实体 |
| 2 | AuthService | Service | Java: AuthService.java | 认证服务 |
| 3 | UserRepository | Repository | Java: UserRepository.java | 用户数据访问 |
| 4 | LoginRequest | DTO | Java: LoginRequest.java | 登录请求 |
```

---

## Phase 2: 关系设计

### 2.1 UML 关系类型总览

| 关系类型 | 图形表示 | .mdj 中的 `aggregation` 值 |
|----------|----------|---------------------------|
| **关联** (Association) | 实线 | `"none"` |
| **聚合** (Aggregation) | 空心菱形 ◇ | `"shared"` |
| **组合** (Composition) | 实心菱形 ◆ | `"composite"` |
| **继承** (Generalization) | 空心三角箭头 △ | `UMLGeneralization` |

### 2.2 判断规则

**聚合 ◇**：A 包含 B，B 可独立存在（如：UserRepository ◇→ User）
**组合 ◆**：A 包含 B，B 不可独立存在（如：Order ◆→ OrderItem）
**关联**：A 知道 B，但不是整体-部分（如：AuthService → UserRepository）
**继承**：A 是 B 的一种（如：Admin △ User）

---

## 一、文件整体结构

```jsonc
{
  "_type": "Project",
  "_id": "AAAAAAFF+xxx",
  "name": "项目名称",
  "ownedElements": [
    { "_type": "UMLModel", ... },          // 主模型容器
    { "_type": "UMLClass", ... },           // 每个类一个
    { "_type": "UMLAssociation", ... },     // 每个关系一个
    { "_type": "UMLClassDiagram", ... },    // 类图视图
    { "_type": "UMLProfile", ... }          // 可选
  ]
}
```

---

## 二、层级关系

```
Project
 └─ UMLModel ("模型名")
      ├─ UMLClass × N              ← 类定义
      ├─ UMLAssociation × M        ← 关联关系
      └─ UMLClassDiagram           ← 类图视图
           └─ ownedViews: [
                UMLClassView × N           ← 类视图
                UMLAssociationView × M     ← 关联视图
              ]
```

---

## 三、完整 JSON 模板

### 3.1 类定义（UMLClass）

**实体类：**
```jsonc
{
  "_type": "UMLClass",
  "_id": "CLASS+User",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "name": "User",
  "attributes": [
    { "_type": "UMLAttribute", "_id": "A+User+id", "_parent": { "$ref": "CLASS+User" },
      "name": "id", "type": "Long", "visibility": "private" },
    { "_type": "UMLAttribute", "_id": "A+User+email", "_parent": { "$ref": "CLASS+User" },
      "name": "email", "type": "String", "visibility": "private" }
  ],
  "operations": []
}
```

**服务类：**
```jsonc
{
  "_type": "UMLClass",
  "_id": "CLASS+AuthService",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "name": "AuthService",
  "attributes": [],
  "operations": [
    { "_type": "UMLOperation", "_id": "OP+Auth+login", "_parent": { "$ref": "CLASS+AuthService" },
      "name": "login", "visibility": "public", "returnType": "LoginResponse" }
  ]
}
```

### 3.2 关联关系（UMLAssociation）

**普通关联：**
```jsonc
{
  "_type": "UMLAssociation",
  "_id": "ASSOC+Auth+UserRepo",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "end1": {
    "_type": "UMLAssociationEnd",
    "_id": "E+Auth+UR+1",
    "_parent": { "$ref": "ASSOC+Auth+UserRepo" },
    "reference": { "$ref": "CLASS+AuthService" },
    "multiplicity": "1",
    "aggregation": "none"
  },
  "end2": {
    "_type": "UMLAssociationEnd",
    "_id": "E+Auth+UR+2",
    "_parent": { "$ref": "ASSOC+Auth+UserRepo" },
    "reference": { "$ref": "CLASS+UserRepository" },
    "multiplicity": "1",
    "navigable": "navigable",
    "aggregation": "none"
  }
}
```

**聚合关系（空心菱形 ◇）：**
```jsonc
{
  "_type": "UMLAssociation",
  "_id": "ASSOC+UR+User",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "end1": {
    "_type": "UMLAssociationEnd",
    "_id": "E+UR+User+1",
    "_parent": { "$ref": "ASSOC+UR+User" },
    "reference": { "$ref": "CLASS+UserRepository" },
    "multiplicity": "1",
    "aggregation": "shared"          // ◇ 在"整体"端
  },
  "end2": {
    "_type": "UMLAssociationEnd",
    "_id": "E+UR+User+2",
    "_parent": { "$ref": "ASSOC+UR+User" },
    "reference": { "$ref": "CLASS+User" },
    "multiplicity": "0..*",
    "navigable": "navigable",
    "aggregation": "none"
  }
}
```

**继承关系（UMLGeneralization）：**
```jsonc
{
  "_type": "UMLGeneralization",
  "_id": "GEN+Admin+User",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "source": { "$ref": "CLASS+Admin" },
  "target": { "$ref": "CLASS+User" }
}
```

### 3.3 类图视图（UMLClassDiagram）

```jsonc
{
  "_type": "UMLClassDiagram",
  "_id": "DIAG+AuthDomain",
  "_parent": { "$ref": "AAAAAAG+authModel01" },
  "name": "用户认证模块领域类图",
  "ownedViews": [
    // UMLClassView × N
    // UMLAssociationView × M
  ]
}
```

### 3.4 类视图（UMLClassView）

```jsonc
{
  "_type": "UMLClassView",
  "_id": "VIEW+User",
  "_parent": { "$ref": "DIAG+AuthDomain" },
  "model": { "$ref": "CLASS+User" },    // ← 指向 UMLClass，不是视图
  "left": 100,
  "top": 60,
  "width": 200,
  "height": 220,
  "font": "Arial;12;0"
}
```

### 3.5 关联视图（UMLAssociationView）

```jsonc
{
  "_type": "UMLAssociationView",
  "_id": "VIEW+ASSOC+Auth+UR",
  "_parent": { "$ref": "DIAG+AuthDomain" },
  "model": { "$ref": "ASSOC+Auth+UserRepo" },
  "head": { "$ref": "VIEW+UserRepository" },    // ← 目标类视图，不是模型
  "tail": { "$ref": "VIEW+AuthService" },       // ← 源类视图
  "lineStyle": 1,
  "points": "500:180;500:280",
  "showVisibility": true,
  "font": "Arial;12;0"
}
```

---

## 四、坐标计算方法

```
公式：
classView[n].left = 40 + 列 × 280
classView[n].top = 40 + 行 × 240

width = 200px（固定）
height = 属性数 × 20 + 方法数 × 20 + 60
```

**关联视图 points：**
```
中心x = 类View.left + 类View.width / 2
中心y = 类View.top + 类View.height / 2
points = "源中心x:源中心y;目标中心x:目标中心y"
```

---

## 五、常见错误清单

| # | 错误 | 现象 | 修复 |
|---|------|------|------|
| 1 | `UMLClass._parent` 写错 | 类找不到父级 | 确保指向 `UMLModel` 的 `_id` |
| 2 | `UMLAttribute._parent` 写错 | 属性找不到父级 | 确保指向 `UMLClass` 的 `_id` |
| 3 | `UMLAssociation._parent` 写错 | 关联找不到父级 | 确保指向 `UMLModel` 的 `_id` |
| 4 | `reference` 写成类名 | 找不到类 | 使用 `{ "$ref": "CLASS+xxx" }` |
| 5 | `aggregation` 值写错 | 菱形不显示 | 使用 `"none"`/`"shared"`/`"composite"` |
| 6 | `model` 引用循环 | 视图不显示 | 确保指向模型 ID |
| 7 | `UMLClassView._parent` 写错 | 视图找不到父级 | 指向 `UMLClassDiagram` |
| 8 | `head`/`tail` 指向模型层 | 连线不显示 | 指向 `UMLClassView` |
| 9 | `points` 格式写错 | 连线不显示 | `"源中心x:源中心y;目标中心x:目标中心y"` |
| 10 | 菱形位置画反 | 菱形在错误端 | 菱形永远画在"整体"端 |

---

## 六、ID 命名规范

| 元素类型 | ID 前缀 | 示例 |
|----------|---------|------|
| Project | 固定格式 | `AAAAAAFF+项目名` |
| UMLModel | `AAAAAAG+` | `AAAAAAG+authModel01` |
| UMLClass | `CLASS+` | `CLASS+User` |
| UMLAttribute | `A+类名+` | `A+User+id` |
| UMLOperation | `OP+类名+` | `OP+Auth+login` |
| UMLAssociation | `ASSOC+` | `ASSOC+Auth+UserRepo` |
| UMLAssociationEnd | `E+` | `E+Auth+UR+1` |
| UMLClassDiagram | `DIAG+` | `DIAG+AuthDomain` |
| UMLClassView | `VIEW+` | `VIEW+User` |
| UMLAssociationView | `VIEW+ASSOC+` | `VIEW+ASSOC+Auth+UR` |

---

*最后更新：2026-06-17*
