/**
 * ============================================================================
 * 知识点：继承内置类 —— Array / Error / Map，以及 Error 子类为何要修正 name
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/07_inheritance_extends.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 的内置类型（Array、Error、Map、Set、Promise、RegExp…）本身也是
 *    可以用 extends 继承的类。继承后可以添加自己的方法、重写父类行为。
 *
 * 2. 为什么需要
 *    - 自定义错误类型：HttpError / ValidationError，便于按类型 catch，
 *      也能带上 statusCode、field 等结构化信息。
 *    - 专用集合：class Stack extends Array 直接复用数组的全部能力。
 *    - 带默认值/校验的 Map：Config extends Map。
 *
 * 3. 核心语法要点
 *    - 内置类的子类实例，其内部槽（internal slot）由父类构造函数建立。
 *      所以 Array 子类必须保证走 super()，而且数组方法（map/filter/slice 等）
 *      在 ES6 规范下会用 Symbol.species 决定返回什么类型，默认返回子类实例。
 *    - Error 子类：Error 的第一个参数是 message，第二个是 options（cause）。
 *      但 Error 不会自动设置 name，name 仍来自 Error.prototype.name === 'Error'。
 *      因此自定义错误的 console.log / toString 会显示 "Error: xxx" 而不是
 *      "MyError: xxx"。惯例做法是在构造函数里写 this.name = 'MyError'，
 *      或者用 get name() 访问器返回类名。
 *    - Object.setPrototypeOf(this, new.target.prototype) 这段"老代码必备"
 *      的补救写法，在 ES6 class + extends 内置类时已经不再需要。
 *    - 可以利用 Error.captureStackTrace（V8 专有）裁掉构造函数自身的栈帧。
 *
 * 4. 常见陷阱
 *    - 忘记 this.name = this.constructor.name，导致错误名字不对。
 *    - Array 子类里用 length 赋值、以及 reduce/concat 等会走 Symbol.species，
 *      某些第三方库或老代码里行为与想象不同；现代做法是组合而非继承 Array。
 *    - 继承 Array 后 JSON.stringify 仍按数组处理（因为内部槽还在）。
 *    - Error 子类被 JSON.stringify 时，message 不是自有可枚举属性，
 *      会丢失；需要自己加 toJSON。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/08_extends_builtins.js
 *
 * 【预期输出】
 *   演示继承 Error、Array、Map 的效果，以及 name 修正前后的差别。
 * ============================================================================
 */

console.log('--- 1. 先看问题：不修正 name 的自定义错误 ---');

class PlainError extends Error {
  // 只调用 super，不做别的
}

const pe = new PlainError('出问题了');
console.log('pe.message =', pe.message);
// 关键点：name 是从 Error.prototype.name 继承来的 'Error'，不是 'PlainError'
console.log('pe.name =', pe.name, '（注意不是 PlainError）');
console.log('String(pe) =', String(pe));
console.log('pe instanceof PlainError =', pe instanceof PlainError);
console.log('pe instanceof Error =', pe instanceof Error);

// name 来自原型链：实例自己没有 name，PlainError.prototype 也没有，
// 一直到 Error.prototype 才找到 'Error'。
console.log('实例自己有 name 吗？', Object.hasOwn(pe, 'name'));
console.log('PlainError.prototype 上有 name 吗？', Object.hasOwn(PlainError.prototype, 'name'));
console.log('Error.prototype.name =', Error.prototype.name);

console.log('--- 2. 修正方案 A：构造函数里写 this.name ---');

class HttpError extends Error {
  constructor(message, statusCode = 500, options) {
    // super 的第一个参数是 message；options 可带 cause（错误链）
    super(message, options);
    // 修正 name —— 这是继承 Error 时最经典的必做动作。
    // 写成 this.name = ... 后，它变成了实例的自有属性。
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

const he = new HttpError('资源不存在', 404);
console.log('he.name =', he.name);
console.log('String(he) =', String(he));
console.log('he.statusCode =', he.statusCode);
// 现在 name 是实例自有属性了
console.log('实例自己有 name 吗？', Object.hasOwn(he, 'name'));

console.log('--- 3. 修正方案 B：用 get name 访问器动态取类名 ---');

class AppError extends Error {
  constructor(message, code = 'E_UNKNOWN', options) {
    super(message, options);
    this.code = code;
  }

  // 用访问器返回构造函数的名字，这样子类不必各自写 this.name = '...'。
  get name() {
    return this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 'E_VALIDATION');
    // 注意：这里不再需要手动改 name，getter 会自动返回 'ValidationError'
    this.field = field;
  }
}

const ve = new ValidationError('邮箱格式不正确', 'email');
console.log('ve.name =', ve.name, '（自动来自类名）');
console.log('ve.code =', ve.code, '| ve.field =', ve.field);
console.log('String(ve) =', String(ve));
console.log('ve instanceof ValidationError / AppError / Error：', ve instanceof ValidationError, ve instanceof AppError, ve instanceof Error);

console.log('--- 4. 按类型分别 catch ---');

// 自定义错误类型最大的价值：catch 时可以精确区分。
function riskyAction(kind) {
  if (kind === 'http') throw new HttpError('服务不可用', 503);
  if (kind === 'validation') throw new ValidationError('缺少必填项', 'title');
  return '一切正常';
}

for (const kind of ['http', 'validation', 'ok']) {
  try {
    console.log(`执行(${kind}) →`, riskyAction(kind));
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`执行(${kind}) → 校验失败，字段=${err.field}，code=${err.code}`);
    } else if (err instanceof HttpError) {
      console.log(`执行(${kind}) → HTTP 错误，状态码=${err.statusCode}`);
    } else {
      console.log(`执行(${kind}) → 其它错误：${err.message}`);
    }
  }
}

