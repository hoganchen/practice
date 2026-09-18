/**
 * ============================================================================
 * 知识点：速率限制与暴力破解防护 —— 四种限流算法与 429 响应
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/15_auth_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    速率限制（Rate Limiting）指的是：**在一个时间窗口内，限制某个主体（IP / 用户 / 接口 /
 *    全局）能发起多少次操作**，超出就拒绝（通常返回 HTTP 429 Too Many Requests）。
 *    它既是可用性保护（防爬虫、防资源耗尽），也是最基础的**在线攻击缓解手段**
 *    —— 尤其是对"暴力破解密码""撞库""短信轰炸""验证码轰炸"这类攻击，
 *    在密码强度之外，限流往往是唯一真正生效的一道闸。
 *
 * 2. 为什么需要（真实攻击场景）
 *    (a) **在线密码爆破**：没有限流时，攻击者可以每秒试几百个密码。
 *        哪怕密码有 8 位，几天之内也能撞出一批弱密码账号。
 *    (b) **撞库**：用别的站点泄漏的"邮箱 + 密码"批量登录你的站点。
 *        这种攻击**完全不需要爆破**，只是把已知的组合挨个试一遍 —— 只能靠限流挡。
 *    (c) **短信/邮件轰炸**：被人拿你的"发送验证码"接口当武器，给任意手机号狂发短信，
 *        既骚扰用户，也烧掉你的短信费用（真实事故里一夜损失数万元）。
 *    (d) **爬虫与数据抓取**：商品价格、用户资料被批量拖走。
 *    (e) **资源耗尽**：一个昂贵的接口（导出报表、复杂查询）被打满，整站雪崩。
 *    (f) **限流本身是高价值接口的兜底**：即使前面的鉴权、校验都做对了，
 *        攻击者拿着合法账号也能把你打崩。
 *
 * 3. 核心语法要点：四种算法
 *
 *    (1) **固定窗口（Fixed Window）**
 *        把时间切成固定长度的窗口（如每分钟一个），窗口内计数，超过就拒绝，到点清零。
 *        实现最简单（一个计数器 + 一个窗口编号）。
 *        **致命缺陷：窗口边界的"突刺"**。假设限制 10 次/分钟，攻击者在 00:59 打 10 次
 *        （上一个窗口），在 01:00 再打 10 次（新窗口）——
 *        两秒内实际放行了 20 次，是限制值的两倍。
 *
 *    (2) **滑动窗口日志（Sliding Window Log）**
 *        记录每一次请求的时间戳，判断"最近 N 秒内的请求数是否超过限制"。
 *        最精确，没有边界突刺问题。
 *        代价：**每个主体都要存 N 次请求的时间戳**，内存开销与请求量成正比，
 *        高并发下存储成本很高（通常需要给日志长度设上限）。
 *
 *    (3) **令牌桶（Token Bucket）**
 *        一个容量为 C 的桶，以固定速率 r 往里放令牌，请求来了就取一个令牌，取不到就拒绝。
 *        关键特性：**允许突发**（只要桶里有存量，连打 C 个都能过），
 *        长期平均速率被限制在 r。这是最常用的工业级算法（Nginx、各类网关都在用）。
 *        参数直觉：C = 能容忍的突发量，r = 长期平均速率。
 *
 *    (4) **漏桶（Leaky Bucket）**
 *        请求先漏进桶里，桶以恒定速率 r 往外漏。桶满了就拒绝。
 *        与令牌桶的区别：漏桶**平滑输出**（无论输入多突发，下游看到的速率恒定），
 *        桶初始为空，所以**不允许初始突发**。
 *        适用：需要保护下游脆弱服务（数据库、第三方 API）的"整流"场景。
 *
 *    工程上常用组合：令牌桶做入口限流（允许合理突发）+ 关键接口再加固定/滑动窗口兜底。
 *
 *    (5) 分布式场景：为什么必须用 Redis 共享计数
 *        如果限流状态存在**每个实例的内存**里，那么"限制 100 次/分钟"在 10 个实例上
 *        实际变成了 1000 次/分钟（每个实例各算各的）。
 *        做法：把计数/令牌桶状态放到 Redis（或任何共享存储）里，所有实例读写同一份状态。
 *        实现要点：
 *          - 用 `INCR` + `EXPIRE` 时，两条命令之间进程崩溃会导致 key 永不过期 —— 必须用
 *            **Lua 脚本**把"判断 + 计数 + 设置过期"合成一次原子操作；
 *          - 令牌桶也要用 Lua 脚本实现（读状态 → 按时间差补令牌 → 判断 → 写回，必须原子）；
 *          - 多实例的**时钟漂移**会造成补充速率偏差，尽量用 Redis 服务端时间或统一 NTP；
 *          - 还要考虑 **Redis 挂掉怎么办**：
 *              · fail-open（放行）：可用性优先，但限流形同虚设；
 *              · fail-closed（拒绝）：安全优先，但 Redis 抖动会导致全站不可用；
 *              · 常见折中：本地内存兜底限流（比 Redis 的阈值宽松一些）+ 降级告警。
 *        本文件**不连 Redis**，只用内存实现演示算法本身。
 *
 *    (6) 429 响应与标准头
 *        - 状态码：**429 Too Many Requests**（不是 403，也不是 500）。
 *        - **Retry-After**：告诉客户端多久后可以重试。可以是秒数（`Retry-After: 30`），
 *          也可以是 HTTP 日期。客户端（含爬虫、SDK）应当遵守它。
 *        - 老式的 `X-RateLimit-Limit / -Remaining / -Reset` 头仍然广泛使用，
 *          新草案（RateLimit 头字段）建议：`RateLimit: limit=100, remaining=3, reset=30`。
 *        - 响应体里可以带上人类可读的原因，但**不要泄漏内部实现细节**
 *          （如"当前 Redis key 的计数是 137" —— 见 08 篇的错误信息卫生）。
 *
 *    (7) 限流按什么维度
 *        - **按 IP**：最通用，但坑很多 ——
 *            · 办公室/学校出口是同一个 NAT IP，一个人触发限流会连累全公司；
 *            · `X-Forwarded-For` 是**客户端可伪造**的，绝不能直接当 IP 用；
 *              必须由可信代理（且只有可信代理）追加，并取"从右向左第一个非可信 IP"；
 *            · IPv6 单用户可以持有整个 /64 网段，按单个地址限流等于没限。
 *        - **按用户**：登录后的接口最合理（一个账号一个配额）。
 *        - **按接口**：昂贵接口配更严的限制（导出报表 5 次/小时）。
 *        - **按全局**：兜底保护（防止总流量打垮下游），通常阈值设得较宽。
 *        - **按组合**：如"登录接口：每 IP 20 次/分钟 **且** 每账号 5 次/分钟
 *          **且** 全局 2000 次/分钟"。实践中永远是多个维度叠加，而不是只选一个。
 *        - 关键点：**限流 key 必须包含足够细的维度**，否则会出现"用一个账号把全站锁死"的
 *          拒绝服务效果（攻击者故意打满你的全局限制，让正常用户进不来）。
 *
 * 4. 常见陷阱
 *    - 只用固定窗口，被边界突刺打成两倍流量。
 *    - 限流状态放在各实例内存里，多实例部署后实际限额翻 N 倍。
 *    - 计数器不设过期时间，key 无限增长把内存撑爆（Redis 里尤其常见）。
 *    - 只按 IP 限流：NAT 后面的正常用户被误伤；同时攻击者换代理池就绕过了。
 *    - 只对"密码错误"限流，不限"总尝试次数" —— 攻击者可以用大量不存在的用户名绕开。
 *    - 只在前端做限流（JS 里计时），后端完全不设防 —— 攻击者根本不走你的前端。
 *    - 失败计数没有滑动窗口/衰减，用户输错两次后要等一小时。
 *    - 账户锁定策略可被武器化：攻击者故意用你的用户名连续输错密码，把你锁死（账户锁定 DoS）。
 *      → 缓解：锁定用"指数退避 + 验证码"而不是硬锁定，或按 IP+账号组合锁定。
 *    - 返回 200 但内容里写"太频繁了" —— 监控、SDK、爬虫都识别不出，应使用 429。
 *    - 用 sleep 阻塞请求来实现限流（应拒绝而不是排队阻塞，否则连接会被耗尽）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/16_rate_limiting.js
 *
 * 【预期输出】
 *   用**虚拟时钟**把同一个请求序列喂给四种限流算法，打印各自放行/拒绝的逐条结果与
 *   统计差异（这样可以在毫秒内演示完几分钟的限流行为，且不真的 sleep）；
 *   再起一个本地服务真实返回 429 + Retry-After；最后演示登录接口的
 *   失败计数 + 指数退避 + 验证码 + 锁定。全程无真实等待、无外部依赖，退出码 0。
 * ============================================================================
 */

