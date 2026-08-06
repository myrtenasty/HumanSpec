## Why

HumanSpec 学习闭环（init → propose → 实践 → verify → archive → next）需要项目级"活文档"作为上下文底座：`project.md`（产品目标）、`roadmap.md`（里程碑与候选切片）、`learner.md`（学习者状态）。当前已落地的 `human-learning` schema 和 7 个 humanspec workflow 骨架只处理 change 粒度的 artifacts，没有任何项目级文档协议——propose 无从选择 roadmap 切片，verify/archive 无处读写学习者状态，后续 6 个 roadmap change 全部悬空。

同时存在一个必须现在解决的冲突：上游 OpenSpec 曾把 `openspec/project.md` 视为遗留物并迁移到 `config.yaml` 的 `context` 字段，`legacy-cleanup` 至今按纯路径检测它并显示"迁移提示"。HumanSpec 要复活 `project.md` 作为活文档，同一路径两种语义，会导致 init 生成文档后下一次 init 自己提示"你的 project.md 需要迁移"。

## What Changes

- 定义项目级文档基础协议：`openspec/project.md`、`openspec/roadmap.md`、`openspec/learner.md` 的路径、frontmatter、分级结构与读取约定；初始化、更新与合并交互由后续 workflow change 实施。
- 新增三份文档模板，均带 frontmatter 标记（如 `type: humanspec-project`），该标记同时作为 legacy-cleanup 豁免的识别特征。
- 分级结构化：`project.md` 固定标题 markdown（人类维护为主）、`roadmap.md` 半机器可读（候选切片清单）、`learner.md` 机器可更新（知识缺口、已掌握条目）。
- 在 `humanspec-shared.ts` 单点定义项目文档路径与用途的共享指引，所有 humanspec workflow 模板引用，避免 7 个 workflow 各自硬编码路径。
- `legacy-cleanup` 的 `project.md` 迁移提示改为内容特征感知：带 HumanSpec 标记的 `project.md` 不提示迁移。
- 文档模板作为独立模板文件存放（按名字维护的常量列表登记），供后续 `add-humanspec-init-workflow` 消费；本 change 不实现 init 对话流程。

## Capabilities

### New Capabilities

- `humanspec-project-context`: 项目级活文档基础协议——三份模板的路径、frontmatter 与分级结构约定，以及 workflow 读取约定；初始化、归档/验证写回和重复初始化合并交互由后续 HumanSpec workflow change 实施。

### Modified Capabilities

- `legacy-cleanup`: `project.md` 迁移提示从纯路径检测改为内容特征感知，带 HumanSpec 标记的 `project.md` 不再被报告为需要迁移的遗留物。

## Impact

- `src/core/legacy-cleanup.ts`：`detectLegacyStructureFiles` 与迁移提示逻辑增加标记检测；显式按名字匹配，不引入模式匹配删除。
- `src/core/templates/workflows/humanspec-shared.ts`：新增项目文档读取指引常量。
- 新增模板文件（如 `src/core/templates/project-docs/` 下的 `project.md`、`roadmap.md`、`learner.md`）及登记常量列表。
- `src/core/templates/workflows/humanspec-*.ts`：各 workflow 模板引用共享指引（行为不变，仅补充上下文来源说明）。
- 测试：`test/core/legacy-cleanup.test.ts` 增加标记豁免用例；新增项目文档协议测试（模板存在、标记格式、路径跨平台）。
- 不修改 `human-learning` schema 本身；`learner.md` 与 change 级 `learning.md` 的关系（归档时回写）属于后续 archive change。
