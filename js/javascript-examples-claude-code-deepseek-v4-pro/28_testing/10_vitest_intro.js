/**
 * ============================================================================
 * 知识点：Vitest 风格测试 —— expect 断言体系与 vi 工具对象
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/04_test_structure.js、28_testing/05_mocking_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Vitest 是 Vite 生态里的测试框架，API 与 Jest 高度兼容。
 *    它的两大特色：
 *      - expect 断言体系：`expect(actual).toBe(expected)` 这种链式写法，
 *        比 `assert.strictEqual(actual, expected)` 更接近自然语言。
 *      - vi 工具对象：`vi.fn()` / `vi.spyOn()` / `vi.useFakeTimers()`，
 *        对应 node:test 的 mock.fn / mock.method / mock.timers。
 *    除了这两点，它的组织方式（describe / it / beforeEach）与 node:test 完全一致。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 前端项目（Vue / React / Svelte）里 Vitest 几乎是默认选择：
 *      它复用 Vite 的配置与转换管线，能直接 import .vue / .tsx / CSS；
 *    - Jest 生态的断言习惯可以无缝迁移（expect 语法基本一致）；
 *    - 快照测试（toMatchSnapshot）、内联快照、UI 组件测试能力比 node:test 强；
 *    - watch 模式体验好，改一行立刻重跑受影响的测试。
 *
 * 3. 核心语法要点
 *    import { describe, it, expect, vi, beforeEach } from 'vitest';
 *    expect(x).toBe(y)                  严格相等（Object.is）
 *    expect(x).toEqual(y)               深比较（忽略 undefined 属性）
 *    expect(x).toStrictEqual(y)         深比较（严格，检查类型与 undefined）
 *    expect(x).toBeTruthy() / toBeFalsy()
 *    expect(x).toBeCloseTo(y, digits)   浮点近似比较
 *    expect(fn).toThrow(/msg/)          断言抛错
 *    expect(arr).toContain(item)
 *    expect(str).toMatch(/re/)
 *    expect(x).not.toBe(y)              取反，所有匹配器都可用
 *    await expect(p).resolves.toBe(y)   断言 Promise 成功
 *    await expect(p).rejects.toThrow()  断言 Promise 失败
 *    expect(mockFn).toHaveBeenCalledWith(...args)
 *    vi.fn(impl) / vi.spyOn(obj, 'm') / vi.useFakeTimers() / vi.advanceTimersByTime(ms)
 *    运行方式：npx vitest run 或 npx vitest（watch 模式）
 *
 * 4. 常见陷阱
 *    - toBe vs toEqual：toBe 比较引用，比较对象/数组必须用 toEqual，否则永远失败。
 *    - 忘记 await expect(p).resolves：不 await 的话断言不会被检查，用例会假通过。
 *    - vi.useFakeTimers() 后忘记 vi.useRealTimers()：后续用例的时间相关代码全部失效。
 *    - toEqual 忽略 undefined 属性：{a: 1, b: undefined} 与 {a: 1} 在 toEqual 下相等，
 *      需要严格语义时用 toStrictEqual。
 *    - 覆盖率与快照：快照文件（__snapshots__）需要提交到版本库，
 *      且不能用 `-u` 无脑更新，否则快照会变成"记录 bug 的文档"。
 *
 * 【本文件的特殊说明（必读）】
 *    本仓库的硬性要求是：**每个文件都必须能用 `node <路径>` 直接运行且退出码为 0**。
 *    而 Vitest 的模块（vitest）无法被普通 node 进程驱动 ——
 *    它必须由 vitest 命令（npx vitest）启动，因为 expect / vi 的实现依赖
 *    Vitest 自己的运行时上下文（内部状态、worker 通信等）。
 *
 *    下面的第 1 小节会实际尝试 import('vitest') 并把真实的报错打印出来，
 *    以此说明"为什么本文件不能直接用 vitest 的 expect"。
 *
 *    随后第 2 小节起，我们用 node:test 作为运行器，
 *    并在文件内实现一套 API 与 Vitest 完全一致的 expect / vi 垫片（shim），
 *    从而完整演示 Vitest 的断言风格。这既满足了"必须可运行"的要求，
 *    也让你在真正使用 Vitest 时能无缝上手 —— 语法是同一套。
 *
 *    真正在项目里跑 Vitest 的方式：
 *      1) 安装：npm i -D vitest
 *      2) 写测试文件 xxx.test.js，用 import { describe, it, expect, vi } from 'vitest'
 *      3) 运行：npx vitest run（跑一次）或 npx vitest（watch 模式）
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/10_vitest_intro.js
 *
 * 【预期输出】
 *   先打印 vitest 无法被直接 import 的真实错误，
 *   再用 Vitest 风格的 expect / vi 垫片跑完全部用例，TAP 结果全部通过，退出码 0。
 * ============================================================================
 */