import http from 'node:http';

// ============================================================================
// 小节 1：为什么需要限流
// ============================================================================
console.log('--- 1. 限流挡的是什么 ---');
for (const [attack, how, onlyDefense] of [
  ['在线密码爆破', '对同一个账号连续尝试不同密码', '限流 + 退避 + 验证码 + 锁定'],
  ['撞库', '用别站泄漏的"账号+密码"批量登录', '**只能靠限流**（密码本身是对的）'],
  ['短信/验证码轰炸', '拿你的发送接口给任意手机号狂发', '限流（按手机号 + 按 IP + 全局）'],
  ['爬虫抓取', '批量请求列表/详情接口', '限流 + 行为识别'],
  ['资源耗尽', '打满昂贵接口（导出、复杂查询）', '限流 + 配额 + 队列'],
]) {
  console.log(`  ${attack.padEnd(14)} 手法：${how}`);
  console.log(`  ${' '.repeat(14)} 防御：${onlyDefense}`);
}
console.log('\n  一句话：认证/授权解决"该不该让他进"，限流解决"他能进多快"。');

// ============================================================================
// 小节 2：四种限流算法的实现（全部使用"虚拟时钟"，不真的等待）
// ============================================================================
console.log('\n--- 2. 四种限流算法（同样的参数：10 次 / 1000ms） ---');
console.log('  说明：所有实现都接收一个 now（毫秒时间戳）参数，而不是内部调用 Date.now()。');
console.log('        这样同一个请求序列可以在毫秒内被四种算法分别回放，也方便写单元测试。');

