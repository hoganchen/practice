/**
 * ============================================================================
 * 知识点：对象展开运算符 —— 浅拷贝、合并、覆盖规则
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    展开运算符 ...（spread）用在对象字面量里，可以把一个对象的
 *    "所有可枚举自有属性"逐个复制到新对象中：
 *      const copy = { ...original };
 *    注意它是 ES2018 才加入的语法（之前只能用 Object.assign）。
 *
 * 2. 为什么需要
 *    (1) 想要一个"改动版"的对象，但不想污染原对象（React/Redux 的不可变更新模式）。
 *    (2) 想把多个配置对象合并成一个，且希望某几个字段有更高优先级。
 *    (3) 想要一个对象的浅拷贝，用最简短的写法。
 *
 * 3. 核心语法要点
 *    (1) 展开的是"自有 + 可枚举"属性；继承来的属性、不可枚举属性、
 *        Symbol 键（如果可枚举）需要区分对待——Symbol 键是会被展开的。
 *    (2) 覆盖规则：同一个键，**后写的赢**。{ ...a, ...b } 里 b 覆盖 a。
 *    (3) 展开的是"值本身"：对于对象/数组类型的值，复制的是引用。
 *        所以 { ...obj } 是浅拷贝（shallow copy），不是深拷贝（deep clone）。
 *    (4) 可以在展开前后追加/覆盖属性：{ ...a, extra: 1, key: '覆盖值' }。
 *    (5) 展开 null / undefined 是安全的：{ ...null } 得到 {}，不报错。
 *        但展开 5、'abc' 这类原始值也不报错：数字没有属性，字符串会展开成字符索引。
 *    (6) ... 用在函数调用/数组里是"数组展开"，与对象展开语法相同但场景不同。
 *
 * 4. 常见陷阱
 *    (1) 以为它是深拷贝：嵌套对象仍然是共享引用，改副本会连带改原对象。
 *    (2) 原型丢失：{ ...instanceOfClass } 得到的是普通对象，原型链被丢掉，方法没了。
 *    (3) getter 会被"求值"成普通属性值，不再保留 getter 的行为（见 06 号文件）。
 *    (4) 不可枚举属性不会被复制（如 Object.defineProperty 默认 enumerable: false）。
 *    (5) 数组也是对象，{ ...arr } 得到的是 { 0: ..., 1: ... } 这种下标对象，不是数组。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/04_spread_merge.js
 *
 * 【预期输出】
 *   分 6 个小节，演示展开拷贝、合并覆盖、浅拷贝陷阱与常见误用。
 * ============================================================================
 */

console.log('--- 1. 基本用法：浅拷贝一个对象 ---');

const original = { a: 1, b: 2, c: 3 };
const copy = { ...original };

console.log('original =', JSON.stringify(original));
console.log('copy     =', JSON.stringify(copy));
console.log('内容相同 =', JSON.stringify(original) === JSON.stringify(copy));
console.log('但不是同一个对象（=== 为 false） =', original === copy);

// 修改副本的顶层属性，不影响原对象——说明顶层确实是"复制"过的。
copy.a = 100;
console.log('改副本后 original.a =', original.a, '，copy.a =', copy.a);

console.log('\n--- 2. 合并多个对象：后面的覆盖前面的 ---');

const defaults = { theme: 'light', fontSize: 14, lang: 'zh-CN' };
const userPrefs = { theme: 'dark', fontSize: 16 };
const forced = { lang: 'en-US' };

// 从左到右依次铺开，同名键不断被后面的覆盖。
// 语义上就像"默认值 → 用户偏好 → 强制值"的优先级链。
const merged = { ...defaults, ...userPrefs, ...forced };
console.log('defaults  =', JSON.stringify(defaults));
console.log('userPrefs =', JSON.stringify(userPrefs));
console.log('merged    =', JSON.stringify(merged));

// 也可以在展开之后立刻覆盖某几个键，写起来比 Object.assign 更直观。
const withOverride = { ...defaults, theme: 'dark' };
console.log('展开后覆盖 theme =', JSON.stringify(withOverride));

// 更常见的用法：保留原对象，只改一个字段（不可变更新）。
const state = { count: 0, user: '张三', loading: false };
const nextState = { ...state, count: state.count + 1 };
console.log('原 state      =', JSON.stringify(state), '（没被改动）');
console.log('新 nextState  =', JSON.stringify(nextState));

console.log('\n--- 3. 浅拷贝陷阱：嵌套对象仍然共享 ---');

const nested = {
  name: '订单A',
  // 这个值是对象，属于"嵌套"层
  address: { city: '杭州', zip: '310000' },
  // 这个值是数组，也属于"嵌套"层
  items: ['苹果', '香蕉'],
};

const shallow = { ...nested };