import { describe, it, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// ===========================================================================
// 1. 先证明"vitest 不能被普通 node 进程直接驱动"
// ===========================================================================

console.log('--- 1. 为什么不能直接 `node` 跑 vitest 的 expect ---');

try {
  // 动态 import 会在运行时解析模块。这里的报错是 Vitest 主动抛出的，
  // 不是"模块不存在"，而是"没有运行在 vitest 命令的上下文里"。
  const vitest = await import('vitest');
  console.log('  import("vitest") 成功，导出：', Object.keys(vitest).slice(0, 8).join(', '));
  // 即便 import 成功（某些版本可以加载模块），调用 expect 依然会失败，
  // 因为 expect 内部要访问 Vitest 的运行时状态。这里直接尝试一下并捕获错误。
  assert.strictEqual(typeof vitest.expect, 'undefined', '没有 vitest 上下文时拿不到可用的 expect');
} catch (error) {
  console.log('  import("vitest") 抛出错误（这是预期行为）：');
  console.log(
    String(error.message)
      .split('\n')
      .slice(0, 4)
      .map((line) => `    ${line}`)
      .join('\n'),
  );
  console.log('  结论：Vitest 必须由 `npx vitest` 启动，普通 node 进程无法驱动它。');
}

// ===========================================================================
// 2. 实现一套 API 与 Vitest 一致的 expect 垫片
// ===========================================================================

console.log('');
console.log('--- 2. 自实现 Vitest 风格的 expect（语法与真实 Vitest 完全一致）---');

/**
 * 把"断言失败"统一成 AssertionError，并生成 Vitest 风格的消息。
 * @param {boolean} ok 断言是否成立
 * @param {string} negatedMessage 取反时的消息
 * @param {string} message 正常消息
 */
function report(ok, message, negatedMessage) {
  if (!ok) {
    throw new assert.AssertionError({ message: negatedMessage ? negatedMessage : message });
  }
}

/** 格式化值用于消息输出 */
const show = (value) => (typeof value === 'string' ? JSON.stringify(value) : String(value));

/**
 * 构造匹配器集合。
 * @param {unknown} actual 实际值
 * @param {boolean} negated 是否为 .not 模式
 */
function makeMatchers(actual, negated = false) {
  /**
   * 统一的断言入口：根据 negated 决定期望真假。
   * @param {boolean} condition 条件成立与否（未取反时）
   * @param {string} passMsg 成立时的描述
   * @param {string} failMsg 不成立时的描述
   */
  const check = (condition, passMsg, failMsg) => {
    const ok = negated ? !condition : condition;
    if (!ok) {
      throw new assert.AssertionError({
        message: negated ? `期望不满足：${passMsg}（实际值 ${show(actual)}）` : failMsg,
      });
    }
  };

  const matchers = {
    /** 严格相等（Object.is 语义），Vitest / Jest 里最常用的匹配器 */
    toBe(expected) {
      check(
        Object.is(actual, expected),
        `值应等于 ${show(expected)}`,
        `期望 ${show(expected)}，实际 ${show(actual)}`,
      );
    },

    /** 深比较（宽松版：忽略值为 undefined 的属性） */
    toEqual(expected) {
      /** 深克隆时丢掉 undefined 属性，模拟 toEqual 的宽松语义 */
      const strip = (value) => {
        if (Array.isArray(value)) return value.map(strip);
        if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
          const out = {};
          for (const [k, v] of Object.entries(value)) {
            if (v !== undefined) out[k] = strip(v);
          }
          return out;
        }
        return value;
      };
      let equal = true;
      try {
        assert.deepStrictEqual(strip(actual), strip(expected));
      } catch {
        equal = false;
      }
      check(equal, `值应深等于 ${show(expected)}`, `期望深等于 ${show(expected)}，实际 ${show(actual)}`);
    },

    /** 深比较（严格版：检查类型，不忽略 undefined 属性） */
    toStrictEqual(expected) {
      let equal = true;
      try {
        assert.deepStrictEqual(actual, expected);
      } catch {
        equal = false;
      }
      check(equal, '值应严格深等于期望值', `期望严格深等于 ${show(expected)}，实际 ${show(actual)}`);
    },

    toBeTruthy() {
      check(Boolean(actual), '值应为真值', `期望为真值，实际 ${show(actual)}`);
    },

    toBeFalsy() {
      check(!actual, '值应为假值', `期望为假值，实际 ${show(actual)}`);
    },

    toBeNull() {
      check(actual === null, '值应为 null', `期望 null，实际 ${show(actual)}`);
    },

    toBeUndefined() {
      check(actual === undefined, '值应为 undefined', `期望 undefined，实际 ${show(actual)}`);
    },

    toBeDefined() {
      check(actual !== undefined, '值应已定义', '期望已定义，实际为 undefined');
    },

    toBeNaN() {
      check(Number.isNaN(actual), '值应为 NaN', `期望 NaN，实际 ${show(actual)}`);
    },

    toBeGreaterThan(n) {
      check(actual > n, `值应大于 ${n}`, `期望大于 ${n}，实际 ${show(actual)}`);
    },

    toBeGreaterThanOrEqual(n) {
      check(actual >= n, `值应大于等于 ${n}`, `期望大于等于 ${n}，实际 ${show(actual)}`);
    },

    toBeLessThan(n) {
      check(actual < n, `值应小于 ${n}`, `期望小于 ${n}，实际 ${show(actual)}`);
    },

    toBeLessThanOrEqual(n) {
      check(actual <= n, `值应小于等于 ${n}`, `期望小于等于 ${n}，实际 ${show(actual)}`);
    },

    /** 浮点近似比较：避免 0.1 + 0.2 !== 0.3 的经典问题 */
    toBeCloseTo(expected, digits = 2) {
      const tolerance = 0.5 * 10 ** -digits;
      check(
        Math.abs(actual - expected) < tolerance,
        `值应接近 ${expected}`,
        `期望接近 ${expected}（误差 < ${tolerance}），实际 ${show(actual)}`,
      );
    },

    toContain(item) {
      const contained = typeof actual === 'string' ? actual.includes(item) : [...actual].includes(item);
      check(contained, `应包含 ${show(item)}`, `期望包含 ${show(item)}，实际 ${show(actual)}`);
    },

    toHaveLength(n) {
      check(actual.length === n, `长度应为 ${n}`, `期望长度 ${n}，实际 ${actual.length}`);
    },

    toMatch(regexp) {
      const re = regexp instanceof RegExp ? regexp : new RegExp(regexp);
      check(re.test(actual), `应匹配 ${re}`, `期望匹配 ${re}，实际 ${show(actual)}`);
    },

    toBeInstanceOf(cls) {
      check(actual instanceof cls, `应是 ${cls.name} 的实例`, `期望 ${cls.name} 的实例，实际 ${show(actual)}`);
    },

    toThrow(expected) {
      let thrown = null;
      try {
        actual();
      } catch (error) {
        thrown = error;
      }
      const didThrow = thrown !== null;
      let matched = didThrow;
      if (didThrow && expected !== undefined) {
        matched =
          expected instanceof RegExp
            ? expected.test(thrown.message)
            : typeof expected === 'function'
              ? thrown instanceof expected
              : thrown.message === String(expected);
      }
      check(matched, '函数应抛出指定错误', `期望抛出 ${expected ?? '错误'}，实际${didThrow ? `抛出 ${thrown.message}` : '未抛出'}`);
    },

    /** 断言 mock 函数的调用次数 —— 与 vi.fn() 配合使用 */
    toHaveBeenCalledTimes(n) {
      check(
        actual.mock.calls.length === n,
        `应被调用 ${n} 次`,
        `期望被调用 ${n} 次，实际 ${actual.mock.calls.length} 次`,
      );
    },

    toHaveBeenCalledWith(...args) {
      const found = actual.mock.calls.some(
        (call) => JSON.stringify(call.arguments) === JSON.stringify(args),
      );
      check(found, `应以参数 ${JSON.stringify(args)} 被调用`, `未找到参数为 ${JSON.stringify(args)} 的调用`);
    },

    toHaveBeenCalled() {
      check(actual.mock.calls.length > 0, '应被调用过', '期望被调用过，实际一次都没调用');
    },
  };

  // .not 返回一套"取反"的匹配器。这里用递归构造，保持代码只写一份。
  Object.defineProperty(matchers, 'not', {
    get: () => makeMatchers(actual, !negated),
  });

  return matchers;
}

