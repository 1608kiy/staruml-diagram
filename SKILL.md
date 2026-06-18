---
name: staruml-diagram
description: 为毕业设计/课程作业生成 StarUML 可直接打开的 .mdj 图文件。支持序列图（含 BCE 图标）、领域类图（含关联/聚合/组合/继承）、ER 图（数据库实体关系）。当用户提到"画序列图 / 类图 / ER 图"、"生成 mdj"、"毕业设计画图"、"StarUML"、"UML 图" 时触发。
user-invocable: true
---

# StarUML 毕业设计画图

把代码/需求/数据库表 → StarUML 能直接打开的 `.mdj` 文件。

## 快速判断

| 用户说 | 图类型 | 你需要做什么 |
|--------|--------|-------------|
| "画个登录序列图" / "API 调用流程" | 序列图 | → 跳到 §序列图速查 |
| "类图" / "模块结构" / "Service-Repository" | 领域类图 | → 跳到 §类图速查 |
| "ER 图" / "数据库表关系" | ER 图 | → 跳到 §ER 图速查 |
| "帮我把所有模块都画了" | 批量 | → 跳到 §批量生成 |
| "在刚才那个图上改一下" | 增量 | → 跳到 §增量修改 |

**不适用**：流程图（用 draw.io/mermaid）、用例图/活动图/状态图（暂未覆盖）。

---

## 序列图速查

### 对象识别（从代码自动推断）

```
扫描项目代码，按以下规则分类：

Actor:     需求中的外部角色（用户、管理员、定时器）—— 代码中没有对应类
Boundary:  @RestController / @Controller / *.vue 文件 / 前端弹窗组件
Control:   @Service / @Component / 算法工具类（GradeMapper、Scheduler 等）
Entity:    @Entity / @Table / JPA Repository 操作的对象
```

### 消息流模板

```
Actor → Boundary: 用户操作()
Boundary → Control: 请求()
Control → Entity: 查询/保存()
Entity → Control: 数据
Control → Boundary: 结果
Boundary → Actor: 展示
```

### 序列图 JSON 结构速记

```
Project
 ├─ UMLActor × N                ← Actor 类（显示小人）
 ├─ UMLClass × N                ← Boundary/Control/Entity 类
 │    └─ stereotype: { "$ref": "STEREO_BOUNDARY/CONTROL/ENTITY" }
 ├─ UMLProfile                  ← 必须！含 boundary/control/entity 三个 stereotype
 └─ UMLModel
      └─ UMLCollaboration
           ├─ attributes: [UMLAttribute × N]    ← 每个生命线一个，type 指向类
           └─ UMLInteraction
                ├─ participants: [UMLLifeline × N]  ← represent 指向 attribute
                ├─ messages: [UMLMessage × M]       ← source/target 指向 lifeline
                └─ UMLSequenceDiagram
                     └─ ownedViews: [UMLFrameView, UMLSeqLifelineView × N, UMLSeqMessageView × M]
```

### 关键字段速记

```
生命线视图:  _type="UMLSeqLifelineView"（不是 UMLLifelineView！）
             stereotypeDisplay: "icon"（必须，否则不显示 BCE 图标）
             subViews 里要有 UMLNameCompartmentView + UMLLinePartView

消息视图:    _type="UMLSeqMessageView"（不是 UMLMessageView！）
             head/tail 指向 UMLLinePartView._id（不是 UMLLifeline._id！）
             subViews 里要有 3 个 EdgeLabelView（name + stereotype + property）
             不要手动加 UMLActivationView，让 StarUML 自动管理

消息模型:    messageSort="synchCall"（调用，默认）/ "reply"（返回，必须显式标！）
             name 不加序号（StarUML 自动编号，否则双编号）

坐标公式:    生命线 left = 59 + n × 160, linePart.left = left + 30
             消息 y = 120 + n × 40
             points = "源x:源y;目标x:目标y"
             框架 width = 最后linePart.left + 80, height = 最后消息y + 80
```

### 实战案例参考

