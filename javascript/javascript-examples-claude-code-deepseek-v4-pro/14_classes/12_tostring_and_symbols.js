/**
 * ============================================================================
 * 知识点：定制对象的转换行为 —— Symbol.toPrimitive、toString、valueOf
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/06_getters_setters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    当对象参与运算、被打印、被比较时，JS 会把它"转换"成原始值。
 *    转换过程中会按顺序调用对象上的几个特殊方法：
 *      - Symbol.toPrimitive(hint)：最高优先级的自定义入口；
 *      - valueOf()：倾向转成"数字"；
 *      - toString()：倾向转成"字符串"。
 *
 * 2. 为什么需要
 *    - 可读性：console.log(obj) / 模板字符串里输出有意义的内容，而不是 [object Object]。
 *    - 数值语义：Money、Vector、Duration 这类值对象应当能直接相加减、比较大小。
 *    - 类型互操作：+obj、`${obj}`、String(obj)、Number(obj)、obj == 1 等都会走转换。
 *
 * 3. 核心语法要点
 *    - 转换的 hint 有三种：'default'（如 +、==、Date 之外的比较）、'number'、'string'。
 *        触发 'number' 的场景：Number(obj)、算术运算（除 +）、一元 +、位运算；
 *        触发 'string' 的场景：String(obj)、模板字符串、alert、String.prototype 上的方法；
 *        触发 'default' 的场景：+ 运算符、== 宽松相等。
 *    - 没有 Symbol.toPrimitive 时的顺序：
 *        hint 为 'default' 或 'number' → 先 valueOf 再 toString；
 *        hint 为 'string' → 先 toString 再 valueOf。
 *    - 若返回的不是原始值，就继续试下一个方法；都失败则抛 TypeError。
 *    - Symbol.toPrimitive 接收一个参数 hint（'default' / 'number' / 'string'），
 *      必须返回原始值，否则抛 TypeError。
 *    - 用 class 定义时：`[Symbol.toPrimitive](hint) { ... }` 是计算属性名方法。
 *    - 相关钩子还有：Symbol.iterator（可迭代）、Symbol.asyncIterator、
 *      Symbol.toStringTag（影响 Object.prototype.toString 的输出）。
 *
 * 4. 常见陷阱
 *    - 覆写 valueOf 返回对象 → 引擎继续用 toString，容易迷惑。
 *    - toString 里访问尚未初始化的字段，导致 "undefined" 出现在日志里。
 *    - 用 == 比较时转换链很绕（如 [] == false 为 true），优先用 ===。
 *    - Symbol.toPrimitive 若没考虑 hint 直接返回数字，模板字符串会得到数字而不是格式化文本。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/12_tostring_and_symbols.js
 *
 * 【预期输出】
 *   打印对象在字符串/数字/默认三种 hint 下的转换结果，并演示陷阱。
 * ============================================================================
 */

console.log('--- 1. 默认的转换结果 ---');

class Raw {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const raw = new Raw(1, 2);
// 默认继承自 Object.prototype.toString，只给出内部标签
console.log('模板字符串：', `raw = ${raw}`);
console.log('String(raw) =', String(raw));
console.log('Number(raw) =', Number(raw), '（NaN）');
console.log('+raw =', +raw);
console.log('Object.prototype.toString 的默认输出：', Object.prototype.toString.call(raw));

console.log('--- 2. 覆写 toString：让日志变好看 ---');

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // toString 影响 String(obj)、模板字符串、以及"需要字符串"的场合
  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
}

const pt = new Point(3, 4);
console.log('模板字符串：', `pt = ${pt}`);
console.log('String(pt) =', String(pt));
console.log('拼接字符串：', '坐标是 ' + pt);
// 但数组/对象里的打印可能仍然走 inspect（Node 会优先用自定义 inspect）
console.log('数组里的元素：', [pt]);
// 显式调用：
console.log('pt.toString() =', pt.toString());

console.log('--- 3. 覆写 valueOf：让对象能参与算术 ---');

class Money {
  // 用私有字段存"分"，避免浮点误差
  #cents;

  constructor(yuan) {
    // 输入按元，内部存分
    this.#cents = Math.round(yuan * 100);
  }

  get yuan() {
    return this.#cents / 100;
  }

  // valueOf 返回原始值（数字），于是算术运算可以直接用
  valueOf() {
    return this.#cents;
  }

  // toString 负责展示
  toString() {
    return `¥${this.yuan.toFixed(2)}`;
  }