const LIMIT = 10;
const WINDOW_MS = 1000;

/** (1) 固定窗口：一个计数器 + 一个窗口编号，到点清零 */
class FixedWindowLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.currentWindow = -1;
    this.count = 0;
  }

  /**
   * @param {number} now 当前时间（毫秒）
   * @returns {{allowed:boolean, reason:string}}
   */
  tryConsume(now) {
    const w = Math.floor(now / this.windowMs);
    if (w !== this.currentWindow) {
      this.currentWindow = w;
      this.count = 0;
    }
    if (this.count < this.limit) {
      this.count++;
      return { allowed: true, reason: `窗口内第 ${this.count}/${this.limit} 次` };
    }
    return { allowed: false, reason: `本窗口已达上限 ${this.limit}` };
  }
}

/** (2) 滑动窗口日志：保存每次请求的时间戳，只统计最近 windowMs 内的 */
class SlidingWindowLogLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    /** @type {number[]} */
    this.log = [];
  }

  tryConsume(now) {
    // 清掉窗口外的旧记录
    this.log = this.log.filter((t) => now - t < this.windowMs);
    if (this.log.length < this.limit) {
      this.log.push(now);
      return { allowed: true, reason: `窗口内第 ${this.log.length}/${this.limit} 次` };
    }
    const retryIn = this.windowMs - (now - this.log[0]);
    return { allowed: false, reason: `最近 ${this.windowMs}ms 内已有 ${this.log.length} 次，${retryIn}ms 后可重试` };
  }
}

/** (3) 令牌桶：容量 C，按 r 个/毫秒补充，允许突发（桶满时） */
class TokenBucketLimiter {
  constructor(capacity, refillPerWindow) {
    this.capacity = capacity;
    this.ratePerMs = refillPerWindow / WINDOW_MS;
    this.tokens = capacity; // 初始满桶 —— 注意这一点：它允许一开始就突发
    this.lastRefill = null;
  }

  tryConsume(now) {
    if (this.lastRefill === null) this.lastRefill = now;
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.ratePerMs);
      this.lastRefill = now;
    }
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return { allowed: true, reason: `剩余令牌 ${this.tokens.toFixed(2)}` };
    }
    const needMs = Math.ceil((1 - this.tokens) / this.ratePerMs);
    return { allowed: false, reason: `令牌不足（剩 ${this.tokens.toFixed(2)}），约 ${needMs}ms 后可用` };
  }
}

/** (4) 漏桶：桶以恒定速率漏水，桶满则拒绝；初始为空 —— 不允许初始突发 */
class LeakyBucketLimiter {
  constructor(capacity, leakPerWindow) {
    this.capacity = capacity;
    this.leakPerMs = leakPerWindow / WINDOW_MS;
    this.level = 0; // 初始空桶
    this.lastLeak = null;
  }