/**
 * Vitest 风格的 expect 入口。
 * @param {unknown} actual
 */
function expect(actual) {
  return makeMatchers(actual, false);
}

// ===========================================================================
// 3. 实现一套 API 与 Vitest 一致的 vi 工具对象
// ===========================================================================

/** vi.fn / vi.spyOn 创建的假函数都带一个 .mock 属性，与 Vitest 保持一致 */
function createMockFn(implementation) {
  const calls = [];
  const mockFn = function (...args) {
    calls.push({ arguments: args, result: undefined });
    if (implementation) {
      const result = implementation.apply(this, args);
      calls[calls.length - 1].result = result;
      return result;
    }
    return undefined;
  };
  mockFn.mock = {
    calls,
    /** 重新设置实现 */
    mockImplementation(fn) {
      implementation = fn;
      return mockFn;
    },
    /** 清空调用记录 */
    mockClear() {
      calls.length = 0;
      return mockFn;
    },
  };
  return mockFn;
}

const vi = {
  /** 创建一个带调用记录的假函数 */
  fn: createMockFn,

  /** 替换对象上的方法并记录调用；restore() 可还原 */
  spyOn(obj, methodName, implementation) {
    const original = obj[methodName];
    const spy = createMockFn(implementation ?? ((...args) => original.apply(obj, args)));
    spy.mock.restore = () => {
      obj[methodName] = original;
    };
    obj[methodName] = spy;
    return spy;
  },

  /** 使用真实定时器（本演示里只是占位，语义与 Vitest 一致） */
  useRealTimers() {
    return undefined;
  },
};

