/**
 * ============================================================================
 * 知识点：Promise 链式调用 —— 返回值穿透与 then 返回 Promise 的扁平化
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/04_promise_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    promise.then(fn) 的返回值**永远是一个新的 Promise**（不是原来那个）。
 *    这个新 Promise 的结果由 fn 的返回值决定：
 *      - fn 返回普通值 v       → 新 Promise 以 v 兑现；
 *      - fn 返回一个 Promise p → 新 Promise 会"跟随" p（这叫扁平化 / 展开），
 *                                所以要等 p 完成，链才继续；
 *      - fn 抛错 throw e       → 新 Promise 以 e 拒绝；
 *      - fn 什么都不返回       → 新 Promise 以 undefined 兑现。
 *    正是这条规则让 .then().then() 可以串起来，而且不会产生嵌套的 Promise。
 *
 * 2. 为什么需要
 *    回调地狱的根源是"异步结果只能写在上一层的回调里"。链式调用让每一步
 *    都能把结果 return 出去，下一步用同一个 then 接收——代码从"向右爬"
 *    变成"向下排"，这是 Promise 解决回调地狱的核心机制。
 *
 * 3. 核心语法要点
 *    - 每个 then 都返回新 Promise，所以可以一直点下去。
 *    - 返回 Promise 不会嵌套（不会得到 Promise<Promise<T>>），而是自动展开。
 *    - 错误会沿着链向下传播，跳过中间所有 onFulfilled，直到遇到 catch。
 *    - catch 之后链并没有断：它返回的也是新 Promise，可以继续 then。
 *    - finally 不接收也不改变值，主要用于收尾（关 loading、清资源）。
 *
 * 4. 常见陷阱
 *    - 忘记 return：下一步拿到的是 undefined，而不是上一步的结果。
 *    - 在 then 里返回 Promise，却忘了它也返回 Promise，于是多套了一层 then。
 *    - 认为 catch 之后的 then 会拿到错误对象：其实 catch 的返回值会变成
 *      链上新的成功值。
 *    - 把 Promise 链写成"每次都是新的一条链"（忘了赋值或忘了 return）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/05_promise_chaining.js
 *
 * 【预期输出】
 *   带编号的日志展示值如何沿链传递、Promise 如何被扁平化、错误如何传播。
 * ============================================================================
 */