// 顶层属性 name 是分开的：改副本不影响原对象。
shallow.name = '订单B';
console.log('改顶层 shallow.name 后，nested.name =', nested.name);

// 嵌套对象是共享的：改副本的 address 会连带改原对象！
shallow.address.city = '上海';
console.log('改嵌套 shallow.address.city 后，nested.address.city =', nested.address.city);
console.log('证明两者是同一个对象 =', shallow.address === nested.address);

// 同样地，数组也是共享引用。
shallow.items.push('橙子');
console.log('shallow.items.push 后，nested.items =', JSON.stringify(nested.items));

// 结论：{ ...obj } 只复制第一层。要真正独立，需要每一层都手动展开，
// 或者用深拷贝（见 12 号文件）。
const deeperCopy = { ...nested, address: { ...nested.address }, items: [...nested.items] };
deeperCopy.address.city = '北京';
deeperCopy.items.push('梨');
console.log('手动逐层拷贝后，原对象仍是 =', JSON.stringify(nested));

console.log('\n--- 4. 展开会丢失原型，也会丢方法 ---');

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // 这个方法定义在 Point.prototype 上，属于"继承属性"
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

const p = new Point(3, 4);
console.log('p.toString()        =', p.toString());
console.log('p 的原型是 Point.prototype =', Object.getPrototypeOf(p) === Point.prototype);

// 展开只复制"自有可枚举属性"，x、y 被复制了，但原型链被丢弃。
const pCopy = { ...p };
console.log('pCopy =', JSON.stringify(pCopy));
console.log('pCopy 的原型是 Object.prototype =', Object.getPrototypeOf(pCopy) === Object.prototype);
try {
  // pCopy.toString() 变成了 Object.prototype 上的默认实现
  console.log('pCopy.toString()    =', pCopy.toString());
} catch (err) {
  console.log('报错：', err.message);
}

console.log('\n--- 5. 展开会丢失不可枚举属性，getter 会被求值 ---');

const source = { visible: 1 };

// defineProperty 默认 enumerable: false，所以下面这个属性不会被展开复制。
Object.defineProperty(source, 'hidden', {
  value: '我是不可枚举属性',
  enumerable: false,
  writable: true,
  configurable: true,
});

// 定义一个 getter：它不是"一个固定的值"，而是每次访问时现算。
Object.defineProperty(source, 'derived', {
  get() {
    return `动态计算于 ${source.visible}`;
  },
  enumerable: true,
  configurable: true,
});

console.log('source.hidden  =', source.hidden, '（直接访问能拿到）');
console.log('source.derived =', source.derived, '（getter 现算）');

const cloned = { ...source };
console.log('展开后 cloned =', JSON.stringify(cloned));
console.log("cloned.hidden  =", cloned.hidden, '（丢失了）');
console.log("cloned.derived =", cloned.derived, '（getter 被求值成了一个静态字符串）');

// 验证 derived 在副本上已经不是 getter 了，而是普通数据属性。
const desc = Object.getOwnPropertyDescriptor(cloned, 'derived');
console.log('副本上 derived 的描述符 =', JSON.stringify(desc));

// Symbol 键只要可枚举，是会被展开的。
const sym = Symbol('s');
const withSym = { [sym]: 'symbol 值', normal: 1 };
const symCopy = { ...withSym };
console.log('Symbol 键被复制了 =', symCopy[sym]);
console.log('但 Object.keys 看不到它 =', JSON.stringify(Object.keys(symCopy)));

console.log('\n--- 6. 其它边界与常见误用 ---');

// (1) 展开 null / undefined 是安全的，被当成"没有属性"。
console.log('{ ...null }      =', JSON.stringify({ ...null }));
console.log('{ ...undefined } =', JSON.stringify({ ...undefined }));

// (2) 展开数字/字符串：原始值会被包装成对象再取属性。
console.log("展开字符串 'ab'  =", JSON.stringify({ ...'ab' }), '（字符索引成了键）');
console.log('展开数字 5       =', JSON.stringify({ ...5 }), '（数字没有自有属性）');

// (3) 数组是对象，展开成对象会得到下标键的对象，而不是数组。
const arr = ['a', 'b', 'c'];
console.log('{ ...arr } =', JSON.stringify({ ...arr }));
console.log('[...arr] 才是数组 =', JSON.stringify([...arr]), Array.isArray([...arr]));

// (4) 嵌套数组里的"空位"：展开顶层没问题，但空位还是空位。
const sparse = [1, , 3];
console.log('展开稀疏数组 =', JSON.stringify([...sparse]));

// (5) 展开只是语法糖，本质是 Object.assign({}, ...) 的语义（但 Object.assign 会
//     触发 setter，而展开不会——这是两者的细微差异，见 06 号文件）。
console.log('\n全部演示完毕。');
