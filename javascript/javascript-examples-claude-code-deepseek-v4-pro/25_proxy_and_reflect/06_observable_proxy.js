/**
 * ============================================================================
 * 知识点：用 Proxy 实现数据变化侦测 —— 简易响应式系统的完整原理
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】高级
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js、03_has_delete_traps.js 与 WeakMap
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    响应式（reactivity）指的是：数据变了，用到这份数据的地方自动更新。
 *    它的实现只需要三步：
 *      ① **收集依赖**：某个函数读取了对象的某个属性时，记住"这个函数依赖这个属性"；
 *      ② **触发更新**：该属性被写入时，找出所有依赖它的函数，重新执行一遍；
 *      ③ **清理依赖**：函数重新执行时，先清掉上一次的依赖记录，再重新收集
 *         （否则条件分支切换后，旧分支的依赖会残留下来）。
 *    本文件用 Proxy + WeakMap 约 120 行实现这套机制 —— 这正是 Vue 3 响应式内核的骨架。
 *
 * 2. 为什么需要
 *    手动更新 UI / 缓存 / 派生状态极其繁琐且容易漏。有了响应式，
 *    开发者只声明"结果是怎么算出来的"，更新时机由框架负责。
 *    Proxy 相比 Vue 2 的 Object.defineProperty 方案有三个决定性优势：
 *      - 能监听新增/删除属性（defineProperty 要预先递归转换所有属性）；
 *      - 能监听数组下标与 length 的变化；
 *      - 能监听 in、delete、遍历等操作（靠 has/deleteProperty/ownKeys 陷阱）。
 *
 * 3. 核心语法要点
 *    - 用 WeakMap 存"目标对象 -> (属性 -> 依赖集合)"的映射，键是对象所以用 WeakMap，
 *      对象被回收时可自动释放依赖记录，避免内存泄漏。
 *    - 全局变量 activeEffect 记录"当前正在执行的函数"，
 *      get 陷阱触发时就把 activeEffect 收进依赖集合。
 *    - effect 重跑前必须清掉自己的旧依赖记录（cleanupEffect）。
 *    - get 陷阱里 track、set 陷阱里 trigger，这是响应式的全部要害。
 *    - 深层响应式：get 陷阱里发现值还是对象，就递归地再包一层代理（用缓存保证身份稳定）。
 *    - 数组与新增属性需要额外处理：用 ownKeys 陷阱监听"遍历"，
 *      用一个特殊的 ITERATE_KEY 作为依赖键。
 *    - computed 是"惰性 + 缓存"的 effect：脏了才重算。
 *    - batch 用"延迟触发"把一轮内的多次修改合并成一次更新。
 *
 * 4. 常见陷阱
 *    - 忘记清理旧依赖 => 条件分支切换后触发多余的更新，甚至出现"幽灵依赖"。
 *    - 依赖集合在遍历过程中被修改 => 必须复制一份再遍历（[...dep]）。
 *    - 代理缓存没做好 => 每次读取嵌套对象都新建代理，导致 === 判断失败，
 *      也会让依赖记录分散到不同的代理对象上（这里用 WeakMap 缓存解决）。
 *    - 循环依赖 / 自己触发自己 => 需要防重入（正在执行的 effect 不要再排队）。
 *    - 把大对象整体做成响应式有性能代价：每一个属性访问都要过陷阱，是真实的开销。
 *    - 响应式只能追踪"通过代理"的读写，直接操作原始对象（raw）不会触发任何更新。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/06_observable_proxy.js
 *
 * 【预期输出】
 *   打印依赖收集、自动重跑、动态依赖清理、computed 缓存与批量更新的完整过程。
 * ============================================================================
 */

// ===========================================================================
// 基础设施：依赖收集与触发
// ===========================================================================

// 正在执行的副作用函数（一个"函数作者"栈顶）。
let activeEffect = null;

