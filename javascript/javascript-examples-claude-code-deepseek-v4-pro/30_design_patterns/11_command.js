/**
 * ============================================================================
 * 知识点：命令模式 —— 把"操作"封装成对象（execute / undo / redo / 宏命令）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/10_proxy_pattern.js、14_classes（类的语法）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    命令模式把"一个请求"封装成一个对象，这个对象至少要有 execute()，
 *    通常还会有 undo()。于是"请求"从"一次函数调用"变成了**一等公民**：
 *    可以被保存、排队、序列化、撤销、重放、组合。
 *    四个角色：
 *      Command（命令）  ：定义 execute/undo 接口，持有"做什么"的全部信息；
 *      ConcreteCommand  ：具体命令，持有 Receiver 的引用与参数；
 *      Receiver（接收者）：真正干活的对象（这里是文档）；
 *      Invoker（调用者） ：持有命令并触发它，还负责维护历史栈（undo/redo）。
 *    关键点：**Invoker 不知道命令具体做什么**，它只会调用 execute/undo。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 编辑器撤销/重做：Ctrl+Z / Ctrl+Y 就是"历史栈 + 命令对象"。
 *    - 操作队列与批处理：把命令排队，依次执行（任务队列、作业调度）。
 *    - 可重放的日志：记录命令序列（而不是结果），故障后可重放恢复状态
 *      （事件溯源 Event Sourcing、数据库 WAL 都是这个思想）。
 *    - 宏命令：把多个命令组合成一个命令（"一键格式化 + 保存 + 提交"）。
 *    - 事务/回滚：每个命令可撤销，组合起来就是一个可回滚的事务。
 *    - UI 与业务解耦：菜单项/按钮/快捷键都只是"触发某个命令对象"，
 *      同一命令可以被多个入口触发，不用重复写逻辑。
 *
 * 3. 核心语法要点
 *    - execute() 与 undo() **必须严格对称可逆**：
 *      如果 execute 是"在位置 p 插入 s"，undo 就必须是"删除位置 p 起的 len(s) 个字符"。
 *      写错一个下标，撤销就会出现"越撤越乱"。
 *    - undo 时"需要的旧值"必须在 execute 时就存下来（前向信息不足以后向撤销）。
 *    - 历史栈 + 游标：
 *        history: [c1, c2, c3]
 *        cursor  : 指向"下一个要执行的位置"（或"最后一个已执行的位置"，两者选一口径并统一）
 *      本文件用"cursor 指向下一个待执行位置"的口径，undo 就是 cursor--，redo 就是 cursor++。
 *    - 执行新命令时必须**截断游标之后的历史**（否则 redo 会重放已废弃的分支）。
 *    - 历史栈必须有上限：无限增长就是内存泄漏（编辑器里输入 10 万字就是 10 万条命令）。
 *    - 宏命令（MacroCommand）：内部持有一个命令数组，
 *      execute 正序执行、undo **逆序**撤销（顺序反了状态就错了）。
 *
 * 4. 常见陷阱
 *    - undo 不对称：只存了"插入了什么"，没存"插入到哪"，撤销时不知道从哪删。
 *    - 忘记截断 redo 分支：新命令执行后，旧的前进历史还在，导致 Ctrl+Y 重放旧操作。
 *    - 游标口径混乱：一会儿把 cursor 当"已执行个数"，一会儿当"下标"，
 *      边界（空历史、栈底、栈顶）就会错。
 *    - 历史栈无上限：长时间运行必然 OOM。要么限制条数，要么做"命令合并"
 *      （连续输入的字符合并成一个 InsertText 命令，这是编辑器的常规优化）。
 *    - 命令持有可变引用：命令里存的应该是"值快照"，而不是"会被后续修改的对象"，
 *      否则撤销时读到的已经不是当初的值了。
 *    - 命令里做副作用（发网络请求、改全局状态）：撤销时这些副作用无法回滚，
 *      命令应当只操作可回滚的状态，外部副作用移到 Invoker 层。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/11_command.js
 *
 * 【预期输出】
 *   实现一个简单文本编辑器：InsertCommand / DeleteCommand / ReplaceCommand
 *   各自 execute/undo，CommandManager 作为 Invoker 提供 undo/redo 与历史上限，
 *   再演示宏命令（一次执行多个命令、逆序撤销），最后给出命令模式的代价
 *   与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. Receiver：真正干活的对象（一个极简文本缓冲区）
// ===========================================================================

console.log('--- 1. Receiver：文本缓冲区（真正干活的对象） ---');

/**
 * Receiver（接收者）：命令模式里真正持有数据、执行操作的对象。
 * 它**不知道命令的存在**，只是一组普通的字符串操作方法。
 * 这样设计的好处：Receiver 可以脱离命令模式单独使用/单独测试。
 */