  tryConsume(now) {
    if (this.lastLeak === null) this.lastLeak = now;
    const elapsed = now - this.lastLeak;
    if (elapsed > 0) {
      this.level = Math.max(0, this.level - elapsed * this.leakPerMs);
      this.lastLeak = now;
    }
    if (this.level + 1 <= this.capacity) {
      this.level += 1;
      return { allowed: true, reason: `桶内水位 ${this.level.toFixed(2)}/${this.capacity}` };
    }
    return { allowed: false, reason: `桶已满（${this.level.toFixed(2)}/${this.capacity}），需等待漏水` };
  }
}

// ============================================================================
// 小节 3：同一个请求序列，四种算法各是什么表现
// ============================================================================
console.log('\n--- 3. 同一请求序列喂给四种算法（限流阈值 10 次 / 1000ms） ---');

/**
 * 用同一个请求序列回放一个限流器，返回每个请求的放行结果。
 * @param {{tryConsume:(now:number)=>{allowed:boolean, reason:string}}} limiter
 * @param {number[]} times
 * @returns {boolean[]}
 */
function replay(limiter, times) {
  return times.map((t) => limiter.tryConsume(t).allowed);
}

/** 每次回放都用全新的限流器实例，避免序列之间互相污染状态 */
const makeLimiters = () => [
  ['固定窗口 Fixed Window', new FixedWindowLimiter(LIMIT, WINDOW_MS)],
  ['滑动窗口日志 Sliding Window Log', new SlidingWindowLogLimiter(LIMIT, WINDOW_MS)],
  ['令牌桶 Token Bucket', new TokenBucketLimiter(LIMIT, LIMIT)],
  ['漏桶 Leaky Bucket', new LeakyBucketLimiter(LIMIT, LIMIT)],
];

/** 把放行结果渲染成一行易读的符号串（✓ 放行 / ✗ 拒绝），每 4 个一组方便数 */
const render = (results) => results.map((ok) => (ok ? '✓' : '✗')).join('').replace(/(.{4})/g, '$1 ');

/** 回放一个序列并打印每种算法的结果 */
function runSequence(title, segments, times) {
  console.log(`  序列：${title}`);
  for (const [desc, count] of segments) {
    console.log(`    · ${desc}（${count} 个请求）`);
  }
  console.log();
  /** @type {Map<string, boolean[]>} */
  const allResults = new Map();
  for (const [name, limiter] of makeLimiters()) {
    const results = replay(limiter, times);
    allResults.set(name, results);
    const allowed = results.filter(Boolean).length;
    console.log(`  ${name}`);
    console.log(`    ${render(results)}`);
    console.log(`    放行 ${allowed} / 拒绝 ${results.length - allowed}`);
  }
  console.log();
  return allResults;
}

// ---------------------------------------------------------------------------
// 序列 A：窗口边界突刺（固定窗口最著名的缺陷）
//   · t=990ms 打 10 个（落在第 0 个窗口的尾巴上）
//   · t=1010ms 再打 10 个（刚好进入第 1 个窗口）
//   · t=2500ms 再打 3 个（此时早已恢复）
// ---------------------------------------------------------------------------
const seqA = [
  ...Array.from({ length: 10 }, (_, i) => 990 + i * 0.1),
  ...Array.from({ length: 10 }, (_, i) => 1010 + i * 0.1),
  ...Array.from({ length: 3 }, (_, i) => 2500 + i * 0.1),
];
const resultsA = runSequence(
  '窗口边界突刺（20 个请求挤在 21ms 内，跨越窗口边界）',
  [
    ['t=990ms 打 10 个', 10],
    ['t=1010ms 再打 10 个', 10],
    ['t=2500ms 打 3 个（恢复期）', 3],
  ],
  seqA
);

const fixedA = resultsA.get('固定窗口 Fixed Window');
console.log('  怎么读序列 A：');
console.log(
  `    · 固定窗口：23 个请求【全部放行】。其中前两段突发就有 20 个，散落在 21 毫秒之内。`
);
console.log('      原因：990ms 属于窗口 0、1010ms 属于窗口 1，两个窗口各算各的 ——');
console.log('      所以在 21 毫秒里实际放行了 20 个请求，是限制值（10 个/秒）的两倍。这就是"边界突刺"。');
console.log('    · 滑动窗口日志 / 令牌桶 / 漏桶：第二段 10 个【全部拒绝】，因为它们的判断依据是');
console.log('      "最近 1000ms 内已经放行了多少"，而不是"当前这个固定窗口内放行了多少"。');
console.log('    → 结论：只要你对精确性有要求，就不该用天真的固定窗口实现。');