// 副作用函数栈：支持嵌套 effect。
const effectStack = [];

// 依赖表：target -> (key -> effects 集合)。用 WeakMap 是为了让对象可被回收。
const targetMap = new WeakMap();

// 数组/对象"遍历"这类无法归到某个具体属性上的依赖，用这个 symbol 当键。
const ITERATE_KEY = Symbol('iterate');

// 代理缓存：raw 对象 -> 它的响应式代理。保证 obj.a === obj.a。
const proxyCache = new WeakMap();

/** 一个可被依赖追踪的副作用函数 */
class ReactiveEffect {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.scheduler = options.scheduler; // 可选的调度器（computed 会用到）
    this.deps = []; // 我依赖了哪些依赖集合（清理时用）
    this.active = true; // stop() 之后置为 false
    this.id = ++effectSeed;
  }

  run() {
    if (!this.active) return undefined;

    // 1) 重跑之前先清掉旧依赖 —— 这是"动态依赖"能正确工作的关键。
    cleanupEffect(this);

    // 2) 把自己压栈，并在 fn 执行期间作为 activeEffect。
    try {
      effectStack.push(this);
      activeEffect = this;
      return this.fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] ?? null;
    }
  }

  stop() {
    if (!this.active) return;
    cleanupEffect(this);
    this.active = false;
  }
}

let effectSeed = 0;

/** 把 effect 从它依赖过的所有集合里摘掉 */
function cleanupEffect(effect) {
  for (const dep of effect.deps) {
    dep.delete(effect);
  }
  effect.deps.length = 0;
}

/** 收集依赖：记录"当前 effect 依赖了 target 的 key" */
function track(target, key) {
  if (!activeEffect) return; // 没有正在执行的 effect，不需要收集

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // 双向记录：依赖集合里存 effect，effect 里也存依赖集合（便于清理）。
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
  return dep;
}

/**
 * 触发更新：让所有依赖 target[key] 的 effect 重新执行。
 * @param {object} target
 * @param {string|symbol} key
 * @param {boolean} includeIterate 是否连"遍历"依赖一起触发。
 *        只有**新增/删除**属性才需要，因为那才会改变"对象有哪些键"；
 *        修改已有属性的值不影响键集合，触发它只会造成多余的重跑。
 */
function trigger(target, key, includeIterate = false) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return 0;

  // 用 Set 收集依赖集合：当 key 本身就是 ITERATE_KEY 时两次取到同一个集合，
  // 不去重会让依赖它的 effect 被执行两遍。
  const depSets = new Set([depsMap.get(key)]);
  if (includeIterate) depSets.add(depsMap.get(ITERATE_KEY));
  depSets.delete(undefined);
  if (depSets.size === 0) return 0;
  const deps = [...depSets];

  let count = 0;
  const effectsToRun = new Set();
  for (const dep of deps) {
    // 复制一份再遍历：effect 执行时可能修改依赖集合。
    for (const effect of [...dep]) {
      // 避免"自己触发自己"造成的无限递归。
      if (effect !== activeEffect) effectsToRun.add(effect);
    }
  }

  for (const effect of effectsToRun) {
    count += 1;
    if (effect.scheduler) {
      effect.scheduler(); // 有调度器就交给调度器（computed / 批量更新）
    } else {
      effect.run();
    }
  }
  return count;
}

// ===========================================================================
// 创建响应式对象
// ===========================================================================

/** 取出响应式对象的原始对象（如果不是代理就返回自己） */
const RAW = Symbol('raw');
function toRaw(value) {
  return value && value[RAW] ? value[RAW] : value;
}

