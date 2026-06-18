#!/usr/bin/env node
/**
 * StarUML .mdj 文件验证脚本（带友好修复建议）
 * 用法: node validate.js <file.mdj>
 *
 * 每个错误都会附带修复建议，方便 AI 或用户直接定位问题。
 */

const fs = require('fs')

const filePath = process.argv[2]
if (!filePath) {
  console.error('用法: node validate.js <file.mdj>')
  process.exit(1)
}

let errorCount = 0
let warnCount = 0

function err(msg, fix) {
  console.error(`✗ ${msg}`)
  if (fix) console.error(`  → 修复: ${fix}`)
  errorCount++
}

function warn(msg, fix) {
  console.warn(`⚠ ${msg}`)
  if (fix) console.warn(`  → 建议: ${fix}`)
  warnCount++
}

function ok(msg) {
  console.log(`✓ ${msg}`)
}

// ── 1. JSON 解析 ──

let data
try {
  const raw = fs.readFileSync(filePath, 'utf8')
  data = JSON.parse(raw)
} catch (e) {
  err(`JSON 解析失败: ${e.message}`, '检查逗号、括号、引号是否配对。可用 JSON.stringify(data, null, 2) 格式化后检查')
  process.exit(1)
}
ok('JSON 格式合法')

// ── 2. 收集所有 _id + 唯一性 ──

const allIds = new Map()
function collectIds(obj, path) {
  if (!obj || typeof obj !== 'object') return
  if (obj._id) {
    if (allIds.has(obj._id)) {
      err(`重复 _id: "${obj._id}"`, `改其中一个 _id（如加后缀 _2），或合并两个元素`)
    }
    allIds.set(obj._id, path)
  }
  if (Array.isArray(obj)) {
    obj.forEach((e, i) => collectIds(e, `${path}[${i}]`))
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (k !== '$ref') collectIds(v, `${path}.${k}`)
    }
  }
}
collectIds(data, 'root')
if (errorCount === 0) ok(`收集到 ${allIds.size} 个 _id，无重复`)

// ── 3. $ref 引用完整性 ──

let brokenRefs = 0
function checkRefs(obj, path) {
  if (!obj || typeof obj !== 'object') return
  if (obj.$ref && !allIds.has(obj.$ref)) {
    err(`断裂引用: ${path} → "$ref":"${obj.$ref}"`, `目标 _id "${obj.$ref}" 不存在。检查拼写，或补充缺失的元素定义`)
    brokenRefs++
  }
  if (Array.isArray(obj)) {
    obj.forEach((e, i) => checkRefs(e, `${path}[${i}]`))
  } else {
    for (const [k, v] of Object.entries(obj)) checkRefs(v, `${path}.${k}`)
  }
}
checkRefs(data, 'root')
if (brokenRefs === 0) ok('所有 $ref 引用完整')

// ── 4. 顶层结构分析 ──

const model = (data.ownedElements || []).find(e => e._type === 'UMLModel')
const profile = (data.ownedElements || []).find(e => e._type === 'UMLProfile')
const modelElements = model ? (model.ownedElements || []) : []
const allTopLevel = data.ownedElements || []
const classes = [...allTopLevel, ...modelElements].filter(e => e._type === 'UMLClass')
const actors = allTopLevel.filter(e => e._type === 'UMLActor')
const associations = [...allTopLevel, ...modelElements].filter(e => e._type === 'UMLAssociation')
const generalizations = [...allTopLevel, ...modelElements].filter(e => e._type === 'UMLGeneralization')

console.log(`\n── 顶层结构 ──`)
console.log(`  Project: ${data.name || '(unnamed)'}`)
if (!model) err('缺少 UMLModel', '所有类/关联/图表必须放在 UMLModel.ownedElements 中')
else ok('UMLModel ✓')
console.log(`  UMLProfile: ${profile ? '✓ (可选)' : '无 (序列图建议添加)'}`)
console.log(`  UMLClass: ${classes.length}`)
console.log(`  UMLActor: ${actors.length}`)
console.log(`  UMLAssociation: ${associations.length}`)
console.log(`  UMLGeneralization: ${generalizations.length}`)