console.log('--- 5. 错误链：用 cause 保留原始错误 ---');

function parseConfig(text) {
  try {
    return JSON.parse(text);
  } catch (cause) {
    // ES2022 起 Error 支持 cause 选项，把底层错误挂在 err.cause 上，
    // 这样既不丢失原始信息，又能给出更有意义的上下文。
    throw new AppError('配置文件解析失败', 'E_CONFIG', { cause });
  }
}

try {
  parseConfig('{ 这不是合法 JSON }');
} catch (err) {
  console.log('顶层错误：', String(err));
  console.log('原始错误（cause）：', String(err.cause));
  console.log('cause 的类型：', err.cause.constructor.name);
}

console.log('--- 6. 用 Error.captureStackTrace 裁掉多余栈帧（V8 专有） ---');

class CleanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CleanError';
    // Node.js（V8）提供了 captureStackTrace，可以让 stack 从"调用方"开始，
    // 把 CleanError 构造函数自身的这一帧去掉，日志更干净。
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CleanError);
    }
  }
}

function throwClean() {
  throw new CleanError('栈顶就是这里');
}

try {
  throwClean();
} catch (err) {
  const firstLine = err.stack.split('\n')[1].trim();
  console.log('栈的第一帧指向：', firstLine);
  console.log('是否包含 throwClean？', err.stack.includes('throwClean'));
}

console.log('--- 7. 继承 Array ---');

class NumberList extends Array {
  // 新增方法
  sum() {
    // reduce 继承自 Array.prototype
    return this.reduce((acc, n) => acc + n, 0);
  }

  average() {
    return this.length === 0 ? 0 : this.sum() / this.length;
  }

  // 重写方法：保持链式调用返回子类实例
  add(value) {
    this.push(value);
    return this;
  }
}

const list = new NumberList();
list.add(1).add(2).add(3);
console.log('list =', JSON.stringify([...list]));
console.log('sum =', list.sum(), '| average =', list.average());
console.log('list instanceof NumberList =', list instanceof NumberList);
console.log('list instanceof Array =', list instanceof Array);
console.log('Array.isArray(list) =', Array.isArray(list));
// 继承来的 map 返回的也是 NumberList（ES6 起内置方法使用 Symbol.species）
const mapped = list.map((n) => n * 10);
console.log('map 之后仍是 NumberList 吗？', mapped instanceof NumberList);
console.log('mapped.sum() =', mapped.sum());

console.log('--- 8. 继承 Map ---');

class Config extends Map {
  get(key, fallback = undefined) {
    // 重写 get：键不存在时返回默认值，比每次都写 ?? 更方便
    return this.has(key) ? super.get(key) : fallback;
  }

  toObject() {
    // 迭代器继承自 Map.prototype
    return Object.fromEntries(this);
  }

  static fromObject(obj) {
    return new Config(Object.entries(obj));
  }
}

const cfg = Config.fromObject({ host: 'localhost', port: 8080 });
console.log('存在的键：', cfg.get('host'));
console.log('不存在的键（带默认值）：', cfg.get('timeout', 3000));
console.log('cfg.toObject() =', JSON.stringify(cfg.toObject()));
console.log('cfg 是 Map 吗？', cfg instanceof Map, '| size =', cfg.size);

console.log('--- 9. 继承 Error 时 JSON 序列化会丢 message（try/catch 演示） ---');

const he2 = new HttpError('序列化测试', 400);
// message 在 Error 上不是"自有可枚举属性"，所以直接序列化会丢掉。
console.log('直接 JSON.stringify =', JSON.stringify(he2));

// 解决办法：自己加一个 toJSON 方法。
class JsonFriendlyError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'JsonFriendlyError';
    this.statusCode = statusCode;
  }
  toJSON() {
    return { name: this.name, message: this.message, statusCode: this.statusCode };
  }
}

const jfe = new JsonFriendlyError('可以序列化', 422);
console.log('加了 toJSON 之后 =', JSON.stringify(jfe));

console.log('\n全部演示完毕。');
