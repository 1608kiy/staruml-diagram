# StarUML 序列图 .mdj 文件生成指南

> 本指南详细说明如何通过 JSON 生成 StarUML 可直接打开的序列图 `.mdj` 文件。
> 适用于任何 AI（Claude、GPT、DeepSeek 等）根据需求自动生图。

## 使用方式

**给 AI 的提示词模板：**

```
请根据以下需求生成 StarUML 序列图 .mdj 文件：

1. 需求描述：[粘贴需求文档或代码描述]
2. 参考模板：[提供一个已有的 .mdj 文件路径]
3. 输出路径：[目标 .mdj 文件路径]

请先完成对象分析（Phase 0），再读取模板结构（Phase 1），
然后设计消息流程（Phase 2），最后生成 JSON（Phase 4）。
```

**AI 执行顺序：**

1. 读取需求/代码 → Phase 0: 对象分析
2. 读取用户提供的 .mdj 模板 → Phase 1: 模板分析
3. 设计消息流 → Phase 2: 消息流程设计
4. 计算坐标 → Phase 3: 坐标计算
5. 生成 JSON → Phase 4: JSON 生成（使用后续章节的模板）
6. 验证 → Phase 5: 验证修复

---

## 前置：完整工作流程

```
用户需求描述 / 代码分析
        │
        ▼
  ┌─────────────────┐
  │ Phase 0: 对象分析 │  ← 最关键！分析清楚再动手
  │ 识别 Actor / BCE  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 1: 模板分析 │  ← 读取用户提供的 .mdj 模板
  │ 提取格式和结构    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 2: 消息设计 │  ← 设计交互流程
  │ 确定消息顺序和方向 │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 3: 坐标计算 │  ← 计算布局
  │ 生命线和消息位置   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 4: JSON生成 │  ← 按模板格式输出
  │ 生成 .mdj 文件    │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Phase 5: 验证修复 │  ← 检查 + StarUML 打开验证
  └─────────────────┘
```

---

## Phase 0: 对象分析（最关键步骤）

> ⚠️ **在写任何 JSON 之前，必须先完成对象分析。** 分析错了，后面全部白做。

### 0.1 分析依据

从以下来源提取对象信息：

| 来源 | 提取内容 |
|------|----------|
| **需求描述文本** | 用户故事、功能说明、业务流程描述 |
| **代码文件** | Controller、Service、Repository、Entity、DTO 等类 |
| **API 端点** | REST 接口定义（路由、参数、返回值） |
| **数据库表** | 表名、字段、外键关系 |
| **现有 .mdj 模板** | 已有的类图、用例图中的类和关系 |

### 0.2 四种对象识别规则

#### Actor（参与者/用户）

**识别方法：**
- 需求中提到的"用户"、"管理员"、"系统定时器"等外部角色
- 代码中没有对应类，是系统的外部使用者
- 在用例图中通常作为起点

**判断标准：**
- ✅ 是人或外部系统，不是代码中的类
- ✅ 主动发起操作
- ❌ 不是 Controller、Service 等后端组件

**示例：**
```
"用户点击开始学习" → User (Actor)
"管理员重置密码" → Admin (Actor)
"系统每天凌晨生成报告" → Timer (Actor)
```

---

#### Boundary（边界对象）

**识别方法：**
- 用户直接交互的界面/页面/API入口
- 代码中的 Vue 组件、JSP、HTML 页面
- 后端的 Controller（REST 入口点）
- 前端的弹窗、对话框、表单

**判断标准：**
- ✅ 位于系统边界，连接用户和内部逻辑
- ✅ 负责接收用户输入、展示系统输出
- ✅ 通常是 `@RestController`、`@Controller`、Vue `*.vue` 文件
- ❌ 不包含业务逻辑（业务逻辑在 Service 中）

**代码特征：**
```java
// Boundary: 接收请求，转发给 Service
@RestController
@RequestMapping("/api/study")
public class StudyController {
    @PostMapping("/submit-quick-memory")
    public Result submit(@RequestBody QuickMemoryRequest request) {
        return studyService.submitQuickMemory(request);  // 转发
    }
}
```