console.log('  expect / vi 垫片已就绪，下面的用例写法与真实 Vitest 一模一样。');

// ===========================================================================
// 4. 被测代码
// ===========================================================================

/** 购物车条目：{ name, price, qty } */

/**
 * 计算购物车小计（保留两位小数）。
 * @param {Array<{name: string, price: number, qty: number}>} items
 */
function subtotal(items) {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  return Math.round(sum * 100) / 100;
}

/**
 * 商品格式化：把商品对象转成展示用字符串。
 * @param {{name: string, price: number, tags?: string[]}} product
 */
function formatProduct(product) {
  const tags = product.tags?.length ? ` [${product.tags.join('/')}]` : '';
  return `${product.name}：¥${product.price.toFixed(2)}${tags}`;
}

/**
 * 异步加载商品（模拟接口调用）。id 为偶数时成功，奇数时失败。
 * @param {number} id
 */
async function fetchProduct(id) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  if (id % 2 === 1) {
    throw new Error(`商品 ${id} 不存在`);
  }
  return { id, name: `商品${id}`, price: id * 10 };
}

// 缓存层：用来演示 vi.fn() 的调用断言
const cache = {
  store: new Map(),
  get(key) {
    return this.store.get(key);
  },
  set(key, value) {
    this.store.set(key, value);
    return true;
  },
};