// ---------------------------------------------------------------------------
// 序列 B：持续超速（到达速率 20 次/秒，限制 10 次/秒）
//   · 每 50ms 来一个请求，共 30 个（总时长 1450ms）
// ---------------------------------------------------------------------------
const seqB = Array.from({ length: 30 }, (_, i) => i * 50);
const resultsB = runSequence(
  '持续超速：每 50ms 来 1 个（到达 20 次/秒 > 限制 10 次/秒）',
  [['每 50ms 一个，共 30 个', 30]],
  seqB
);

console.log('  怎么读序列 B：');
for (const [name, results] of resultsB) {
  const allowed = results.filter(Boolean).length;
  console.log(`    · ${name.padEnd(32)} 30 个请求中放行 ${allowed} 个`);
}
console.log('    → 在"长期稳定超速"的场景下，四种算法的**平均放行速率会趋同**（都贴近限额），');
console.log('      真正拉开差距的是**突发怎么处理**（见序列 A）与**输出是否平滑**。');
console.log('    → 一个诚实的说明：本文件把漏桶实现成"水位计"（水平面越低越接受请求），');
console.log('      它和令牌桶在数学上其实高度接近，差别主要在**初始状态**（令牌桶起始满桶、');
console.log('      允许一开始就突发；漏桶起始空桶）与**语义**（授权 vs 整流）。');
console.log('      漏桶的另一种经典实现是**队列**：请求先排队，再以恒定速率逐个处理，');
console.log('      队列满才拒绝。那种实现会带来真实的"平滑输出 + 排队延迟"，');
console.log('      适合放在脆弱下游（数据库、第三方 API）前面做整流 —— 但代价是请求会变慢。');

console.log('\n  选型口诀：');
console.log('    - 只要"简单够用" → 固定窗口（但要接受边界突刺，或把窗口切细一些）。');
console.log('    - 要求"绝对精确" → 滑动窗口日志（代价是每个主体都要存 N 个时间戳）。');
console.log('    - 希望"允许合理突发" → 令牌桶（最常用，网关普遍默认选择）。');
console.log('    - 希望"保护下游脆弱服务" → 漏桶（输出恒定速率）。');
console.log('    - 折中方案：滑动窗口计数（Sliding Window Counter）——');
console.log('      用"上一窗口计数 × 重叠比例 + 本窗口计数"来近似，内存 O(1) 且几乎没有突刺。');

// ============================================================================
// 小节 4：分布式限流的原理（不连 Redis）
// ============================================================================
console.log('\n--- 4. 分布式场景：为什么必须共享状态 ---');
console.log('  假设限制是 100 次/分钟，线上有 4 个实例：');
console.log('    状态存各自内存 → 每个实例各给 100 次 → 全站实际 400 次/分钟（超了 4 倍）');
console.log('    状态存共享存储 → 4 个实例读写同一份计数 → 全站 100 次/分钟（正确）');
console.log('\n  用 Redis 实现时必须注意的四点：');
for (const [k, v] of [
  ['原子性', '`INCR` 与 `EXPIRE` 是两条命令，中间崩溃会留下永不 过期的 key → 用 Lua 脚本合成一次原子操作'],
  ['过期时间', '每个 key 都必须有过期时间，否则内存会被无限增长的限流 key 撑爆'],
  ['时钟漂移', '令牌桶/漏桶按时间差补令牌，多实例时钟不一致会导致速率偏差 → 用服务端时间或统一 NTP'],
  ['故障策略', 'Redis 挂了怎么办？fail-open（可用性优先，限流失效）/ fail-closed（安全优先，可能全站 503）'],
]) {
  console.log(`    ${k.padEnd(8)} ${v}`);
}
console.log('\n  伪代码（仅示意，本示例不连接任何 Redis）：');
console.log('    -- Lua 脚本：固定窗口限流，保证"判断+计数+过期"是原子的');
console.log('    local current = redis.call("INCR", KEYS[1])');
console.log('    if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end');
console.log('    if current > tonumber(ARGV[2]) then return 0 else return 1 end');
console.log('\n  推荐的降级姿势：Redis 不可用时启用一个**本地内存的宽松兜底限流**');
console.log('    （比如阈值放大到 3 倍），既能防止下游被瞬间打垮，又不会因 Redis 抖动导致全站不可用。');

// ============================================================================
// 小节 5：真实 HTTP 429 + Retry-After
// ============================================================================
console.log('\n--- 5. 本地服务实测：429 Too Many Requests 与 Retry-After ---');

/** 服务端限流器：按 IP 做固定窗口（演示用，真实项目按前面的维度组合来） */
const perIpLimiters = new Map();
const IP_LIMIT = 5;
const IP_WINDOW_MS = 2000;