/** 把一个普通对象变成响应式对象 */
function reactive(target) {
  // 已经代理过就直接返回同一个代理。
  if (proxyCache.has(target)) return proxyCache.get(target);

  const proxy = new Proxy(target, {
    // ---------------- 读：收集依赖 ----------------
    get(tgt, key, receiver) {
      if (key === RAW) return tgt; // 内部用的"取原始对象"通道

      track(tgt, key);

      const value = Reflect.get(tgt, key, receiver);

      // 深层响应式：如果读到的还是对象，就递归包一层。
      if (value !== null && typeof value === 'object') {
        return reactive(value);
      }
      return value;
    },

    // ---------------- 写：触发更新 ----------------
    set(tgt, key, value, receiver) {
      // 取出旧值（注意要用原始值比较，避免代理与原始对象比较永远不等）。
      const oldValue = toRaw(tgt[key]);
      const hadKey = Object.hasOwn(tgt, key);

      const result = Reflect.set(tgt, key, value, receiver);

      // 真正发生变化才触发，减少无谓更新。
      if (!hadKey) {
        // 新增属性：既触发这个键，也触发"遍历"依赖（键集合变了）。
        trigger(tgt, key, true);
        // 数组新增下标会改变 length。
        // 注意：引擎在定义新下标时会顺带把 length 改成新值，
        // 导致后面那次"设置 length"因为值没变而不触发，
        // 所以必须在这里显式通知 length 的依赖者（push/unshift 就靠这一条）。
        if (Array.isArray(tgt) && /^\d+$/.test(String(key))) {
          trigger(tgt, 'length');
        }
      } else if (oldValue !== toRaw(value)) {
        // 修改已有属性：键集合没变，所以不必惊动"遍历"依赖。
        trigger(tgt, key);
      }
      return result;
    },

    // ---------------- 删除：触发更新 ----------------
    deleteProperty(tgt, key) {
      const hadKey = Object.hasOwn(tgt, key);
      const result = Reflect.deleteProperty(tgt, key);
      if (hadKey) {
        // 删除同样改变了键集合。
        trigger(tgt, key, true);
      }
      return result;
    },

    // ---------------- 遍历：把"遍历"本身也登记成依赖 ----------------
    ownKeys(tgt) {
      track(tgt, ITERATE_KEY);
      return Reflect.ownKeys(tgt);
    },

    // ---------------- in：也可以做成响应式（这里只转发，不收集） ----------------
    has(tgt, key) {
      return Reflect.has(tgt, key);
    },
  });

  proxyCache.set(target, proxy);
  return proxy;
}

/** 注册一个副作用函数，返回一个可 stop 的句柄 */
function effect(fn, options) {
  const reactiveEffect = new ReactiveEffect(fn, options);
  if (!options || options.lazy !== true) {
    reactiveEffect.run(); // 立即执行一次，完成首次依赖收集
  }
  const runner = () => reactiveEffect.run();
  runner.effect = reactiveEffect;
  return runner;
}

// ===========================================================================
// 演示
// ===========================================================================

console.log('--- 1. 第一个响应式效果 ---');

const state = reactive({ count: 0, name: '计数器' });

// effect 会立即执行一次，此时读到的 count 会被登记为依赖。
const logCount = effect(() => {
  console.log(`  [effect] 当前 count = ${state.count}`);
});
console.log('  （上面这行是 effect 注册时的首次执行）');

console.log('修改 count = 1：');
state.count = 1;

console.log('修改 count = 2：');
state.count = 2;

console.log('写入相同的值（2 -> 2）不会有任何输出：');
state.count = 2;

console.log('修改无关属性 name：');
state.name = '新名字';
console.log('  -> 没有重新执行，因为这次 effect 只依赖了 count');

console.log('--- 2. 依赖表长什么样 ---');

// 直接查看 targetMap 里记录的内容。
function dumpDeps(target, label) {
  const depsMap = targetMap.get(toRaw(target));
  console.log(`  ${label} 的依赖表：`);
  if (!depsMap) {
    console.log('    （空）');
    return;
  }
  for (const [key, dep] of depsMap) {
    console.log(`    键 ${String(key)} -> ${dep.size} 个 effect（编号 ${[...dep].map((e) => e.id).join(', ')}）`);
  }
}
dumpDeps(state, 'state');