**常见 Boundary 对象：**
| 对象 | 类型 | 说明 |
|------|------|------|
| `QuickMemoryView` | 前端页面 | 快速记忆学习页面 |
| `LightningVerifyDialog` | 前端弹窗 | 闪电验证对话框 |
| `StudyController` | 后端 Controller | 学习相关 API 入口 |
| `LoginView` | 前端页面 | 登录页面 |
| `DashboardView` | 前端页面 | 仪表盘页面 |

---

#### Control（控制对象）

**识别方法：**
- 编排业务逻辑的中间层
- 代码中的 Service、Manager、Handler 等
- 负责协调多个组件完成一个业务流程
- 不直接与用户交互，也不直接存储数据

**判断标准：**
- ✅ 包含业务逻辑（if/else、循环、算法调用）
- ✅ 调用其他 Service/Repository 完成工作
- ✅ 通常是 `@Service`、`@Component`、工具类
- ❌ 不是 Controller（那是 Boundary）
- ❌ 不是 Entity/Repository（那是 Entity）

**常见 Control 对象：**
| 对象 | 说明 |
|------|------|
| `StudyService` | 学习业务逻辑编排 |
| `GradeMapper` | 行为数据→评分映射 |
| `Scheduler` | FSRS 调度算法 |
| `AgentService` | AI Agent 对话逻辑 |

---

#### Entity（实体对象）

**识别方法：**
- 持久化到数据库的数据对象
- 代码中的 Entity、Model、POJO、数据库表映射
- 被 Controller/Service 读写的数据

**判断标准：**
- ✅ 对应数据库表或集合
- ✅ 主要包含数据字段（getter/setter）
- ✅ 通常是 `@Entity`、`@Table`、JPA Repository 操作的对象
- ❌ 不包含业务逻辑（那是 Control）

**常见 Entity 对象：**
| 对象 | 对应表 | 说明 |
|------|--------|------|
| `Word` | `words` | 单词实体 |
| `UserWordBind` | `user_word_bind` | 用户-单词 FSRS 状态 |
| `QuizRecord` | `quiz_records` | 学习记录 |
| `User` | `users` | 用户信息 |

---

### 0.3 分析输出模板

完成分析后，输出以下表格：

```markdown
### 对象分析结果

| 序号 | 对象名称 | 类型(Actor/Boundary/Control/Entity) | 来源(代码/需求) | 职责说明 |
|------|----------|--------------------------------------|-----------------|----------|
| 1 | User | Actor | 需求："用户点击学习" | 发起学习操作 |
| 2 | QuickMemoryView | Boundary | Vue: QuickMemoryView.vue | 展示单词、接收选择 |
| 3 | StudyController | Boundary | Java: StudyController.java | REST API 入口 |
| 4 | StudyService | Control | Java: StudyService.java | 编排学习流程 |
| 5 | GradeMapper | Control | Java: GradeMapper.java | 行为→评分映射 |
| 6 | Scheduler | Control | Java: Scheduler.java | FSRS 参数更新 |
| 7 | UserWordBind | Entity | JPA: UserWordBind.java | FSRS 状态持久化 |
| 8 | QuizRecord | Entity | JPA: QuizRecord.java | 学习记录持久化 |
```

### 0.4 分析检查清单

- [ ] 所有参与者都已识别（Actor + Boundary + Control + Entity）
- [ ] 每个对象的类型判断正确（特别注意 Boundary vs Control）
- [ ] 每个对象都有明确的职责说明
- [ ] 没有遗漏关键对象（检查需求中的每个动词是否都有对应对象处理）
- [ ] 没有重复对象（同一个类不要出现两次）

---

## Phase 2: 消息流程设计

### 2.1 消息流分析方法

根据对象分析结果，按以下步骤设计消息流：

**步骤 1：确定起点和终点**
```
起点：Actor 发起操作
终点：Actor 收到结果
```

