/**
 * ============================================================================
 * 知识点：表单与校验（Node 端用纯函数实现同一套校验逻辑）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/02_dom_events.js、13_regexp/01_basics_and_literals.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "表单"是网页收集用户输入的标准方式：输入框、下拉框、单选框、复选框、文本域。
 *    "校验"是判断这些输入是否合法的过程：必填项有没有填、邮箱格式对不对、
 *    两次密码是否一致……
 *
 * 2. 为什么需要
 *    用户的输入永远不可信：可能是空的、格式错的、恶意的。
 *    校验分两层，缺一不可：
 *      a) 前端校验（本文件重点）：用户体验好，即时反馈，不用等服务器往返；
 *      b) 后端校验：真正的安全防线，因为前端校验可以被绕过。
 *    前端的正确做法是"浏览器原生约束校验 + 自定义校验函数"配合，
 *    而不是自己手写一堆 if 去拼错误提示。
 *
 * 3. 核心语法要点（浏览器部分，见同名 .html，这里列出以便对照）
 *    - 读取表单值：input.value、checkbox.checked、radio 组用
 *      form.querySelector('input[name=gender]:checked').value
 *    - form.elements：表单内所有控件的集合，可以用 elements['name'] 或 elements[0] 取。
 *    - form.addEventListener('submit', ...)：先 e.preventDefault() 再自己处理，
 *      否则浏览器会真的提交并刷新页面（用 file:// 打开时表现为页面重载）。
 *    - 原生校验 API：
 *        input.required / minLength / maxLength / min / max / pattern / type="email"
 *        input.checkValidity()     只检查，返回布尔值
 *        input.reportValidity()    检查并弹出浏览器的原生提示气泡
 *        input.validity            一个对象，含 valueMissing / patternMismatch /
 *                                  tooShort / typeMismatch / customError 等细项
 *        input.setCustomValidity('错误信息')  写入自定义错误（会立刻让 checkValidity 返回 false）
 *        input.setCustomValidity('')          清空自定义错误，恢复正常校验
 *        form.checkValidity()      整个表单是否全部通过
 *    - new FormData(form)：一次性取出全部字段（键值对），还会自动包含文件。
 *    - input.setCustomValidity 的坑：它是"粘性"的。一旦设置过，就必须在
 *      每次输入后重新计算并清空，否则表单一辈子都提交不了。
 *
 * 4. 常见陷阱
 *    - 表单控件的 value 永远是字符串：'0' 是 truthy，'false' 也是 truthy，
 *      数字比较前必须先 Number() 转换。
 *    - 没勾选的 checkbox 不会出现在 FormData 里（不是 false，而是"不存在"）。
 *    - e.preventDefault() 必须写在 submit 处理函数的第一行，写在后面就来不及了。
 *    - pattern 属性是"隐式全匹配"的（相当于 ^(?:...)$），别自己再加 ^$；
 *      并且它只作用于文本类控件。
 *    - 前端校验只是体验优化，不能替代后端校验。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 里没有表单控件，也就没有 validity / setCustomValidity。
 *    所以本文件把"校验"这件事从 DOM 中剥离出来，用**纯函数**实现同样的规则集
 *    （必填、长度、正则、数字区间、字段间联动、异步校验）。
 *    这套校验核心才是真正值得复用的部分——在浏览器里，你只要把
 *    input.value 传进来、把返回的错误信息用 setCustomValidity 写回去即可。
 *
 * 【运行方法】
 *   node 27_web_apis/03_forms_and_validation.js
 *
 * 【预期输出】
 *   打印若干组测试数据的校验结果：哪些字段通过、哪些字段报了什么错，
 *   以及异步校验（用户名重复）和联动校验（两次密码是否一致）的演示。
 * ============================================================================
 */

// ===========================================================================
// 第 1 部分：定义校验规则（声明式）
// ===========================================================================

console.log('--- 1. 用声明式的规则表描述"一个表单应该长什么样" ---');

/**
 * 规则表：字段名 → 校验规则数组。
 * 每条规则是一个对象 { check(values, value) -> true | string }：
 * 返回 true 表示通过，返回字符串表示错误信息。
 * 这种"数据驱动校验"的写法比一堆 if 更易读、易扩展。
 */