console.log('--- 3. 多个 effect 与依赖属性不同 ---');

const derived = reactive({ a: 1, b: 2, sum: 0 });

// 只依赖 a 的 effect。
effect(() => {
  console.log(`  [A] a = ${derived.a}`);
});

// 根据 flag 动态决定依赖 a 还是 b 的 effect。
let useA = true;
effect(() => {
  const value = useA ? derived.a : derived.b;
  console.log(`  [B] 当前读取的是 ${useA ? 'a' : 'b'}，值 = ${value}`);
});

console.log('修改 a（A、B 都会重跑）：');
derived.a = 10;

console.log('切换开关，让 B 改为依赖 b：');
useA = false;
derived.a = 11; // B 这时还在依赖 a，仍然会重跑一次

console.log('再次修改 a（B 已经清理掉对 a 的依赖，不会再重跑）：');
derived.a = 12;

console.log('修改 b（只剩 B 会重跑）：');
derived.b = 20;

console.log('  -> 这就是"清理旧依赖"的价值：否则 B 会一直挂在 a 上，做多余的更新');
dumpDeps(derived, 'derived');

console.log('--- 4. 嵌套对象也是响应式的（深代理 + 缓存） ---');

const nested = reactive({ user: { profile: { nickname: '张三' } } });

effect(() => {
  console.log(`  [nested] nickname = ${nested.user.profile.nickname}`);
});

nested.user.profile.nickname = '李四';
console.log('  嵌套对象身份稳定吗？', nested.user === nested.user, '（代理缓存保证 === 成立）');

console.log('--- 5. computed：惰性求值 + 缓存 ---');

/**
 * 计算属性：只有当依赖变化后才重算，且如果没人读就一直不算。
 */
function computed(getter) {
  let value; // 缓存的値
  let dirty = true; // 是否需要重算

  // 用一个"懒"的 effect 来收集依赖；依赖变化时，scheduler 只把 dirty 置为 true。
  const runner = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true;
        console.log('    [computed] 依赖发生变化，缓存失效');
        // 计算属性变了，依赖计算属性的外层 effect 也要重跑。
        trigger(computedRef, 'value');
      }
    },
  });

  const computedRef = {
    get value() {
      // 谁读我，谁就依赖我。
      track(computedRef, 'value');
      if (dirty) {
        console.log('    [computed] 缓存已失效，开始重新计算');
        value = runner(); // 只有脏了才真正求值
        dirty = false;
      } else {
        console.log('    [computed] 直接命中缓存');
      }
      return value;
    },
  };

  return computedRef;
}

const cart = reactive({ price: 100, quantity: 3 });
const total = computed(() => {
  console.log('    [computed] 执行 getter');
  return cart.price * cart.quantity;
});

console.log('第一次读取 total：');
console.log('  total =', total.value);

console.log('第二次读取 total（没有依赖变化）：');
console.log('  total =', total.value);

console.log('读取第三次：');
console.log('  total =', total.value);

console.log('修改 quantity = 5：');
cart.quantity = 5;

console.log('再读 total：');
console.log('  total =', total.value, '（价格乘数量已经更新）');

// 计算属性可以再被别的 effect 依赖。
console.log('让一个 effect 依赖这个计算属性：');
effect(() => {
  console.log(`  [effect依赖computed] total = ${total.value}`);
});
console.log('修改 price = 200：');
cart.price = 200;

console.log('--- 6. batch：把多次修改合并成一次更新 ---');

// 渲染函数模拟：打印一次"渲染"日志。
let batchDepth = 0;
const pendingEffects = new Set();

function batch(fn) {
  batchDepth += 1;
  try {
    fn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) {
      // 统一刷新队列。
      const queued = [...pendingEffects];
      pendingEffects.clear();
      for (const e of queued) e.run();
    }
  }
}