**步骤 2：追踪调用链**
```
Actor → Boundary(页面/Controller) → Control(Service) → Entity(数据库)
```

**步骤 3：标注每条消息**
```
方向：从谁到谁
类型：synchCall(调用) / reply(返回)
内容：方法名或数据描述
```

### 2.2 消息流设计模板

```markdown
### 消息流程设计

| 序号 | 消息名称 | 源 | 目标 | 类型 | 说明 |
|------|----------|-----|------|------|------|
| 1 | 开始学习() | User | QuickMemoryView | synchCall | 用户发起 |
| 2 | 获取下一个单词() | QuickMemoryView | StudyController | synchCall | 页面请求 |
| 3 | 查询待复习单词() | StudyController | StudyService | synchCall | Controller 转发 |
| 4 | 返回单词 | StudyService | StudyController | reply | Service 返回 |
| 5 | 返回单词 | StudyController | QuickMemoryView | reply | Controller 返回 |
| 6 | 展示单词(word) | QuickMemoryView | User | reply | 页面展示 |
```

---

## Phase 3: 坐标计算

### 3.1 生命线 X 坐标

```
公式：lifeLine[n].left = 起始X + n × 间隔
推荐：起始X = 59, 间隔 = 160px

示例（8个生命线）：
User:            left = 59,   linePart.left = 89
QuickMemoryView: left = 174,  linePart.left = 249
StudyController: left = 334,  linePart.left = 404
StudyService:    left = 494,  linePart.left = 549
```

### 3.2 消息 Y 坐标

```
公式：message[n].y = 起始Y + n × 间隔
推荐：起始Y = 120, 间隔 = 40px
```

### 3.3 框架尺寸

```
width = 最后一个生命线的 linePart.left + 80
height = 最后一条消息的 y + 80
```

---

## 一、文件整体结构

```jsonc
{
  "_type": "Project",
  "_id": "AAAAAAFF+h6SjaM2Hec=",    // 固定值，Project 的 _id
  "name": "项目名称",
  "ownedElements": [
    // ① UMLModel（主模型容器）
    { "_type": "UMLModel", ... },
    // ② UMLActor（角色，仅用户/Actor 需要）
    { "_type": "UMLActor", ... },
    // ③ UMLClass（边界/控制/实体类，每个生命线对应一个）
    { "_type": "UMLClass", ... },
    // ④ UMLProfile（BCE 标准配置文件）
    { "_type": "UMLProfile", ... }
  ]
}
```

### 必须包含的顶层元素

| 元素 | 作用 | 数量 |
|------|------|------|
| `UMLModel` | 主模型容器，包含 Collaboration → Interaction → SequenceDiagram | 1 |
| `UMLActor` | 用户/Actor 角色（仅 Actor 需要，普通类不需要） | ≥1 |
| `UMLClass` | 每个生命线对应一个类（边界/控制/实体） | =生命线数 |
| `UMLProfile` | BCE 标准配置文件（boundary/control/entity 刺激） | 1 |

---

## 二、层级关系（关键！）

```
Project
 └─ UMLModel ("模型名")
      ├─ UMLCollaboration ("Collaboration1")
      │    ├─ ownedElements: [UMLInteraction]
      │    └─ attributes: [UMLAttribute × N]     ← 每个生命线一个
      │
      └─ (可选：UMLClassDiagram 等其他图表)
```

```
UMLInteraction ("Interaction1")
 ├─ ownedElements: [UMLSequenceDiagram]           ← 序列图定义
 ├─ messages: [UMLMessage × N]                    ← 所有消息的模型
 └─ participants: [UMLLifeline × N]               ← 所有生命线的模型
```

```
UMLSequenceDiagram ("图名")
 └─ ownedViews: [
      UMLFrameView,                              ← 框架（1个）
      UMLSeqLifelineView × N,                    ← 生命线视图
      UMLSeqMessageView × M                      ← 消息视图
    ]
```

---

## 三、完整 JSON 模板