/**
 * 取客户端 IP。
 * 重要：X-Forwarded-For 是**客户端可以随便伪造的**，只有在你信任的反向代理
 * 明确设置了它的情况下才能使用，而且应该取"从右往左第一个非可信 IP"。
 * 这里为了演示维度问题，故意保留了一个不校验 XFF 的版本供对比。
 * @param {http.IncomingMessage} req
 * @param {boolean} trustProxy 是否信任代理头
 * @returns {string}
 */
function clientIp(req, trustProxy) {
  if (trustProxy) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
      // 取最左边那个（真实部署中这仍然不安全，见下面的说明）
      return xff.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}

let server;
const port = await new Promise((resolve) => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const trustProxy = url.searchParams.get('trustProxy') === '1';
    const ip = clientIp(req, trustProxy);

    let limiter = perIpLimiters.get(ip);
    if (!limiter) {
      limiter = new SlidingWindowLogLimiter(IP_LIMIT, IP_WINDOW_MS);
      perIpLimiters.set(ip, limiter);
    }
    const result = limiter.tryConsume(Date.now());

    if (!result.allowed) {
      // 关键：429 + Retry-After，让客户端知道该等多久
      res.writeHead(429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': '2',
        'RateLimit': `limit=${IP_LIMIT}, remaining=0, reset=2`,
      });
      return res.end(JSON.stringify({ message: '请求过于频繁，请稍后再试', retryAfterSeconds: 2 }));
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'RateLimit': `limit=${IP_LIMIT}, remaining=${Math.max(0, IP_LIMIT - 1)}, reset=2`,
    });
    res.end(JSON.stringify({ message: 'ok' }));
  });
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const base = `http://127.0.0.1:${port}`;
console.log(`  本地服务已启动：${base}（限流：每 IP 5 次 / 2 秒，滑动窗口）`);

console.log('\n  连打 8 次（观察第 6 次开始被拒）：');
for (let i = 1; i <= 8; i++) {
  const res = await fetch(`${base}/api/data`);
  const body = await res.json();
  const retryAfter = res.headers.get('retry-after');
  console.log(
    `    第 ${i} 次 -> ${res.status} ${body.message}` +
      (res.status === 429 ? `（Retry-After: ${retryAfter}s）` : '')
  );
}

console.log('\n  伪造 X-Forwarded-For 绕过按 IP 的限流（真实存在的绕过手法）：');
console.log('    如果服务端直接采信 X-Forwarded-For 当作客户端 IP：');
for (const fakeIp of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
  const res = await fetch(`${base}/api/data?trustProxy=1`, { headers: { 'X-Forwarded-For': fakeIp } });
  console.log(`      伪造 XFF=${fakeIp} -> ${res.status}（攻击者每次换个假 IP 就绕过了限流）`);
}
console.log('    正确做法：');
console.log('      · 只信任你自己那台反向代理写入的 XFF；');
console.log('      · 从**右往左**找第一个"不在可信代理网段内"的 IP；');
console.log('      · 或者干脆由代理层（Nginx / 网关）把真实 IP 写进一个内部专用的头，');
console.log('        并在入口处**剥掉**客户端传来的同名头。');

console.log('\n  429 响应的规范要点：');
for (const item of [
  '状态码用 429，不要用 403 / 500 / 200',
  '带上 Retry-After（秒数或 HTTP 日期），让合规的客户端知道何时重试',
  '配合 RateLimit / X-RateLimit-* 头暴露剩余额度（注意：暴露给外部时可能泄漏业务规模）',
  '响应体可以给人类可读提示，但不要泄漏内部实现（如具体计数值、key 名）',
  '限流命中要打点监控：突增往往意味着攻击，也可能意味着阈值配错了',
]) {
  console.log(`    · ${item}`);
}

// ============================================================================
// 小节 6：登录接口的防暴力破解（失败计数 + 指数退避 + 验证码 + 锁定）
// ============================================================================
console.log('\n--- 6. 登录接口防暴力破解的组合拳 ---');
console.log('  只用"失败 N 次就锁定账户"是不够的：攻击者可以故意输错你的用户名，把你锁在门外');
console.log('  （账户锁定 DoS）。实践中要四件套组合使用。');

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 60_000;
const CAPTCHA_AFTER = 3; // 失败 3 次后开始要求验证码
const LOCK_THRESHOLD = 10; // 失败 10 次后锁定一段时间
const FAIL_WINDOW_MS = 15 * 60_000; // 失败计数的滑动窗口：15 分钟