  // 业务方法
  plus(other) {
    // other 会被 valueOf 自动转成数字
    return new Money((this.#cents + Number(other)) / 100);
  }
}

const a = new Money(1.1);
const b = new Money(2.2);
console.log('a =', String(a), '| b =', String(b));
console.log('a + b（走 valueOf）=', a + b, '（单位是分）');
console.log('Number(a) =', Number(a));
console.log('a > b ？', a > b, '（关系运算也会走 valueOf）');
console.log('a.plus(b) =', String(a.plus(b)));
// 注意 + 在 hint 为 'default' 时同样先试 valueOf，所以 a + b 得到数字而不是拼接
console.log('a + "" 得到：', a + '', '（字符串拼接时也走 valueOf，得到数字形式）');
console.log('`${a}` 得到：', `${a}`, '（模板字符串 hint 是 string，优先 toString）');

console.log('--- 4. Symbol.toPrimitive：统一入口，优先级最高 ---');

class Duration {
  constructor(seconds) {
    this.seconds = seconds;
  }

  // Symbol.toPrimitive 接收 hint 参数，是三种转换的统一入口。
  // 它的优先级高于 valueOf 和 toString。
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      // 数值场景：返回秒数
      return this.seconds;
    }
    if (hint === 'string') {
      // 字符串场景：返回人类可读的格式
      const m = Math.floor(this.seconds / 60);
      const s = this.seconds % 60;
      return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
    }
    // 'default'：+ 运算符、== 宽松比较
    return `Duration(${this.seconds}s)`;
  }
}

const dur = new Duration(125);
console.log('String(dur)  → hint=string  →', String(dur));
console.log('`${dur}`     → hint=string  →', `${dur}`);
console.log('Number(dur)  → hint=number  →', Number(dur));
console.log('+dur         → hint=number  →', +dur);
console.log('dur * 2      → hint=number  →', dur * 2);
console.log('dur + 1      → hint=default →', dur + 1);
// 因为 'default' 分支返回的是字符串 'Duration(125s)'，与数字 125 比较结果为 false。
// 这提醒我们：让 'default' 与 'number' 返回同一种类型，往往更符合直觉。
console.log('dur == 125   → hint=default →', dur == 125);
console.log('dur + dur    → hint=default →', dur + dur);

console.log('--- 5. 用 Object.prototype.toString 校验"返回原始值"的规则 ---');

class BadPrimitive {
  // 故意返回对象，违反约定 → 抛 TypeError
  [Symbol.toPrimitive]() {
    return { notPrimitive: true };
  }
}

const bad = new BadPrimitive();
try {
  console.log(`${bad}`);
} catch (err) {
  console.log('返回对象报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

console.log('--- 6. toStringTag：影响 Object.prototype.toString 的输出 ---');

class Vector {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Symbol.toStringTag 让 Object.prototype.toString 输出 [object Vector]
  get [Symbol.toStringTag]() {
    return 'Vector';
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }

  valueOf() {
    // 返回模长，方便比较大小
    return Math.hypot(this.x, this.y, this.z);
  }
}

const v = new Vector(1, 2, 2);
console.log('Object.prototype.toString.call(v) =', Object.prototype.toString.call(v));
console.log('String(v) =', String(v), '（走 toString）');
console.log('Number(v) =', Number(v), '（走 valueOf）');
console.log('v > 2 ？', v > 2);
console.log('对比没有 toStringTag 的对象：', Object.prototype.toString.call(new Point(1, 1)));

console.log('--- 7. 让对象可迭代：Symbol.iterator 顺带一提 ---');

class Playlist {
  #songs = [];
  constructor(name) {
    this.name = name;
  }
  add(song) {
    this.#songs.push(song);
    return this;
  }
  get length() {
    return this.#songs.length;
  }
  // 实现迭代协议后，对象就能用 for...of / 展开运算符 / Array.from
  [Symbol.iterator]() {
    // 直接借用数组的迭代器，并在每个元素前加上序号
    let index = 0;
    const songs = this.#songs;
    return {
      next() {
        if (index < songs.length) {
          const value = `${index + 1}. ${songs[index]}`;
          index += 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
  toString() {
    return `播放列表「${this.name}」共 ${this.#songs.length} 首`;
  }
}

const pl = new Playlist('通勤歌单').add('第一首').add('第二首').add('第三首');
console.log(String(pl));
for (const item of pl) {
  console.log('  •', item);
}
console.log('展开成数组：', [...pl]);
console.log('Array.from 长度：', Array.from(pl).length);

console.log('--- 8. 陷阱：只有 toString 没有 valueOf 时的意外 ---');

class OnlyToString {
  toString() {
    return '42';
  }
}

const ots = new OnlyToString();
// hint=string 时先 toString → '42'，符合预期
console.log('String(ots) =', String(ots));
// hint=number 时本应先 valueOf（继承自 Object，返回对象本身），
// 发现不是原始值，于是退回到 toString → '42'，再转成数字 42。
console.log('Number(ots) =', Number(ots), '（意外地能用！因为回退到了 toString）');
console.log('ots * 1 =', ots * 1);

console.log('--- 9. 陷阱：把对象放进模板字符串前要小心 null ---');

class MaybeValue {
  constructor(value) {
    // 这里保留 null，不做兜底
    this.value = value;
  }
  toString() {
    // 如果 value 是 null，模板里会打印 "null"，而不是空串
    return `值：${this.value}`;
  }
}

console.log(new MaybeValue(null).toString());
console.log(new MaybeValue(undefined).toString(), '（undefined 会变成 "undefined" 字样）');

console.log('\n全部演示完毕。');