### 3.2 Actor 和 Class 定义

**Actor（用户）**— 显示小人图标：

```jsonc
{
  "_type": "UMLActor",
  "_id": "CLS_USER",
  "_parent": { "$ref": "MDL001" },
  "name": "User"
}
```

**Class（边界类）**— 显示圆+竖线图标：

```jsonc
{
  "_type": "UMLClass",
  "_id": "CLS_VIEW",
  "_parent": { "$ref": "MDL001" },
  "name": "QuickMemoryView",
  "stereotype": { "$ref": "STEREO_BOUNDARY" }
}
```

**Class（控制类）**— 显示圆+箭头图标：

```jsonc
{
  "_type": "UMLClass",
  "_id": "CLS_CTRL",
  "_parent": { "$ref": "MDL001" },
  "name": "StudyController",
  "stereotype": { "$ref": "STEREO_CONTROL" }
}
```

**Class（实体类）**— 显示椭圆+横线图标：

```jsonc
{
  "_type": "UMLClass",
  "_id": "CLS_ENTITY",
  "_parent": { "$ref": "MDL001" },
  "name": "UserWordBind",
  "stereotype": { "$ref": "STEREO_ENTITY" }
}
```

---

### 3.3 协作属性（UMLAttribute）

```jsonc
{
  "_type": "UMLAttribute",
  "_id": "ATTR01",
  "_parent": { "$ref": "COL001" },
  "name": "User",
  "type": { "$ref": "CLS_USER" }
}
```

---

### 3.4 生命线模型（UMLLifeline）

```jsonc
{
  "_type": "UMLLifeline",
  "_id": "LL_M01",
  "_parent": { "$ref": "INT001" },
  "represent": { "$ref": "ATTR01" },
  "isMultiInstance": false
}
```

---

### 3.5 消息模型（UMLMessage）

```jsonc
{
  "_type": "UMLMessage",
  "_id": "MSG_M01",
  "_parent": { "$ref": "INT001" },
  "name": "开始学习()",
  "source": { "$ref": "LL_M01" },
  "target": { "$ref": "LL_M02" },
  "messageSort": "synchCall"
}
```

**messageSort 取值：**

| 值 | 含义 | 箭头样式 |
|----|------|----------|
| `"synchCall"` | 同步调用 | 实线 + 实心三角 |
| `"reply"` | 返回消息 | 虚线 + 开放三角 |
| `"asynchCall"` | 异步调用 | 实线 + 开放三角 |

---

### 3.6 BCE 标准配置文件（UMLProfile）

**必须添加**，否则生命线头部无法显示 BCE 图标。