/**
 * 计算第 n 次失败后的退避时间（指数退避，带封顶）。
 * @param {number} failures 连续失败次数
 * @returns {number} 需要等待的毫秒数
 */
function backoffMs(failures) {
  if (failures <= 0) return 0;
  return Math.min(BACKOFF_BASE_MS * 2 ** (failures - 1), BACKOFF_MAX_MS);
}

/** 按账号维度的失败记录（内存模拟） */
const loginFailures = new Map(); // account -> number[]（失败时间戳）

/**
 * 一次登录尝试的准入判断 + 结果记录（虚拟时钟，便于演示）。
 * @param {{account:string, password:string, captchaOk?:boolean, now:number}} attempt
 * @returns {{allowed:boolean, code:string, message:string, waitMs?:number, needCaptcha?:boolean}}
 */
function attemptLogin(attempt) {
  const { account, password, captchaOk = true, now } = attempt;
  const history = (loginFailures.get(account) ?? []).filter((t) => now - t < FAIL_WINDOW_MS);

  // 第 1 关：是否处于锁定中
  if (history.length >= LOCK_THRESHOLD) {
    const unlockAt = history[history.length - LOCK_THRESHOLD] + FAIL_WINDOW_MS;
    return { allowed: false, code: 'LOCKED', message: `账号已被临时锁定，请 ${Math.ceil((unlockAt - now) / 60000)} 分钟后再试` };
  }
  // 第 2 关：指数退避 —— 距离上次失败还不够久就拒绝
  if (history.length > 0) {
    const waitNeeded = backoffMs(history.length);
    const sinceLast = now - history[history.length - 1];
    if (sinceLast < waitNeeded) {
      return {
        allowed: false,
        code: 'BACKOFF',
        message: `失败次数过多，请等待 ${((waitNeeded - sinceLast) / 1000).toFixed(1)} 秒后重试`,
        waitMs: waitNeeded - sinceLast,
      };
    }
  }
  // 第 3 关：需要验证码而未提供
  const needCaptcha = history.length >= CAPTCHA_AFTER;
  if (needCaptcha && !captchaOk) {
    return { allowed: false, code: 'CAPTCHA_REQUIRED', message: '需要输入图形验证码', needCaptcha: true };
  }
  // 通过准入关卡后，真正校验密码（这里的假密码只用于演示）
  if (password === 'correct-password') {
    loginFailures.delete(account); // 成功则清零
    return { allowed: true, code: 'OK', message: '登录成功' };
  }
  history.push(now);
  loginFailures.set(account, history);
  return {
    allowed: false,
    code: 'BAD_CREDENTIALS',
    message: `账号或密码错误（第 ${history.length} 次失败）`, // 不区分"用户不存在/密码错"，防枚举
    needCaptcha: history.length >= CAPTCHA_AFTER,
  };
}

/**
 * 模拟一次爆破：攻击者尽量"守规矩"（被退避挡回就等到可以再试），
 * 这样能看清三道关卡依次生效的顺序 —— 退避 → 验证码 → 锁定。
 * @param {{solveCaptcha:boolean, maxAttempts:number}} opts
 */
function simulateBruteForce({ solveCaptcha, maxAttempts }) {
  loginFailures.delete('alice');
  let now = 0;
  const lines = [];
  for (let i = 1; i <= maxAttempts; i++) {
    now += 100; // 攻击者先按 100ms 一次猛冲
    const r = attemptLogin({ account: 'alice', password: `guess-${i}`, captchaOk: solveCaptcha, now });
    // 标出"这一次已经进入需要验证码的阶段"，便于观察第二道关卡何时生效
    const captchaTag = r.code === 'CAPTCHA_REQUIRED' || r.needCaptcha ? ' [需验证码]' : '';
    lines.push(
      `    第 ${String(i).padStart(2)} 次（t=${(now / 1000).toFixed(1)}s）-> ${r.code}${captchaTag}：${r.message}`
    );
    if (r.code === 'LOCKED') break;
    if (r.waitMs) now += r.waitMs + 50; // 被退避挡回后，攻击者等到允许再试
  }
  return lines;
}

console.log('\n  【场景 1】自动化脚本，不处理验证码（多数低端攻击者就是这种）');
console.log(simulateBruteForce({ solveCaptcha: false, maxAttempts: 8 }).join('\n'));

console.log('\n  【场景 2】假设攻击者愿意花成本解题（打码平台 / 人工），验证码不再是障碍');
console.log(simulateBruteForce({ solveCaptcha: true, maxAttempts: 30 }).join('\n'));