class TextBuffer {
  #content = '';

  get content() {
    return this.#content;
  }

  get length() {
    return this.#content.length;
  }

  // ---- 三个原子操作：命令会用它们来实现 execute / undo ----

  /** 在 index 处插入 text */
  insertAt(index, text) {
    // 越界检查放在 Receiver 里，保证无论谁调用都安全
    if (index < 0 || index > this.#content.length) {
      throw new RangeError(`插入位置 ${index} 越界（当前长度 ${this.#content.length}）`);
    }
    this.#content = this.#content.slice(0, index) + text + this.#content.slice(index);
  }

  /** 删除 [index, index+length) 区间的字符，返回被删掉的内容 */
  removeAt(index, length) {
    if (index < 0 || index + length > this.#content.length) {
      throw new RangeError(`删除范围 [${index}, ${index + length}) 越界（当前长度 ${this.#content.length}）`);
    }
    const removed = this.#content.slice(index, index + length);
    this.#content = this.#content.slice(0, index) + this.#content.slice(index + length);
    return removed;
  }

  /** 只读切片（命令在 execute 前用它记录"旧值"） */
  sliceFrom(index, length) {
    return this.#content.slice(index, index + length);
  }
}

// ===========================================================================
// 2. Command 接口 + 三个具体命令
// ===========================================================================

console.log('\n--- 2. 具体命令：Insert / Delete / Replace ---');

/**
 * 命令接口。约定：
 *   execute() —— 执行，返回"是否改变了文档"（便于 Invoker 决定要不要入栈）
 *   undo()    —— 撤销，必须把状态**精确还原**到 execute 之前
 *   description —— 供 UI/日志显示的描述（命令作为一等公民的体现之一）
 */
class Command {
  execute() {
    throw new Error('命令必须实现 execute()');
  }
  undo() {
    throw new Error('命令必须实现 undo()');
  }
  get description() {
    return this.constructor.name;
  }
}

/**
 * 插入命令：在 index 处插入 text。
 * 对称性分析：
 *   正向：在 index 插入 text（长度 len）
 *   逆向：删除 [index, index + len)
 * → 所以 undo 需要的全部信息（index、text）在 execute 时就已经确定了，
 *   不需要额外记录任何"运行时才知道的"状态。这是最理想的命令形态。
 */
class InsertCommand extends Command {
  #buffer;
  #index;
  #text;

  constructor(buffer, index, text) {
    super();
    this.#buffer = buffer;
    this.#index = index;
    this.#text = text;
  }

  execute() {
    this.#buffer.insertAt(this.#index, this.#text);
    return true;
  }

  undo() {
    // 严格对称：插入多少就删多少，位置不变
    this.#buffer.removeAt(this.#index, this.#text.length);
  }

  get description() {
    // JSON.stringify 让空白字符可见（否则看不出插入的是空格还是换行）
    return `Insert(${JSON.stringify(this.#text)} @${this.#index})`;
  }
}

/**
 * 删除命令：删除 [index, index + length)。
 * 对称性分析：
 *   正向：删除 length 个字符，但这些字符的内容**丢掉了**
 *   逆向：必须把删掉的内容原样插回去
 * → 所以必须在 execute 时把"被删内容"保存下来（这就是"撤销需要预先记录状态"）。
 */
class DeleteCommand extends Command {
  #buffer;
  #index;
  #length;
  #removedText = null; // execute 时填充，undo 时使用

  constructor(buffer, index, length) {
    super();
    this.#buffer = buffer;
    this.#index = index;
    this.#length = length;
  }