```jsonc
{
  "_type": "UMLProfile",
  "_id": "PROFILE01",
  "_parent": { "$ref": "AAAAAAFF+h6SjaM2Hec=" },
  "name": "UMLStandardProfile",
  "ownedElements": [
    {
      "_type": "UMLStereotype",
      "_id": "STEREO_BOUNDARY",
      "_parent": { "$ref": "PROFILE01" },
      "name": "boundary",
      "icon": {
        "_type": "UMLImage",
        "_id": "STEREO_BOUNDARY_ICON",
        "_parent": { "$ref": "STEREO_BOUNDARY" },
        "width": 50, "height": 40,
        "content": "!icon 50 40\ne 10 0 50 40\nl 0 0 0 40\nl 0 20 10 20\n",
        "smallIcon": "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\"><circle fill=\"none\" stroke=\"#AD9400\" stroke-miterlimit=\"10\" cx=\"10.5\" cy=\"7.5\" r=\"4\"/><line fill=\"none\" stroke=\"#AD9400\" stroke-miterlimit=\"10\" x1=\"1\" y1=\"7.5\" x2=\"6.5\" y2=\"7.5\"/><line fill=\"none\" stroke=\"#AD9400\" stroke-miterlimit=\"10\" x1=\"1.5\" y1=\"3\" x2=\"1.5\" y2=\"12\"/></svg>"
      }
    },
    {
      "_type": "UMLStereotype",
      "_id": "STEREO_CONTROL",
      "_parent": { "$ref": "PROFILE01" },
      "name": "control",
      "icon": {
        "_type": "UMLImage",
        "_id": "STEREO_CONTROL_ICON",
        "_parent": { "$ref": "STEREO_CONTROL" },
        "width": 40, "height": 40,
        "content": "!icon 40 40\ne 5 5 35 35\nl 20 5 25 0\nl 20 5 25 10\n",
        "smallIcon": "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\"><circle fill=\"none\" stroke=\"#AC9531\" stroke-miterlimit=\"10\" cx=\"8.5\" cy=\"8.5\" r=\"4\"/><line fill=\"none\" stroke=\"#AC9531\" stroke-miterlimit=\"10\" x1=\"8.5\" y1=\"4.5\" x2=\"10\" y2=\"7\"/><line fill=\"none\" stroke=\"#AC9531\" stroke-miterlimit=\"10\" x1=\"8.5\" y1=\"4.5\" x2=\"10\" y2=\"2\"/></svg>"
      }
    },
    {
      "_type": "UMLStereotype",
      "_id": "STEREO_ENTITY",
      "_parent": { "$ref": "PROFILE01" },
      "name": "entity",
      "icon": {
        "_type": "UMLImage",
        "_id": "STEREO_ENTITY_ICON",
        "_parent": { "$ref": "STEREO_ENTITY" },
        "width": 50, "height": 40,
        "content": "!icon 50 40\ne 10 0 50 40\nl 0 20 10 20\n",
        "smallIcon": "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\"><ellipse fill=\"none\" stroke=\"#3060A0\" stroke-miterlimit=\"10\" cx=\"9\" cy=\"8\" rx=\"6\" ry=\"4\"/><line fill=\"none\" stroke=\"#3060A0\" stroke-miterlimit=\"10\" x1=\"3\" y1=\"8\" x2=\"9\" y2=\"8\"/></svg>"
      }
    }
  ]
}
```

---

## 四、视图元素详细结构

### 4.1 框架视图（UMLFrameView）

```jsonc
{
  "_type": "UMLFrameView",
  "_id": "FRAME01",
  "_parent": { "$ref": "SEQ001" },
  "model": { "$ref": "SEQ001" },
  "subViews": [
    {
      "_type": "LabelView",
      "_id": "FRAME01_NAME",
      "_parent": { "$ref": "FRAME01" },
      "font": "Arial;13;0", "parentStyle": true,
      "left": 40, "top": 13, "width": 130, "height": 13,
      "text": "序列图名称"
    },
    {
      "_type": "LabelView",
      "_id": "FRAME01_SD",
      "_parent": { "$ref": "FRAME01" },
      "font": "Arial;13;1", "parentStyle": true,
      "left": 21, "top": 13, "width": 13, "height": 13,
      "text": "sd"
    }
  ],
  "font": "Arial;13;0", "parentStyle": false,
  "left": 8, "top": 8, "width": 1120, "height": 780,
  "nameLabel": { "$ref": "FRAME01_NAME" },
  "frameTypeLabel": { "$ref": "FRAME01_SD" }
}
```

---

### 4.2 生命线视图（UMLSeqLifelineView）

```
UMLSeqLifelineView
 ├─ UMLNameCompartmentView     ← 名称区域（头部）
 │    ├─ LabelView (stereotype)  ← 刺激标签（隐藏）
 │    ├─ LabelView (name)        ← 名称标签（显示）
 │    ├─ LabelView (namespace)   ← 命名空间标签（隐藏）
 │    └─ LabelView (property)    ← 属性标签（隐藏）
 └─ UMLLinePartView             ← 虚线部分（生命线）
```

---

### 4.3 消息视图（UMLSeqMessageView）

