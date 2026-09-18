/**
 * ============================================================================
 * 知识点：promisify —— 把回调风格 API 转成 Promise
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】高级
 * 【前置知识】18_async/11_promise_static_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    promisify 是"回调风格 API → Promise"的转换器。Node 社区把
 *    `callback(err, data)` 这种约定称为 Node 风格回调，util.promisify(fn)
 *    可以把任何一个遵守该约定的函数转换成"返回 Promise"的版本。
 *
 * 2. 为什么需要
 *    大量老库、Node 核心模块（fs、dns、child_process 的非 Promise 版本）
 *    仍然是回调风格。有了 promisify，就能用 await 直接调用它们，
 *    不必每个函数手写一遍 new Promise 包装（不然会产生大量样板代码）。
 *
 * 3. 核心语法要点
 *    - 约定：回调必须是**最后一个参数**，且形如 (err, result)。
 *    - util.promisify(fn) 返回新函数，调用后返回 Promise：
 *      回调里 err 非空 → 拒绝；否则以 result 兑现。
 *    - 用 this 的方法要先 bind：util.promisify(obj.method.bind(obj))。
 *    - util.promisify.custom 是一个 symbol：函数可以自己挂上
 *      [util.promisify.custom] 来指定"被 promisify 时应该做什么"，
 *      从而支持多返回值等特殊情况。
 *    - 回调返回多个值时（err, a, b），标准 promisify 只取第一个，
 *      需要自己手写包装。
 *
 * 4. 常见陷阱
 *    - 回调不是最后一个参数：promisify 会静默出错（回调永远不会被调用）。
 *    - 回调被调用多次：Promise 只会采用第一次的结果。
 *    - 忘记 bind：丢失 this，方法里的 this 变成 undefined。
 *    - 只用 promisify 而不处理拒绝：未处理的拒绝会导致进程退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/14_promisify.js
 *
 * 【预期输出】
 *   手写 promisify、util.promisify、多返回值包装、custom 定制、
 *   批量转换对象方法的演示，以及一次真实的本地文件读取。延时 ≤ 50ms。
 * ============================================================================
 */

import { promisify } from 'node:util';
import { readFile } from 'node:fs'; // 回调风格版本
import { readFile as readFilePromise } from 'node:fs/promises'; // 原生 Promise 版本
import { fileURLToPath } from 'node:url';

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// 1. 先看一个典型的回调风格 API
// ---------------------------------------------------------------------------

console.log('--- 1. 回调风格 API ---');

// 模拟：按 id 查询用户，回调形如 (err, user)
function findUserCallback(id, callback) {
  setTimeout(() => {
    if (id > 0) {
      callback(null, { id, name: `用户-${id}` }); // 成功：err 为 null
    } else {
      callback(new Error(`非法的 id：${id}`)); // 失败：err 非空
    }
  }, 5);
}

// 直接调用：结果只能写在回调里
findUserCallback(1, (err, user) => {
  if (err) return console.log('  回调方式失败：', err.message);
  console.log('  回调方式成功：', user);
});

// 注意：回调是异步执行的，为了让它的输出留在本节内，这里等一下
await delay(10);

// ---------------------------------------------------------------------------
// 2. 手写一个 promisify
// ---------------------------------------------------------------------------

console.log('\n--- 2. 手写 promisify ---');

/**
 * myPromisify —— 30 行以内就能实现的通用转换器。
 * 要点：
 *  1. 返回一个新函数，调用后返回 Promise；
 *  2. 用剩余参数收集原有实参，再在末尾追加自定义回调；
 *  3. 回调里按 err 决定拒绝还是兑现。
 */
