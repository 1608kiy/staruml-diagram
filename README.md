# ⭐ StarUML Diagram — Claude Code Skill

> 把代码 / 需求 / 数据库表 → StarUML 能直接打开的 `.mdj` 文件。
> 毕业设计画图不用再拖控件了。

## ✨ 功能

| 图表 | 触发词 | 能力 |
|------|--------|------|
| **序列图** | "画个登录序列图" / "API 调用流程" | BCE 图标、消息时序、自动编号、激活条 |
| **领域类图** | "类图" / "模块结构" | 关联 / 聚合◇ / 组合◆ / 继承△、多重性 |
| **ER 图** | "ER图" / "数据库表关系" | PK / FK / UQ 标注、外键关联 |

### 额外能力

- 🔍 **代码反向扫描** — 自动从 `@RestController` / `@Service` / `@Entity` 推断对象类型
- ✏️ **增量修改** — "在刚才那个图上加一条消息"，不用全量重生成
- 📦 **批量生成** — "帮我把所有模块的类图都画了"
- ✅ **友好验证** — 每个错误附修复建议，不用猜

## 📦 安装

```bash
git clone https://github.com/1608kiy/staruml-diagram.git ~/.claude/skills/staruml-diagram
```

重启 Claude Code 后即可使用。

## 🚀 使用

在 Claude Code 里直接说：

```
帮我画一个用户认证的序列图
```

```
根据这个 Controller 生成类图
```

```
把数据库表关系画成 ER 图
```

或者用斜杠命令：

```
/staruml-diagram
```

## 📁 结构

```
staruml-diagram/
├── SKILL.md                          # 主入口（触发词 + 速查表 + 工作流）
├── references/
│   ├── sequence-diagram-guide.md     # 序列图完整指南
│   ├── class-diagram-guide.md        # 领域类图完整指南
│   └── er-diagram-guide.md           # ER 图完整指南
├── templates/
│   ├── sequence-template.mdj         # 最小序列图模板（2 生命线）
│   ├── class-template.mdj            # 最小类图模板（3 类 2 关联）
│   ├── er-template.mdj               # 最小 ER 图模板（2 表 1 关联）
│   └── examples/
│       ├── quick-memory-sequence.mdj      # 实战：8 生命线 18 消息
│       ├── auth-module-class-diagram.mdj  # 实战：5 类 4 关联
│       └── system-er-diagram.mdj          # 实战：15 表 14 关联
├── scripts/
│   └── validate.js                   # 验证脚本（$ref / _id / 视图匹配）
└── README.md
```

## 🔧 验证

生成的 `.mdj` 文件可以用验证脚本检查：

```bash
node ~/.claude/skills/staruml-diagram/scripts/validate.js your-diagram.mdj
```

输出示例：

```
✓ JSON 格式合法
✓ 收集到 203 个 _id，无重复
✓ 所有 $ref 引用完整
✓ 生命线视图/模型数量匹配
✓ 消息视图/模型数量匹配
════════════════════════════════════════
✅ 全部通过！可在 StarUML 中打开。
```

## ⚠️ 常见问题

| StarUML 里的现象 | 原因 | 解决 |
|-----------------|------|------|
| 绘图区空白，模型浏览器正常 | `$ref` 写成了 `_ref` | 全文替换 |
| 生命线头部显示带 X 的方框 | 缺 `stereotype` 或 `UMLProfile` | 补充引用 |
| 消息箭头不显示 | `head/tail` 指向了模型层 | 改为指向视图层 |
| 返回消息显示实线 | 缺 `messageSort: "reply"` | 加上该字段 |
| `1 : 1: xxx` 双编号 | 消息名手动加了序号 | 去掉序号 |

## 📋 适用场景

- ✅ 毕业设计 / 课程报告的 UML 图
- ✅ 从 Spring Boot / Vue 代码反向生成结构图
- ✅ 从 PRD / 需求文档翻译成交互图
- ❌ 流程图（请用 draw.io / mermaid）
- ❌ 用例图 / 活动图 / 状态图（暂未覆盖）

## 📄 License

MIT