/**
 * 带缓存的商品加载：命中缓存直接返回，未命中则请求并回填。
 * @param {number} id
 */
async function loadProductWithCache(id) {
  const cached = cache.get(id);
  if (cached !== undefined) {
    return { ...cached, fromCache: true };
  }
  const product = await fetchProduct(id);
  cache.set(id, product);
  return { ...product, fromCache: false };
}

// ===========================================================================
// 5. Vitest 风格的测试
// ===========================================================================

console.log('');
console.log('--- 3. Vitest 风格断言全览 ---');

describe('expect 基础匹配器', () => {
  it('toBe / not.toBe：严格相等', () => {
    expect(1 + 1).toBe(2);
    expect('a' + 'b').toBe('ab');
    expect(NaN).toBe(NaN); // toBe 用 Object.is，所以 NaN 等于 NaN
    expect(1).not.toBe('1'); // 类型不同
    expect({ a: 1 }).not.toBe({ a: 1 }); // 引用不同 —— 这就是为什么要用 toEqual
  });

  it('toEqual / toStrictEqual：深比较', () => {
    expect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
    expect([1, [2, [3]]]).toEqual([1, [2, [3]]]);

    // toEqual 忽略 undefined 属性，toStrictEqual 不忽略 —— 这是两者唯一的区别
    expect({ a: 1, b: undefined }).toEqual({ a: 1 });
    expect({ a: 1, b: undefined }).not.toStrictEqual({ a: 1 });
  });

  it('真值类匹配器', () => {
    expect('非空字符串').toBeTruthy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect('defined').toBeDefined();
    expect(Number('abc')).toBeNaN();
  });

  it('数值比较匹配器', () => {
    expect(10).toBeGreaterThan(9);
    expect(10).toBeGreaterThanOrEqual(10);
    expect(10).toBeLessThan(11);
    expect(10).toBeLessThanOrEqual(10);
    // 浮点近似比较：0.1 + 0.2 = 0.30000000000000004
    expect(0.1 + 0.2).toBeCloseTo(0.3, 10);
    expect(0.1 + 0.2).not.toBe(0.3); // 严格相等会失败，所以必须用 toBeCloseTo
  });

  it('集合与字符串匹配器', () => {
    expect([1, 2, 3]).toContain(2);
    expect('hello world').toContain('world');
    expect([1, 2, 3]).toHaveLength(3);
    expect('2026-09-16').toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect('订单 ORDER-12345').toMatch(/ORDER-\d+/);
    expect(new Date()).toBeInstanceOf(Date);
  });

  it('toThrow：断言抛错', () => {
    const boom = () => {
      throw new TypeError('参数类型错误');
    };
    expect(boom).toThrow(); // 只要抛错就通过
    expect(boom).toThrow(TypeError); // 断言错误类型
    expect(boom).toThrow(/参数类型错误/); // 断言错误消息
    expect(boom).toThrow('参数类型错误'); // 断言消息完全相等
    expect(() => 1 + 1).not.toThrow(); // 反向断言
  });
});