  execute() {
    // ★关键：先记录被删掉的内容，再删。
    //   顺序反了就永远拿不到旧值了（这是新手最常犯的错）。
    this.#removedText = this.#buffer.removeAt(this.#index, this.#length);
    return true;
  }

  undo() {
    if (this.#removedText === null) {
      throw new Error('undo 之前必须先 execute（没有可恢复的内容）');
    }
    // 把当初删掉的内容插回原位
    this.#buffer.insertAt(this.#index, this.#removedText);
  }

  get description() {
    return `Delete(@${this.#index}, len=${this.#length})`;
  }
}

/**
 * 替换命令：把 [index, index+length) 换成 newText。
 * 它也可以用"删除 + 插入"两条命令组合实现（那就是宏命令了），
 * 但作为一个原子操作更清晰：撤销时一步回到原位。
 */
class ReplaceCommand extends Command {
  #buffer;
  #index;
  #length;
  #newText;
  #oldText = null;

  constructor(buffer, index, length, newText) {
    super();
    this.#buffer = buffer;
    this.#index = index;
    this.#length = length;
    this.#newText = newText;
  }

  execute() {
    // 同样：先存旧值
    this.#oldText = this.#buffer.sliceFrom(this.#index, this.#length);
    this.#buffer.removeAt(this.#index, this.#length);
    this.#buffer.insertAt(this.#index, this.#newText);
    return true;
  }

  undo() {
    // 逆操作：删掉新文本，写回旧文本
    this.#buffer.removeAt(this.#index, this.#newText.length);
    this.#buffer.insertAt(this.#index, this.#oldText);
  }

  get description() {
    return `Replace(@${this.#index}, ${JSON.stringify(this.#oldText ?? '?')} -> ${JSON.stringify(this.#newText)})`;
  }
}

// ===========================================================================
// 3. Invoker：命令管理器（历史栈 + undo / redo）
// ===========================================================================

console.log('\n--- 3. Invoker：历史栈与 undo/redo ---');

/**
 * Invoker（调用者）：它**不知道任何命令的具体含义**，
 * 只会调用 execute()/undo()，并负责维护历史。
 *
 * 游标口径（非常重要，必须统一）：
 *   history 是"已经执行过的命令序列"，cursor 是"下一个待执行的位置"。
 *     history = [c1, c2, c3], cursor = 3  → 三个都已执行，没有可 redo 的
 *   执行新命令：history[cursor] = cmd; cursor++（并截断 cursor 之后的部分）
 *   undo       ：cursor--; history[cursor].undo()
 *   redo       ：history[cursor].execute(); cursor++
 * 这样 canUndo = cursor > 0，canRedo = cursor < history.length，边界很干净。
 */
class CommandManager {
  #history = [];
  #cursor = 0; // 下一个待执行的位置
  #limit; // 历史栈上限（超过就丢弃最旧的）

  constructor(limit = 100) {
    this.#limit = limit;
  }

  /** 执行一个命令并写入历史 */
  execute(command) {
    command.execute();

    // ★关键一步：截断游标之后的历史。
    //   否则"撤销两步 → 做一件新事 → 重做"会重放出已被废弃的旧命令。
    if (this.#cursor < this.#history.length) {
      this.#history.length = this.#cursor;
    }

    this.#history.push(command);
    this.#cursor += 1;

    // 历史上限：超出就丢弃最旧的命令。
    // 注意丢弃后 cursor 也要跟着前移，否则游标会越界。
    if (this.#history.length > this.#limit) {
      const dropped = this.#history.shift();
      this.#cursor -= 1;
      console.log(`    （历史超过上限 ${this.#limit}，最旧的命令被丢弃：${dropped.description}）`);
    }
    return command;
  }

  get canUndo() {
    return this.#cursor > 0;
  }
  get canRedo() {
    return this.#cursor < this.#history.length;
  }

  /** 撤销：把游标前移一格，并让那条命令自我撤销 */
  undo() {
    if (!this.canUndo) return null;
    this.#cursor -= 1;
    const command = this.#history[this.#cursor];
    command.undo();
    return command;
  }

