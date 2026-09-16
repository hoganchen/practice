/**
 * ESLint 配置（flat config —— ESLint 9+ / 10+ 的格式）
 * ----------------------------------------------------------------------------
 * 本仓库装了 ESLint 却没配置过，属于「教了工具自己不用」。这个文件把它补上，
 * 顺便作为 39_tooling_and_workflow/04_eslint.js 所讲内容的**活例子**：
 * 那个文件用编程 API 内联配置演示规则，这里的配置文件则是真实项目里的形态。
 *
 * 设计取舍（对应 04_eslint.js 讲的「ESLint 该管逻辑、不该管格式」）：
 *   - **不配置任何纯格式规则** —— 那是 Prettier 的职责（见 .prettierrc）。
 *     ESLint 官方已废弃所有纯格式规则，两边同时管格式必然互相打架。
 *   - 规则集刻意偏宽松：本仓库的示例大量「故意写错再 try/catch 演示」，
 *     例如故意未使用的变量、故意空 catch 块。规则太严会把教学内容判成错误。
 *   - 不用 @eslint/js 的 recommended 预设（它没被安装，避免为此新增依赖），
 *     改为显式列出规则 —— 也让读者能一眼看清「到底开了哪些检查」。
 *
 * 用法：
 *   npm run lint          检查全部示例
 *   npm run lint:fix      自动修复可修复的问题
 */

export default [
  // ---------------------------------------------------------------- 忽略范围
  {
    ignores: [
      'node_modules/**',
      '.glossary_parts/**', // 术语表分册，是文档不是代码
      '**/*.min.js',

      // ↓ 这两个文件 ESLint 的解析器（espree）读不了，但它们本身是正确的：
      //   · 08_arrays/15 —— 故意写 `arr.at(-1) = 99` 演示"给 at() 赋值会报错"。
      //     规范里这是**早期语法错误**，espree 因此在解析阶段就拒绝；
      //     但 V8 把它推迟到运行时抛 ReferenceError（可被 try/catch 捕获），
      //     所以 `node --check` 通过、文件也能正常跑出教学效果。
      //   · 34_modern_es_features/08 —— 用了显式资源管理 `using res = ...`，
      //     espree 尚未支持该语法（eslint 10 实测）。
      //   两者都是解析器跟不上，不是代码有问题。
      '08_arrays/15_at_and_negative_index.js',
      '34_modern_es_features/08_explicit_resource_management.js',
    ],
  },

  // ---------------------------------------------------------------- 全部 JS
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      // 必须是 2025：示例里用到了 import attributes（`import x from 'y' with { type: 'json' }`）
      // 与显式资源管理（`using res = ...`），2024 的解析器会直接报 Parsing error。
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        // Node 全局
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        performance: 'readonly',
        // Node 与浏览器通用的 Web 标准 API
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        crypto: 'readonly',
        WebSocket: 'readonly',
        CompressionStream: 'readonly',
        DecompressionStream: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        CountQueuingStrategy: 'readonly',
        ByteLengthQueuingStrategy: 'readonly',
        DOMException: 'readonly',
        CryptoKey: 'readonly',
        CryptoKeyPair: 'readonly',
        EventSource: 'readonly',
        BroadcastChannel: 'readonly',
        MessageChannel: 'readonly',
        MessagePort: 'readonly',
        Worker: 'readonly',
        Cache: 'readonly',
        CacheStorage: 'readonly',
        caches: 'readonly',
        // 浏览器全局（.html 内联脚本与 27_web_apis 的浏览器示例用得到）
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // base64 编解码（Node 16+ 全局；示例里会与 Buffer 方案做对照）
        btoa: 'readonly',
        atob: 'readonly',
        // 定时与调度
        requestIdleCallback: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // 观察者与组件
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        HTMLElement: 'readonly',
        customElements: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
    rules: {
      // ==================== 示例目录（教学材料，故意放松） ====================
      // 关键认知：**本仓库的示例里有大量"故意写错"的代码** ——
      // 用 `x === x` 演示 NaN 比较、用 `while(true)` 演示无限循环、
      // 用未声明的变量演示作用域、用 `arr.at(-1) = 99` 演示报错。
      // 这些正是教学内容本身，不能被当成"代码问题"。
      // 所以示例目录只保留**不会误伤教学**的几条结构性检查。

      // 保留：这些即使刻意写错也很难说是"教学需要"，报了多半是真问题
      'no-dupe-keys': 'error', // 对象字面量重复键 —— 基本是手误
      'no-dupe-args': 'error', // 函数参数重名
      'no-func-assign': 'error', // 给函数声明重新赋值
      'no-cond-assign': ['error', 'except-parens'], // if (x = 1) 少了括号
      'no-unsafe-negation': 'error', // !key in obj 的优先级陷阱
      'valid-typeof': 'error', // typeof x === 'strng' —— 字符串拼错

      // 降级为警告：示例里可能是刻意的，但值得看一眼
      'no-undef': 'warn', // 作用域 / 隐式全局的示例会故意用未声明变量
      'no-redeclare': 'warn',
      'no-unreachable': 'warn',
      'no-obj-calls': 'warn',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-sparse-arrays': 'warn',
      'no-template-curly-in-string': 'warn',

      // 关闭：这些规则拦的正是本仓库要教的东西
      'no-self-compare': 'off', // 03_data_types 用 x === x 演示 NaN 的怪异
      'use-isnan': 'off', // 同上，示例必须能写 x === NaN
      'no-constant-condition': 'off', // 01/02 用 while(true) 演示
      eqeqeq: 'off', // 03_data_types/12 专讲 == 与 === 的区别
      'no-eval': 'off', // 32_security/05 讲 eval 风险时必须真的调用
      'no-new-func': 'off', // 多处用 new Function 构造代码演示语法错误
      'no-var': 'off', // 02_variables 专门讲 var
      'prefer-const': 'off',
      'no-prototype-builtins': 'off', // 讲原型链时会故意用 hasOwnProperty
      'no-console': 'off', // 示例的输出方式就是 console.log
    },
  },

  // ============ 基础设施代码（scripts/ 与配置文件）—— 按真实项目标准来 ============
  // 这部分是仓库自己的"生产代码"，不含教学演示，所以用严格规则。
  // 顺带作为对照：读者可以对比同一份配置里两类文件的不同待遇。
  {
    files: ['scripts/**/*.js', 'eslint.config.js'],
    rules: {
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-self-compare': 'error',
      'use-isnan': 'error',
      'no-constant-condition': 'error',
      'no-unused-vars': ['error', { args: 'after-used' }],
      'no-empty': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'warn',
    },
  },

  // ------------------------------------------- CommonJS 文件（.cjs）单独放宽
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
];