const viewState = reactive({ width: 100, height: 50, title: '面板' });

const render = effect(() => {
  console.log(`  [render] 尺寸 ${viewState.width} x ${viewState.height}，标题「${viewState.title}」`);
});

console.log('不加 batch，连续改三个属性：');
viewState.width = 200;
viewState.height = 80;
viewState.title = '新面板';

console.log('再看一个"带调度器"的 effect（它会排队到 batch 结束才执行）：');

// 先用 let 声明，稍后再赋值 —— 这样 scheduler 内部就可以安全引用它自己。
let batchedEffect;

batchedEffect = effect(
  () => {
    console.log(`  [batched] 读到 ${viewState.width} / ${viewState.height} / ${viewState.title}`);
  },
  {
    scheduler: () => {
      // 调度器：不立刻执行，先排队，等 batch 结束时统一刷新。
      // 注意这个排队用的是 Set，同一个 effect 排多次也只会执行一次。
      pendingEffects.add(batchedEffect.effect);
    },
  },
);

console.log('不加 batch，连续改三个属性（普通 effect 会执行 3 次）：');
viewState.width = 250;
viewState.height = 90;
viewState.title = '中间态';

console.log('用 batch 包起来再改三个属性：');
batch(() => {
  viewState.width = 300;
  viewState.height = 150;
  viewState.title = '批量面板';
});
console.log('  -> 一次 batch 内改了 3 个属性，带调度器的 effect 只重新执行了 1 次');
console.log('  -> render 没有用调度器，所以上面那两轮里它每次都立刻执行了');
void render;

console.log('--- 7. 数组：下标、length 与遍历 ---');

const list = reactive([1, 2, 3]);

effect(() => {
  // 读 length 会收集对 "length" 的依赖。
  console.log(`  [list] 长度 = ${list.length}，内容 = ${list.join(',')}`);
});

console.log('push 一个元素：');
list.push(4);

console.log('修改下标 0：');
list[0] = 100;

console.log('直接改 length：');
list.length = 2;

console.log('--- 8. 新增属性与遍历依赖（ownKeys 陷阱的功劳）---');

const bag = reactive({ a: 1 });

effect(() => {
  // Object.keys 会触发 ownKeys 陷阱，从而依赖 ITERATE_KEY。
  console.log(`  [bag] 键 = ${Object.keys(bag).join(',')}`);
});

console.log('给 bag 增加一个新属性 b：');
bag.b = 2; // 会同时触发 b 与 ITERATE_KEY 的依赖

console.log('删除属性 a：');
delete bag.a;
console.log('  -> 如果没有 ownKeys 陷阱登记"遍历"依赖，新增/删除属性时这个 effect 就不会重跑');

console.log('--- 9. stop：手动停止侦听 ---');

const counter = reactive({ n: 0 });
const stopEffect = effect(() => {
  console.log(`  [stopped?] n = ${counter.n}`);
});

counter.n = 1;
console.log('调用 stop() 之后：');
stopEffect.effect.stop();
counter.n = 2;
counter.n = 3;
console.log('  -> 没有再打印，说明依赖已被彻底清理（不是"每次都跳过"，而是已经不在依赖表里了）');

console.log('--- 10. 常见坑：绕过代理就不会触发更新 ---');

const guarded = reactive({ value: 1 });
effect(() => {
  console.log(`  [raw] value = ${guarded.value}`);
});

// 通过代理改：会触发。
guarded.value = 2;

// 直接改原始对象：不会触发任何更新。
const rawObject = toRaw(guarded);
rawObject.value = 3;
console.log('  直接改原始对象后，guarded.value =', guarded.value, '（值变了，但 effect 没有被触发）');
console.log('  -> 响应式只能看见"经过代理"的操作，这也是它无法感知外部修改的根本原因');

console.log('\n全部演示完毕。');