  /** 重做：重新执行游标处的命令，游标后移 */
  redo() {
    if (!this.canRedo) return null;
    const command = this.#history[this.#cursor];
    command.execute();
    this.#cursor += 1;
    return command;
  }

  /** 栈顶命令（刚执行的那条）。命令合并时要用它来判断"能不能并进上一条" */
  get lastCommand() {
    return this.#cursor > 0 ? this.#history[this.#cursor - 1] : null;
  }

  /** 供 UI/调试：列出历史与游标位置（'|' 标出当前游标） */
  describeHistory() {
    const parts = this.#history.map((c, i) => (i === this.#cursor ? `|${c.description}` : c.description));
    if (this.#cursor === this.#history.length) parts.push('|');
    return parts.join('  ');
  }

  get stats() {
    return { total: this.#history.length, cursor: this.#cursor, limit: this.#limit };
  }
}

// ---- 演示：编辑一段文本，然后一路撤销回去 ----

const buffer = new TextBuffer();
const manager = new CommandManager(50);

console.log('初始内容：', JSON.stringify(buffer.content));

manager.execute(new InsertCommand(buffer, 0, 'Hello'));
console.log('插入 "Hello" 后：', JSON.stringify(buffer.content));

manager.execute(new InsertCommand(buffer, 5, ' World'));
console.log('插入 " World" 后：', JSON.stringify(buffer.content));

manager.execute(new ReplaceCommand(buffer, 6, 5, 'JavaScript'));
console.log('替换 "World"->"JavaScript" 后：', JSON.stringify(buffer.content));

manager.execute(new DeleteCommand(buffer, 0, 6));
console.log('删除前 6 个字符后：', JSON.stringify(buffer.content));

console.log('\n历史栈（| 表示当前游标）：');
console.log('  ' + manager.describeHistory());
console.log('  canUndo =', manager.canUndo, '| canRedo =', manager.canRedo);

console.log('\n-- 连续撤销三次 --');
for (let i = 1; i <= 3; i += 1) {
  const cmd = manager.undo();
  console.log(`  撤销 ${i}：${cmd.description}  ->  ${JSON.stringify(buffer.content)}`);
}

console.log('\n-- 重做两次 --');
for (let i = 1; i <= 2; i += 1) {
  const cmd = manager.redo();
  console.log(`  重做 ${i}：${cmd.description}  ->  ${JSON.stringify(buffer.content)}`);
}

console.log('\n-- 撤销到底（回到空文档） --');
while (manager.canUndo) manager.undo();
console.log('  最终内容：', JSON.stringify(buffer.content), '| canUndo =', manager.canUndo);

// 全部重做，恢复到最后状态
while (manager.canRedo) manager.redo();
console.log('  全部重做后：', JSON.stringify(buffer.content));

// ===========================================================================
// 4. 陷阱演示：执行新命令会截断 redo 分支
// ===========================================================================

console.log('\n--- 4. 陷阱：新命令会截断 redo 分支 ---');

const b2 = new TextBuffer();
const m2 = new CommandManager();
m2.execute(new InsertCommand(b2, 0, 'ABC'));
m2.execute(new InsertCommand(b2, 3, 'DEF'));
console.log('  内容：', JSON.stringify(b2.content), '| 历史：', m2.describeHistory());

m2.undo();
console.log('  撤销一次：', JSON.stringify(b2.content), '| 历史：', m2.describeHistory());
console.log('  此时 canRedo =', m2.canRedo, '（"DEF" 那条命令还在前方等着被重做）');

// 关键：现在执行一条**新**命令
m2.execute(new InsertCommand(b2, 3, 'XYZ'));
console.log('  执行新命令插入 "XYZ"：', JSON.stringify(b2.content));
console.log('  历史：', m2.describeHistory());
console.log('  canRedo =', m2.canRedo, '—— "DEF" 已被永久丢弃（分支被截断）');
console.log(`  这是浏览器的行为标准：撤销后做了新操作，"重做"就作废了。
  如果不截断，redo 会把 DEF 插回来，文档内容和历史就完全对不上了。`);

// ===========================================================================
// 5. 宏命令：把多个命令合成一个
// ===========================================================================

console.log('\n--- 5. 宏命令（MacroCommand） ---');

/**
 * 宏命令本身也是一个命令（实现了同样的接口），
 * 所以它可以被放进历史栈、也可以被嵌套进另一个宏 —— 这就是组合的力量。
 *
 * 执行顺序：正序执行（先做什么后做什么，有依赖关系）
 * 撤销顺序：**逆序撤销**（后做的先撤，否则中间状态会出错）
 */
class MacroCommand extends Command {
  #commands;
  #label;

  constructor(label, commands) {
    super();
    this.#label = label;
    this.#commands = commands;
  }

  execute() {
    // 逐个执行；如果中途失败，把已执行的**逆序回滚**，保证宏的原子性
    const done = [];
    try {
      for (const cmd of this.#commands) {
        cmd.execute();
        done.push(cmd);
      }
      return true;
    } catch (err) {
      console.log(`    ⚠ 宏命令执行失败（${err.message}），正在回滚已执行的 ${done.length} 步`);
      // 逆序回滚，恢复到宏开始前的状态
      for (const cmd of [...done].reverse()) cmd.undo();
      throw err; // 让调用方知道这个宏没成功
    }
  }

  undo() {
    // ★逆序撤销：这是宏命令最容易写错的地方
    for (const cmd of [...this.#commands].reverse()) {
      cmd.undo();
    }
  }

  get description() {
    return `${this.#label}[${this.#commands.length}步]`;
  }
}

const b3 = new TextBuffer();
const m3 = new CommandManager();

/** 一个"格式化标题"的宏：先插入标记，再插入标题，再把光标概念上移到开头 */
function makeTitleMacro(buffer, title) {
  return new MacroCommand('TitleMacro', [
    new InsertCommand(buffer, 0, `# ${title}`),
    new InsertCommand(buffer, 0, '\n'),
  ]);
}

m3.execute(makeTitleMacro(b3, '命令模式'));
console.log('  执行宏命令后：', JSON.stringify(b3.content));
m3.undo();
console.log('  撤销宏命令后：', JSON.stringify(b3.content), '（完全还原）');
m3.redo();
console.log('  重做宏命令后：', JSON.stringify(b3.content));

// 宏的原子性：中途失败会回滚
const b4 = new TextBuffer();
const m4 = new CommandManager();
m4.execute(new InsertCommand(b4, 0, 'base'));
const failingMacro = new MacroCommand('FailingMacro', [
  new InsertCommand(b4, 4, '-step1'),
  new InsertCommand(b4, 999, '-step2'), // 越界，会抛错
]);
try {
  m4.execute(failingMacro);
} catch (err) {
  console.log('  宏失败：', err.name, '-', err.message);
}
console.log('  内容仍然是：', JSON.stringify(b4.content), '（第一步也被回滚了，宏是原子的）');

// ===========================================================================
// 6. 命令合并：控制历史栈增长
// ===========================================================================

console.log('\n--- 6. 历史栈的代价：合并连续输入 ---');

/**
 * 编辑器里连续输入 100 个字符，如果每条都是一个命令，
 * 历史栈就有 100 项 —— 内存与撤销体验都会崩坏。
 * 常规优化：**命令合并**（把连续的同类命令并成一条）。
 * 这里给 CommandManager 加一个"可合并"的辅助函数。
 */
class TypingCommand extends Command {
  #buffer;
  #index;
  #text;

  constructor(buffer, index, text) {
    super();
    this.#buffer = buffer;
    this.#index = index;
    this.#text = text;
  }

  /** 能否与"紧接着的下一条命令"合并：位置相接且都是追加字符 */
  canMergeWith(other) {
    return other instanceof TypingCommand && other.#index === this.#index + this.#text.length;
  }

  mergeWith(other) {
    this.#text += other.#text;
    return this;
  }

  execute() {
    this.#buffer.insertAt(this.#index, this.#text);
    return true;
  }

  undo() {
    this.#buffer.removeAt(this.#index, this.#text.length);
  }

  get description() {
    return `Type(${JSON.stringify(this.#text)})`;
  }
}

const b5 = new TextBuffer();
const m5 = new CommandManager(1000);

/**
 * 模拟逐字符输入，并在入栈时尝试合并。
 * 合并的实现有个容易写错的点：不能只把文本拼上去就完事 ——
 * 缓冲区里的内容也要跟着"变成合并后的样子"。正确做法是：
 *    先 undo 旧命令（把短文本撤掉） -> 合并文本 -> 再 execute 新命令（写入长文本）
 * 这样 undo/execute 的对称性依然成立，撤销时删掉的正好是完整的那段文本。
 */
function typeChar(buffer, manager, ch) {
  const cmd = new TypingCommand(buffer, buffer.length, ch);
  const last = manager.lastCommand; // 栈顶命令

  if (last instanceof TypingCommand && last.canMergeWith(cmd)) {
    last.undo(); // ① 撤销旧的短版本
    last.mergeWith(cmd); // ② 把新字符并进去（命令变长）
    last.execute(); // ③ 重新执行，写入变长后的文本
    return 'merged';
  }

  manager.execute(cmd); // 不能合并：作为一条新命令入栈
  return 'pushed';
}

const word = 'CommandPattern';
const results = [...word].map((ch) => typeChar(b5, m5, ch));
console.log('  输入内容：', JSON.stringify(b5.content));
console.log('  逐字符数：', word.length, '| 合并次数：', results.filter((r) => r === 'merged').length);
console.log('  历史栈实际长度：', m5.stats.total, '（如果没有合并，这里会是', word.length, '）');
console.log(`  逐字符输入的 ${word.length} 个字符被合并成 1 条命令，`);
console.log('  撤销一次就全部退回 —— 这正是编辑器的真实行为。');
m5.undo();
console.log('  一次撤销后：', JSON.stringify(b5.content));

// ===========================================================================
// 7. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 7. 命令模式的代价与不适用场景 ---');

console.log(`【代价】
  1) 类的数量爆炸：每个操作都要一个类。一个编辑器有 30 种操作，
     就是 30 个命令类 + 30 个 undo 实现。小项目里这个成本很明显。
  2) undo 必须严格对称，写错就"越撤越乱"：这是最难查的一类 bug，
     因为执行时一切正常，只在撤销时出错。**命令必须逐个配单测**
     （execute → 记录状态 → undo → 断言状态完全一致）。
  3) 内存代价：历史栈持有命令对象，命令又持有文本快照。
     一个 1MB 的替换操作，撤销栈里就存了 1MB。必须设上限 + 做命令合并。
  4) 无法撤销的副作用：网络请求、日志、文件写入、随机数 —— 这些撤销不了。
     命令只应操作**可回滚的状态**，外部副作用要挪到 Invoker 层单独处理。
  5) 间接层：一个简单的"改个标题"，现在是 命令类 + Invoker + 历史栈 三件套。
  6) 序列化成本：想让命令"可持久化/可重放"，命令必须是可序列化的纯数据，
     这意味着不能用闭包捕获函数 —— 会限制实现方式。

【什么时候不该用】
  1) 不需要撤销/重放/排队：那就是一次普通的方法调用，
     把操作封装成类只会增加文件数量。
     **命令模式的价值全部来自"请求需要被当作数据处理"这一需求。**
  2) 只有 1~2 个操作：两个方法调用比两个命令类清楚得多。
  3) 状态无法回滚：如果操作是不可逆的（发送邮件、扣款），
     硬做 undo 只能是"发一封反向邮件"这种补偿操作 ——
     那叫 Saga/补偿事务，不是命令模式的 undo。
  4) 撤销粒度极细且高频（如每秒 1000 次输入）：
     命令对象的分配与历史栈管理会成为性能瓶颈；
     编辑器通常要做"合并 + 快照"的混合策略，而不是纯命令。
  5) 只是想要"可配置的回调"：那就是把函数存进数组，
     不需要 execute/undo 这套接口。

判断口诀：问自己三个问题 ——
  "需要撤销吗？需要重放/排队吗？需要把操作存起来以后再做吗？"
  三个都"不"，就别用命令模式。
  有一个"是"，命令模式就是最自然的选择。`);

console.log('\n全部演示完毕。');
