/**
 * ============================================================================
 * 知识点：作用域链与变量查找规则（由内向外）
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】进阶
 * 【前置知识】07_scope_and_closure/03_block_scope.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    作用域链（scope chain）是变量查找的"路线图"。当代码里用到某个标识符时，
 *    引擎会从"当前作用域"开始，一层一层往外找，直到最外层的全局作用域：
 *      当前块 → 外层块 → … → 当前函数 → 外层函数 → … → 模块作用域 → 全局作用域
 *    找到就用，找不到就抛 ReferenceError（读）或创建/报错（写）。
 *    这条"由内向外的链"就是作用域链。
 *
 * 2. 为什么需要
 *    理解作用域链才能回答这些问题：
 *      - 为什么内层函数能看到外层的变量，反过来不行？
 *      - 变量同名时到底用的是哪一个？
 *      - 为什么闭包能"记住"外层变量？
 *      - 为什么在函数里读一个不存在的变量会报错，而不是拿到 undefined？
 *
 * 3. 核心语法要点
 *    (1) 查找只朝"外"走，从不朝"内"走，也不会"横向"走到别的函数里。
 *    (2) 链的顺序是由"代码写在哪里（词法位置）"决定的，不是由"谁调用"决定的。
 *    (3) 遮蔽（shadowing）：内层同名变量会挡住外层，查找在遇到第一个同名时停止。
 *    (4) 读取时找不到 → ReferenceError（严格模式与非严格模式一致）；
 *        写入时找不到 → 严格模式抛 ReferenceError，非严格模式创建全局变量。
 *    (5) 链上的作用域数量在函数"定义时"就定下来了，所以作用域链又叫"词法作用域链"。
 *
 * 4. 常见陷阱
 *    - 以为函数能访问"调用它的地方"的变量（那是动态作用域，JS 不是）。
 *    - 内层声明了同名变量，导致本想改外层却改不了（遮蔽）。
 *    - 在深层嵌套里到处找变量，读代码时根本追不到来源 —— 应减少嵌套层级。
 *    - 误以为 `typeof` 也会抛错（typeof 对不存在的标识符是安全的）。
 *
 * 【运行方法】
 *   node 07_scope_and_closure/04_scope_chain.js
 *
 * 【预期输出】
 *   把作用域链的查找过程逐层打印出来，演示遮蔽、由内向外查找、
 *   以及"找不到时会怎样"的完整规则。
 * ============================================================================
 */

console.log('--- 1. 一条完整的作用域链 ---');

// 第 5 层（最外层）：模块作用域
const level5 = '模块作用域（最外层）';

function outer() {
  // 第 4 层：outer 的函数作用域
  const level4 = 'outer 的函数作用域';

  function middle() {
    // 第 3 层：middle 的函数作用域
    const level3 = 'middle 的函数作用域';

    function inner() {
      // 第 2 层：inner 的函数作用域
      const level2 = 'inner 的函数作用域';

      {
        // 第 1 层（最内层）：一个块级作用域
        const level1 = '最内层的块';

        // 逐层往上找，全都能找到。
        console.log('  从最内层向外一路找：');
        console.log('    level1 →', level1);
        console.log('    level2 →', level2);
        console.log('    level3 →', level3);
        console.log('    level4 →', level4);
        console.log('    level5 →', level5);
      }

      // 回到 inner 这一层：向内层的块里找已经不行了。
      console.log('  inner 里能找到 level1 吗？', typeof level1, '（块外找不到）');
      console.log('  inner 里能找到 level2 吗？', typeof level2);
    }

    inner();
    // 回到 middle 这一层：
    console.log('  middle 里能找到 level2 吗？', typeof level2, '（找不到，只能朝外找）');
    console.log('  middle 里能找到 level3 吗？', typeof level3);
  }

  middle();
  console.log('  outer 里能找到 level3 吗？', typeof level3);
}
outer();

console.log('--- 2. 查找只看"写在哪里"，不看"谁调用" ---');

const whoAmI = '模块层的 whoAmI';

function defineHere() {
  // 这个函数定义在模块层，它的作用域链里只有"模块作用域 → 全局"，
  // 完全没有"调用它的那个函数"的作用域。
  const localOne = 'defineHere 的局部变量';

  function reportFromHere() {
    // 这里能拿到 whoAmI（外层模块作用域），但拿不到 localOne 吗？
    // 能拿到 —— 因为 reportFromHere 定义在 defineHere 内部，localOne 在它的链上。
    return `whoAmI = ${whoAmI}；localOne = ${localOne}`;
  }
  return reportFromHere;
}

const reporter = defineHere();
console.log(' ', reporter());
console.log('  ↑ 关键点：reporter 是在模块顶层被调用的，但它依然访问到了');
console.log('    defineHere 内部的 localOne —— 因为作用域链由"定义位置"决定，与调用位置无关。');

console.log('--- 3. 遮蔽：查找遇到第一个同名就停止 ---');

const value = '最外层的 value';

