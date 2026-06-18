# StarUML ER 图（实体关系图）.mdj 文件生成指南

> 本指南详细说明如何通过 JSON 生成 StarUML 可直接打开的 ER 图 `.mdj` 文件。
> ER 图在 StarUML 中使用 Class Diagram 结构实现，通过 `stereotype: "Entity"` 标注实体表。

---

## Phase 0: 实体分析

### 0.1 分析依据

| 来源 | 提取内容 |
|------|----------|
| **数据库表结构** | 表名、字段、类型、PK/FK/UQ 约束 |
| **JPA Entity 代码** | `@Entity`、`@Table`、`@Id`、`@ManyToOne` 注解 |
| **需求描述** | 实体及其关系描述 |

### 0.2 实体识别规则

- 每个数据库表 = 一个 `UMLClass`（`stereotype: "Entity"`）
- 外键关系 = 一个 `UMLAssociation`
- 主键字段名加 `«PK»` 后缀，外键字段名加 `«FK»` 后缀，唯一约束加 `«UQ»` 后缀
- 字段类型使用 SQL 类型（VARCHAR、BIGINT、DATETIME 等）

### 0.3 分析输出模板

```markdown
### 实体分析结果

| 序号 | 表名 | 字段数 | 主键 | 说明 |
|------|------|--------|------|------|
| 1 | users | 13 | id | 用户表 |
| 2 | words | 9 | id | 单词表 |
| 3 | meanings | 5 | id | 释义表（FK: word_id → words.id） |

### 关系分析结果

| 序号 | 源表 | 目标表 | 关系 | 外键 | 多重性 |
|------|------|--------|------|------|--------|
| 1 | words | meanings | 1:N | meanings.word_id | 1 → 0..* |
| 2 | users | quiz_records | 1:N | quiz_records.user_id | 1 → 0..* |
```

---

## 一、文件整体结构

ER 图使用类图结构，但用 `stereotype: "Entity"` 标注表名：

```jsonc
{
  "_type": "Project",
  "_id": "PROJ+TiMoER001",
  "name": "TiMo系统E-R图",
  "ownedElements": [
    { "_type": "UMLModel", ... },          // 主模型
    { "_type": "UMLClass", ... },           // 每个表一个
    { "_type": "UMLAssociation", ... },     // 外键关系
    { "_type": "UMLClassDiagram", ... }     // 类图视图
  ]
}
```

---

## 二、实体定义（UMLClass）

```jsonc
{
  "_type": "UMLClass",
  "_id": "E+users",
  "_parent": { "$ref": "MODEL+ER01" },
  "name": "users",
  "stereotype": "Entity",
  "attributes": [
    { "_type": "UMLAttribute", "_id": "A+users+id",
      "_parent": { "$ref": "E+users" }, "name": "id «PK»", "type": "BIGINT" },
    { "_type": "UMLAttribute", "_id": "A+users+email",
      "_parent": { "$ref": "E+users" }, "name": "email «UQ»", "type": "VARCHAR" },
    { "_type": "UMLAttribute", "_id": "A+users+pwd",
      "_parent": { "$ref": "E+users" }, "name": "password_hash", "type": "VARCHAR" },
    { "_type": "UMLAttribute", "_id": "A+users+role",
      "_parent": { "$ref": "E+users" }, "name": "role", "type": "VARCHAR" }
  ],
  "operations": []
}
```

**命名规范：**
- `_id`：`E+表名`（如 `E+users`）
- 属性 `_id`：`A+表名+字段名`（如 `A+users+id`）
- `name`：字段名，PK/FK/UQ 用 «» 标注（如 `"id «PK»"`, `"word_id «FK»"`）
- `type`：SQL 类型（`BIGINT`、`VARCHAR`、`INT`、`DOUBLE`、`DATETIME`、`TEXT`）

---

## 三、外键关系（UMLAssociation）

```jsonc
{
  "_type": "UMLAssociation",
  "_id": "ASSOC+words+meanings",
  "_parent": { "$ref": "MODEL+ER01" },
  "end1": {
    "_type": "UMLAssociationEnd",
    "_id": "E+wm+1",
    "_parent": { "$ref": "ASSOC+words+meanings" },
    "reference": { "$ref": "E+words" },
    "multiplicity": "1",
    "aggregation": "none"
  },
  "end2": {
    "_type": "UMLAssociationEnd",
    "_id": "E+wm+2",
    "_parent": { "$ref": "ASSOC+words+meanings" },
    "reference": { "$ref": "E+meanings" },
    "multiplicity": "0..*",
    "navigable": "navigable",
    "aggregation": "none"
  }
}
```

**聚合关系（主表管理子表）：**
当子表不能脱离主表独立存在时，主表端用 `"aggregation": "shared"`。

---

## 四、视图层

### 4.1 实体视图（UMLClassView）

```jsonc
{
  "_type": "UMLClassView",
  "_id": "VIEW+E+users",
  "_parent": { "$ref": "DIAG+ER" },
  "model": { "$ref": "E+users" },
  "left": 40,
  "top": 40,
  "width": 200,
  "height": 300,
  "font": "Arial;12;0"
}
```

**尺寸计算：**
```
width = 200px（固定，或根据最长字段名调整）
height = 字段数 × 20 + 60（标题+分隔线）
```

### 4.2 关联视图（UMLAssociationView）

```jsonc
{
  "_type": "UMLAssociationView",
  "_id": "VIEW+ASSOC+words+meanings",
  "_parent": { "$ref": "DIAG+ER" },
  "model": { "$ref": "ASSOC+words+meanings" },
  "head": { "$ref": "VIEW+E+meanings" },
  "tail": { "$ref": "VIEW+E+words" },
  "lineStyle": 1,
  "points": "140:190;420:190",
  "showVisibility": true,
  "font": "Arial;12;0"
}
```

---

## 五、坐标计算

```
网格布局：
起始X = 40, 列间隔 = 280px
起始Y = 40, 行间隔 = 240px

entityView[n].left = 40 + 列 × 280
entityView[n].top = 40 + 行 × 240

关联 points = "源中心x:源中心y;目标中心x:目标中心y"
```

---

## 六、常见错误

| 错误 | 现象 | 修复 |
|------|------|------|
| 缺少 `stereotype: "Entity"` | 显示为普通类，不是 ER 实体 | 加上 stereotype 字段 |
| `head`/`tail` 指向模型层 | 连线不显示 | 指向 `UMLClassView._id` |
| PK/FK 未标注 | 无法区分主外键 | 字段名加 `«PK»`/`«FK»` 后缀 |
| 菱形方向画反 | 关系含义不清 | 菱形在"一"端（主表端） |

---

## 七、ID 命名规范

| 元素类型 | ID 格式 | 示例 |
|----------|---------|------|
| Project | `PROJ+项目名` | `PROJ+TiMoER001` |
| UMLModel | `MODEL+` | `MODEL+ER01` |
| UMLClass（实体） | `E+表名` | `E+users` |
| UMLAttribute | `A+表名+字段` | `A+users+id` |
| UMLAssociation | `ASSOC+表1+表2` | `ASSOC+words+meanings` |
| UMLClassDiagram | `DIAG+` | `DIAG+ER` |
| UMLClassView | `VIEW+E+` | `VIEW+E+users` |
| UMLAssociationView | `VIEW+ASSOC+` | `VIEW+ASSOC+words+meanings` |

---

*最后更新：2026-06-17*