```
读取此文件可看到一个完整可运行的序列图长什么样：
templates/examples/quick-memory-sequence.mdj  （TiMo 快速记忆学习序列图，8生命线18消息）
```

---

## 类图速查

### 类识别

```
Entity:     @Entity / @Table —— 对应数据库表，主要含字段
Service:    @Service / @Component —— 业务逻辑层
Repository: @Repository / extends JpaRepository —— 数据访问层
DTO:        *Request / *Response —— 层间传输，不持久化
```

### 关系判断

```
关联（实线）:   A 用 B，但不是整体-部分  → aggregation: "none" 两端
聚合（空心菱形◇）: A 管理 B，B 可独立   → aggregation: "shared" 在 A 端
组合（实心菱形◆）: A 拥有 B，B 不可独立  → aggregation: "composite" 在 A 端
继承（空心三角△）: A 是 B 的一种         → UMLGeneralization，source→target
```

### 类图 JSON 结构速记

```
Project
 ├─ UMLProfile（可选）
 ├─ UMLModel
 │    ├─ UMLClass × N
 │    │    ├─ attributes: [UMLAttribute]  ← _parent 指向 UMLClass
 │    │    └─ operations: [UMLOperation]  ← _parent 指向 UMLClass
 │    ├─ UMLAssociation × M
 │    │    ├─ end1: { reference→UMLClass, aggregation, multiplicity }
 │    │    └─ end2: { reference→UMLClass, navigable, aggregation, multiplicity }
 │    ├─ UMLGeneralization（继承时用）
 │    └─ UMLClassDiagram
 │         └─ ownedViews: [UMLClassView × N, UMLAssociationView × M]
```

### 关键字段速记

```
类视图:     model 指向 UMLClass._id（不是视图自己！）
            _parent 指向 UMLClassDiagram._id
            尺寸: width=200, height=属性数×20+方法数×20+60

关联视图:   model 指向 UMLAssociation._id
            head/tail 指向 UMLClassView._id（不是 UMLClass._id！）
            points = "源中心x:源中心y;目标中心x:目标中心y"
            中心x = left + width/2, 中心y = top + height/2

布局:       列间隔 280px, 行间隔 240px
            left = 40 + 列×280, top = 40 + 行×240
```

---

## ER 图速查

ER 图用类图结构实现，靠 `stereotype: "Entity"` 区分。

### 字段标注

```
主键:  name: "id «PK»"        type: "BIGINT"
外键:  name: "word_id «FK»"    type: "BIGINT"
唯一:  name: "email «UQ»"      type: "VARCHAR"
普通:  name: "nickname"         type: "VARCHAR"
```

### ID 命名

```
实体:  _id = "E+表名"           如 "E+users"
字段:  _id = "A+表名+字段名"    如 "A+users+id"
关联:  _id = "ASSOC+表1+表2"    如 "ASSOC+words+meanings"
视图:  _id = "VIEW+E+表名"      如 "VIEW+E+users"
```

---

## 代码扫描策略

当用户说"根据代码生成 xxx 图"时，按以下策略自动提取对象：

### 扫描目录约定

```
后端代码: src/main/java/com/*/   （按模块分目录）
前端代码: src/views/              （*.vue 文件）
数据库:   @Entity 注解 / schema.sql / import-words.sql
```

### 序列图对象提取

```
1. 找到用户描述的业务场景涉及的 Controller 方法
2. 沿调用链追踪: Controller → Service → Repository/其他Service → Entity
3. 前端: 从 api/ 目录找到对应的 API 调用，追溯到 vue 文件
4. 自动分类:
   - @RestController → Boundary
   - @Service/@Component → Control
   - @Entity/@Table → Entity
   - *.vue → Boundary
5. 消息流 = 方法调用链（调用=synchCall，返回=reply）
```

### 类图/ER 图提取

```
1. 类图: 扫描指定模块下所有 @Entity、@Service、@Repository、DTO
2. ER 图: 只扫 @Entity/@Table，提取字段和外键关系
3. 关系推断:
   - @ManyToOne/@OneToMany → 关联或聚合
   - 字段类型是另一个 Entity → 关联
   - @Embedded / 级联删除 → 组合
   - extends → 继承
```