// ── 5. 检测图类型 ──

let diagramType = 'unknown'
let collab, interaction, seqDiagram, classDiagram

if (model) {
  collab = (model.ownedElements || []).find(e => e._type === 'UMLCollaboration')
  if (collab) {
    interaction = (collab.ownedElements || []).find(e => e._type === 'UMLInteraction')
    if (interaction) {
      seqDiagram = (interaction.ownedElements || []).find(e => e._type === 'UMLSequenceDiagram')
    }
  }
  classDiagram = (model.ownedElements || []).find(e => e._type === 'UMLClassDiagram')
  if (seqDiagram) diagramType = 'sequence'
  else if (classDiagram) diagramType = 'class'
}

const typeLabel = diagramType === 'sequence' ? '序列图' : diagramType === 'class' ? '类图/ER图' : '未知'
console.log(`\n检测到图类型: ${typeLabel}`)

// ── 6. 序列图特有检查 ──

if (diagramType === 'sequence' && seqDiagram) {
  if (!profile) warn('序列图缺少 UMLProfile', '添加 UMLProfile（含 boundary/control/entity stereotype），否则 BCE 图标显示为带 X 的方框')

  const lifelineViews = (seqDiagram.ownedViews || []).filter(v => v._type === 'UMLSeqLifelineView')
  const wrongLL = (seqDiagram.ownedViews || []).filter(v => v._type === 'UMLLifelineView')
  const messageViews = (seqDiagram.ownedViews || []).filter(v => v._type === 'UMLSeqMessageView')
  const wrongMSG = (seqDiagram.ownedViews || []).filter(v => v._type === 'UMLMessageView')
  const participants = interaction.participants || []
  const messages = interaction.messages || []

  if (wrongLL.length > 0)
    err(`使用了 UMLLifelineView (${wrongLL.length}个)`, '全部改为 UMLSeqLifelineView（多了 Seq 前缀）')
  if (wrongMSG.length > 0)
    err(`使用了 UMLMessageView (${wrongMSG.length}个)`, '全部改为 UMLSeqMessageView（多了 Seq 前缀）')

  console.log(`\n── 序列图统计 ──`)
  console.log(`  参与者(lifeline): ${participants.length}`)
  console.log(`  消息(message): ${messages.length}`)
  console.log(`  生命线视图: ${lifelineViews.length}`)
  console.log(`  消息视图: ${messageViews.length}`)

  if (lifelineViews.length !== participants.length)
    err(`生命线视图(${lifelineViews.length}) ≠ 参与者模型(${participants.length})`,
      '每个 UMLLifeline 必须有对应的 UMLSeqLifelineView，反之亦然')
  else ok('生命线视图/模型数量匹配')

  if (messageViews.length !== messages.length)
    err(`消息视图(${messageViews.length}) ≠ 消息模型(${messages.length})`,
      '每个 UMLMessage 必须有对应的 UMLSeqMessageView，反之亦然')
  else ok('消息视图/模型数量匹配')

  // 消息视图字段检查
  messageViews.forEach((mv, i) => {
    const label = mv.model?.$ref ? `(${mv.model.$ref})` : `#${i+1}`
    if (!mv.head) err(`消息视图 ${label} 缺少 head`, 'head 指向目标生命线的 UMLLinePartView._id')
    if (!mv.tail) err(`消息视图 ${label} 缺少 tail`, 'tail 指向源生命线的 UMLLinePartView._id')
    if (!mv.points) err(`消息视图 ${label} 缺少 points`, '格式: "源x:源y;目标x:目标y"')
  })

  // BCE stereotype 检查
  lifelineViews.forEach((lv, i) => {
    if (lv.stereotypeDisplay !== 'icon') {
      warn(`生命线视图 ${i+1} 缺少 stereotypeDisplay: "icon"`, 'BCE 图标可能不显示，加上此字段即可')
    }
  })

  // subViews 完整性检查
  messageViews.forEach((mv, i) => {
    const subs = mv.subViews || []
    const hasName = subs.some(s => s._type === 'EdgeLabelView' && s.visible !== false)
    const hasStereotype = subs.some(s => s._type === 'EdgeLabelView' && s.visible === false)
    if (!hasName || subs.filter(s => s._type === 'EdgeLabelView' && s.visible === false).length < 2) {
      warn(`消息视图 ${i+1} subViews 可能不完整`, '需要 3 个 EdgeLabelView: nameLabel(可见) + stereotypeLabel(隐藏) + propertyLabel(隐藏)')
    }
  })
}