function shadowLevelOne() {
  const value = 'shadowLevelOne 里的 value';

  function shadowLevelTwo() {
    const value = 'shadowLevelTwo 里的 value';

    function shadowLevelThree() {
      const value = 'shadowLevelThree 里的 value';
      // 这行用的是最近的那个 value。
      console.log('  最内层看到的 value →', value);
    }

    shadowLevelThree();
    console.log('  中间层看到的 value →', value);
  }

  shadowLevelTwo();
  console.log('  最外层看到的 value →', value);
}
shadowLevelOne();
console.log('  模块层看到的 value →', value);
console.log('  结论：每一层都有自己的 value，互不影响；查找在遇到第一个同名时立即停止。');

console.log('--- 4. 遮蔽的一个实用好处：避免意外改动外层 ---');

let counter = 0;
function incrementSafely() {
  // 这里故意用不同的名字，避免遮蔽带来的困惑。
  let localCounter = counter;
  localCounter += 1;
  return `函数内加到 ${localCounter}，外层的 counter 仍是 ${counter}`;
}
console.log(' ', incrementSafely());
console.log(' ', incrementSafely());

function incrementWrongly() {
  // 如果不小心又声明了一次，就会遮蔽外层的 counter，外层永远不会变。
  let counter = 0;
  counter += 1;
  return `函数内 ${counter}（但愿你以为外层也变了）`;
}
console.log(' ', incrementWrongly());
console.log('  外层的 counter 现在是 →', counter, '（确实没变）');

console.log('--- 5. 写入时的查找规则：找不到会怎样 ---');

function writeRules() {
  // 情况一：链上找得到 → 直接改那个变量。
  let found = '函数内的 found';
  function setFound() {
    found = '被内层函数改过了';
  }
  setFound();
  console.log('  链上找得到 → 改的是外层那个：', found);

  // 情况二：链上找不到 → 严格模式（模块默认严格模式）下抛 ReferenceError。
  function setNotFound() {
    try {
      // eslint-disable-next-line no-undef
      neverDeclared = 'some value';
    } catch (err) {
      console.log('  链上找不到（写入）→ 报错', err.constructor.name, ':', err.message);
      console.log('  非严格模式下这里会悄悄创建一个全局变量，这是历史遗留的大坑。');
    }
  }
  setNotFound();
}
writeRules();

console.log('--- 6. 读取时的查找规则：找不到就是 ReferenceError ---');

try {
  console.log(nothingHere);
} catch (err) {
  console.log('  读取不存在的变量 → 报错', err.constructor.name, ':', err.message);
}
// 例外：typeof 是唯一"安全"的探测方式。
console.log('  typeof nothingHere →', typeof nothingHere);

// 另一个例外：对象属性不存在时不会报错，只会得到 undefined。
const obj = { a: 1 };
console.log('  obj.b（不存在的属性）→', obj.b, '（属性查找和变量查找是两套规则）');

console.log('--- 7. 作用域链的可视化：把链上的名字列出来 ---');

// 在最内层用 typeof 逐个探测，看看哪些名字在作用域链上。
// （typeof 对不存在的标识符是安全的，不会抛错，非常适合用来探测。）
const moduleVar = 'module';

function buildChain() {
  const chain = [];

  function level3() {
    // 本来可以写成一个数组循环，但那样就得用 eval 动态求值（eval 会抛错且性能差），
    // 所以这里老老实实逐个探测，反而更清晰。
    const checks = [
      ['level1Var（在 buildChain 的函数体里）', typeof level1Var !== 'undefined'],
      ['level2Var（在 level2 的函数里）', typeof level2Var !== 'undefined'],
      ['moduleVar（在模块作用域）', typeof moduleVar !== 'undefined'],
    ];
    for (const [label, found] of checks) {
      chain.push(`${label} → ${found ? '找到' : '未找到'}`);
    }
  }

  function level2() {
    // level2Var 只在 level2 的作用域里，level3 里访问不到它。
    const level2Var = 'level2'; // eslint-disable-line no-unused-vars
    return level3();
  }

  const level1Var = 'level1'; // eslint-disable-line no-unused-vars
  level2();
  return chain;
}
console.log('  在 level3（最内层）里探测的结果：');
for (const line of buildChain()) {
  console.log('    ', line);
}
console.log('  说明：level1Var 定义在 buildChain 的函数体里，而 level3 又定义在 buildChain 内部，');
console.log('        所以它在 level3 的链上，能沿链找到；');
console.log('        moduleVar 在更外层的模块作用域，同样能找到；');
console.log('        level2Var 定义在 level2 里 —— level3 的链是 level3 → buildChain → 模块，');
console.log('        里面没有 level2，所以找不到。查找只能朝外，不能横向进入别的函数。');

console.log('--- 8. 减少嵌套的建议 ---');
const nestingAdvice = [
  ['每一层嵌套最多承担一件事', '嵌套越深，变量来源越难追'],
  ['优先用参数传值而不是靠外层变量', '参数的来源永远一目了然'],
  ['函数超过 3 层嵌套就考虑抽成独立函数', '抽出后作用域链变短，可读性显著提升'],
  ['需要跨层共享时，显式放进一个配置对象传下去', '比依赖作用域链隐式共享更清晰'],
];
for (const [rule, reason] of nestingAdvice) {
  console.log(`  · ${rule} —— ${reason}`);
}