---

## 生成方式（直接 Write 优先）

### 方式 A：直接 Write（推荐，≤8 个对象时）

1. 读取对应模板 `templates/xxx-template.mdj`
2. 在内存中深拷贝 JSON，替换对象名/消息/坐标
3. 用 Write 工具直接输出完整 .mdj 文件
4. 跑验证脚本

### 方式 B：Node.js 脚本（>8 个对象时）

1. 在用户工作目录创建 `_gen_xxx.js`
2. 脚本读模板 → 深拷贝 → 批量修改 → writeFileSync
3. `node _gen_xxx.js` 运行
4. 跑验证脚本
5. 询问用户是否删除临时脚本

### ⚠️ 绝对不能犯的错

```
1. "$ref" 不要写成 "_ref"         → 绘图区空白
2. 消息名不加序号                  → 否则 "1 : 1: xxx" 双编号
3. 生命线用 UMLSeqLifelineView     → 不是 UMLLifelineView
4. 消息用 UMLSeqMessageView        → 不是 UMLMessageView
5. head/tail 指向视图 ID 不是模型 ID → 否则箭头不显示
6. 返回消息必须 messageSort="reply" → 否则显示实线
7. 生命线加 stereotypeDisplay:"icon" → 否则不显示 BCE 图标
8. 每个 _id 全局唯一               → 否则 JSON 异常
```

---

## 增量修改

当用户说"在刚才那个图上改一下"、"加一条消息"、"改个名字"时：

### 步骤

```
1. 用 Read 读取已有 .mdj 文件
2. JSON.parse 解析
3. 定位要修改的元素（按 _id 或 name 查找）
4. 只修改目标字段，其余不动
5. JSON.stringify 写回（用 Write 或 Edit）
6. 跑验证
```

### 常见增量操作

| 用户说 | 改什么 |
|--------|--------|
| "把第 3 个生命线改名为 xxx" | 改 UMLAttribute.name + UMLNameCompartmentView 里 nameLabel 的 text |
| "在 A 和 B 之间加一条消息" | 新增 UMLMessage（messages）+ UMLSeqMessageView（ownedViews），计算 Y 坐标 |
| "删除最后一条消息" | 从 messages 和 ownedViews 中移除对应元素 |
| "加一个新的类" | 新增 UMLClass + UMLClassView，调整布局 |
| "把聚合改成组合" | 改 UMLAssociation.end1 或 end2 的 aggregation: "shared" → "composite" |
| "在类图里加一条关联" | 新增 UMLAssociation + UMLAssociationView |

---

## 批量生成

当用户说"把所有模块都画了"、"帮我生成一套图"时：

### 步骤

```
1. 先列出要生成的图清单，请用户确认
2. 逐个生成，每个都跑验证
3. 最后汇总报告：哪些成功、哪些失败
```

### 推荐的毕业设计标准图集

```
序列图（按业务场景）:
  - 用户认证序列图（注册/登录/JWT）
  - 快速记忆学习序列图
  - 上下文深度学习序列图
  - 统一复习序列图
  - FSRS+DF 算法执行序列图
  - Agent 对话交互序列图
  - 游戏化数据计算序列图

类图（按模块）:
  - 用户认证模块领域类图
  - 学习模块领域类图
  - 核心算法领域类图
  - Agent 模块领域类图
  - 游戏化模块领域类图

ER 图:
  - 系统 E-R 图（全表关系）
```

### 批量脚本模板

```javascript
// _gen_batch.js — 批量生成多个 .mdj
const fs = require('fs')
const path = require('path')

const diagrams = [
  { name: '图4.5_快速记忆学习顺序图', type: 'sequence', config: { /* ... */ } },
  { name: '图4.9_用户认证模块类图', type: 'class', config: { /* ... */ } },
  // ...
]

for (const diag of diagrams) {
  const templatePath = `C:/Users/86166/.claude/skills/staruml-diagram/templates/${diag.type}-template.mdj`
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
  // ... 深拷贝 + 修改 + 写出
  const output = path.join(process.cwd(), `${diag.name}.mdj`)
  fs.writeFileSync(output, JSON.stringify(result, null, 2))
  console.log(`✓ ${output}`)
}
```