// 统一工具：延时后兑现
const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
// 统一工具：延时后拒绝
const delayReject = (ms, message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// ---------------------------------------------------------------------------
// 1. 值沿链传递
// ---------------------------------------------------------------------------

console.log('--- 1. 返回值穿透：每个 then 的返回值成为下一个 then 的输入 ---');

delay(5, 1)
  .then((v) => {
    console.log('  第 1 环收到：', v);
    return v + 1; // 返回普通值
  })
  .then((v) => {
    console.log('  第 2 环收到：', v); // 2
    return v * 10;
  })
  .then((v) => {
    console.log('  第 3 环收到：', v); // 20
    // 这里没有 return，所以下一个 then 收到 undefined
  })
  .then((v) => {
    console.log('  第 4 环收到：', v, '（因为上一环没有 return）');
  })
  .catch((e) => console.log('  不该走到这里：', e.message));

// ---------------------------------------------------------------------------
// 2. 返回 Promise 会被扁平化
// ---------------------------------------------------------------------------

setTimeout(() => {
  console.log('\n--- 2. then 返回 Promise 时自动扁平化（不会嵌套） ---');

  delay(5, '第一步结果')
    .then((v) => {
      console.log('  第 1 环收到：', v);
      // 关键：这里返回的是一个 Promise，而不是普通值。
      // 链不会得到 Promise<Promise<...>>，而是"等这个 Promise 兑现后继续"。
      return delay(10, `${v} → 第二步结果`);
    })
    .then((v) => {
      // 上面的 10ms 已经等完了，这里拿到的是内层 Promise 的兑现值
      console.log('  第 2 环收到：', v);
      return '普通值也可以接在内层 Promise 之后';
    })
    .then((v) => {
      console.log('  第 3 环收到：', v);
      console.log('  扁平化证明：链上每个值都是"最终值"，不是 Promise 对象');
    })
    .catch((e) => console.log('  不该走到这里：', e.message));
}, 30);

// 对照实验：如果不用扁平化，就只能嵌套写法（这就是回调地狱的 Promise 版）
setTimeout(() => {
  console.log('\n--- 2.1 对照：嵌套写法 vs 扁平写法 ---');

  // 嵌套（不推荐）
  delay(5, 'A').then((a) => {
    delay(5, 'B').then((b) => {
      console.log('  嵌套写法：', a, b, '（缩进随步骤数增长）');
    });
  });

  // 扁平（推荐）：每一步都 return 出去
  delay(5, 'A')
    .then((a) => delay(5, 'B').then((b) => [a, b]))
    .then(([a, b]) => console.log('  扁平写法：', a, b, '（缩进始终不变）'));
}, 60);

// ---------------------------------------------------------------------------
// 3. 在 then 里 throw 等价于返回一个被拒绝的 Promise
// ---------------------------------------------------------------------------

setTimeout(() => {
  console.log('\n--- 3. then 里 throw 与返回拒绝 Promise 等价 ---');

  delay(5, 'ok')
    .then(() => {
      throw new Error('我在 then 里被抛出来了');
    })
    .catch((e) => console.log('  catch 捕获同步抛错：', e.message));

  delay(5, 'ok')
    .then(() => delayReject(5, '我在内层 Promise 里被拒绝了'))
    .catch((e) => console.log('  catch 捕获内层拒绝：', e.message));

  // 两者效果完全一样：都让链变成 rejected，后续 onFulfilled 全部跳过。
}, 90);

// ---------------------------------------------------------------------------
// 4. 错误传播：跳过中间所有 onFulfilled
// ---------------------------------------------------------------------------

setTimeout(() => {
  console.log('\n--- 4. 错误沿链向下传播 ---');

  delay(5, '开始')
    .then((v) => {
      console.log('  第 1 环：', v);
      throw new Error('第 1 环炸了');
    })
    .then(() => console.log('  第 2 环：不会执行'))
    .then(() => console.log('  第 3 环：不会执行'))
    .catch((e) => {
      console.log('  第 4 环 catch 捕获：', e.message);
      // catch 的返回值会成为链上新的"成功值"
      return '从错误中恢复的值';
    })
    .then((v) => console.log('  catch 之后的 then 收到：', v, '（链已恢复）'))
    .finally(() => console.log('  finally：无论成败都会跑'));
}, 120);

// ---------------------------------------------------------------------------
// 5. 实战：把回调地狱写成 Promise 链
// ---------------------------------------------------------------------------

setTimeout(() => {
  console.log('\n--- 5. 实战：三种写法对比同一个流程 ---');

  // 模拟回调式 API
  const callbackApi = {
    validate: (input, cb) => setTimeout(() => cb(null, { ...input, ok: true }), 5),
    createUser: (data, cb) => setTimeout(() => cb(null, { id: 'U-1', name: data.name }), 5),
    sendEmail: (user, cb) => setTimeout(() => cb(null, `邮件已发给 ${user.name}`), 5),
  };

  // 写法 A：回调嵌套（回调地狱）
  callbackApi.validate({ name: '小明' }, (err1, validated) => {
    if (err1) return console.log('  A 失败');
    callbackApi.createUser(validated, (err2, user) => {
      if (err2) return console.log('  A 失败');
      callbackApi.sendEmail(user, (err3, result) => {
        if (err3) return console.log('  A 失败');
        console.log('  A 回调嵌套结果：', result, '（3 层缩进，3 处错误处理）');
      });
    });
  });

  // 写法 B：用 Promise 链整理同一套 API
  const promiseApi = {
    validate: (input) =>
      new Promise((resolve, reject) =>
        callbackApi.validate(input, (err, data) => (err ? reject(err) : resolve(data))),
      ),
    createUser: (data) =>
      new Promise((resolve, reject) =>
        callbackApi.createUser(data, (err, d) => (err ? reject(err) : resolve(d))),
      ),
    sendEmail: (user) =>
      new Promise((resolve, reject) =>
        callbackApi.sendEmail(user, (err, d) => (err ? reject(err) : resolve(d))),
      ),
  };

  promiseApi
    .validate({ name: '小红' })
    .then((validated) => promiseApi.createUser(validated))
    .then((user) => promiseApi.sendEmail(user))
    .then((result) => console.log('  B Promise 链结果：', result, '（无缩进增长）'))
    .catch((e) => console.log('  B 统一错误处理：', e.message))
    .finally(() => {
      console.log('\n示例结束。');
    });
}, 150);