const rules = {
  username: [
    mustBeFilled('用户名'),
    lengthBetween('用户名', 3, 12),
    // 正则规则：只允许字母、数字、下划线
    {
      check: (values, value) => /^[A-Za-z0-9_]+$/.test(value) || '用户名只能包含字母、数字和下划线',
    },
    // 异步规则：模拟"查数据库看用户名是否被占用"
    {
      async: true,
      check: async (values, value) => {
        await sleep(1); // 模拟一次网络/数据库往返
        const taken = ['admin', 'root', 'test'];
        return taken.includes(value.toLowerCase()) ? '用户名「' + value + '」已被占用' : true;
      },
    },
  ],
  email: [
    mustBeFilled('邮箱'),
    {
      check: (values, value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '邮箱格式不正确（应形如 user@example.com）',
    },
  ],
  age: [
    mustBeFilled('年龄'),
    // 表单里拿到的一切都是字符串，这里演示显式转换
    {
      check: (values, value) => /^\d+$/.test(String(value).trim()) || '年龄必须是整数',
    },
    {
      check: (values, value) => {
        const n = Number(value);
        return (n >= 18 && n <= 120) || '年龄必须在 18 到 120 之间';
      },
    },
  ],
  password: [mustBeFilled('密码'), lengthBetween('密码', 8, 64), {
    check: (values, value) => /[A-Za-z]/.test(value) && /\d/.test(value) || '密码必须同时包含字母和数字',
  }],
  confirm: [
    mustBeFilled('确认密码'),
    // 跨字段校验：需要读取另一个字段的值，所以 check 的第一个参数是整份数据
    {
      check: (values, value) => value === values.password || '两次输入的密码不一致',
    },
  ],
  agree: [
    // 复选框：值为布尔
    {
      check: (values, value) => value === true || '必须同意用户协议才能注册',
    },
  ],
};

/** 规则工厂：必填 */
function mustBeFilled(label) {
  return {
    check: (values, value) => {
      // 注意：空字符串、纯空白都算"没填"；而 0 和 false 是合法值
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      return !isEmpty || label + '不能为空';
    },
  };
}

/** 规则工厂：长度区间（先 trim 再算长度，避免"全是空格"钻空子） */
function lengthBetween(label, min, max) {
  return {
    check: (values, value) => {
      const len = String(value).trim().length;
      return (len >= min && len <= max) || label + '长度必须在 ' + min + ' 到 ' + max + ' 个字符之间（当前 ' + len + ' 个）';
    },
  };
}

/** 把回调包成 Promise 的小工具 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('已定义字段：' + Object.keys(rules).join('、'));
console.log('每个字段挂了一串规则，其中 username 还挂了一条"异步规则"。');
console.log('');

// ===========================================================================
// 第 2 部分：校验引擎（纯函数，不依赖任何 DOM）
// ===========================================================================

console.log('--- 2. 校验引擎：输入数据 + 规则表 → 错误清单 ---');

/**
 * 校验一份表单数据。
 * @param {object} values 形如 { username: 'alice', age: '30' } 的键值对
 * @param {object} ruleSet 规则表
 * @returns {Promise<{valid: boolean, errors: object, checked: string[]}>}
 *          errors 形如 { username: '用户名已被占用', ... }，通过校验的字段不出现在里面
 */
async function validate(values, ruleSet) {
  const errors = {};
  const checked = [];

  for (const field of Object.keys(ruleSet)) {
    const fieldRules = ruleSet[field];
    const value = values[field];
    checked.push(field);

    for (const rule of fieldRules) {
      // 同步规则与异步规则统一处理：await 一个非 Promise 值也是合法的
      // 关键设计：一旦某条规则失败就停止后续规则（错误信息只报第一条，体验更好）
      const result = await rule.check(values, value);
      if (result !== true) {
        errors[field] = result; // result 是字符串 = 错误信息
        break;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, checked };
}

/** 把错误清单打印成人能读的格式 */
function printResult(title, result) {
  console.log(title);
  if (result.valid) {
    console.log('  ✅ 校验通过，可以提交');
  } else {
    console.log('  ❌ 校验失败，共 ' + Object.keys(result.errors).length + ' 个字段有问题：');
    for (const [field, message] of Object.entries(result.errors)) {
      console.log('     - ' + field + '：' + message);
    }
  }
  console.log('');
}

// ===========================================================================
// 第 3 部分：跑几组测试数据
// ===========================================================================

console.log('--- 3. 测试用例：把所有错误一次性暴露出来 ---');

// 用例 A：什么都填错（用于验证"每个字段只报第一条错误"）
const badCase = {
  username: 'ab', // 太短（长度规则先于正则规则失败）
  email: 'not-an-email',
  age: '17', // 小于 18
  password: 'abcdefgh', // 没有数字
  confirm: 'abcdegfh', // 与 password 不一致（连拼写都错了）
  agree: false, // 没勾选
};
printResult('用例 A（全部填错）：', await validate(badCase, rules));

// 用例 B：必填项留空
const emptyCase = { username: '   ', email: '', age: '', password: '', confirm: '', agree: false };
printResult('用例 B（全部留空，含纯空格）：', await validate(emptyCase, rules));

// 用例 C：完全合法
const goodCase = {
  username: 'alice_2024',
  email: 'alice@example.com',
  age: '28',
  password: 'abcd1234',
  confirm: 'abcd1234',
  agree: true,
};
printResult('用例 C（全部合法）：', await validate(goodCase, rules));

// 用例 D：异步规则命中——用户名被占用
const takenCase = { username: 'admin', email: 'admin@example.com', age: '30', password: 'abcd1234', confirm: 'abcd1234', agree: true };
printResult('用例 D（用户名 admin 被占用，需要异步查询）：', await validate(takenCase, rules));

console.log('注意用例 D：其它字段全部合法，只有 username 因为异步规则失败。');
console.log('这说明校验引擎是"逐字段、逐规则"独立判断的。');
console.log('');

// ===========================================================================
// 第 4 部分：字段级校验（对应浏览器的 checkValidity）
// ===========================================================================

console.log('--- 4. 字段级校验：只验一个字段（对应浏览器的 input.checkValidity()） ---');

/**
 * 只校验单个字段，返回第一条错误信息或 null。
 * 浏览器里对应的时机是 input 的 'blur' 或 'input' 事件——
 * 用户正在输入时不要立刻报错，等失去焦点再提示，体验更好。
 */
async function validateField(field, values, ruleSet) {
  const fieldRules = ruleSet[field] || [];
  for (const rule of fieldRules) {
    const result = await rule.check(values, values[field]);
    if (result !== true) return result;
  }
  return null; // 没有错误
}

const partial = { username: 'tom', email: 'tom@example.com', age: '25', password: 'abc12345', confirm: 'abc12345', agree: true };
console.log("validateField('email', ...) →", await validateField('email', partial, rules));
console.log("validateField('username', ...) →", await validateField('username', partial, rules), '（tom 不在占用名单里）');
console.log("validateField('username', {username:'root'}, ...) →", await validateField('username', { ...partial, username: 'root' }, rules));
console.log('');

// ===========================================================================
// 第 5 部分：模拟浏览器原生约束校验（required / pattern / minLength）
// ===========================================================================

console.log('--- 5. 对照：浏览器原生约束校验的规则表长什么样 ---');

// 下面这段"规则表"不是可执行代码，而是与 HTML 属性一一对应的说明。
// 浏览器内置了一个免费的校验引擎，能用声明式属性表达的就别写 JS。
const nativeConstraints = [
  {
    html: '<input name="username" required minlength="3" maxlength="12" pattern="[A-Za-z0-9_]+">',
    browserChecks: '属性 required → validity.valueMissing；minlength → validity.tooShort；pattern → validity.patternMismatch',
    note: 'pattern 是隐式全匹配的，等价于 ^(?:[A-Za-z0-9_]+)$，不需要自己写 ^ $',
  },
  {
    html: '<input name="email" type="email" required>',
    browserChecks: 'type="email" → validity.typeMismatch（格式不对时）',
    note: '浏览器自带的邮箱校验只做最基本的形状检查，不会去验证域名是否真实存在',
  },
  {
    html: '<input name="age" type="number" min="18" max="120">',
    browserChecks: 'min/max → validity.rangeUnderflow / rangeOverflow',
    note: 'type=number 时仍然可能拿到空字符串（用户什么都没输），要单独处理',
  },
  {
    html: '<input name="password" type="password" required><input name="confirm" type="password" required>',
    browserChecks: '两次密码是否一致浏览器无法表达 → 必须自定义校验',
    note: "在 confirm 的 input 事件里 setCustomValidity(password !== confirm ? '两次密码不一致' : '')",
  },
];

for (const item of nativeConstraints) {
  console.log('  HTML：' + item.html);
  console.log('    浏览器负责：' + item.browserChecks);
  console.log('    注意点：' + item.note);
  console.log('');
}

// ===========================================================================
// 第 6 部分：自定义校验的"粘性"陷阱
// ===========================================================================

console.log('--- 6. 陷阱演示：setCustomValidity 是"粘性"的 ---');

/**
 * 模拟浏览器控件的 validity 状态机。
 * 这是前端最容易踩的坑：setCustomValidity('xxx') 一旦调用，控件就永远是 invalid，
 * 除非在合适的时机用 setCustomValidity('') 清除。
 */
class FakeInput {
  constructor(name, { required = false } = {}) {
    this.name = name;
    this.required = required;
    this.value = '';
    this.customMessage = ''; // "" 表示没有自定义错误
    this.validity = { valueMissing: false, customError: false };
  }

  setCustomValidity(message) {
    this.customMessage = message;
    this.validity.customError = message !== '';
  }

  /** 对应浏览器的 checkValidity() */
  checkValidity() {
    this.validity.valueMissing = this.required && String(this.value).trim() === '';
    if (this.validity.valueMissing || this.validity.customError) return false;
    return true;
  }

  /** 对应浏览器的 validationMessage */
  get validationMessage() {
    if (this.validity.customError) return this.customMessage;
    if (this.validity.valueMissing) return '请填写此字段。';
    return '';
  }
}

const pwd = new FakeInput('password', { required: true });
const confirmInput = new FakeInput('confirm', { required: true });

// 场景：用户在确认框里输入了不一致的密码
confirmInput.value = 'abc';
pwd.value = 'abcd1234';

// 正确做法：每次输入都重新计算，通过时一定要传空字符串清除
confirmInput.setCustomValidity(confirmInput.value === pwd.value ? '' : '两次输入的密码不一致');
console.log('  第一次检查：checkValidity() =', confirmInput.checkValidity(), '，提示：' + confirmInput.validationMessage);

// 用户改对了
confirmInput.value = 'abcd1234';
console.log('  用户改成一致后，但**忘记清除**自定义错误：');
console.log('    checkValidity() =', confirmInput.checkValidity(), '，提示：' + confirmInput.validationMessage, '← 仍然不通过！');

console.log('  正确做法：在 input 事件里重新计算并清除：');
confirmInput.setCustomValidity(confirmInput.value === pwd.value ? '' : '两次输入的密码不一致');
console.log('    checkValidity() =', confirmInput.checkValidity(), '，提示：' + JSON.stringify(confirmInput.validationMessage), '← 通过了');
console.log('');
console.log('  结论：自定义校验必须写成"每次输入都重新求值"的形式，');
console.log('        不能用 if (错误) setCustomValidity(...) 这种只写不擦的写法。');
console.log('');

// ===========================================================================
// 第 7 部分：表单数据序列化（对应浏览器的 FormData）
// ===========================================================================

console.log('--- 7. 表单数据的序列化：所有值最终都会变成字符串 ---');

/** 模拟 new FormData(form)：把控件值收集成键值对 */
function collectFormData(controls) {
  const data = {};
  for (const control of controls) {
    if (control.type === 'checkbox') {
      // 复选框没勾选时不会进入数据（浏览器 FormData 也是这个行为）
      if (control.checked) data[control.name] = control.value || 'on';
      continue;
    }
    if (control.type === 'radio' && !control.checked) continue;
    data[control.name] = control.value;
  }
  return data;
}

const controls = [
  { name: 'username', type: 'text', value: 'alice_2024' },
  { name: 'age', type: 'text', value: '28' }, // 注意：输入框里的 28 是字符串 '28'
  { name: 'agree', type: 'checkbox', checked: true, value: 'on' },
  { name: 'newsletter', type: 'checkbox', checked: false, value: 'on' }, // 没勾选 → 不会出现
  { name: 'gender', type: 'radio', checked: true, value: 'female' },
  { name: 'gender', type: 'radio', checked: false, value: 'male' },
];

const formData = collectFormData(controls);
console.log('  收集到的数据：', formData);
console.log('  typeof formData.age =', typeof formData.age, '← 表单里拿到的数字其实是字符串！');
console.log("  表单里没有 newsletter 这个键：", 'newsletter' in formData, '（没勾选的复选框不会出现在数据里）');
console.log('  发送给服务器前通常要手动转换类型：Number(formData.age) =', Number(formData.age));
console.log('');

console.log('程序结束。所有校验逻辑都是纯函数，可以原样搬到浏览器里使用。');