---

## 验证与排错

### 运行验证

```bash
node "C:/Users/86166/.claude/skills/staruml-diagram/scripts/validate.js" <file.mdj>
```

### 验证失败 → 修复指引

| 验证输出 | 含义 | 怎么修 |
|----------|------|--------|
| `✗ JSON 解析失败` | JSON 语法错误 | 检查逗号、括号、引号是否配对 |
| `✗ 重复 _id: "XXX"` | 两个元素用了同一个 _id | 改其中一个 _id |
| `✗ 断裂引用: → "XXX"` | $ref 指向不存在的 _id | 检查拼写，或补充缺失的元素 |
| `✗ 生命线视图 ≠ 参与者模型` | 视图和模型数量不一致 | 检查是否漏加了视图或模型 |
| `✗ 使用了 UMLLifelineView` | 类型名写错 | 改为 `UMLSeqLifelineView` |
| `✗ 使用了 UMLMessageView` | 类型名写错 | 改为 `UMLSeqMessageView` |
| `✗ 消息视图缺 head/tail` | 消息没有连接端 | 补充 head/tail，指向 UMLLinePartView |
| `✗ 类视图缺 model` | 类视图没有关联模型 | 补充 `"model": {"$ref":"CLASS+xxx"}` |
| `✗ head/tail 指向模型层` | 连线引用了模型而不是视图 | 改为指向 UMLClassView._id |
| `✗ aggregation 值无效` | 菱形值写错 | 改为 `"none"` / `"shared"` / `"composite"` |
| `⚠ 缺少 stereotypeDisplay` | BCE 图标可能不显示 | 生命线视图加 `"stereotypeDisplay": "icon"` |

### StarUML 打开后的问题

| 现象 | 原因 | 修复 |
|------|------|------|
| 绘图区完全空白，但模型浏览器正常 | `$ref` 写成了 `_ref` | 全文替换 `_ref` → `$ref` |
| 生命线头部显示带 X 的方框 | 缺 stereotype 引用或 UMLProfile | 检查 Class 的 stereotype 字段和 Profile 是否存在 |
| 消息箭头不显示 | head/tail 指向了模型层 | 改为指向 UMLLinePartView._id |
| 关联连线不显示 | head/tail 指向了 UMLClass | 改为指向 UMLClassView._id |
| 显示 `1 : 1: xxx` 双编号 | 消息名手动加了序号 | 去掉消息名里的序号 |
| 返回消息显示实线 | 缺 messageSort: "reply" | 给返回消息加上 messageSort |
| 菱形不显示 | aggregation 值写错 | 改为 "none"/"shared"/"composite" |
| 菱形在错误端 | aggregation 放错了 end | 菱形放在"整体"端（拥有者端） |
| 每次点击激活条变长 | 手动加了 UMLActivationView | 去掉它，让 StarUML 自动管理 |

---

## 输出约定

- 默认输出到用户当前工作目录：`./<图名>.mdj`
- 用户指定路径时按指定路径
- 不要写到 `references/` 或 `templates/`
- 临时脚本命名为 `_gen_xxx.js`（下划线开头，用户容易识别和删除）

## 参考资料（仅在需要深入了解时读取）

```
references/sequence-diagram-guide.md  — 序列图完整指南（对象分析+JSON模板+踩坑记录）
references/class-diagram-guide.md     — 领域类图完整指南
references/er-diagram-guide.md        — ER 图完整指南
templates/examples/                   — 完整实战案例（StarUML 打开可直接查看效果）
```

## 与其他工具的边界

- 流程图 → draw.io MCP 或 mermaid
- 导出 PNG → 用户在 StarUML 里 `File → Export → PNG`
- 文档撰写 → `word-document-processor`