function myPromisify(fn) {
  return function promisified(...args) {
    return new Promise((resolve, reject) => {
      // 回调放在最后：这是 Node 风格回调的硬性约定
      fn.call(this, ...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

const findUser = myPromisify(findUserCallback);

console.log('  成功：', await findUser(2));
await findUser(-1).catch((e) => console.log('  失败：', e.message));

// ---------------------------------------------------------------------------
// 3. 用 node:util 的 promisify
// ---------------------------------------------------------------------------

console.log('\n--- 3. util.promisify ---');

// 用法和手写版完全一样，只是由标准库提供、经过充分测试
const findUserStd = promisify(findUserCallback);
console.log('  标准库版本：', await findUserStd(3));
await findUserStd(0).catch((e) => console.log('  标准库版本失败：', e.message));

// 真实场景：读取本地文件（注意这个仓库里没有网络访问，只读本地文件）
// import.meta.url 是当前模块的 file:// URL，转成路径后才能交给 fs
const thisFile = fileURLToPath(import.meta.url);
const readFileAsync = promisify(readFile);

try {
  const content = await readFileAsync(thisFile, 'utf8');
  const firstLine = content.split('\n')[0];
  console.log('  读取本文件的第一行：', firstLine.slice(0, 30), '...');
  console.log('  文件总行数：', content.split('\n').length);
} catch (err) {
  console.log('  读文件失败：', err.message);
}

// 读一个不存在的文件，看看错误如何变成 Promise 的拒绝
await readFileAsync(thisFile + '.not-exist', 'utf8').catch((err) => {
  console.log('  读不存在的文件 -> 拒绝：', err.code, '/', err.message.split('\n')[0]);
});

// ---------------------------------------------------------------------------
// 4. 回调返回多个值：标准 promisify 不够用
// ---------------------------------------------------------------------------

console.log('\n--- 4. 回调返回多个值时要自己包装 ---');

// 这种 API 的回调是 (err, a, b)，标准 promisify 只会拿到 a，丢掉 b
function readRangeCallback(start, end, callback) {
  setTimeout(() => callback(null, `从 ${start} 开始`, `到 ${end} 结束`), 5);
}

// 标准 promisify 的结果：只能拿到第一个值
const lostSecond = promisify(readRangeCallback);
console.log('  标准 promisify 只拿到第一个值：', await lostSecond(1, 10));

// 手写包装：把多个值打包成数组或对象再兑现
function readRange(start, end) {
  return new Promise((resolve, reject) => {
    readRangeCallback(start, end, (err, a, b) => {
      if (err) return reject(err);
      resolve([a, b]); // 用数组把两个值一起交出去
    });
  });
}
console.log('  手写包装拿到全部：', await readRange(1, 10));

// ---------------------------------------------------------------------------
// 5. util.promisify.custom：让被包装的函数自己决定
// ---------------------------------------------------------------------------

console.log('\n--- 5. promisify.custom ---');

// 有些 API 的行为不适合"err + 单值"模型（例如返回的是流、或者有多个返回值、
// 或者想提供更友好的返回值）。这时可以让函数自己挂上 custom 实现。
function legacyReadConfig(callback) {
  setTimeout(() => callback(null, '原始配置文件内容'), 5);
}

legacyReadConfig[promisify.custom] = () => {
  // promisify 遇到这个 symbol 会直接使用它，而不是按 (err, result) 推导
  return Promise.resolve({ content: '解析后的配置对象', source: 'custom' });
};

const readConfig = promisify(legacyReadConfig);
console.log('  custom 生效：', await readConfig());

// 查看一个函数是否提供了 custom 实现
console.log('  legacyReadConfig 提供 custom 了吗：', typeof legacyReadConfig[promisify.custom] === 'function');
console.log('  findUserCallback 提供 custom 了吗：', typeof findUserCallback[promisify.custom] === 'function');

// ---------------------------------------------------------------------------
// 6. 批量转换一个对象上的所有方法
// ---------------------------------------------------------------------------

console.log('\n--- 6. 批量 promisify 一个模块 ---');

// 模拟一个老式 SDK：所有方法都是回调风格
const legacySdk = {
  getProfile(id, callback) {
    setTimeout(() => callback(null, { id, profile: `档案-${id}` }), 5);
  },
  getQuota(id, callback) {
    setTimeout(() => callback(null, { id, quota: id * 100 }), 5);
  },
  fail(id, callback) {
    setTimeout(() => callback(new Error('SDK 内部错误')), 5);
  },
};

/**
 * promisifyAll —— 把对象上的所有函数都换成 Promise 版本。
 * 注意要 bind 原对象，否则方法内部的 this 会丢失。
 */
function promisifyAll(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'function') {
      out[key] = promisify(obj[key].bind(obj)); // bind 保住 this
    }
  }
  return out;
}

const sdk = promisifyAll(legacySdk);
console.log('  getProfile：', await sdk.getProfile(7));
console.log('  getQuota：', await sdk.getQuota(7));
await sdk.fail(1).catch((e) => console.log('  fail 变成拒绝：', e.message));

// 有了 Promise 版本，就能直接用并发组合器（回调风格做不到这么干净）
const [profile, quota] = await Promise.all([sdk.getProfile(9), sdk.getQuota(9)]);
console.log('  并发调用：', profile, quota);

// ---------------------------------------------------------------------------
// 7. 对照：Node 自带的 Promise 版本模块
// ---------------------------------------------------------------------------

console.log('\n--- 7. 优先用官方 Promise 版本 ---');

// Node 里大多数核心模块都提供了原生 Promise 版本，
// 能直接用就用它，比 promisify 更省事、类型也更友好：
//   fs/promises  ←→  fs（回调风格）
//   dns/promises ←→  dns
//   timers/promises ←→  timers

const viaPromiseModule = await readFilePromise(thisFile, 'utf8');
console.log('  fs/promises 读取成功，长度：', viaPromiseModule.length, '字符');

// timers/promises 的 setTimeout 直接返回 Promise（本质就是本篇讲的包装）
const { setTimeout: sleep } = await import('node:timers/promises');
const t0 = Date.now();
await sleep(10);
console.log(`  timers/promises 的 sleep(10) 实际等待了 ${Date.now() - t0}ms`);

// 顺便演示：promisify 与手写包装的等价性
console.log('  结论：promisify 省掉的是样板代码，不改变任何异步语义');

console.log('\n示例结束。');