```
UMLSeqMessageView
 ├─ EdgeLabelView (nameLabel)      ← 消息名称（显示）
 ├─ EdgeLabelView (stereotypeLabel) ← 刺激标签（隐藏）
 ├─ EdgeLabelView (propertyLabel)   ← 属性标签（隐藏）
 └─ UMLActivationView (activation)  ← 激活条（可选，推荐不加）
```

---

## 五、消息方向与箭头样式

| messageSort | 箭头样式 | 用途 |
|-------------|----------|------|
| `"synchCall"` | 实线 + 实心三角 ▶ | 同步调用（最常用） |
| `"reply"` | 虚线 + 开放三角 ▷ | 返回消息 |
| `"asynchCall"` | 实线 + 开放三角 ▷ | 异步调用 |

---

## 七、常见错误清单

| # | 错误 | 现象 | 修复 |
|---|------|------|------|
| 1 | Class 没加 `stereotype` | 生命线头部显示带 X 的方框 | 添加 `stereotype: { "$ref": "STEREO_xxx" }` |
| 2 | Attribute `_parent` 写错 | 属性找不到父级 | 确保指向 `UMLCollaboration` 的 `_id` |
| 3 | Lifeline `_parent` 写错 | 生命线模型找不到父级 | 确保指向 `UMLInteraction` 的 `_id` |
| 4 | `represent` 指向 Class | 显示异常 | 确保指向 `UMLAttribute` 的 `_id` |
| 5 | 消息名手动加序号 | `1 : 1: startStudy()` 双编号 | 消息名不加序号 |
| 6 | 忘记添加 `UMLProfile` | 生命线显示方框 | 添加包含 boundary/control/entity 的 Profile |
| 7 | `UMLProfile._parent` 写错 | Profile 找不到 | 确保指向 Project 的 `_id` |
| 8 | 用 `UMLLifelineView` | 生命线不渲染 | 改用 `UMLSeqLifelineView` |
| 9 | 缺少 `UMLLinePartView` | 虚线不显示 | 添加 linePart 子视图 |
| 10 | 缺少 `stereotypeDisplay` | 不显示 BCE 图标 | 添加 `"stereotypeDisplay": "icon"` |
| 11 | 用 `UMLMessageView` | 消息不渲染 | 改用 `UMLSeqMessageView` |
| 12 | `head`/`tail` 指向错误 | 消息箭头位置错误 | 指向 `UMLLinePartView` 而不是生命线视图 |
| 13 | 缺少 `points` 字段 | 消息箭头不显示 | 添加 `"points": "x1:y1;x2:y2"` |
| 14 | `_id` 重复 | JSON 解析异常或渲染错误 | 每个元素的 `_id` 必须唯一 |
| 15 | `_parent` 链断裂 | 元素不显示 | 确保每个元素的 `_parent` 指向正确的父级 |

---

## 九、ID 命名规范

| 元素类型 | ID 前缀 | 示例 |
|----------|---------|------|
| Project | 固定值 | `AAAAAAFF+h6SjaM2Hec=` |
| UMLModel | `MDL` | `MDL001` |
| UMLCollaboration | `COL` | `COL001` |
| UMLInteraction | `INT` | `INT001` |
| UMLSequenceDiagram | `SEQ` | `SEQ001` |
| UMLProfile | `PROFILE` | `PROFILE01` |
| UMLStereotype | `STEREO_` | `STEREO_BOUNDARY` |
| UMLClass | `CLS_` | `CLS_VIEW` |
| UMLActor | `CLS_` | `CLS_USER` |
| UMLAttribute | `ATTR` | `ATTR01` |
| UMLLifeline | `LL_M` | `LL_M01` |
| UMLMessage | `MSG_M` | `MSG_M01` |
| UMLFrameView | `FRAME` | `FRAME01` |
| UMLSeqLifelineView | `LL_V` | `LL_V01` |
| UMLLinePartView | `LL_V_LP` | `LL_V01_LP` |
| UMLNameCompartmentView | `LL_V_NC` | `LL_V01_NC` |
| UMLSeqMessageView | `MSG_V` | `MSG_V01` |
| EdgeLabelView | `MSG_V_L` | `MSG_V01_L` |
| UMLActivationView | `MSG_V_ACT` | `MSG_V01_ACT` |
| LabelView | `名称` | `FRAME01_NAME` |

