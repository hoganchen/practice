/**
 * ============================================================================
 * 知识点：node:fs 回调 API —— 异步非阻塞与错误优先回调
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/04_fs_sync.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    回调 API 是 node:fs 最经典的异步形式：把任务交给操作系统后立刻返回，
 *    等内核完成 I/O，Node 再把结果通过回调函数交还给你。
 *    方法名就是去掉 Sync 后缀的版本：readFile / writeFile / mkdir / readdir / rm …
 *
 *    它的回调遵循一个铁律，叫"错误优先回调"（error-first callback）：
 *
 *        fs.readFile(path, (err, data) => { ... })
 *
 *    回调的第一个参数永远是 err：
 *      · 成功时 err 为 null，后面的参数才是结果
 *      · 失败时 err 是一个 Error 对象，后面的参数是 undefined
 *    这个约定不只属于 fs，而是整个 Node 生态的通用模式——
 *    node:child_process、node:dns、node:net 以及大量第三方库都照此设计。
 *
 * 2. 为什么需要
 *    Node 是单线程执行 JS 的。如果读文件是同步的，那么读一个慢速磁盘上的大文件时，
 *    整个进程（包括正在服务的所有 HTTP 连接）都得干等着。
 *    异步回调让"等待 I/O"这件事交还给操作系统，JS 线程腾出来继续处理别的任务。
 *    这就是 Node 能用单线程扛住高并发的根本原因。
 *
 * 3. 核心语法要点
 *    - fs.readFile(path, options?, cb)          cb(err, data)
 *    - fs.writeFile(path, data, options?, cb)   cb(err)
 *    - fs.appendFile(path, data, options?, cb)  cb(err)
 *    - fs.mkdir(path, options?, cb)             cb(err)
 *    - fs.readdir(path, options?, cb)           cb(err, files)
 *    - fs.stat(path, cb)                        cb(err, stats)
 *    - fs.copyFile(src, dest, cb)               cb(err)
 *    - fs.rename(oldPath, newPath, cb)          cb(err)
 *    - fs.rm(path, options?, cb)                cb(err)
 *    - 回调里的 I/O 完成顺序**不保证**与调用顺序一致，需要顺序执行就必须嵌套或串起来
 *
 * 4. 常见陷阱
 *    陷阱 1：忘记写 `if (err) return;`。错误被吞掉，程序继续用 undefined 当数据用，
 *            最后报出一个与真正原因毫无关系的错。
 *    陷阱 2：回调只保证"调用一次"，不保证"不会同步调用"。不要假设回调一定在下一轮才执行。
 *    陷阱 3：在 for 循环里用 var 声明的变量做回调闭包，会拿到循环结束后的值。
 *            改用 let（块作用域）或 forEach。本文件第 5 节有实测。
 *    陷阱 4：以为异步 API 就不会"阻塞"。真正耗 CPU 的计算（大循环、大 JSON.parse）
 *            在回调里照样会卡住事件循环——异步只解决 I/O 等待，不解决计算。
 *    陷阱 5：回调嵌套太深会形成"回调地狱"，难以维护。现代写法请用
 *            node:fs/promises + await（见 06_fs_promises.js），或把回调 promisify。
 *    陷阱 6：回调里抛出的异常**不会**被外层的 try/catch 捕获，因为 try 块早就执行完了。
 *            这类异常会变成未捕获异常，直接终止进程。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/05_fs_callback.js
 *
 * 【预期输出】
 *   在 os.tmpdir() 下建临时目录，用回调 API 演示写文件、读文件、追加、
 *   列目录、stat、复制、重命名、删除的完整流程；
 *   并对比"异步读不阻塞事件循环"与"同步读会阻塞"的实测差异。
 *   演示结束后清理临时文件，全部输出完成后进程自然退出。
 * ============================================================================
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// 0. 临时目录（回调版）
// ---------------------------------------------------------------------------

// 注意这里用的是 mkdtemp（异步回调版），不是 mkdtempSync。
// 回调风格下"准备阶段"也必须放进回调里，代码会呈现出明显的嵌套结构——
// 这正是后面要讲的"回调地狱"的由来。
fs.mkdtemp(path.join(os.tmpdir(), 'js-cb-demo-'), (err, workDir) => {
  // 铁律第一步：先检查 err。
  // 这里用 return 提前退出，避免后面所有代码都要包一层 if (!err)。
  if (err) {
    console.error('创建临时目录失败：', err.message);
    // 设置非零退出码会被校验脚本判为失败，所以这里只打印错误、不改变退出码。
    return;
  }

  console.log('临时工作目录 =', workDir);

  // -------------------------------------------------------------------------
  // 1. 错误优先回调的基本形状
  // -------------------------------------------------------------------------

  console.log('--- 1. 错误优先回调的基本形状 ---');

  const fileA = path.join(workDir, 'a.txt');

  // 写法一：先写文件，在它的回调里再读。
  // 这里刻意写成嵌套结构，因为"读之前必须确保写完成"，
  // 而回调 API 没有 await 那样的语法糖，只能靠嵌套。
  fs.writeFile(fileA, '来自回调 API 的内容\n', 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('写入失败：', writeErr.message);
      return;
    }
    console.log('写入 a.txt 成功。');

    // 读文件：回调签名是 (err, data)。
    // 传了 'utf8' 时 data 是字符串，不传则是 Buffer。
    fs.readFile(fileA, 'utf8', (readErr, data) => {
      if (readErr) {
        console.error('读取失败：', readErr.message);
        return;
      }
      console.log('读回内容：', JSON.stringify(data));
      // 二层嵌套已经需要留心了。真实项目里五六层嵌套很常见，
      // 所以才会有 Promise 和 async/await 的出现。
      runErrorDemo();
    });
  });

  // 把后续步骤写成函数，避免所有代码都嵌在一个大括号里。
  // 这是"回调时代"最常用的解嵌套手段：给每一步起个名字。
  function runErrorDemo() {
    console.log('--- 2. 错误优先回调的"错误"分支 ---');

    const missing = path.join(workDir, 'does-not-exist.txt');

    // 读一个不存在的文件，专门观察 err 对象的样子。
    fs.readFile(missing, 'utf8', (readErr, data) => {
      // 这次 err 不为 null。
      console.log('err 是 Error 实例吗：', readErr instanceof Error);
      // code 才是稳定的判断依据；message 的文案在不同平台/版本可能不同。
      console.log('err.code  =', readErr.code, '（ENOENT = no such file or directory）');
      console.log('err.errno =', readErr.errno);
      console.log('err.syscall =', readErr.syscall, '（出错的系统调用名）');
      console.log('err.path  =', readErr.path);
      // 出错时第二个参数是 undefined，而不是 null 或空字符串。
      console.log('data 的值  =', data, '（出错时 data 是 undefined）');
      console.log('提示：用 err.code 做分支判断，不要用 err.message 做字符串匹配。');

      runAsyncVsSyncDemo();
    });
  }

  // -------------------------------------------------------------------------
  // 3. 异步 vs 同步：谁阻塞了事件循环
  // -------------------------------------------------------------------------

  function runAsyncVsSyncDemo() {
    console.log('--- 3. 异步读不阻塞事件循环 ---');

    const t0 = Date.now();
    console.log('  第 1 步：准备发起 fs.readFile');

    // 发起异步读。这一行只是"把任务登记给操作系统"，**不会**等文件读完。
    fs.readFile(fileA, 'utf8', (readErr, data) => {
      if (readErr) {
        console.error('读取失败：', readErr.message);
        return;
      }
      // 回调被调用时，说明数据已经从磁盘取回并交给 JS 了。
      console.log(`  [读文件回调] 触发，距开始 ${Date.now() - t0}ms，读到 ${data.trim()}`);
      console.log('  => 从发起读到回调触发之间，JS 线程一直在做别的事，没有停在那里干等。');

      runBlockingDemo();
    });

    // 关键证据：下面这行在 fs.readFile **之后**书写，却会**先于**回调执行。
    // 这说明 fs.readFile 调用完就立刻返回了，代码继续往下走了。
    console.log(`  第 2 步：这一行紧跟 fs.readFile 之后，距开始 ${Date.now() - t0}ms 就执行了`);
    console.log('  => 证据：异步 API 调用后代码立即继续，回调要等到 I/O 真正完成才被调用。');

    // 附带说明：为什么这里不用"定时器和读回调谁先打印"来证明非阻塞？
    // 因为 setTimeout(0) 会被钳制到约 1ms，而小文件读可能更快完成，
    // 两者的先后顺序在不同机器、不同文件大小下会变化，不能作为确定性的证据。
    // 「紧跟其后的语句先执行」才是永远成立的判据。
  }

  function runBlockingDemo() {
    console.log('--- 4. 同步读会阻塞事件循环（对比） ---');

    const t1 = Date.now();
    // syncTimerFired 用来记录"定时器是不是已经跑过了"。
    let syncTimerFired = false;

    // 注册一个 0ms 定时器，它代表"事件循环里排队的其他任务"。
    setTimeout(() => {
      syncTimerFired = true;
      console.log(`  [同步场景的定时器] 终于触发了，距注册已过 ${Date.now() - t1}ms`);
      console.log('  => 它被硬生生推迟到了同步操作结束之后才执行。');
    }, 0);

    // 用同步 API 读同一个文件（文件很小，再加一点忙等把阻塞效果放大到肉眼可见）。
    fs.readFileSync(fileA, 'utf8');
    while (Date.now() - t1 < 40) {
      // 模拟同步 I/O 实际耗掉的时间
    }

    // 这一行一定在定时器之前打印——因为同步代码不跑完，事件循环一步都动不了。
    console.log(`  同步读+忙等结束，耗时 ${Date.now() - t1}ms`);
    console.log(`  此刻定时器执行了吗：${syncTimerFired}  <= 一定是 false`);
    console.log('  => 同步 API 的耗时，就是事件循环被卡住的时长。');

    runListAndStat(workDir);
  }

  // -------------------------------------------------------------------------
  // 5. 列目录与 stat
  // -------------------------------------------------------------------------

  function runListAndStat(dir) {
    console.log('--- 5. readdir 与 stat ---');

    // 先多造几个文件，让目录内容丰富些。
    // 用 fs.writeFile 的同步版本只是为了少一层嵌套，这里不涉及性能问题。
    for (const name of ['b.txt', 'c.txt', 'note.md']) {
      fs.writeFileSync(path.join(dir, name), `内容：${name}`, 'utf8');
    }

    // withFileTypes: true 时回调第二参数是 Dirent 数组。
    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
      if (err) {
        console.error('列目录失败：', err.message);
        return;
      }

      console.log('目录内容共', entries.length, '项：');
      for (const entry of entries) {
        const kind = entry.isDirectory() ? '目录' : '文件';
        console.log(`  - ${entry.name}  [${kind}]`);
      }

      // stat 回调签名也是 (err, stats)。
      const target = path.join(dir, 'note.md');
      fs.stat(target, (statErr, stats) => {
        if (statErr) {
          console.error('stat 失败：', statErr.message);
          return;
        }
        console.log('note.md 的 size =', stats.size, '字节，isFile() =', stats.isFile());

        runParallelDemo(dir);
      });
    });
  }

  // -------------------------------------------------------------------------
  // 6. 并发发起：回调的顺序不保证
  // -------------------------------------------------------------------------

  function runParallelDemo(dir) {
    console.log('--- 6. 并发发起多个 I/O：完成顺序不保证 ---');

    // 一口气发起 3 个 I/O，不做嵌套。它们会**并发**执行。
    // 但回调触发的先后顺序取决于操作系统和 I/O 大小，代码无法假设。
    let finished = 0;
    const results = [];

    const finish = () => {
      finished += 1;
      // 等三个都完成后再进入下一步：这就是"手工计数器"版的手写并发控制。
      // Promise.all 正是把这个模式标准化了（见 06_fs_promises.js）。
      if (finished === 3) {
        console.log('  三份文件读取完成，实际回调到达顺序：', results.join(' -> '));
        console.log('  => 这个顺序每次运行可能不同，绝不要依赖回调的先后。');
        runLoopClosureDemo(dir);
      }
    };

    for (const name of ['a.txt', 'b.txt', 'c.txt']) {
      fs.readFile(path.join(dir, name), 'utf8', (err, data) => {
        if (err) {
          console.error(`读 ${name} 失败：`, err.message);
          finish();
          return;
        }
        results.push(name);
        finish();
      });
    }
  }

  // -------------------------------------------------------------------------
  // 7. 循环里的闭包陷阱
  // -------------------------------------------------------------------------

  function runLoopClosureDemo(dir) {
    console.log('--- 7. 循环变量的闭包陷阱 ---');

    const files = ['a.txt', 'b.txt', 'c.txt'];

    // 反面教材：var 是函数作用域，所有回调共享**同一个**变量。
    // 等回调执行时，循环早已结束，i 停在 3。
    let varCount = 0;
    const varSeen = [];
    for (var i = 0; i < files.length; i += 1) {
      fs.readFile(path.join(dir, files[i]), 'utf8', (err) => {
        if (err) {
          console.error('读取失败：', err.message);
          return;
        }
        // 这里访问的是同一个 i，而不是"发起那一刻"的 i。
        varSeen.push(i);
        varCount += 1;
        if (varCount === files.length) {
          console.log('  用 var 时回调里看到的 i 依次是：', varSeen.join(', '), '（全是 3！）');
          runLoopLetDemo(dir);
        }
      });
    }
  }

  function runLoopLetDemo(dir) {
    const files = ['a.txt', 'b.txt', 'c.txt'];

    // 正确写法：let 是块作用域，每一轮循环都会创建一个**新的**绑定，
    // 回调捕获的是各自那一轮的 j。
    let letCount = 0;
    const letSeen = [];
    for (let j = 0; j < files.length; j += 1) {
      fs.readFile(path.join(dir, files[j]), 'utf8', (err) => {
        if (err) {
          console.error('读取失败：', err.message);
          return;
        }
        letSeen.push(j);
        letCount += 1;
        if (letCount === files.length) {
          console.log('  用 let 时回调里看到的 j 依次是：', letSeen.join(', '), '（各不相同，符合预期）');
          // 说明：这里打印顺序仍然取决于 I/O 完成顺序，
          // 但每个值都与它对应的文件真实匹配，这才是重点。
          runCopyRenameRemove(dir);
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // 8. 复制 / 重命名 / 删除
  // -------------------------------------------------------------------------

  function runCopyRenameRemove(dir) {
    console.log('--- 8. copyFile / rename / rm ---');

    const src = path.join(dir, 'b.txt');
    const copy = path.join(dir, 'b.copy.txt');
    const renamed = path.join(dir, 'b.renamed.txt');

    // 三层嵌套演示这三个操作，也顺便让"回调地狱"的可读性问题直观可见：
    // 缩进越来越深，错误处理散落各处。
    fs.copyFile(src, copy, (copyErr) => {
      if (copyErr) {
        console.error('复制失败：', copyErr.message);
        return;
      }
      console.log('  已复制 b.txt -> b.copy.txt');

      fs.rename(copy, renamed, (renameErr) => {
        if (renameErr) {
          console.error('重命名失败：', renameErr.message);
          return;
        }
        console.log('  已重命名 b.copy.txt -> b.renamed.txt');
        console.log('  原副本还在吗：', fs.existsSync(copy), '（rename 是移动语义）');

        // rm 的回调只有一个参数：err。没有"结果"要返回。
        fs.rm(renamed, (rmErr) => {
          if (rmErr) {
            console.error('删除失败：', rmErr.message);
            return;
          }
          console.log('  已删除 b.renamed.txt');
          console.log('  上面这段三层缩进就是"回调地狱"的雏形；');
          console.log('  换成 await 写法（06_fs_promises.js）会变成平坦的三行。');

          cleanupAndFinish(dir);
        });
      });
    });
  }

  // -------------------------------------------------------------------------
  // 9. 清理并结束
  // -------------------------------------------------------------------------

  function cleanupAndFinish(dir) {
    console.log('--- 9. 清理临时目录 ---');

    // recursive 删目录树；force 让"路径不存在"不报错。
    fs.rm(dir, { recursive: true, force: true }, (err) => {
      if (err) {
        // 清理失败只是警告，不影响程序的正常结束。
        console.warn('清理失败：', err.message);
      } else {
        console.log('已清理临时目录。');
      }

      // 校验：目录确实没了。
      console.log('清理后目录还存在吗：', fs.existsSync(dir));

      // 注意：这里不再有任何 pending 的异步操作，
      // 事件循环排空后进程会自然退出，退出码 0，不会挂起。
      console.log('--- 全部演示结束 ---');
    });
  }
});