// ── 7. 类图/ER 图特有检查 ──

if (diagramType === 'class' && classDiagram) {
  const classViews = (classDiagram.ownedViews || []).filter(v => v._type === 'UMLClassView')
  const assocViews = (classDiagram.ownedViews || []).filter(v => v._type === 'UMLAssociationView')

  console.log(`\n── 类图统计 ──`)
  console.log(`  类: ${classes.length}`)
  console.log(`  关联: ${associations.length}`)
  console.log(`  类视图: ${classViews.length}`)
  console.log(`  关联视图: ${assocViews.length}`)

  if (classViews.length !== classes.length)
    err(`类视图(${classViews.length}) ≠ 类模型(${classes.length})`,
      '每个 UMLClass 必须有对应的 UMLClassView')
  else ok('类视图/模型数量匹配')

  if (assocViews.length !== associations.length)
    err(`关联视图(${assocViews.length}) ≠ 关联模型(${associations.length})`,
      '每个 UMLAssociation 必须有对应的 UMLAssociationView')
  else ok('关联视图/模型数量匹配')

  // aggregation 检查
  const validAgg = ['none', 'shared', 'composite']
  associations.forEach((a, i) => {
    const e1 = a.end1?.aggregation || 'none'
    const e2 = a.end2?.aggregation || 'none'
    if (!validAgg.includes(e1))
      err(`关联 ${i+1} end1 aggregation="${e1}" 无效`, '改为 "none"(普通关联) / "shared"(聚合◇) / "composite"(组合◆)')
    if (!validAgg.includes(e2))
      err(`关联 ${i+1} end2 aggregation="${e2}" 无效`, '改为 "none"(普通关联) / "shared"(聚合◇) / "composite"(组合◆)')
    if (!a.end1?.reference) err(`关联 ${i+1} end1 缺少 reference`, 'reference 指向源类: {"$ref": "CLASS+xxx"}')
    if (!a.end2?.reference) err(`关联 ${i+1} end2 缺少 reference`, 'reference 指向目标类: {"$ref": "CLASS+xxx"}')
  })

  // 类视图 model 检查
  classViews.forEach((cv, i) => {
    if (!cv.model) err(`类视图 ${i+1} 缺少 model 字段`, 'model 指向 UMLClass._id: {"$ref": "CLASS+xxx"}')
  })

  // 关联视图字段检查
  assocViews.forEach((av, i) => {
    if (!av.head) err(`关联视图 ${i+1} 缺少 head`, 'head 指向目标类的 UMLClassView._id')
    if (!av.tail) err(`关联视图 ${i+1} 缺少 tail`, 'tail 指向源类的 UMLClassView._id')
    if (!av.model) err(`关联视图 ${i+1} 缺少 model`, 'model 指向 UMLAssociation._id')
    if (!av.points) err(`关联视图 ${i+1} 缺少 points`, '格式: "源中心x:源中心y;目标中心x:目标中心y"')
  })
}

// ── 8. 总结 ──

console.log(`\n${'═'.repeat(40)}`)
if (errorCount === 0 && warnCount === 0) {
  console.log('✅ 全部通过！可在 StarUML 中打开。')
} else {
  if (errorCount > 0) console.log(`❌ 发现 ${errorCount} 个错误，必须修复后才能在 StarUML 中正常显示。`)
  if (warnCount > 0) console.log(`⚠️  发现 ${warnCount} 个警告，建议修复但不强制。`)
  console.log('\n常见修复步骤:')
  console.log('  1. 先修 _id 重复 / 断裂引用（结构性问题）')
  console.log('  2. 再修视图-模型数量不匹配（遗漏元素）')
  console.log('  3. 最后修字段缺失（head/tail/model/points）')
}