---

## 十、快速参考：一个生命线的完整 JSON

```jsonc
// ===== 在 Collaboration.attributes 中添加 =====
{
  "_type": "UMLAttribute",
  "_id": "ATTR01",
  "_parent": { "$ref": "COL001" },
  "name": "显示名称",
  "type": { "$ref": "CLS_XXX" }
}

// ===== 在 Interaction.participants 中添加 =====
{
  "_type": "UMLLifeline",
  "_id": "LL_M01",
  "_parent": { "$ref": "INT001" },
  "represent": { "$ref": "ATTR01" },
  "isMultiInstance": false
}

// ===== 在 SequenceDiagram.ownedViews 中添加 =====
{
  "_type": "UMLSeqLifelineView",
  "_id": "LL_V01",
  "_parent": { "$ref": "SEQ001" },
  "model": { "$ref": "LL_M01" },
  "subViews": [
    {
      "_type": "UMLNameCompartmentView",
      "_id": "LL_V01_NC",
      "_parent": { "$ref": "LL_V01" },
      "model": { "$ref": "LL_M01" },
      "subViews": [
        { "_type": "LabelView", "_id": "LL_V01_NC_ST", "_parent": { "$ref": "LL_V01_NC" },
          "visible": false, "font": "Arial;13;0", "parentStyle": true, "height": 13 },
        { "_type": "LabelView", "_id": "LL_V01_NC_NM", "_parent": { "$ref": "LL_V01_NC" },
          "font": "Arial;13;1", "parentStyle": true,
          "left": 64, "top": 57, "width": 80, "height": 13, "text": "显示名称" },
        { "_type": "LabelView", "_id": "LL_V01_NC_NS", "_parent": { "$ref": "LL_V01_NC" },
          "visible": false, "font": "Arial;13;0", "parentStyle": true,
          "width": 80, "height": 13, "text": "(from Interaction1)" },
        { "_type": "LabelView", "_id": "LL_V01_NC_PR", "_parent": { "$ref": "LL_V01_NC" },
          "visible": false, "font": "Arial;13;0", "parentStyle": true,
          "height": 13, "horizontalAlignment": 1 }
      ],
      "font": "Arial;13;0", "parentStyle": true,
      "left": 59, "top": 50, "width": 100, "height": 25,
      "stereotypeLabel": { "$ref": "LL_V01_NC_ST" },
      "nameLabel": { "$ref": "LL_V01_NC_NM" },
      "namespaceLabel": { "$ref": "LL_V01_NC_NS" },
      "propertyLabel": { "$ref": "LL_V01_NC_PR" }
    },
    {
      "_type": "UMLLinePartView",
      "_id": "LL_V01_LP",
      "_parent": { "$ref": "LL_V01" },
      "model": { "$ref": "LL_M01" },
      "font": "Arial;13;0", "parentStyle": false,
      "left": 89, "top": 76, "width": 1, "height": 680
    }
  ],
  "font": "Arial;13;0", "parentStyle": false,
  "left": 59, "top": 40, "width": 100, "height": 716,
  "stereotypeDisplay": "icon",
  "nameCompartment": { "$ref": "LL_V01_NC" },
  "linePart": { "$ref": "LL_V01_LP" }
}
```

---

## 十一、快速参考：一条消息的完整 JSON