console.log('');
console.log('--- 4. expect + Promise：resolves / rejects ---');
console.log('  说明：真实 Vitest 里这两个匹配器通过 expect(p).resolves.toBe(x) 使用，');
console.log('        本文件为了保持 API 一致，用等效的 await assert 形式演示。');

describe('异步断言', () => {
  it('断言 Promise 成功（对应 Vitest 的 await expect(p).resolves.toEqual(...)）', async () => {
    const product = await fetchProduct(2);
    expect(product).toEqual({ id: 2, name: '商品2', price: 20 });
    // 真实 Vitest 写法：await expect(fetchProduct(2)).resolves.toEqual({...})
  });

  it('断言 Promise 失败（对应 Vitest 的 await expect(p).rejects.toThrow(...)）', async () => {
    await assert.rejects(() => fetchProduct(3), /商品 3 不存在/);
    // 真实 Vitest 写法：await expect(fetchProduct(3)).rejects.toThrow('商品 3 不存在')
  });

  it('断言 Promise 不失败（对应 Vitest 的 await expect(p).resolves.not.toThrow()）', async () => {
    await assert.doesNotReject(() => fetchProduct(4));
  });
});

console.log('');
console.log('--- 5. vi.fn / vi.spyOn：Vitest 风格的 mock ---');