console.log('\n  观察点（三道关卡依次生效）：');
console.log('    · 第 1 关【指数退避】：第 1 次失败后就要求等 1 秒，之后 2s、4s、8s…封顶 60s。');
console.log('      攻击者每试一次要等的时间指数增长，单位时间的尝试次数被压到极低。');
console.log('    · 第 2 关【验证码】：累计失败 3 次后再来的请求被要求输入验证码，');
console.log('      场景 1 里攻击者就卡在这里 —— 脚本无法自动过关，成本陡增。');
console.log('    · 第 3 关【账户临时锁定】：即使攻击者能解验证码（场景 2），');
console.log('      累计失败达到阈值后账号进入锁定状态，窗口期内完全拒绝。');
console.log('    · 注意场景 2 里"等待时间"合计已经到分钟级 —— 这就是限流把"每秒几百次"');
console.log('      压缩成"几分钟十几次"的直接效果。');

console.log('\n  另一侧：正常用户 alice 自己输错一次后等待足够久再试：');
loginFailures.delete('alice');
let t2 = 0;
t2 += 100;
console.log(`    第 1 次输错 -> ${attemptLogin({ account: 'alice', password: 'wrong', now: t2 }).message}`);
t2 += 1500; // 等 1.5 秒，超过退避要求
console.log(`    等 1.5s 后用正确密码 -> ${attemptLogin({ account: 'alice', password: 'correct-password', now: t2 }).message}`);
console.log('    → 退避只惩罚"连续快速失败"，不会把正常用户长期挡在门外。');

console.log('\n  防暴力破解的完整清单：');
for (const item of [
  '按【账号 + IP + 全局】三个维度同时限流（不能只按其中一个）',
  '失败计数用滑动窗口并会衰减，成功后立即清零',
  '指数退避（1s、2s、4s…封顶 60s），而不是简单硬锁定',
  '失败 3 次左右开始要求验证码（人机识别，让脚本成本陡增）',
  '失败信息不区分"用户不存在"与"密码错误"（防用户名枚举）',
  '记录并告警异常模式：同一 IP 试多个账号（撞库）、同一账号被多个 IP 试（分布式爆破）',
  '高价值账号支持 2FA；敏感操作要求二次验证',
  '锁定要考虑被武器化的风险：优先"退避 + 验证码"，慎用"永久锁定"',
  '必要时引入 WAF / 风控（代理池、设备指纹、行为特征）',
]) {
  console.log(`    [ ] ${item}`);
}

console.log('\n  限流维度的选择（回顾，很重要）：');
for (const [dim, good, bad] of [
  ['按 IP', '未登录接口的第一道闸', 'NAT 误伤；XFF 可伪造；IPv6 /64 绕过'],
  ['按用户', '登录后接口最合理（一个账号一个配额）', '未登录时没有用户标识'],
  ['按接口', '昂贵接口单独收紧（导出 5 次/小时）', '需要给每个接口单独配置，维护成本高'],
  ['按手机号/邮箱', '验证码类接口必须（防轰炸）', '要防止用大小写/别名绕过'],
  ['按全局', '兜底保护下游', '阈值太严会被攻击者用来"打满配额"拒绝服务'],
]) {
  console.log(`  ${dim.padEnd(12)} 适合：${good}`);
  console.log(`  ${' '.repeat(12)} 注意：${bad}`);
}

// ============================================================================
// 小节 7：小结
// ============================================================================
console.log('\n--- 7. 小结 ---');
console.log('  1) 限流解决的是"能进多快"，认证授权解决的是"该不该让他进"，两者不可互替。');
console.log('  2) 固定窗口简单但有边界突刺；滑动窗口日志精确但费内存；令牌桶允突发；漏桶最平滑。');
console.log('  3) 多实例部署时限流状态必须放共享存储（Redis），且要用 Lua 保证原子性。');
console.log('  4) 每个限流 key 都必须有过期时间，否则内存会被撑爆。');
console.log('  5) 超限返回 429 + Retry-After，不要用 200/403/500 糊弄。');
console.log('  6) 按 IP 限流要小心 XFF 伪造与 NAT 误伤；实践中永远是多维度叠加。');
console.log('  7) 防暴力破解是组合拳：失败计数 + 指数退避 + 验证码 + 锁定 + 告警，缺一不可。');
console.log('  8) 阈值要既能挡住攻击，又不能被攻击者用来"打满配额"实施拒绝服务。');

await new Promise((r) => server.close(r));
console.log('\n[清理] 本地限流演示服务已关闭。示例结束，退出码 0。');