```jsonc
// ===== 在 Interaction.messages 中添加 =====
{
  "_type": "UMLMessage",
  "_id": "MSG_M01",
  "_parent": { "$ref": "INT001" },
  "name": "消息名称()",
  "source": { "$ref": "LL_M01" },
  "target": { "$ref": "LL_M02" },
  "messageSort": "synchCall"
}

// ===== 在 SequenceDiagram.ownedViews 中添加 =====
{
  "_type": "UMLSeqMessageView",
  "_id": "MSG_V01",
  "_parent": { "$ref": "SEQ001" },
  "model": { "$ref": "MSG_M01" },
  "subViews": [
    { "_type": "EdgeLabelView", "_id": "MSG_V01_L",
      "_parent": { "$ref": "MSG_V01" }, "model": { "$ref": "MSG_M01" },
      "font": "Arial;13;0", "parentStyle": false,
      "left": 110, "top": 113, "width": 100, "height": 13,
      "alpha": 1.5707963267948966, "distance": 10,
      "hostEdge": { "$ref": "MSG_V01" }, "edgePosition": 1,
      "text": "消息名称()" },
    { "_type": "EdgeLabelView", "_id": "MSG_V01_SL",
      "_parent": { "$ref": "MSG_V01" }, "model": { "$ref": "MSG_M01" },
      "visible": false, "font": "Arial;13;0", "parentStyle": false,
      "left": 150, "top": 98, "height": 13,
      "alpha": 1.5707963267948966, "distance": 25,
      "hostEdge": { "$ref": "MSG_V01" }, "edgePosition": 1 },
    { "_type": "EdgeLabelView", "_id": "MSG_V01_PL",
      "_parent": { "$ref": "MSG_V01" }, "model": { "$ref": "MSG_M01" },
      "visible": false, "font": "Arial;13;0", "parentStyle": false,
      "left": 150, "top": 133, "height": 13,
      "alpha": -1.5707963267948966, "distance": 10,
      "hostEdge": { "$ref": "MSG_V01" }, "edgePosition": 1 }
  ],
  "font": "Arial;13;0", "parentStyle": false,
  "head": { "$ref": "LL_V02_LP" },
  "tail": { "$ref": "LL_V01_LP" },
  "points": "89:120;249:120",
  "nameLabel": { "$ref": "MSG_V01_L" },
  "stereotypeLabel": { "$ref": "MSG_V01_SL" },
  "propertyLabel": { "$ref": "MSG_V01_PL" }
}
```

---

## 十三、实战踩坑记录

### 13.1 `$ref` vs `_ref` 引用问题

**现象：** StarUML 打开文件后右侧模型浏览器显示正确结构，但主绘图区域完全空白。

**原因：** JavaScript 对象的 key 写成了 `_ref`（下划线），但 StarUML 只识别 `$ref`（美元符号）。

```javascript
// ❌ 错误
{ "_ref": "LL_M01_LP" }

// ✅ 正确
{ "$ref": "LL_M01_LP" }
```

### 13.2 消息视图缺少 `stereotypeLabel` 和 `propertyLabel`

**现象：** StarUML 打开后消息箭头不渲染或显示异常。

**原因：** `UMLSeqMessageView.subViews` 中必须包含 3 个 `EdgeLabelView`（nameLabel + stereotypeLabel + propertyLabel）。

### 13.3 `head`/`tail` 引用了模型 ID 而非视图 ID

**现象：** 消息箭头指向错误位置或不显示。

```
// ❌ 错误：指向模型层
"head": { "$ref": "LL_M02" }

// ✅ 正确：指向视图层的 LinePartView
"head": { "$ref": "LL_V02_LP" }
```

### 13.4 避免手动添加激活条

**建议：** 不要在 subViews 中放 `UMLActivationView`，让 StarUML 全自动管理。

### 13.5 返回消息必须设置 `messageSort: "reply"`

```jsonc
// 调用消息 - 不需要设置 messageSort
{ "_type": "UMLMessage", "name": "获取数据()", "source": {"$ref": "LL_M01"}, "target": {"$ref": "LL_M02"} }

// 返回消息 - 必须设置 messageSort: "reply"
{ "_type": "UMLMessage", "name": "返回数据", "source": {"$ref": "LL_M02"}, "target": {"$ref": "LL_M01"}, "messageSort": "reply" }
```

### 13.6 中文命名规范

所有用户可见的内容都使用中文：`name`、`text` 字段用中文，`_id` 保持英文。

---

*最后更新：2026-06-17*