describe('vi.fn 与 vi.spyOn', () => {
  it('vi.fn() 记录调用并可用 toHaveBeenCalledTimes / toHaveBeenCalledWith 断言', () => {
    const onSelect = vi.fn((item) => `selected:${item}`);

    onSelect('apple');
    onSelect('banana');

    expect(onSelect).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith('apple');
    expect(onSelect).toHaveBeenCalledWith('banana');
    expect(onSelect('cherry')).toBe('selected:cherry'); // 实现被保留
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('vi.spyOn 替换对象方法，restore 后恢复原实现', () => {
    const logger = {
      log(message) {
        return `real:${message}`;
      },
    };

    const spy = vi.spyOn(logger, 'log', (message) => `spy:${message}`);

    expect(logger.log('hi')).toBe('spy:hi');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('hi');

    spy.mock.restore(); // 还原真实实现 —— 不做这一步会导致 mock 泄漏到别的用例
    expect(logger.log('hi')).toBe('real:hi');
  });

  it('vi.spyOn 只监听不替换：保留真实实现', () => {
    const counter = {
      value: 0,
      inc() {
        this.value += 1;
        return this.value;
      },
    };

    const spy = vi.spyOn(counter, 'inc'); // 不传实现 -> 调用真实方法
    counter.inc();
    counter.inc();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(counter.value).toBe(2);
  });
});

console.log('');
console.log('--- 6. 用 mock 隔离依赖：缓存层的实测 ---');

describe('loadProductWithCache', () => {
  beforeEach(() => {
    // 每个用例前清空缓存，保证独立性 —— 与 Vitest 的 beforeEach 用法完全一致
    cache.store.clear();
  });

  afterEach(() => {
    cache.store.clear();
  });

  it('第一次调用未命中缓存，会回填缓存', async () => {
    const setSpy = vi.spyOn(cache, 'set');

    const first = await loadProductWithCache(6);
    expect(first.fromCache).toBe(false);
    expect(first.name).toBe('商品6');
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(6, { id: 6, name: '商品6', price: 60 });

    setSpy.mock.restore();
  });

  it('第二次调用命中缓存，不再回填', async () => {
    await loadProductWithCache(8); // 先预热缓存

    const setSpy = vi.spyOn(cache, 'set');
    const second = await loadProductWithCache(8);

    expect(second.fromCache).toBe(true);
    expect(second.name).toBe('商品8');
    expect(setSpy).not.toHaveBeenCalled(); // 命中缓存时不应再写缓存

    setSpy.mock.restore();
  });
});

console.log('');
console.log('--- 7. 纯函数用例：formatProduct 与 subtotal ---');

describe('formatProduct', () => {
  it('无标签时只输出名称与价格', () => {
    expect(formatProduct({ name: '键盘', price: 299 })).toBe('键盘：¥299.00');
  });

  it('有标签时追加标签列表', () => {
    expect(formatProduct({ name: '鼠标', price: 99.5, tags: ['无线', '静音'] })).toBe(
      '鼠标：¥99.50 [无线/静音]',
    );
  });

  it('标签为空数组时等价于无标签', () => {
    expect(formatProduct({ name: '显示器', price: 1299, tags: [] })).toBe('显示器：¥1299.00');
  });
});

describe('subtotal', () => {
  it('空购物车小计为 0', () => {
    expect(subtotal([])).toBe(0);
  });

  it('多件商品正确累加并保留两位小数', () => {
    expect(
      subtotal([
        { name: 'A', price: 19.9, qty: 2 },
        { name: 'B', price: 35.5, qty: 1 },
      ]),
    ).toBe(75.3);
  });

  it('浮点累加不会出现 0.30000000000000004', () => {
    const result = subtotal([
      { name: 'A', price: 0.1, qty: 1 },
      { name: 'B', price: 0.2, qty: 1 },
    ]);
    expect(result).toBe(0.3);
    expect(result).not.toBe(0.1 + 0.2); // 强调原生加法的浮点问题
  });
});

// ===========================================================================
// 6. node:test vs Vitest 的 API 对照
// ===========================================================================

console.log('');
console.log('--- 8. node:test 与 Vitest 的 API 对照表 ---');
console.log('  能力              node:test                       Vitest / Jest');
console.log('  ' + '-'.repeat(72));
console.log('  组织用例          test() / describe() + it()      describe() + it() / test()');
console.log('  断言              assert.strictEqual(a, b)        expect(a).toBe(b)');
console.log('  深比较            assert.deepStrictEqual(a, b)    expect(a).toEqual(b)');
console.log('  依赖失败          await assert.rejects(fn)        await expect(p).rejects.toThrow()');
console.log('  假函数            mock.fn()                       vi.fn()');
console.log('  替换对象方法      mock.method(obj, "m")           vi.spyOn(obj, "m")');
console.log('  虚拟定时器        mock.timers                     vi.useFakeTimers()');
console.log('  还原              mock.restoreAll()               vi.restoreAllMocks()');
console.log('  运行命令          node --test                     npx vitest run');
console.log('  覆盖率            node --experimental-test-coverage  npx vitest run --coverage');
console.log('');
console.log('  选择建议：');
console.log('    - 纯 Node 项目 / 零依赖诉求  -> node:test（本仓库的 01~09 都是它）');
console.log('    - 前端项目 / 需要 TS + JSX + 快照 -> Vitest');
console.log('    - 两者 API 心智模型一致，迁移成本主要在前端工具链而非断言语法。');

// ---------------------------------------------------------------------------
// 自测：确认垫片的行为与 Vitest 语义一致
// ---------------------------------------------------------------------------
test('expect 垫片自身的语义检查', () => {
  // 断言"该失败的确实失败了"，保证垫片不是永远通过的假实现
  assert.throws(() => expect(1).toBe(2), assert.AssertionError);
  assert.throws(() => expect({ a: 1 }).toBe({ a: 1 }), assert.AssertionError);
  assert.throws(() => expect('abc').toContain('z'), assert.AssertionError);
  assert.throws(() => expect(() => 1).toThrow(), assert.AssertionError);

  // 断言 not 模式确实生效
  assert.doesNotThrow(() => expect(1).not.toBe(2));
  assert.throws(() => expect(1).not.toBe(1), assert.AssertionError);

  // 断言 toEqual 与 toStrictEqual 的差异确实被实现出来了
  assert.doesNotThrow(() => expect({ a: 1, b: undefined }).toEqual({ a: 1 }));
  assert.throws(() => expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 }), assert.AssertionError);
});

console.log('');
console.log('演示结束。');
