/**
 * ============================================================================
 * 知识点：回调地狱 —— 多层嵌套异步代码的形成与问题
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/02_event_loop_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "回调地狱（callback hell）"指多层异步操作层层嵌套回调后形成的
 *    "向右发展的金字塔"：每一步的结果只有在上一步的回调里才能拿到，
 *    于是下一步的异步调用只能写在上一层的回调内部，越写越深。
 *
 * 2. 为什么需要（理解它才能理解 Promise 的价值）
 *    回调地狱不是"写得丑"这么简单，它带来四个真实问题：
 *      ① 可读性：嵌套越深越难看清执行顺序，缩进达到 4 层以上基本无法维护。
 *      ② 错误处理：每一层都要重复写 if (err) 分支，遗漏一处就静默失败。
 *      ③ 无法组合：拿不到"结果对象"，没法 return 给上层，也没法用 try/catch。
 *      ④ 控制反转：你把回调交给了第三方函数，就失去了"它什么时候调用、
 *         调用几次、出错会不会也调用"的控制权。
 *
 * 3. 核心语法要点
 *    - Node 风格回调约定：callback(err, data)，err 为 null 表示成功。
 *      这个约定让异步结果"只能通过参数传出来"，是嵌套的根源。
 *    - 异步函数无法用 return 把结果交给调用者：return 时值还不存在。
 *    - 也无法用 try/catch 捕获异步回调里抛出的错误：
 *      try/catch 只在函数执行期间有效，回调执行时那个 try 早已结束。
 *    - 缓解手段：把回调拆成具名函数（最后一节演示），
 *      但真正的解法是 Promise / async/await（见 04、07 篇）。
 *
 * 4. 常见陷阱
 *    - 忘记在回调里 return，导致出错后代码继续往下跑。
 *    - 把同一个回调注册多次，结果被调用多次（控制反转的经典坑）。
 *    - 以为 try/catch 能包住异步错误。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/03_callback_hell.js
 *
 * 【预期输出】
 *   先展示 4 层嵌套回调的执行过程，再展示错误处理重复的问题，
 *   最后用"具名函数拆分"缓解嵌套。所有延时都在 20ms 以内。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 模拟一组 Node 风格（err, data）的回调式异步 API
// ---------------------------------------------------------------------------

// 统一工具：把结果放到下一个宏任务里返回，模拟真实 I/O 的"稍后才有结果"
function asyncCallback(ms, err, data, callback) {
  setTimeout(() => callback(err, data), ms);
}

const api = {
  // 1. 校验注册参数
  validate(input, callback) {
    asyncCallback(5, null, { ...input, validated: true }, callback);
  },
  // 2. 创建用户
  createUser(data, callback) {
    asyncCallback(5, null, { id: 'U-1001', name: data.name }, callback);
  },
  // 3. 发送欢迎邮件
  sendWelcomeEmail(user, callback) {
    asyncCallback(5, null, `已向 ${user.name} 发送欢迎邮件`, callback);
  },
  // 4. 写入审计日志
  writeAuditLog(message, callback) {
    asyncCallback(5, null, `审计日志：${message}`, callback);
  },
};

// 为了方便演示"出错"的分支，另做一套会失败的 API
const failingApi = {
  createUser(data, callback) {
    asyncCallback(5, new Error('用户名已被占用'), null, callback);
  },
};

// ---------------------------------------------------------------------------
// 1. 回调地狱的真身
// ---------------------------------------------------------------------------

console.log('--- 1. 四层嵌套回调（回调地狱） ---');

console.log('主流程注册完毕，接下来交给回调一步步执行');

api.validate({ name: '小明', email: 'a@b.c' }, (err1, validated) => {
  // 第 1 层
  if (err1) {
    // 每一层都要重复这套错误处理样板代码
    console.log('校验失败：', err1.message);
    return; // 忘记这个 return 就会继续往下执行，是常见 bug
  }
  console.log('第 1 层（校验）完成');

  api.createUser(validated, (err2, user) => {
    // 第 2 层——缩进又多一级
    if (err2) {
      console.log('创建用户失败：', err2.message);
      return;
    }
    console.log('第 2 层（创建用户）完成：', user.id);

    api.sendWelcomeEmail(user, (err3, mailResult) => {
      // 第 3 层
      if (err3) {
        console.log('发邮件失败：', err3.message);
        return;
      }
      console.log('第 3 层（发邮件）完成：', mailResult);

      api.writeAuditLog(`用户 ${user.id} 注册成功`, (err4, logResult) => {
        // 第 4 层——到这里已经很难看清"出错时会跳到哪"
        if (err4) {
          console.log('写日志失败：', err4.message);
          return;
        }
        console.log('第 4 层（写日志）完成：', logResult);
        console.log('整个注册流程结束（但代码已经向右爬了 4 层）');
      });
    });
  });
});

// ---------------------------------------------------------------------------
// 2. 问题一：错误处理处处重复
// ---------------------------------------------------------------------------

console.log('\n--- 2. 问题一：错误处理样板代码重复 ---');

// 上面 4 层里出现了 4 次几乎一模一样的 if (err) {...; return;}。
// 更糟的是：如果某层忘了 return，流程会带着"失败的数据"继续往下走。
function badFlow() {
  api.validate({ name: '小红' }, (err1, validated) => {
    if (err1) {
      console.log('  校验失败');
      // 故意不写 return，演示"忘了 return"的后果
    }
    // 上一行出错时 validated 是 undefined，这里会继续执行并产生连锁错误
    console.log('  即使上一步失败，这里依然会执行（因为忘了 return）');
  });
}
badFlow();

// ---------------------------------------------------------------------------
// 3. 问题二：异步结果无法 return，也无法被 try/catch 捕获
// ---------------------------------------------------------------------------

console.log('\n--- 3. 问题二：不能 return、try/catch 也抓不到 ---');

function getUserName() {
  let result = '（还没拿到）';
  api.createUser({ name: '小刚' }, (err, user) => {
    if (err) return;
    result = user.name; // 赋值发生在"稍后"，而不是现在
  });
  // 关键：这一行在回调执行之前就返回了，所以拿到的是初始值
  return result;
}
console.log('同步 return 拿到的值：', getUserName());
console.log('原因：回调是异步执行的，return 在它执行之前就结束了');

// try/catch 同样无效
try {
  api.validate({ name: '' }, (err) => {
    if (err) {
      // 这个 throw 发生在回调里，而回调执行时 try 块早已结束，
      // 所以它不会被下面的 catch 捕获，反而会成为"未捕获异常"。
      // 演示里我们只打印不真的抛，避免进程非零退出。
      console.log('  （演示）这里如果真的 throw，下面的 catch 是抓不到的');
    }
  });
  console.log('  try 块已经结束了');
} catch (err) {
  console.log('  这一行永远不会执行：', err.message);
}

// ---------------------------------------------------------------------------
// 4. 问题三：调用失败时的分支演示
// ---------------------------------------------------------------------------

console.log('\n--- 4. 出错分支：每层都要重新写一遍 ---');

failingApi.createUser({ name: '已存在的名字' }, (err, user) => {
  if (err) {
    console.log('  捕获到错误：', err.message);
  } else {
    console.log('  创建成功：', user.id);
  }
});

// ---------------------------------------------------------------------------
// 5. 缓解手段：把回调拆成具名函数
// ---------------------------------------------------------------------------

console.log('\n--- 5. 缓解：用具名函数把嵌套"摊平" ---');

// 思路：把每一层的回调单独定义成函数，让嵌套变成"函数之间互相调用"。
// 这确实能减轻缩进，但代价是：
//   - 流程被切成一个个碎片，读代码时要不停跳转；
//   - 数据必须在函数之间手动传递（这里靠参数一路带着走）；
//   - 错误处理依然要在每个函数里重复写。
// 所以它只是"缓解"，真正的解法是 Promise（下一篇）。

function step1Validate(input) {
  api.validate(input, (err, validated) => {
    if (err) return console.log('  校验失败：', err.message);
    console.log('  步骤 1 完成：校验通过');
    step2CreateUser(validated); // 把结果作为参数传给下一步
  });
}

function step2CreateUser(validated) {
  api.createUser(validated, (err, user) => {
    if (err) return console.log('  创建失败：', err.message);
    console.log('  步骤 2 完成：用户', user.id);
    step3SendEmail(user);
  });
}

function step3SendEmail(user) {
  api.sendWelcomeEmail(user, (err, result) => {
    if (err) return console.log('  发信失败：', err.message);
    console.log('  步骤 3 完成：', result);
    console.log('  流程结束（仍然要靠参数一路传递数据）');
  });
}

step1Validate({ name: '小美', email: 'x@y.z' });

console.log('\n（异步回调稍后执行，本行会先打印）');
