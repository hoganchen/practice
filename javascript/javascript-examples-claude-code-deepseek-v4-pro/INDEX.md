# 示例代码索引

> ⚙️ **本文件由 `npm run index` 自动生成，请勿手工编辑。**
> 增删或重命名示例后，重新运行该命令即可刷新。

共 **41** 个知识点目录、**504** 个可运行示例、**19** 个浏览器示例（标 🌐），另有 17 个辅助模块。

每个示例文件的头部注释块都写明了「知识点 / 所属分类 / 难度等级 / 前置知识 / 知识点说明 / 运行方法 / 预期输出」，本索引只摘录其中的「知识点」与「难度等级」两栏，**具体说明请打开文件看头部注释**。

---

## 目录概览

「可运行示例」只计 `.js` / `.cjs`（与 `npm run check` 的口径一致）；
浏览器示例（`.html`）单独标为 `+N 🌐`，它们需要浏览器、不被 `run-all.js` 执行。

| 目录 | 知识板块 | 可运行示例 | 浏览器示例 | 难度分布 |
| --- | --- | --- | --- | --- |
| [`00_hello_world`](#00_hello_world) | 起步 | 3 | 1 | 入门 3 |
| [`01_syntax_basics`](#01_syntax_basics) | 语法基础 | 6 | — | 入门 3 / 进阶 3 |
| [`02_variables`](#02_variables) | 变量与作用域 | 6 | — | 入门 3 / 进阶 3 |
| [`03_data_types`](#03_data_types) | 数据类型 | 12 | — | 入门 8 / 进阶 4 |
| [`04_operators`](#04_operators) | 运算符与表达式 | 12 | — | 入门 6 / 进阶 6 |
| [`05_control_flow`](#05_control_flow) | 流程控制 | 8 | — | 入门 5 / 进阶 3 |
| [`06_functions`](#06_functions) | 函数 | 14 | — | 入门 4 / 进阶 8 / 高级 2 |
| [`07_scope_and_closure`](#07_scope_and_closure) | 作用域与闭包 | 12 | — | 入门 3 / 进阶 5 / 高级 4 |
| [`08_arrays`](#08_arrays) | 数组 | 22 | — | 入门 11 / 进阶 10 / 高级 1 |
| [`09_objects`](#09_objects) | 对象 | 16 | — | 入门 6 / 进阶 8 / 高级 2 |
| [`10_destructuring`](#10_destructuring) | 解构赋值 | 7 | — | 入门 2 / 进阶 4 / 高级 1 |
| [`11_strings`](#11_strings) | 字符串 | 13 | — | 入门 6 / 进阶 5 / 高级 2 |
| [`12_numbers_and_math`](#12_numbers_and_math) | 数字与数学运算 | 10 | — | 入门 1 / 进阶 6 / 高级 3 |
| [`13_regexp`](#13_regexp) | 正则表达式 | 15 | — | 入门 4 / 进阶 6 / 高级 5 |
| [`14_classes`](#14_classes) | 类的语法与面向对象 | 15 | — | 入门 5 / 进阶 7 / 高级 3 |
| [`15_this_and_context`](#15_this_and_context) | this 与执行上下文 | 9 | — | 入门 6 / 进阶 3 |
| [`16_prototype`](#16_prototype) | 原型与原型链 | 8 | — | 入门 4 / 进阶 3 / 高级 1 |
| [`17_iterators_and_generators`](#17_iterators_and_generators) | 迭代器与生成器 | 10 | — | 进阶 4 / 高级 6 |
| [`18_async`](#18_async) | 异步编程 | 15 | — | 入门 1 / 进阶 10 / 高级 4 |
| [`19_modules`](#19_modules) | ES Module（ESM）模块化 | 15 | — | 入门 4 / 进阶 9 / 高级 2 |
| [`20_error_handling`](#20_error_handling) | 错误处理 | 12 | — | 入门 4 / 进阶 8 |
| [`21_json`](#21_json) | JSON 数据格式与序列化 | 11 | — | 入门 2 / 进阶 6 / 高级 3 |
| [`22_date_and_time`](#22_date_and_time) | 日期与时间 | 11 | — | 入门 4 / 进阶 6 / 高级 1 |
| [`23_collections`](#23_collections) | 集合类型 | 10 | — | 入门 3 / 进阶 5 / 高级 2 |
| [`24_typed_arrays`](#24_typed_arrays) | 二进制数据、定型数组与字节操作 | 13 | — | 进阶 12 / 高级 1 |
| [`25_proxy_and_reflect`](#25_proxy_and_reflect) | 元编程：拦截对象的基本操作 | 10 | — | 进阶 7 / 高级 3 |
| [`26_node_core`](#26_node_core) | Node.js 核心模块 | 20 | — | 入门 5 / 进阶 8 / 高级 7 |
| [`27_web_apis`](#27_web_apis) | 浏览器 Web API | 18 | 18 | 入门 2 / 进阶 8 / 高级 8 |
| [`28_testing`](#28_testing) | 测试基础 | 14 | — | 入门 4 / 进阶 9 / 高级 1 |
| [`29_npm_libraries`](#29_npm_libraries) | 常用第三方库 | 16 | — | 入门 5 / 进阶 7 / 高级 4 |
| [`30_design_patterns`](#30_design_patterns) | 设计模式 | 21 | — | 入门 1 / 进阶 14 / 高级 6 |
| [`31_performance_and_memory`](#31_performance_and_memory) | 性能与内存 | 18 | — | 进阶 7 / 高级 11 |
| [`32_security_and_best_practices`](#32_security_and_best_practices) | 安全与最佳实践 | 19 | — | 入门 2 / 进阶 13 / 高级 4 |
| [`33_intl`](#33_intl) | 国际化 API（Intl） | 11 | — | 入门 3 / 进阶 5 / 高级 3 |
| [`34_modern_es_features`](#34_modern_es_features) | 现代 ES 新特性 | 8 | — | 进阶 5 / 高级 3 |
| [`35_web_crypto`](#35_web_crypto) | Web Crypto API | 8 | — | 入门 2 / 进阶 3 / 高级 3 |
| [`36_realtime_and_streams`](#36_realtime_and_streams) | 实时通信与流式处理 | 9 | — | 进阶 4 / 高级 5 |
| [`37_debugging_and_profiling`](#37_debugging_and_profiling) | 调试与性能剖析 | 8 | — | 进阶 3 / 高级 5 |
| [`38_algorithms_and_data_structures`](#38_algorithms_and_data_structures) | 算法与数据结构 | 17 | — | 入门 3 / 进阶 8 / 高级 6 |
| [`39_tooling_and_workflow`](#39_tooling_and_workflow) | 工程化工具链 | 12 | — | 入门 3 / 进阶 6 / 高级 3 |
| [`40_functional_programming`](#40_functional_programming) | 函数式编程进阶 | 10 | — | 进阶 2 / 高级 8 |

---
## 00_hello_world

**起步**

3 个可运行示例 · 1 个浏览器示例（🌐） · 难度 入门 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_hello_world.js](00_hello_world/01_hello_world.js) | Hello World —— 最小的可运行 JavaScript 程序 | 入门 |
| [02_console_methods.js](00_hello_world/02_console_methods.js) | console 对象的常用方法 | 入门 |
| [03_hello_world_in_browser.html 🌐](00_hello_world/03_hello_world_in_browser.html) | 浏览器版 Hello World —— 在页面里运行 JavaScript | 入门 |
| [04_node_vs_browser.js](00_hello_world/04_node_vs_browser.js) | Node.js 与浏览器环境的差异 | 入门 |

---

## 01_syntax_basics

**语法基础**

6 个可运行示例 · 难度 入门 3 / 进阶 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_statements_and_expressions.js](01_syntax_basics/01_statements_and_expressions.js) | 语句与表达式 | 入门 |
| [02_asi_and_semicolons.js](01_syntax_basics/02_asi_and_semicolons.js) | 自动分号插入（ASI）规则与陷阱 | 进阶 |
| [03_comments.js](01_syntax_basics/03_comments.js) | 单行注释、多行注释与文档注释（JSDoc） | 入门 |
| [04_strict_mode.js](01_syntax_basics/04_strict_mode.js) | 严格模式（'use strict'）与 ESM 的默认严格性 | 进阶 |
| [05_identifiers_and_naming.js](01_syntax_basics/05_identifiers_and_naming.js) | 标识符规则、命名约定与保留字 | 入门 |
| [06_language_versions_and_compatibility.js](01_syntax_basics/06_language_versions_and_compatibility.js) | 目标环境的特性可用性判断与降级策略（特性检测 / polyfill / 转译） | 进阶 |

---

## 02_variables

**变量与作用域**

6 个可运行示例 · 难度 入门 3 / 进阶 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_var.js](02_variables/01_var.js) | var —— 函数作用域、变量提升、可重复声明 | 入门 |
| [02_let.js](02_variables/02_let.js) | let —— 块级作用域、暂时性死区、不可重复声明 | 入门 |
| [03_const.js](02_variables/03_const.js) | const —— 常量绑定、对象内容可变、什么时候该用 const | 入门 |
| [04_hoisting_and_tdz.js](02_variables/04_hoisting_and_tdz.js) | 变量提升（hoisting）与暂时性死区（TDZ）详解 | 进阶 |
| [05_var_let_const_compare.js](02_variables/05_var_let_const_compare.js) | var / let / const 三者对比 | 进阶 |
| [06_global_variables.js](02_variables/06_global_variables.js) | 全局变量 —— globalThis、顶层 var/let 的区别、隐式全局变量 | 进阶 |

---

## 03_data_types

**数据类型**

12 个可运行示例 · 难度 入门 8 / 进阶 4

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_primitives_overview.js](03_data_types/01_primitives_overview.js) | 七种原始类型总览与值语义 / 引用语义 | 入门 |
| [02_typeof_operator.js](03_data_types/02_typeof_operator.js) | typeof 运算符的用法、全部返回值与 typeof null 的历史 bug | 入门 |
| [03_type_conversion.js](03_data_types/03_type_conversion.js) | 显式类型转换（Number / String / Boolean）与隐式转换规则 | 入门 |
| [04_number_type.js](03_data_types/04_number_type.js) | number 类型 —— 双精度浮点、安全整数、NaN / Infinity | 入门 |
| [05_bigint.js](03_data_types/05_bigint.js) | BigInt —— 任意精度整数与"不能与 Number 混算"的约束 | 进阶 |
| [06_string_type.js](03_data_types/06_string_type.js) | string 类型 —— 不可变性、UTF-16 编码、length 与码点的差异 | 入门 |
| [07_boolean_type.js](03_data_types/07_boolean_type.js) | boolean 类型与真值表 | 入门 |
| [08_null_vs_undefined.js](03_data_types/08_null_vs_undefined.js) | null 与 undefined 的区别、使用场景、?? 与 ?. 运算符 | 入门 |
| [09_symbol_type.js](03_data_types/09_symbol_type.js) | Symbol —— 唯一性、作为属性键、Symbol.for 注册表与内置符号 | 进阶 |
| [10_truthy_falsy.js](03_data_types/10_truthy_falsy.js) | 真值与假值 —— 假值只有 8 个，其余一切都是真值 | 入门 |
| [11_mutable_vs_immutable.js](03_data_types/11_mutable_vs_immutable.js) | 原始值不可变 vs 对象可变，以及浅拷贝 / 深拷贝 | 进阶 |
| [12_equality_samevalue.js](03_data_types/12_equality_samevalue.js) | == 、=== 、Object.is 的区别与 SameValueZero | 进阶 |

---

## 04_operators

**运算符与表达式**

12 个可运行示例 · 难度 入门 6 / 进阶 6

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_arithmetic.js](04_operators/01_arithmetic.js) | 算术运算符 —— 加减乘除、取余、幂、一元正负号、自增自减 | 入门 |
| [02_assignment.js](04_operators/02_assignment.js) | 赋值运算符 —— 复合赋值、链式赋值与逻辑赋值 | 入门 |
| [03_comparison.js](04_operators/03_comparison.js) | 比较运算符 —— 大小比较、== 与 === 的强制转换规则 | 入门 |
| [04_logical.js](04_operators/04_logical.js) | 逻辑运算符 —— && \|\| ! 的短路求值与"返回操作数"特性 | 入门 |
| [05_nullish_coalescing.js](04_operators/05_nullish_coalescing.js) | 空值合并运算符 ?? —— 与 \|\| 的区别及不可混用规则 | 进阶 |
| [06_optional_chaining.js](04_operators/06_optional_chaining.js) | 可选链 ?. —— obj?.prop、obj?.[expr]、fn?.() 三种形式 | 进阶 |
| [07_bitwise.js](04_operators/07_bitwise.js) | 位运算符 —— & \| ^ ~ << >> >>> 与实战用途 | 进阶 |
| [08_ternary_and_comma.js](04_operators/08_ternary_and_comma.js) | 三元运算符 ?: 与逗号运算符 , | 入门 |
| [09_spread_rest.js](04_operators/09_spread_rest.js) | 展开运算符 ... 与剩余参数 ... —— 同一个语法的两面 | 进阶 |
| [10_operator_precedence.js](04_operators/10_operator_precedence.js) | 运算符优先级与结合性 —— 用括号消除歧义 | 进阶 |
| [11_void_operator.js](04_operators/11_void_operator.js) | void 运算符 —— 求值后丢弃结果，只返回 undefined | 入门 |
| [12_in_delete_instanceof.js](04_operators/12_in_delete_instanceof.js) | in / delete / instanceof —— 三个「与对象内部结构打交道」的运算符 | 进阶 |

---

## 05_control_flow

**流程控制**

8 个可运行示例 · 难度 入门 5 / 进阶 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_if_else.js](05_control_flow/01_if_else.js) | if / else if / else —— 条件表达式求值规则 | 入门 |
| [02_switch.js](05_control_flow/02_switch.js) | switch 语句 —— fallthrough、break 与 case 分组 | 入门 |
| [03_for_loop.js](05_control_flow/03_for_loop.js) | 传统 for 循环 —— 三段式与循环变量作用域（let vs var） | 入门 |
| [04_while_loops.js](05_control_flow/04_while_loops.js) | while 与 do...while —— 至少执行一次的差别 | 入门 |
| [05_for_of.js](05_control_flow/05_for_of.js) | for...of —— 遍历可迭代对象（数组 / 字符串 / Map / Set） | 入门 |
| [06_for_in.js](05_control_flow/06_for_in.js) | for...in —— 遍历可枚举属性键，以及为什么不该用它遍历数组 | 进阶 |
| [07_break_continue.js](05_control_flow/07_break_continue.js) | break / continue 与带标签的语句（label） | 进阶 |
| [08_early_return.js](05_control_flow/08_early_return.js) | 卫语句（guard clause）与提前返回 —— 减少嵌套层级的实践 | 进阶 |

---

## 06_functions

**函数**

14 个可运行示例 · 难度 入门 4 / 进阶 8 / 高级 2

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_declaration_vs_expression.js](06_functions/01_declaration_vs_expression.js) | 函数声明与函数表达式的区别（提升行为、调用时机） | 入门 |
| [02_parameters.js](06_functions/02_parameters.js) | 形参与实参、参数默认值、arguments 对象、实参多余/缺失 | 入门 |
| [03_rest_parameters.js](06_functions/03_rest_parameters.js) | 剩余参数 ...args，与 arguments 的对比 | 入门 |
| [04_arrow_functions.js](06_functions/04_arrow_functions.js) | 箭头函数语法、简写形式、与普通函数的差异清单 | 入门 |
| [05_arrow_vs_regular.js](06_functions/05_arrow_vs_regular.js) | 箭头函数 vs 普通函数 —— this、arguments、new、prototype、hoisting 全维度对比 | 进阶 |
| [06_iife.js](06_functions/06_iife.js) | 立即调用函数表达式 IIFE —— 语法、作用、现代替代方案 | 进阶 |
| [07_call_apply_bind.js](06_functions/07_call_apply_bind.js) | call / apply / bind —— 显式绑定 this 与部分应用 | 进阶 |
| [08_higher_order_functions.js](06_functions/08_higher_order_functions.js) | 高阶函数 —— 函数作为参数、函数作为返回值 | 进阶 |
| [09_callback_pattern.js](06_functions/09_callback_pattern.js) | 回调函数模式、同步回调与异步回调、错误优先回调约定 | 进阶 |
| [10_recursion.js](06_functions/10_recursion.js) | 递归 —— 阶乘、斐波那契、尾递归概念、递归深度限制 | 进阶 |
| [11_pure_functions.js](06_functions/11_pure_functions.js) | 纯函数 —— 定义、副作用、引用透明、为什么重要 | 进阶 |
| [12_currying_and_compose.js](06_functions/12_currying_and_compose.js) | 柯里化与函数组合（compose / pipe） | 高级 |
| [13_function_properties.js](06_functions/13_function_properties.js) | 函数的属性 —— name、length、toString、自定义属性 | 进阶 |
| [14_default_parameters_tricks.js](06_functions/14_default_parameters_tricks.js) | 默认参数的进阶用法 —— 默认值引用前面的参数、必填参数校验技巧 | 高级 |

---

## 07_scope_and_closure

**作用域与闭包**

12 个可运行示例 · 难度 入门 3 / 进阶 5 / 高级 4

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_global_scope.js](07_scope_and_closure/01_global_scope.js) | 全局作用域 —— globalThis、全局变量污染 | 入门 |
| [02_function_scope.js](07_scope_and_closure/02_function_scope.js) | 函数作用域、局部变量 | 入门 |
| [03_block_scope.js](07_scope_and_closure/03_block_scope.js) | 块级作用域 {}、let/const 的块级特性 | 入门 |
| [04_scope_chain.js](07_scope_and_closure/04_scope_chain.js) | 作用域链与变量查找规则（由内向外） | 进阶 |
| [05_lexical_vs_dynamic_scope.js](07_scope_and_closure/05_lexical_vs_dynamic_scope.js) | 词法作用域 vs 动态作用域，为什么 JS 是词法作用域 | 进阶 |
| [06_closure_basics.js](07_scope_and_closure/06_closure_basics.js) | 闭包基础 —— 定义、形成条件、最简单的例子 | 进阶 |
| [07_closure_private_state.js](07_scope_and_closure/07_closure_private_state.js) | 用闭包实现私有状态与计数器（模块模式） | 进阶 |
| [08_closure_loop_pitfall.js](07_scope_and_closure/08_closure_loop_pitfall.js) | 闭包在循环中的经典陷阱（var vs let）、IIFE 解法 | 进阶 |
| [09_closure_memoization.js](07_scope_and_closure/09_closure_memoization.js) | 用闭包实现记忆化（memoize） | 高级 |
| [10_closure_memory.js](07_scope_and_closure/10_closure_memory.js) | 闭包与内存 —— 为什么闭包会阻止回收、如何避免泄漏 | 高级 |
| [11_closure_practical.js](07_scope_and_closure/11_closure_practical.js) | 闭包实战 —— 防抖、节流、一次性函数、单例 | 高级 |
| [12_execution_context_and_environments.js](07_scope_and_closure/12_execution_context_and_environments.js) | 执行上下文（Execution Context）与词法环境 / 变量环境 | 高级 |

---

## 08_arrays

**数组**

22 个可运行示例 · 难度 入门 11 / 进阶 10 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_create_and_access.js](08_arrays/01_create_and_access.js) | 数组的创建方式与索引访问 | 入门 |
| [02_push_pop_shift_unshift.js](08_arrays/02_push_pop_shift_unshift.js) | push / pop / shift / unshift —— 四种增删方法与栈、队列模拟 | 入门 |
| [03_slice.js](08_arrays/03_slice.js) | slice —— 数组切片（不修改原数组） | 入门 |
| [04_splice.js](08_arrays/04_splice.js) | splice —— 数组的删除 / 插入 / 替换（修改原数组） | 入门 |
| [05_concat_and_join.js](08_arrays/05_concat_and_join.js) | concat 合并、join 转字符串、split 的配合 | 入门 |
| [06_index_of_and_includes.js](08_arrays/06_index_of_and_includes.js) | indexOf / lastIndexOf / includes / findIndex / find / findLast 系列查找 | 入门 |
| [07_forEach.js](08_arrays/07_forEach.js) | forEach 遍历 —— 无法 break，以及与 for...of 的取舍 | 入门 |
| [08_map.js](08_arrays/08_map.js) | map 映射 —— 返回新数组，以及"用 map 做副作用"的常见误用 | 入门 |
| [09_filter.js](08_arrays/09_filter.js) | filter 过滤 —— 真值过滤技巧与常见陷阱 | 入门 |
| [10_reduce.js](08_arrays/10_reduce.js) | reduce 归约 —— 求和、求最值、数组转对象、分组，以及初始值陷阱 | 进阶 |
| [11_flat_and_flatMap.js](08_arrays/11_flat_and_flatMap.js) | flat / flatMap 扁平化 —— 深度参数与两者的关系 | 进阶 |
| [12_sort.js](08_arrays/12_sort.js) | sort 排序 —— 默认按字符串比较的坑、比较函数、稳定性 | 进阶 |
| [13_reverse_and_fill.js](08_arrays/13_reverse_and_fill.js) | reverse / fill / copyWithin —— 三个就地修改数组的方法 | 进阶 |
| [14_some_and_every.js](08_arrays/14_some_and_every.js) | some / every 逻辑判断 —— 空数组返回值陷阱与短路特性 | 入门 |
| [15_at_and_negative_index.js](08_arrays/15_at_and_negative_index.js) | at() 方法 —— 负索引访问与 arr[arr.length - 1] 的对比 | 入门 |
| [16_keys_values_entries.js](08_arrays/16_keys_values_entries.js) | keys / values / entries 迭代器 —— 与解构、for...of 的配合 | 进阶 |
| [17_array_destructuring.js](08_arrays/17_array_destructuring.js) | 数组解构 —— 默认值、剩余元素、嵌套解构与交换变量 | 进阶 |
| [18_copy_array.js](08_arrays/18_copy_array.js) | 数组拷贝 —— 浅拷贝的多种方式、深拷贝与 structuredClone、嵌套数组的陷阱 | 进阶 |
| [19_sparse_and_length.js](08_arrays/19_sparse_and_length.js) | 稀疏数组、length 可写特性、delete 数组元素的坑与截断 | 进阶 |
| [20_grouping.js](08_arrays/20_grouping.js) | 分组 —— Object.groupBy / Map.groupBy 与手写分组实现 | 进阶 |
| [21_chaining_practice.js](08_arrays/21_chaining_practice.js) | 链式调用实战 —— 用 map / filter / reduce / sort 完成一组订单统计 | 高级 |
| [22_callback_signature_pitfall.js](08_arrays/22_callback_signature_pitfall.js) | 回调函数签名不匹配的陷阱 —— ['1','2','3'].map(parseInt) 为什么是 [1, NaN, NaN] | 进阶 |

---

## 09_objects

**对象**

16 个可运行示例 · 难度 入门 6 / 进阶 8 / 高级 2

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_object_literal.js](09_objects/01_object_literal.js) | 对象字面量语法 —— 属性、方法、简写与尾随逗号 | 入门 |
| [02_property_access.js](09_objects/02_property_access.js) | 属性访问 —— 点访问 vs 方括号访问、in 与 hasOwnProperty | 入门 |
| [03_computed_property_names.js](09_objects/03_computed_property_names.js) | 计算属性名 —— 用 [表达式] 动态构建对象 | 入门 |
| [04_spread_merge.js](09_objects/04_spread_merge.js) | 对象展开运算符 —— 浅拷贝、合并、覆盖规则 | 入门 |
| [05_keys_values_entries.js](09_objects/05_keys_values_entries.js) | Object.keys / values / entries / fromEntries —— 对象与数组互转 | 入门 |
| [06_object_assign.js](09_objects/06_object_assign.js) | Object.assign —— 合并、拷贝及其浅拷贝与 getter 陷阱 | 入门 |
| [07_getter_setter.js](09_objects/07_getter_setter.js) | 访问器属性 —— get / set 与 Object.defineProperty | 进阶 |
| [08_property_descriptors.js](09_objects/08_property_descriptors.js) | 属性描述符 —— value / writable / enumerable / configurable | 进阶 |
| [09_freeze_seal.js](09_objects/09_freeze_seal.js) | Object.freeze / seal / preventExtensions —— 三种"锁定"程度与浅冻结陷阱 | 进阶 |
| [10_object_create.js](09_objects/10_object_create.js) | Object.create —— 显式指定原型与无原型对象 | 进阶 |
| [11_object_has_own.js](09_objects/11_object_has_own.js) | Object.hasOwn（新）与 hasOwnProperty（旧）—— 自有属性判断的安全性 | 进阶 |
| [12_deep_clone.js](09_objects/12_deep_clone.js) | 深拷贝 —— structuredClone / JSON 方式 / 手写递归的各自局限 | 高级 |
| [13_object_methods.js](09_objects/13_object_methods.js) | Object 上的工具方法 —— Object.is / getPrototypeOf / getOwnPropertyNames 等 | 进阶 |
| [14_property_order.js](09_objects/14_property_order.js) | 属性遍历顺序 —— 整数键 → 字符串键 → Symbol 键 | 进阶 |
| [15_optional_chaining_object.js](09_objects/15_optional_chaining_object.js) | 可选链 ?. 与空值合并 ?? —— 对象深层属性的安全访问 | 进阶 |
| [16_super_in_object_literals.js](09_objects/16_super_in_object_literals.js) | 对象字面量中的 super —— __proto__ 原型继承、home object 与 super 的 this 绑定 | 高级 |

---

## 10_destructuring

**解构赋值**

7 个可运行示例 · 难度 入门 2 / 进阶 4 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_object_destructuring.js](10_destructuring/01_object_destructuring.js) | 对象解构 —— 基本用法、重命名、默认值、函数参数解构 | 入门 |
| [02_array_destructuring.js](10_destructuring/02_array_destructuring.js) | 数组解构 —— 按位置取值、跳过元素、剩余元素、默认值 | 入门 |
| [03_nested_destructuring.js](10_destructuring/03_nested_destructuring.js) | 嵌套解构 —— 对象套数组、数组套对象、深层取值 | 进阶 |
| [04_default_values.js](10_destructuring/04_default_values.js) | 解构默认值 —— 仅在 undefined 时生效，以及默认值的求值时机 | 进阶 |
| [05_function_parameters.js](10_destructuring/05_function_parameters.js) | 函数参数解构 —— options 对象模式、与默认值和剩余参数的组合 | 进阶 |
| [06_swap_and_tricks.js](10_destructuring/06_swap_and_tricks.js) | 解构的实用技巧 —— 变量交换、多返回值、解构字符串与 Map | 进阶 |
| [07_destructuring_iterables.js](10_destructuring/07_destructuring_iterables.js) | 解构可迭代对象 —— 不只是数组，Set、生成器与自定义可迭代对象 | 高级 |

---

## 11_strings

**字符串**

13 个可运行示例 · 难度 入门 6 / 进阶 5 / 高级 2

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_creation_and_immutability.js](11_strings/01_creation_and_immutability.js) | 字符串的创建方式与不可变性 —— 字面量、String()、new String()、基本包装类型 | 入门 |
| [02_template_literals.js](11_strings/02_template_literals.js) | 模板字符串 —— 插值、多行文本、嵌套、表达式求值 | 入门 |
| [03_indexing_and_length.js](11_strings/03_indexing_and_length.js) | 索引访问与 length —— 方括号、charAt、charCodeAt、codePointAt、at() | 入门 |
| [04_search_methods.js](11_strings/04_search_methods.js) | 字符串查找 —— indexOf / lastIndexOf / includes / startsWith / endsWith / search | 入门 |
| [05_transform_methods.js](11_strings/05_transform_methods.js) | 字符串变换方法 —— 大小写、trim、pad、repeat | 入门 |
| [06_split_and_join.js](11_strings/06_split_and_join.js) | split 与 join —— 字符串与数组的互转 | 入门 |
| [07_replace_methods.js](11_strings/07_replace_methods.js) | replace 与 replaceAll —— 字符串模式、正则模式、替换函数 | 进阶 |
| [08_substring_methods.js](11_strings/08_substring_methods.js) | 截取子串 —— slice / substring / substr 的区别与负参数行为 | 进阶 |
| [09_unicode_and_codepoints.js](11_strings/09_unicode_and_codepoints.js) | Unicode 与码点 —— UTF-16、代理对、length 陷阱、码点遍历、normalize | 高级 |
| [10_tagged_templates.js](11_strings/10_tagged_templates.js) | 标签模板 —— 自定义标签函数、String.raw、HTML 转义与 i18n | 高级 |
| [11_string_comparison.js](11_strings/11_string_comparison.js) | 字符串比较 —— 字典序、localeCompare、本地化排序 | 进阶 |
| [12_practical_string_utils.js](11_strings/12_practical_string_utils.js) | 实战字符串工具集 —— 首字母大写、命名风格转换、截断、掩码 | 进阶 |
| [13_well_formed_unicode.js](11_strings/13_well_formed_unicode.js) | 畸形 UTF-16 字符串 —— isWellFormed / toWellFormed（ES2024）与孤立代理项 | 进阶 |

---

## 12_numbers_and_math

**数字与数学运算**

10 个可运行示例 · 难度 入门 1 / 进阶 6 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_math_object.js](12_numbers_and_math/01_math_object.js) | Math 静态方法大全 —— abs/ceil/floor/round/trunc/sign/min/max/pow/sqrt/cbrt/hypot | 入门 |
| [02_rounding.js](12_numbers_and_math/02_rounding.js) | 取整与四舍五入的精度陷阱 —— 各种取整方式、toFixed 的坑、保留 N 位小数 | 进阶 |
| [03_random.js](12_numbers_and_math/03_random.js) | Math.random —— 范围随机、整数随机、随机取元素、洗牌算法 | 进阶 |
| [04_parseint_parsefloat.js](12_numbers_and_math/04_parseint_parsefloat.js) | parseInt 与 parseFloat —— 解析规则、基数参数、与 Number() 的区别 | 进阶 |
| [05_number_methods.js](12_numbers_and_math/05_number_methods.js) | Number 的静态方法与实例方法 —— toFixed / toPrecision / toExponential / toString(radix) | 进阶 |
| [06_number_limits.js](12_numbers_and_math/06_number_limits.js) | 数字的表示极限与精度丢失 —— MAX_SAFE_INTEGER、MIN_VALUE、EPSILON | 高级 |
| [07_intl_number_format.js](12_numbers_and_math/07_intl_number_format.js) | Intl.NumberFormat —— 货币、百分比、千分位、单位与本地化 | 进阶 |
| [08_precision_handling.js](12_numbers_and_math/08_precision_handling.js) | 浮点精度的工程解法 —— 放大取整、整数分、decimal 思路、EPSILON 比较 | 高级 |
| [09_locale_format_and_rounding.js](12_numbers_and_math/09_locale_format_and_rounding.js) | toLocaleString 与 Intl.NumberFormat —— 本地化格式化、性能取舍与 | 进阶 |
| [10_bit_and_precision_math.js](12_numbers_and_math/10_bit_and_precision_math.js) | Math.fround / Math.imul / Math.clz32 —— 三个「单精度 / 32 位」专用方法 | 高级 |

---

## 13_regexp

**正则表达式**

15 个可运行示例 · 难度 入门 4 / 进阶 6 / 高级 5

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_basics_and_literals.js](13_regexp/01_basics_and_literals.js) | 正则的两种创建方式（字面量 / RegExp 构造器）、test 与 exec、lastIndex 陷阱 | 入门 |
| [02_character_classes.js](13_regexp/02_character_classes.js) | 字符类 —— \d \D \w \W \s \S . 与自定义 [abc] [^abc] [a-z] | 入门 |
| [03_quantifiers.js](13_regexp/03_quantifiers.js) | 量词 —— * + ? {n} {n,} {n,m} 以及贪婪与惰性（加 ?） | 入门 |
| [04_anchors_and_boundaries.js](13_regexp/04_anchors_and_boundaries.js) | 锚点 ^ $、单词边界 \b \B、多行模式 m | 入门 |
| [05_groups_and_alternation.js](13_regexp/05_groups_and_alternation.js) | 捕获组 ()、非捕获组 (?:)、或 \|、嵌套组 | 进阶 |
| [06_backreferences.js](13_regexp/06_backreferences.js) | 反向引用 \1、命名反向引用 \k<name> | 进阶 |
| [07_named_groups.js](13_regexp/07_named_groups.js) | 具名捕获组 (?<name>...)、groups 属性、replace 中的 $<name> | 进阶 |
| [08_lookahead_lookbehind.js](13_regexp/08_lookahead_lookbehind.js) | 前瞻 (?=) (?!) 与后顾 (?<=) (?<!) 断言 | 高级 |
| [09_flags.js](13_regexp/09_flags.js) | 修饰符 g i m s u y 各自的含义与组合效果 | 进阶 |
| [10_replace_with_function.js](13_regexp/10_replace_with_function.js) | replace 的第二个参数用函数 —— 动态替换与回调参数含义 | 进阶 |
| [11_string_methods_with_regex.js](13_regexp/11_string_methods_with_regex.js) | 字符串方法配合正则 —— match / matchAll / search / split / replace | 进阶 |
| [12_validation_patterns.js](13_regexp/12_validation_patterns.js) | 实战校验 —— 邮箱、手机号、URL、身份证、密码强度、日期格式 | 高级 |
| [13_catastrophic_backtracking.js](13_regexp/13_catastrophic_backtracking.js) | 灾难性回溯（ReDoS）的原理与规避，用小规模输入演示耗时差异 | 高级 |
| [14_v_flag_and_set_operations.js](13_regexp/14_v_flag_and_set_operations.js) | v 标志（unicodeSets，ES2024）—— u 的正式后继、字符类集合运算与 \q{...} | 高级 |
| [15_custom_regexp_protocol.js](13_regexp/15_custom_regexp_protocol.js) | 自定义正则协议 —— Symbol.match / replace / search / split（含 matchAll） | 高级 |

---

## 14_classes

**类的语法与面向对象**

15 个可运行示例 · 难度 入门 5 / 进阶 7 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_class_basics.js](14_classes/01_class_basics.js) | class 基础 —— 定义、实例化、constructor、方法与 typeof | 入门 |
| [02_instance_methods.js](14_classes/02_instance_methods.js) | 实例方法 —— 方法定义在原型上，被所有实例共享 | 入门 |
| [03_static_members.js](14_classes/03_static_members.js) | 静态成员 —— static 方法、static 属性、static {} 静态块 | 入门 |
| [04_class_fields.js](14_classes/04_class_fields.js) | 实例字段 —— 公有字段与字段初始化顺序 | 入门 |
| [05_private_fields.js](14_classes/05_private_fields.js) | 私有成员 —— #私有字段、#私有方法、私有静态成员 | 进阶 |
| [06_getters_setters.js](14_classes/06_getters_setters.js) | 类的 get / set 访问器 —— 把方法伪装成属性 | 入门 |
| [07_inheritance_extends.js](14_classes/07_inheritance_extends.js) | 继承 —— extends、super()、super.method()、继承链 | 进阶 |
| [08_extends_builtins.js](14_classes/08_extends_builtins.js) | 继承内置类 —— Array / Error / Map，以及 Error 子类为何要修正 name | 进阶 |
| [09_instanceof_and_brands.js](14_classes/09_instanceof_and_brands.js) | instanceof、Object.getPrototypeOf 与 Symbol.hasInstance | 进阶 |
| [10_abstract_pattern.js](14_classes/10_abstract_pattern.js) | 抽象基类的模拟 —— new.target 与"禁止直接实例化" | 进阶 |
| [11_mixins.js](14_classes/11_mixins.js) | 混入（mixin）—— 用 Object.assign 给原型"装配"能力 | 高级 |
| [12_tostring_and_symbols.js](14_classes/12_tostring_and_symbols.js) | 定制对象的转换行为 —— Symbol.toPrimitive、toString、valueOf | 进阶 |
| [13_class_decorator_pattern.js](14_classes/13_class_decorator_pattern.js) | 类装饰器模式（手写版）—— 用函数包装类来"增强"行为 | 高级 |
| [14_polymorphism.js](14_classes/14_polymorphism.js) | 多态 —— 父类引用指向子类实例、方法重写、鸭子类型 | 进阶 |
| [15_symbol_species.js](14_classes/15_symbol_species.js) | Symbol.species —— 内置方法返回值类型的"出厂设置"与子类泄漏 | 高级 |

---

## 15_this_and_context

**this 与执行上下文**

9 个可运行示例 · 难度 入门 6 / 进阶 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_this_rules.js](15_this_and_context/01_this_rules.js) | this 的默认绑定 —— 严格模式下是 undefined，非严格模式下是 globalThis | 入门 |
| [02_this_in_method.js](15_this_and_context/02_this_in_method.js) | 隐式绑定 —— 对象方法调用，以及方法"提取"后 this 丢失 | 入门 |
| [03_this_in_arrow.js](15_this_and_context/03_this_in_arrow.js) | 箭头函数的 this —— 词法捕获，没有自己的 this | 入门 |
| [04_explicit_binding.js](15_this_and_context/04_explicit_binding.js) | 显式绑定 —— call / apply / bind 与硬绑定 | 入门 |
| [05_new_binding.js](15_this_and_context/05_new_binding.js) | new 绑定 —— 构造函数调用时 this 指向新创建的实例 | 入门 |
| [06_this_priority.js](15_this_and_context/06_this_priority.js) | 四种绑定规则的优先级 —— new > 显式 > 隐式 > 默认 | 进阶 |
| [07_this_in_callbacks.js](15_this_and_context/07_this_in_callbacks.js) | 回调中的 this —— setTimeout、数组方法的第二个参数、事件处理器 | 进阶 |
| [08_this_in_class.js](15_this_and_context/08_this_in_class.js) | 类中的 this —— 类方法、类字段箭头函数、私有方法 | 进阶 |
| [09_globalthis.js](15_this_and_context/09_globalthis.js) | globalThis —— 跨环境访问全局对象的统一方式 | 入门 |

---

## 16_prototype

**原型与原型链**

8 个可运行示例 · 难度 入门 4 / 进阶 3 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_prototype_chain.js](16_prototype/01_prototype_chain.js) | 原型链查找机制 —— 对象 → 原型 → 原型链 → null | 入门 |
| [02_proto_vs_prototype.js](16_prototype/02_proto_vs_prototype.js) | __proto__ 与 prototype 的区别 —— 实例 vs 函数 | 入门 |
| [03_constructor_function.js](16_prototype/03_constructor_function.js) | 构造函数 + prototype 的老式"类"写法（理解 ES5 遗产） | 入门 |
| [04_inheritance_es5.js](16_prototype/04_inheritance_es5.js) | ES5 原型继承 —— 借用构造函数 + 原型链，并与 class 对比 | 进阶 |
| [05_object_create.js](16_prototype/05_object_create.js) | Object.create —— 直接指定原型，简洁的原型继承 | 入门 |
| [06_getter_setter_prototype.js](16_prototype/06_getter_setter_prototype.js) | 原型上的 getter/setter 与属性遮蔽（shadowing） | 进阶 |
| [07_method_resolution_order.js](16_prototype/07_method_resolution_order.js) | 方法解析顺序（MRO）—— 遮蔽、删除实例属性后回退到原型 | 进阶 |
| [08_prototype_pollution_intro.js](16_prototype/08_prototype_pollution_intro.js) | 原型污染（Prototype Pollution）—— 概念、危害与防御 | 高级 |

---

## 17_iterators_and_generators

**迭代器与生成器**

10 个可运行示例 · 难度 进阶 4 / 高级 6

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_iterable_protocol.js](17_iterators_and_generators/01_iterable_protocol.js) | 可迭代协议 —— Symbol.iterator 与 for...of 的底层约定 | 进阶 |
| [02_iterator_protocol.js](17_iterators_and_generators/02_iterator_protocol.js) | 迭代器协议 —— next() 返回 { value, done } 的约定 | 进阶 |
| [03_custom_iterable.js](17_iterators_and_generators/03_custom_iterable.js) | 自定义可迭代对象 —— 让自家类型能被 for...of 和解构使用 | 进阶 |
| [04_generator_basics.js](17_iterators_and_generators/04_generator_basics.js) | 生成器基础 —— function*、yield、next() 与惰性执行 | 进阶 |
| [05_generator_two_way.js](17_iterators_and_generators/05_generator_two_way.js) | 生成器双向通信 —— next(value) 的实参成为 yield 表达式的值 | 高级 |
| [06_generator_delegation.js](17_iterators_and_generators/06_generator_delegation.js) | yield* 委托 —— 把迭代工作交给另一个生成器或可迭代对象 | 高级 |
| [07_generator_throw_return.js](17_iterators_and_generators/07_generator_throw_return.js) | generator.throw() 与 generator.return() —— 向生成器内部注入错误与终止 | 高级 |
| [08_infinite_lazy_sequences.js](17_iterators_and_generators/08_infinite_lazy_sequences.js) | 惰性无限序列 —— 用生成器表达"取之不尽"的数据流 | 高级 |
| [09_async_iterator.js](17_iterators_and_generators/09_async_iterator.js) | 异步迭代器 —— Symbol.asyncIterator 与 for await...of | 高级 |
| [10_generator_practical.js](17_iterators_and_generators/10_generator_practical.js) | 生成器实战 —— 分页器、ID 生成器、树遍历与生成器驱动的异步流程 | 高级 |

---

## 18_async

**异步编程**

15 个可运行示例 · 难度 入门 1 / 进阶 10 / 高级 4

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_synchronous_vs_asynchronous.js](18_async/01_synchronous_vs_asynchronous.js) | 同步阻塞 vs 异步非阻塞 —— 用 setTimeout 看清执行顺序 | 入门 |
| [02_event_loop_basics.js](18_async/02_event_loop_basics.js) | 事件循环 —— 调用栈、宏任务队列与微任务队列 | 进阶 |
| [03_callback_hell.js](18_async/03_callback_hell.js) | 回调地狱 —— 多层嵌套异步代码的形成与问题 | 进阶 |
| [04_promise_basics.js](18_async/04_promise_basics.js) | Promise 基础 —— 三种状态、executor 立即执行、then/catch/finally | 进阶 |
| [05_promise_chaining.js](18_async/05_promise_chaining.js) | Promise 链式调用 —— 返回值穿透与 then 返回 Promise 的扁平化 | 进阶 |
| [06_promise_combinators.js](18_async/06_promise_combinators.js) | Promise 四大组合器 —— all / allSettled / race / any | 进阶 |
| [07_async_await_basics.js](18_async/07_async_await_basics.js) | async / await 基础 —— async 函数返回 Promise，await 在等什么 | 进阶 |
| [08_async_error_handling.js](18_async/08_async_error_handling.js) | 异步错误处理 —— try/catch 捕获 await 拒绝与拒绝的多种归宿 | 进阶 |
| [09_async_sequential_vs_parallel.js](18_async/09_async_sequential_vs_parallel.js) | 串行 await 与并行 Promise.all —— 用计时证明性能差异 | 进阶 |
| [10_async_in_loops.js](18_async/10_async_in_loops.js) | 循环里的异步 —— for...of + await、forEach 陷阱、for await...of | 进阶 |
| [11_promise_static_methods.js](18_async/11_promise_static_methods.js) | Promise 静态方法 —— resolve / reject / withResolvers / try | 进阶 |
| [12_microtask_vs_macrotask.js](18_async/12_microtask_vs_macrotask.js) | 微任务与宏任务的优先级 —— queueMicrotask 与执行顺序的真相 | 高级 |
| [13_timeout_and_abort.js](18_async/13_timeout_and_abort.js) | 超时与取消 —— Promise.race 加超时、AbortController 取消异步操作 | 高级 |
| [14_promisify.js](18_async/14_promisify.js) | promisify —— 把回调风格 API 转成 Promise | 高级 |
| [15_async_patterns.js](18_async/15_async_patterns.js) | 异步实战模式 —— 并发控制、失败重试、顺序队列 | 高级 |

---

## 19_modules

**ES Module（ESM）模块化**

15 个可运行示例 · 难度 入门 4 / 进阶 9 / 高级 2

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_named_exports.js](19_modules/01_named_exports.js) | 具名导出与具名导入（export const / import { a, b } / 重命名 as） | 入门 |
| [02_default_export.js](19_modules/02_default_export.js) | 默认导出与默认导入（export default / import 任意命名 / default 的本质） | 入门 |
| [03_mixed_exports.js](19_modules/03_mixed_exports.js) | 混合使用默认导出与具名导出，以及对应的导入语法 | 入门 |
| [04_export_list_and_rename.js](19_modules/04_export_list_and_rename.js) | 统一出口 export { }、导出时重命名、导入时重命名 | 入门 |
| [05_reexport.js](19_modules/05_reexport.js) | 再导出（export ... from / export * from / export * as ns from） | 进阶 |
| [06_namespace_import.js](19_modules/06_namespace_import.js) | 命名空间导入 import * as ns，以及命名空间对象的特性 | 进阶 |
| [07_live_bindings.js](19_modules/07_live_bindings.js) | 模块导出是"实时绑定"而不是值拷贝 | 进阶 |
| [08_module_scope.js](19_modules/08_module_scope.js) | 模块作用域 —— 顶层变量不是全局、this 是 undefined、模块只执行一次 | 进阶 |
| [09_dynamic_import.js](19_modules/09_dynamic_import.js) | 动态 import() —— 返回 Promise、按需加载、条件加载 | 进阶 |
| [10_import_meta.js](19_modules/10_import_meta.js) | import.meta.url 与 import.meta.dirname / filename，以及与 __dirname 的对比 | 进阶 |
| [11_cjs_require.cjs](19_modules/11_cjs_require.cjs) | CommonJS 的 require / module.exports / exports 三者关系与陷阱 | 进阶 |
| [12_esm_vs_cjs.cjs](19_modules/12_esm_vs_cjs.cjs) | ESM 与 CommonJS 全面对比 —— 加载时机、静态 vs 动态、互操作性、适用场景 | 进阶 |
| [13_json_import.js](19_modules/13_json_import.js) | 导入 JSON 数据 —— import ... with { type: 'json' } 与 fs 读取两种方式 | 进阶 |
| [14_package_exports.js](19_modules/14_package_exports.js) | package.json 的 exports 字段 —— 子路径导出与条件导出 | 高级 |
| [15_circular_dependencies.js](19_modules/15_circular_dependencies.js) | 循环依赖 —— ESM 的实时绑定与 TDZ vs CJS 的值快照与半成品 | 高级 |

<sub>辅助模块（被导入，不作为独立示例）：`_barrel.js`、`_config.js`、`_counter.js`、`_cycle-cjs-a.cjs`、`_cycle-cjs-b.cjs`、`_cycle-cjs-mut-a.cjs`、`_cycle-cjs-mut-b.cjs`、`_cycle-good-a.js`、`_cycle-good-b.js`、`_cycle-hoist-a.js`、`_cycle-hoist-b.js`、`_cycle-tdz-a.js`、`_cycle-tdz-b.js`、`_legacy-lib.cjs`、`_math-utils.js`</sub>

---

## 20_error_handling

**错误处理**

12 个可运行示例 · 难度 入门 4 / 进阶 8

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_try_catch_finally.js](20_error_handling/01_try_catch_finally.js) | try / catch / finally 基础，finally 的执行时机与返回值覆盖陷阱 | 入门 |
| [02_error_types.js](20_error_handling/02_error_types.js) | 内置错误类型 —— Error / TypeError / RangeError / SyntaxError / | 入门 |
| [03_error_properties.js](20_error_handling/03_error_properties.js) | 错误对象的属性 —— message / name / stack / cause | 入门 |
| [04_throw_statement.js](20_error_handling/04_throw_statement.js) | throw 的用法 —— 可以抛任何值（但不推荐）、抛出 vs 返回错误码 | 入门 |
| [05_custom_errors.js](20_error_handling/05_custom_errors.js) | 自定义错误类 —— extends Error、修正 name、instanceof 判断、捕获特定错误 | 进阶 |
| [06_error_cause.js](20_error_handling/06_error_cause.js) | error.cause 链接根因，多层错误包装 | 进阶 |
| [07_aggregate_error.js](20_error_handling/07_aggregate_error.js) | AggregateError 与 SuppressedError —— 一次报告多个错误 | 进阶 |
| [08_error_handling_patterns.js](20_error_handling/08_error_handling_patterns.js) | 错误处理模式 —— 早抛晚捕、错误边界、重试、降级 | 进阶 |
| [09_async_error_handling.js](20_error_handling/09_async_error_handling.js) | 异步错误处理 —— Promise 拒绝、await + try/catch、unhandledRejection | 进阶 |
| [10_node_error_codes.js](20_error_handling/10_node_error_codes.js) | Node.js 错误码（ENOENT / EACCES / EEXIST ...）与 err.code 判断 | 进阶 |
| [11_assertion.js](20_error_handling/11_assertion.js) | 断言 —— node:assert 的 assert / strictEqual / deepStrictEqual / throws | 进阶 |
| [12_defensive_programming.js](20_error_handling/12_defensive_programming.js) | 防御式编程 —— 参数校验、类型守卫、Fail Fast 实践 | 进阶 |

---

## 21_json

**JSON 数据格式与序列化**

11 个可运行示例 · 难度 入门 2 / 进阶 6 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_parse_and_stringify.js](21_json/01_parse_and_stringify.js) | JSON.parse / JSON.stringify 基础，以及它们的第二个 / 第三个参数 | 入门 |
| [02_json_format_rules.js](21_json/02_json_format_rules.js) | JSON 语法规则 —— 与 JS 对象字面量的差异 | 入门 |
| [03_replacer_and_reviver.js](21_json/03_replacer_and_reviver.js) | stringify 的 replacer 与 parse 的 reviver —— 过滤与类型恢复 | 进阶 |
| [04_serialization_edge_cases.js](21_json/04_serialization_edge_cases.js) | 序列化陷阱 —— undefined / 函数 / Symbol 被忽略、Date 变字符串、NaN → null、循环引用报错 | 进阶 |
| [05_deep_clone_with_json.js](21_json/05_deep_clone_with_json.js) | 用 JSON 做深拷贝的局限与适用场景 | 进阶 |
| [06_tojson_method.js](21_json/06_tojson_method.js) | 自定义 toJSON 方法控制序列化结果 | 进阶 |
| [07_read_write_json_file.js](21_json/07_read_write_json_file.js) | 用 node:fs 读写 JSON 文件 —— 美化输出与原子写入 | 进阶 |
| [08_json_lines.js](21_json/08_json_lines.js) | JSON Lines（NDJSON）格式 —— 逐行解析大文件 | 进阶 |
| [09_raw_json_and_big_numbers.js](21_json/09_raw_json_and_big_numbers.js) | JSON.rawJSON / JSON.isRawJSON —— 大整数不丢精度的序列化（ES2025） | 高级 |
| [10_parse_source_context.js](21_json/10_parse_source_context.js) | JSON.parse 的 reviver 第三参数 context.source —— 原始文本的最后一根稻草 | 高级 |
| [11_lone_surrogates.js](21_json/11_lone_surrogates.js) | 孤立代理项（lone surrogate）与 JSON 序列化 | 高级 |

---

## 22_date_and_time

**日期与时间**

11 个可运行示例 · 难度 入门 4 / 进阶 6 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_date_creation.js](22_date_and_time/01_date_creation.js) | 创建 Date 对象的各种方式 —— 月份从 0 开始的历史坑 | 入门 |
| [02_timestamp.js](22_date_and_time/02_timestamp.js) | 时间戳 —— Date.now()、getTime()、秒与毫秒、performance.now() | 入门 |
| [03_date_getters_setters.js](22_date_and_time/03_date_getters_setters.js) | 日期读取与修改 —— get/set 全家桶与 getUTC* 系列 | 入门 |
| [04_date_arithmetic.js](22_date_and_time/04_date_arithmetic.js) | 日期加减与间隔计算 —— 为什么时间戳运算优于 Date 运算 | 进阶 |
| [05_date_formatting.js](22_date_and_time/05_date_formatting.js) | 日期格式化 —— 手工补零、ISO 8601 与 toLocaleDateString | 入门 |
| [06_date_parsing.js](22_date_and_time/06_date_parsing.js) | 解析日期字符串 —— Date.parse 的格式兼容性与时区歧义 | 进阶 |
| [07_timezone_basics.js](22_date_and_time/07_timezone_basics.js) | 时区基础 —— UTC 偏移、getTimezoneOffset 与 IANA 时区 | 进阶 |
| [08_intl_datetimeformat.js](22_date_and_time/08_intl_datetimeformat.js) | Intl.DateTimeFormat —— 本地化日期格式化与相对时间 | 进阶 |
| [09_date_temporal_api.js](22_date_and_time/09_date_temporal_api.js) | Temporal API 简介 —— 下一代日期时间 API（含特性检测） | 高级 |
| [10_date_pitfalls.js](22_date_and_time/10_date_pitfalls.js) | 日期与时间常见陷阱汇总 —— 月份索引、时区错位、夏令时、可变性 | 进阶 |
| [11_iso_week.js](22_date_and_time/11_iso_week.js) | ISO 周历与周数计算 —— 手写 getISOWeek / getISOWeekYear | 进阶 |

---

## 23_collections

**集合类型**

10 个可运行示例 · 难度 入门 3 / 进阶 5 / 高级 2

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_map_basics.js](23_collections/01_map_basics.js) | Map 基础 —— 任意类型作键的键值集合 | 入门 |
| [02_map_iteration.js](23_collections/02_map_iteration.js) | Map 的遍历 —— keys / values / entries 与数组互转 | 入门 |
| [03_set_basics.js](23_collections/03_set_basics.js) | Set 基础 —— 唯一值集合与数组去重 | 入门 |
| [04_set_operations.js](23_collections/04_set_operations.js) | Set 集合运算 —— 并集、交集、差集、对称差集 | 进阶 |
| [05_weakmap.js](23_collections/05_weakmap.js) | WeakMap —— 只收对象当键、不可遍历、对垃圾回收友好 | 进阶 |
| [06_weakset.js](23_collections/06_weakset.js) | WeakSet —— 给对象打"临时标记"的弱引用集合 | 进阶 |
| [07_map_vs_object.js](23_collections/07_map_vs_object.js) | Map 与 Object 的全维度对比 —— 键类型、顺序、size、性能、序列化 | 进阶 |
| [08_set_vs_array.js](23_collections/08_set_vs_array.js) | Set 与 Array 对比 —— 查找复杂度、去重、顺序与稳定性的取舍 | 进阶 |
| [09_map_practical.js](23_collections/09_map_practical.js) | Map 实战 —— 缓存、邻接表、频次统计、LRU 思路 | 高级 |
| [10_weakref_and_finalization.js](23_collections/10_weakref_and_finalization.js) | WeakRef 与 FinalizationRegistry —— 弱引用与回收回调（含特性检测） | 高级 |

---

## 24_typed_arrays

**二进制数据、定型数组与字节操作**

13 个可运行示例 · 难度 进阶 12 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_arraybuffer_basics.js](24_typed_arrays/01_arraybuffer_basics.js) | ArrayBuffer —— 字节缓冲区、byteLength 与「内存与视图分离」 | 进阶 |
| [02_dataview.js](24_typed_arrays/02_dataview.js) | DataView —— 读写多字节数值与字节序（大端 / 小端） | 进阶 |
| [03_typed_array_types.js](24_typed_arrays/03_typed_array_types.js) | 定型数组的 8 种类型 —— 取值范围、溢出回绕与普通数组的差异 | 进阶 |
| [04_typed_array_methods.js](24_typed_arrays/04_typed_array_methods.js) | 定型数组的方法 —— map/filter/slice 返回新定型数组，set/subarray 的复制与共享 | 进阶 |
| [05_multiple_views.js](24_typed_arrays/05_multiple_views.js) | 多个视图共享同一块 ArrayBuffer —— 互相影响的原理与实战用法 | 进阶 |
| [06_textencoder_decoder.js](24_typed_arrays/06_textencoder_decoder.js) | TextEncoder / TextDecoder —— 字符串与 UTF-8 字节的互转 | 进阶 |
| [07_node_buffer.js](24_typed_arrays/07_node_buffer.js) | Node.js 的 Buffer —— Uint8Array 的子类与它自带的编解码能力 | 进阶 |
| [08_binary_encoding.js](24_typed_arrays/08_binary_encoding.js) | 字节的文本化编码 —— Base64 / Hex / 百分号编码的互转 | 进阶 |
| [09_binary_file_parsing.js](24_typed_arrays/09_binary_file_parsing.js) | 解析自定义二进制格式 —— 内存中构造「文件头 + 变长记录」并完整解析 | 高级 |
| [10_compression.js](24_typed_arrays/10_compression.js) | 二进制压缩 —— CompressionStream / DecompressionStream 与 node:zlib | 进阶 |
| [11_blob_and_binary_interop.js](24_typed_arrays/11_blob_and_binary_interop.js) | Blob / File 与二进制数据的互转 —— 附完整的类型转换矩阵 | 进阶 |
| [12_float16array.js](24_typed_arrays/12_float16array.js) | Float16Array 与半精度浮点（ES2025）—— 1+5+10 的表示、精度与内存取舍 | 进阶 |
| [13_native_base64_and_hex.js](24_typed_arrays/13_native_base64_and_hex.js) | Uint8Array 的原生字节编解码（ES2025）—— toBase64 / fromBase64 / toHex / fromHex | 进阶 |

---

## 25_proxy_and_reflect

**元编程：拦截对象的基本操作**

10 个可运行示例 · 难度 进阶 7 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_proxy_basics.js](25_proxy_and_reflect/01_proxy_basics.js) | Proxy 基础 —— new Proxy(target, handler) 与最基本的 get / set 拦截 | 进阶 |
| [02_get_set_traps.js](25_proxy_and_reflect/02_get_set_traps.js) | get / set 陷阱详解 —— 参数含义、receiver 与 Reflect 的配合 | 进阶 |
| [03_has_delete_traps.js](25_proxy_and_reflect/03_has_delete_traps.js) | has / deleteProperty / ownKeys 陷阱 —— 拦截 in、delete 与键枚举 | 进阶 |
| [04_apply_construct_traps.js](25_proxy_and_reflect/04_apply_construct_traps.js) | apply / construct 陷阱 —— 拦截函数调用与 new 调用 | 进阶 |
| [05_validation_proxy.js](25_proxy_and_reflect/05_validation_proxy.js) | 用 Proxy 做运行时校验 —— 类型约束、未知字段拒绝、只读包装 | 高级 |
| [06_observable_proxy.js](25_proxy_and_reflect/06_observable_proxy.js) | 用 Proxy 实现数据变化侦测 —— 简易响应式系统的完整原理 | 高级 |
| [07_negative_array_index.js](25_proxy_and_reflect/07_negative_array_index.js) | 用 Proxy 实现 Python 风格负索引数组与"默认值对象" | 进阶 |
| [08_reflect_api.js](25_proxy_and_reflect/08_reflect_api.js) | Reflect 全部静态方法 —— 与 Proxy 陷阱的一一对应 | 进阶 |
| [09_reflect_vs_object.js](25_proxy_and_reflect/09_reflect_vs_object.js) | Reflect 与 Object 同名方法的差异 —— 返回值、抛错与类型强转 | 进阶 |
| [10_proxy_limitations.js](25_proxy_and_reflect/10_proxy_limitations.js) | Proxy 的局限 —— 性能开销、内部槽、私有字段与透明性陷阱 | 高级 |

---

## 26_node_core

**Node.js 核心模块**

20 个可运行示例 · 难度 入门 5 / 进阶 8 / 高级 7

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_process_object.js](26_node_core/01_process_object.js) | process 全局对象 —— 进程信息、argv、env 与 nextTick | 入门 |
| [02_path_module.js](26_node_core/02_path_module.js) | node:path —— 路径拼接、解析与跨平台差异 | 入门 |
| [03_url_module.js](26_node_core/03_url_module.js) | URL 与 URLSearchParams —— 解析、构造与查询参数操作 | 入门 |
| [04_fs_sync.js](26_node_core/04_fs_sync.js) | node:fs 同步 API —— readFileSync / writeFileSync / mkdirSync 等 | 入门 |
| [05_fs_callback.js](26_node_core/05_fs_callback.js) | node:fs 回调 API —— 异步非阻塞与错误优先回调 | 进阶 |
| [06_fs_promises.js](26_node_core/06_fs_promises.js) | node:fs/promises —— await 风格的文件操作 | 进阶 |
| [07_events_eventemitter.js](26_node_core/07_events_eventemitter.js) | node:events —— EventEmitter 事件模型与发布订阅 | 进阶 |
| [08_streams_basics.js](26_node_core/08_streams_basics.js) | node:stream —— 可读流、可写流与 pipe 管道 | 高级 |
| [09_readline_cli.js](26_node_core/09_readline_cli.js) | node:readline —— 逐行读取输入与交互式命令行 | 进阶 |
| [10_child_process.js](26_node_core/10_child_process.js) | node:child_process —— spawn / exec / execFile 的区别 | 进阶 |
| [11_timers.js](26_node_core/11_timers.js) | 定时器 —— setTimeout / setInterval / setImmediate 与事件循环 | 进阶 |
| [12_os_and_util.js](26_node_core/12_os_and_util.js) | node:os 与 node:util —— 系统信息与通用工具函数 | 入门 |
| [13_crypto_hash.js](26_node_core/13_crypto_hash.js) | node:crypto —— 哈希、HMAC、随机数与密码加盐哈希 | 高级 |
| [14_worker_threads.js](26_node_core/14_worker_threads.js) | node:worker_threads —— 用多线程做真正的并行计算 | 高级 |
| [15_http_server_client.js](26_node_core/15_http_server_client.js) | node:http —— 自建服务器并用 fetch 请求自己 | 高级 |
| [16_env_and_dotenv.js](26_node_core/16_env_and_dotenv.js) | 环境变量与配置管理 —— process.env、默认值策略与 NODE_ENV 约定 | 进阶 |
| [17_shared_memory_and_atomics.js](26_node_core/17_shared_memory_and_atomics.js) | SharedArrayBuffer 与 Atomics —— 真正的多线程共享内存 | 高级 |
| [18_cli_args_and_signals.js](26_node_core/18_cli_args_and_signals.js) | 命令行参数解析与进程信号 —— parseArgs 与优雅关闭 | 进阶 |
| [19_fork_and_cluster.js](26_node_core/19_fork_and_cluster.js) | child_process.fork 与 cluster —— 多进程跑 Node 脚本、多进程共享端口 | 高级 |
| [20_http_caching.js](26_node_core/20_http_caching.js) | HTTP 缓存 —— 强缓存、协商缓存与 Vary | 高级 |

---

## 27_web_apis

**浏览器 Web API**

18 个可运行示例 · 18 个浏览器示例（🌐） · 难度 入门 2 / 进阶 8 / 高级 8

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_dom_query.html 🌐](27_web_apis/01_dom_query.html) | DOM 查询与操作（querySelector / querySelectorAll / 创建与插入节点） | 入门 |
| [01_dom_query.js](27_web_apis/01_dom_query.js) | DOM 查询与操作（Node 端用对象树模拟 DOM 遍历） | 入门 |
| [02_dom_events.html 🌐](27_web_apis/02_dom_events.html) | DOM 事件（addEventListener / 冒泡 / 捕获 / 委托 / 阻止默认行为） | 进阶 |
| [02_dom_events.js](27_web_apis/02_dom_events.js) | DOM 事件（Node 端自建事件发射器，演示捕获 / 冒泡 / 委托 / 阻止默认） | 进阶 |
| [03_forms_and_validation.html 🌐](27_web_apis/03_forms_and_validation.html) | 表单与校验（表单元素读写 / submit / 必填与自定义校验） | 进阶 |
| [03_forms_and_validation.js](27_web_apis/03_forms_and_validation.js) | 表单与校验（Node 端用纯函数实现同一套校验逻辑） | 进阶 |
| [04_fetch_api.html 🌐](27_web_apis/04_fetch_api.html) | 网络请求 fetch（GET / POST / 响应解析 / 错误处理） | 进阶 |
| [04_fetch_api.js](27_web_apis/04_fetch_api.js) | 网络请求 fetch（Node 端自建本地服务器 + 用 fetch 请求自己） | 进阶 |
| [05_web_storage.html 🌐](27_web_apis/05_web_storage.html) | 本地存储（localStorage / sessionStorage / Cookie） | 入门 |
| [05_web_storage.js](27_web_apis/05_web_storage.js) | 本地存储（Node 端用 Map 实现同接口的 Storage） | 入门 |
| [06_url_and_history.html 🌐](27_web_apis/06_url_and_history.html) | URL 与历史记录（URL / URLSearchParams / History API） | 进阶 |
| [06_url_and_history.js](27_web_apis/06_url_and_history.js) | URL 与历史记录（Node 端用 node:url 演示同样的解析与构造） | 进阶 |
| [07_canvas_basics.html 🌐](27_web_apis/07_canvas_basics.html) | 画布绘制（canvas 2D：图形 / 文字 / 动画 requestAnimationFrame） | 进阶 |
| [07_canvas_basics.js](27_web_apis/07_canvas_basics.js) | 画布绘制（Node 端用字符画模拟像素缓冲区） | 进阶 |
| [08_browser_modules.html 🌐](27_web_apis/08_browser_modules.html) | 浏览器端 ES 模块（type="module" 的导入导出、模块作用域） | 进阶 |
| [08_browser_modules.js](27_web_apis/08_browser_modules.js) | 浏览器端 ES 模块（Node 中同样的 ESM 用法对比） | 进阶 |
| [09_dom_performance.html 🌐](27_web_apis/09_dom_performance.html) | DOM 性能（批量插入：innerHTML vs DocumentFragment vs 逐个 appendChild） | 高级 |
| [09_dom_performance.js](27_web_apis/09_dom_performance.js) | DOM 性能（批量插入的代价：字符串拼接 / 数组 join / DocumentFragment） | 高级 |
| [10_browser_storage_limits.html 🌐](27_web_apis/10_browser_storage_limits.html) | 浏览器存储的容量限制（配额探测 / 体积压缩 / LRU 淘汰） | 高级 |
| [10_browser_storage_limits.js](27_web_apis/10_browser_storage_limits.js) | 浏览器存储的容量限制（Node 端实测体积 + 模拟配额与 LRU 淘汰） | 高级 |
| [11_blob_file_formdata.html 🌐](27_web_apis/11_blob_file_formdata.html) | Blob / File / FileReader / FormData —— 二进制数据的表示与传递 | 进阶 |
| [11_blob_file_formdata.js](27_web_apis/11_blob_file_formdata.js) | Blob / File / FileReader / FormData —— 二进制数据的表示与传递 | 进阶 |
| [12_observer_apis.html 🌐](27_web_apis/12_observer_apis.html) | 三大观察者 —— IntersectionObserver / MutationObserver / ResizeObserver | 进阶 |
| [12_observer_apis.js](27_web_apis/12_observer_apis.js) | 三大观察者 —— IntersectionObserver / MutationObserver / ResizeObserver | 进阶 |
| [13_cross_context_messaging.html 🌐](27_web_apis/13_cross_context_messaging.html) | 跨上下文通信 —— postMessage / BroadcastChannel / storage 事件 | 高级 |
| [13_cross_context_messaging.js](27_web_apis/13_cross_context_messaging.js) | 跨上下文通信 —— postMessage / BroadcastChannel / storage 事件 | 高级 |
| [14_drag_drop_and_clipboard.html 🌐](27_web_apis/14_drag_drop_and_clipboard.html) | 拖放 API（Drag and Drop）与剪贴板 API（Clipboard） | 高级 |
| [14_drag_drop_and_clipboard.js](27_web_apis/14_drag_drop_and_clipboard.js) | 拖放 API（Drag and Drop）与剪贴板 API（Clipboard） | 高级 |
| [15_indexeddb.html 🌐](27_web_apis/15_indexeddb.html) | IndexedDB 实操（开库 / 对象仓库 / 索引 / 事务 / 游标 / 版本升级） | 高级 |
| [15_indexeddb.js](27_web_apis/15_indexeddb.js) | IndexedDB —— 浏览器里的结构化数据库（Node 端手写迷你模拟器） | 高级 |
| [16_web_components.html 🌐](27_web_apis/16_web_components.html) | Web Components 三件套（自定义元素 / Shadow DOM / template + slot） | 高级 |
| [16_web_components.js](27_web_apis/16_web_components.js) | Web Components 三件套（自定义元素 / Shadow DOM / template+slot） | 高级 |
| [17_service_worker.html 🌐](27_web_apis/17_service_worker.html) | Service Worker 与离线能力（生命周期 / 缓存策略 / 版本管理 / 离线兜底） | 高级 |
| [17_service_worker.js](27_web_apis/17_service_worker.js) | Service Worker 与离线能力（生命周期 / 缓存策略 / 后台缓存 / 版本管理） | 高级 |
| [18_web_worker.html 🌐](27_web_apis/18_web_worker.html) | 浏览器 Web Worker（多线程 / postMessage / Transferable / Worker 池） | 高级 |
| [18_web_worker.js](27_web_apis/18_web_worker.js) | 浏览器 Web Worker（多线程 / postMessage / Transferable / Worker 池） | 高级 |

<sub>辅助模块（被导入，不作为独立示例）：`_cjs_like_module.cjs`、`_esm_shared_module.js`</sub>

---

## 28_testing

**测试基础**

14 个可运行示例 · 难度 入门 4 / 进阶 9 / 高级 1

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_why_testing.js](28_testing/01_why_testing.js) | 为什么需要测试 —— 手工验证 vs 自动化，可回归与文档价值 | 入门 |
| [02_node_test_runner.js](28_testing/02_node_test_runner.js) | Node 内置测试运行器 node:test —— test()、断言、子测试 | 入门 |
| [03_assert_module.js](28_testing/03_assert_module.js) | node:assert 断言库全览 —— strictEqual / deepStrictEqual / throws / rejects / ok / match | 入门 |
| [04_test_structure.js](28_testing/04_test_structure.js) | 测试结构 —— describe/it 风格、setup/teardown、beforeEach | 入门 |
| [05_mocking_basics.js](28_testing/05_mocking_basics.js) | 测试替身 —— stub / spy / mock 手写实现，以及 node:test 的 mock 模块 | 进阶 |
| [06_testing_async_code.js](28_testing/06_testing_async_code.js) | 测试异步代码 —— async 测试函数、断言 Promise 拒绝、超时控制 | 进阶 |
| [07_testing_pure_functions.js](28_testing/07_testing_pure_functions.js) | 为纯函数写测试 —— 边界值、等价类划分、参数化测试 | 进阶 |
| [08_test_coverage_concept.js](28_testing/08_test_coverage_concept.js) | 覆盖率概念 —— 语句 / 分支 / 函数 / 行覆盖 | 进阶 |
| [09_tdd_workflow.js](28_testing/09_tdd_workflow.js) | TDD 流程演示 —— 红 / 绿 / 重构（Red-Green-Refactor） | 进阶 |
| [10_vitest_intro.js](28_testing/10_vitest_intro.js) | Vitest 风格测试 —— expect 断言体系与 vi 工具对象 | 进阶 |
| [11_snapshot_testing.js](28_testing/11_snapshot_testing.js) | 快照测试 —— 首次记录、后续比对，以及"什么时候不该用快照" | 进阶 |
| [12_test_pyramid_and_e2e.js](28_testing/12_test_pyramid_and_e2e.js) | 测试金字塔与端到端测试 —— 单元 / 集成 / E2E 三层的取舍 | 进阶 |
| [13_module_mocking.js](28_testing/13_module_mocking.js) | 模块级 mock —— 为什么打不到内部 import，以及依赖注入这个正解 | 高级 |
| [14_testing_http.js](28_testing/14_testing_http.js) | HTTP / API 层测试 —— 用真实端口验证契约 | 进阶 |

---

## 29_npm_libraries

**常用第三方库**

16 个可运行示例 · 难度 入门 5 / 进阶 7 / 高级 4

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_lodash_basics.js](29_npm_libraries/01_lodash_basics.js) | lodash 基础 —— chunk / uniqBy / groupBy / get / set / debounce | 入门 |
| [02_lodash_advanced.js](29_npm_libraries/02_lodash_advanced.js) | lodash 进阶 —— debounce / throttle / memoize / cloneDeep / merge 与原生实现对比 | 进阶 |
| [03_dayjs.js](29_npm_libraries/03_dayjs.js) | dayjs —— 解析、格式化、加减、比较、插件（relativeTime），与原生 Date 对比 | 入门 |
| [04_axios.js](29_npm_libraries/04_axios.js) | axios —— GET/POST、实例配置、拦截器、错误处理 | 进阶 |
| [05_zod_validation.js](29_npm_libraries/05_zod_validation.js) | zod —— schema 定义、parse/safeParse、类型推断、嵌套对象、自定义校验、错误格式化 | 进阶 |
| [06_uuid.js](29_npm_libraries/06_uuid.js) | uuid —— v4 / v7 生成、唯一性演示、与 crypto.randomUUID 对比 | 入门 |
| [07_chalk_terminal_colors.js](29_npm_libraries/07_chalk_terminal_colors.js) | chalk —— 终端彩色输出、样式组合、嵌套样式、level 检测 | 入门 |
| [08_commander_cli.js](29_npm_libraries/08_commander_cli.js) | commander —— 构建一个完整的命令行工具（子命令 / 选项 / 参数 / 帮助） | 进阶 |
| [09_dotenv.js](29_npm_libraries/09_dotenv.js) | dotenv —— .env 文件解析、变量覆盖规则、真实项目中的用法 | 入门 |
| [10_express_server.js](29_npm_libraries/10_express_server.js) | express —— 路由、中间件、JSON 请求体、错误处理中间件 | 进阶 |
| [11_express_rest_api.js](29_npm_libraries/11_express_rest_api.js) | express 实战 —— 一个完整的迷你 REST API（CRUD + 内存存储 + 状态码） | 高级 |
| [12_library_selection.js](29_npm_libraries/12_library_selection.js) | 如何选择第三方库 —— 包体积、维护状态、类型支持、许可证 | 进阶 |
| [13_ws_websocket.js](29_npm_libraries/13_ws_websocket.js) | WebSocket 实时通信 —— 用 ws 库做服务端 / 客户端 / 广播 / 心跳 | 进阶 |
| [14_logging.js](29_npm_libraries/14_logging.js) | 日志 —— 从 console.log 到结构化日志器，以及 pino / winston / consola 选型 | 高级 |
| [15_database_and_orm.js](29_npm_libraries/15_database_and_orm.js) | 数据库与数据访问层 —— node:sqlite 原生 SQL 与仓储（Repository）抽象 | 高级 |
| [16_retry_and_resilience.js](29_npm_libraries/16_retry_and_resilience.js) | 请求重试与弹性 —— 指数退避、抖动、幂等性、熔断器 | 高级 |

---

## 30_design_patterns

**设计模式**

21 个可运行示例 · 难度 入门 1 / 进阶 14 / 高级 6

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_module_pattern.js](30_design_patterns/01_module_pattern.js) | 模块模式 —— IIFE + 闭包实现私有成员 | 进阶 |
| [02_singleton.js](30_design_patterns/02_singleton.js) | 单例模式 —— 多种实现方式与 ESM 的天然单例 | 进阶 |
| [03_factory.js](30_design_patterns/03_factory.js) | 工厂模式 —— 简单工厂、工厂方法、参数化创建与抽象工厂 | 进阶 |
| [04_builder.js](30_design_patterns/04_builder.js) | 建造者模式 —— 分步构建复杂对象（链式调用 + build 校验） | 进阶 |
| [05_observer.js](30_design_patterns/05_observer.js) | 观察者模式 —— Subject / Observer 双向直连的推模型 | 进阶 |
| [06_pubsub.js](30_design_patterns/06_pubsub.js) | 发布订阅模式 —— 完整 EventBus 实现（on/once/off/emit/clear） | 进阶 |
| [07_strategy.js](30_design_patterns/07_strategy.js) | 策略模式 —— 用"数据映射"消除成堆的 if-else | 进阶 |
| [08_decorator.js](30_design_patterns/08_decorator.js) | 装饰器模式 —— 用高阶函数包装函数（日志/计时/缓存/鉴权） | 进阶 |
| [09_adapter.js](30_design_patterns/09_adapter.js) | 适配器模式 —— 把不兼容的第三方接口统一成自己的接口 | 进阶 |
| [10_proxy_pattern.js](30_design_patterns/10_proxy_pattern.js) | 代理模式 —— 缓存代理 / 虚拟代理 / 保护代理 / 远程代理 + ES6 Proxy | 进阶 |
| [11_command.js](30_design_patterns/11_command.js) | 命令模式 —— 把"操作"封装成对象（execute / undo / redo / 宏命令） | 进阶 |
| [12_chain_of_responsibility.js](30_design_patterns/12_chain_of_responsibility.js) | 责任链模式 —— 中间件流水线与 compose 的完整实现 | 高级 |
| [13_pattern_selection.js](30_design_patterns/13_pattern_selection.js) | 模式选择指南 —— 12 个模式的适用场景对照与"不要过度设计" | 入门 |
| [14_state.js](30_design_patterns/14_state.js) | 状态模式 —— 行为随内部状态改变而改变（与策略模式的本质区别） | 进阶 |
| [15_template_method.js](30_design_patterns/15_template_method.js) | 模板方法模式 —— 父类定骨架、子类填步骤（与策略模式的复用方式之别） | 进阶 |
| [16_structural_patterns.js](30_design_patterns/16_structural_patterns.js) | 结构型模式补充 —— 外观 Facade、组合 Composite、享元 Flyweight | 进阶 |
| [17_behavioral_patterns_extra.js](30_design_patterns/17_behavioral_patterns_extra.js) | 行为型模式补充 —— 中介者 Mediator、备忘录 Memento、访问者 Visitor、桥接 Bridge | 高级 |
| [18_solid_principles.js](30_design_patterns/18_solid_principles.js) | SOLID 五大设计原则 —— 违反 → 问题 → 重构 的三段式对照 | 高级 |
| [19_dependency_injection.js](30_design_patterns/19_dependency_injection.js) | 依赖注入（DI）与控制反转（IoC）—— 让依赖可替换、代码可测试 | 高级 |
| [20_decorator_syntax.js](30_design_patterns/20_decorator_syntax.js) | TC39 装饰器语法（Stage 3）—— @decorator 原生语法与能力检测 | 高级 |
| [21_architecture_patterns.js](30_design_patterns/21_architecture_patterns.js) | 应用架构模式 —— 分层、Repository、Service、DTO、MVC/MVVM、服务端韧性 | 高级 |

---

## 31_performance_and_memory

**性能与内存**

18 个可运行示例 · 难度 进阶 7 / 高级 11

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_debounce.js](31_performance_and_memory/01_debounce.js) | 防抖 debounce —— 闭包保存 timer、leading 立即执行、cancel 取消与 maxWait | 进阶 |
| [02_throttle.js](31_performance_and_memory/02_throttle.js) | 节流 throttle —— 时间戳版、定时器版与结合版（首次立即 + 末尾补执行） | 进阶 |
| [03_memoization.js](31_performance_and_memory/03_memoization.js) | 记忆化 memoization —— 闭包缓存、键策略、TTL 失效与 LRU 淘汰 | 进阶 |
| [04_algorithm_complexity.js](31_performance_and_memory/04_algorithm_complexity.js) | 算法复杂度实测 —— Array 线性查找 O(n) vs Set/Map 哈希查找 O(1) | 进阶 |
| [05_loop_performance.js](31_performance_and_memory/05_loop_performance.js) | 循环性能实测 —— for / while / for...of / forEach / map 的真实差距 | 进阶 |
| [06_string_concatenation.js](31_performance_and_memory/06_string_concatenation.js) | 字符串拼接性能 —— + / 模板字符串 / 数组 join 与 V8 的 Rope 结构 | 进阶 |
| [07_batch_dom_updates.js](31_performance_and_memory/07_batch_dom_updates.js) | 批量更新与减少重复计算 —— DocumentFragment 思想与重排次数统计 | 进阶 |
| [08_object_shape_optimization.js](31_performance_and_memory/08_object_shape_optimization.js) | 对象形状（隐藏类 / Hidden Class）与属性访问性能 | 高级 |
| [09_memory_leak_patterns.js](31_performance_and_memory/09_memory_leak_patterns.js) | 内存泄漏的常见模式 —— 全局变量、定时器、闭包、无上限缓存、分离 DOM | 高级 |
| [10_weakref_and_gc.js](31_performance_and_memory/10_weakref_and_gc.js) | 弱引用与 GC —— WeakMap / WeakSet / WeakRef / FinalizationRegistry | 高级 |
| [11_benchmark_basics.js](31_performance_and_memory/11_benchmark_basics.js) | 基准测试基础 —— 高精度计时、预热、多轮采样与死代码消除 | 高级 |
| [12_gc_internals.js](31_performance_and_memory/12_gc_internals.js) | 垃圾回收原理进阶 —— 分代假设、新生代 Scavenge、老生代标记清除/整理、 | 高级 |
| [13_memory_profiling.js](31_performance_and_memory/13_memory_profiling.js) | 内存剖析实操 —— memoryUsage 各字段、堆统计 API、堆快照三步分析法、 | 高级 |
| [14_long_tasks_and_scheduling.js](31_performance_and_memory/14_long_tasks_and_scheduling.js) | 长任务与主线程调度 —— 50ms 长任务、INP 影响、分片让出、 | 高级 |
| [15_virtual_list.js](31_performance_and_memory/15_virtual_list.js) | 虚拟列表（窗口化渲染）—— 核心思路与完整算法实现 | 高级 |
| [16_web_vitals.js](31_performance_and_memory/16_web_vitals.js) | Web Vitals 与性能测量 API —— LCP/CLS/INP/TTFB/FCP、 | 高级 |
| [17_data_structure_performance.js](31_performance_and_memory/17_data_structure_performance.js) | 数据结构的性能视角 —— Array vs TypedArray、Map vs Object、 | 高级 |
| [18_load_testing.js](31_performance_and_memory/18_load_testing.js) | 负载测试 —— 接口级并发基准（吞吐、延迟分位数与错误率） | 高级 |

---

## 32_security_and_best_practices

**安全与最佳实践**

19 个可运行示例 · 难度 入门 2 / 进阶 13 / 高级 4

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_input_validation.js](32_security_and_best_practices/01_input_validation.js) | 输入校验 —— 白名单优于黑名单，以及手写一个 zod 风格的 schema 校验器 | 进阶 |
| [02_xss_prevention.js](32_security_and_best_practices/02_xss_prevention.js) | XSS 跨站脚本攻击的原理与防御 —— HTML 转义、上下文区分、CSP | 进阶 |
| [03_sql_injection.js](32_security_and_best_practices/03_sql_injection.js) | SQL 注入的原理与防御 —— 参数化查询是"结构与数据分离"，不是"转义字符" | 进阶 |
| [04_prototype_pollution.js](32_security_and_best_practices/04_prototype_pollution.js) | 原型污染（Prototype Pollution）—— __proto__ / constructor.prototype 攻击与防御 | 高级 |
| [05_eval_dangers.js](32_security_and_best_practices/05_eval_dangers.js) | eval / new Function 的风险与替代方案 —— 为什么"把字符串当代码跑"很危险 | 进阶 |
| [06_immutability.js](32_security_and_best_practices/06_immutability.js) | 不可变数据 —— Object.freeze（浅冻结！）、不可变更新、深拷贝与代价 | 进阶 |
| [07_jsdoc_typing.js](32_security_and_best_practices/07_jsdoc_typing.js) | JSDoc 类型标注 —— 不引入 TypeScript 也能获得编辑器类型提示与检查 | 进阶 |
| [08_error_message_hygiene.js](32_security_and_best_practices/08_error_message_hygiene.js) | 错误信息安全 —— 内部日志与用户响应两条通道、错误分类、脱敏与 traceId | 进阶 |
| [09_secure_random.js](32_security_and_best_practices/09_secure_random.js) | 安全随机数 —— Math.random 为什么不能用、crypto 系列 API、取模偏差与常量时间比较 | 进阶 |
| [10_code_style_guide.js](32_security_and_best_practices/10_code_style_guide.js) | 代码风格与最佳实践清单 —— 命名、单一职责、早返回、隐式转换、const、可选链 | 入门 |
| [11_csrf.js](32_security_and_best_practices/11_csrf.js) | CSRF 跨站请求伪造 —— 攻击原理与五种防御手段 | 进阶 |
| [12_cors_and_same_origin.js](32_security_and_best_practices/12_cors_and_same_origin.js) | 同源策略与 CORS 的安全含义 —— 预检、凭证、错误配置的后果 | 进阶 |
| [13_csp_advanced.js](32_security_and_best_practices/13_csp_advanced.js) | CSP 内容安全策略进阶 —— nonce、hash、strict-dynamic、上报与 Trusted Types | 高级 |
| [14_supply_chain_security.js](32_security_and_best_practices/14_supply_chain_security.js) | 供应链与第三方脚本安全 —— SRI、lockfile、npm audit、postinstall 风险 | 进阶 |
| [15_auth_basics.js](32_security_and_best_practices/15_auth_basics.js) | 认证与授权基础 —— 会话 vs JWT、密码存储、OAuth 2.0 的定位 | 进阶 |
| [16_rate_limiting.js](32_security_and_best_practices/16_rate_limiting.js) | 速率限制与暴力破解防护 —— 四种限流算法与 429 响应 | 进阶 |
| [17_path_traversal_and_ssrf.js](32_security_and_best_practices/17_path_traversal_and_ssrf.js) | 路径遍历与 SSRF —— 从"读任意文件"到"打内网" | 高级 |
| [18_sandboxing.js](32_security_and_best_practices/18_sandboxing.js) | 沙箱化执行不可信代码 —— node:vm 的能力边界与真正的隔离层级 | 高级 |
| [19_owasp_checklist.js](32_security_and_best_practices/19_owasp_checklist.js) | OWASP Top 10 与项目安全自查清单 —— 收口与索引 | 入门 |

---

## 33_intl

**国际化 API（Intl）**

11 个可运行示例 · 难度 入门 3 / 进阶 5 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_intl_overview.js](33_intl/01_intl_overview.js) | Intl 命名空间总览 —— 构造器清单、locale/options 结构、实例缓存 | 入门 |
| [02_intl_collator.js](33_intl/02_intl_collator.js) | Intl.Collator —— 本地化字符串比较与排序 | 进阶 |
| [03_intl_plural_rules.js](33_intl/03_intl_plural_rules.js) | Intl.PluralRules —— 复数类别、范围复数与序数词 | 进阶 |
| [04_intl_list_format.js](33_intl/04_intl_list_format.js) | Intl.ListFormat —— 本地化的列表连接（"张三、李四和王五"） | 入门 |
| [05_intl_segmenter.js](33_intl/05_intl_segmenter.js) | Intl.Segmenter —— 分词、字素簇与句子切分 | 进阶 |
| [06_intl_display_names.js](33_intl/06_intl_display_names.js) | Intl.DisplayNames —— 语言、地区、货币等名称的本地化 | 入门 |
| [07_intl_locale.js](33_intl/07_intl_locale.js) | Intl.Locale —— 解析、推导与协商 BCP 47 语言标签 | 进阶 |
| [08_intl_best_practices.js](33_intl/08_intl_best_practices.js) | Intl 最佳实践与陷阱汇总 —— locale、缓存、时区、解析、ICU 差异 | 高级 |
| [09_intl_duration_format.js](33_intl/09_intl_duration_format.js) | Intl.DurationFormat —— 时长本地化（视频进度 / 任务耗时 / 倒计时） | 进阶 |
| [10_intl_rtl_and_bidi.js](33_intl/10_intl_rtl_and_bidi.js) | RTL 与双向文本（bidi）—— 排版方向、逻辑属性、以及 Intl 输出里的隐形字符 | 高级 |
| [11_i18n_engineering.js](33_intl/11_i18n_engineering.js) | i18n 工程实践 —— 消息目录、缺失兜底、语言协商、偏好持久化 | 高级 |

---

## 34_modern_es_features

**现代 ES 新特性**

8 个可运行示例 · 难度 进阶 5 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_es2021_features.js](34_modern_es_features/01_es2021_features.js) | ES2021 新特性 —— 逻辑赋值、数字分隔符、replaceAll、Promise.any、WeakRef | 进阶 |
| [02_es2022_features.js](34_modern_es_features/02_es2022_features.js) | ES2022 新特性 —— .at()、Object.hasOwn、error.cause、类字段与静态块、d 标志、顶层 await | 进阶 |
| [03_es2023_features.js](34_modern_es_features/03_es2023_features.js) | ES2023 新特性 —— findLast、非破坏性数组方法、Hashbang、Symbol 作 WeakMap 键 | 进阶 |
| [04_es2024_features.js](34_modern_es_features/04_es2024_features.js) | ES2024 新特性 —— Object.groupBy、Promise.withResolvers、RegExp v 标志、 | 高级 |
| [05_es2025_iterator_helpers.js](34_modern_es_features/05_es2025_iterator_helpers.js) | ES2025 迭代器助手（Iterator Helpers）—— 惰性求值的链式迭代 | 高级 |
| [06_es2025_set_methods.js](34_modern_es_features/06_es2025_set_methods.js) | ES2025 Set 集合运算原生方法 —— union / intersection / difference / | 进阶 |
| [07_promise_try_and_regexp_escape.js](34_modern_es_features/07_promise_try_and_regexp_escape.js) | ES2025 三件套 —— Promise.try、RegExp.escape、Array.fromAsync | 进阶 |
| [08_explicit_resource_management.js](34_modern_es_features/08_explicit_resource_management.js) | ES2025 显式资源管理（Explicit Resource Management）—— | 高级 |

---

## 35_web_crypto

**Web Crypto API**

8 个可运行示例 · 难度 入门 2 / 进阶 3 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_crypto_overview.js](35_web_crypto/01_crypto_overview.js) | Web Crypto 总览 —— crypto.subtle 是什么、与 node:crypto 的分工、可用算法、安全随机数 | 入门 |
| [02_digest_hashing.js](35_web_crypto/02_digest_hashing.js) | 摘要算法 —— SHA-256/384/512，subtle.digest 用法、与 node:crypto 交叉验证、为什么不可逆 | 入门 |
| [03_hmac_signing.js](35_web_crypto/03_hmac_signing.js) | HMAC 消息认证码 —— 导入密钥、sign/verify、时序安全比较、API 签名与 Webhook 校验 | 进阶 |
| [04_aes_gcm_encryption.js](35_web_crypto/04_aes_gcm_encryption.js) | AES-GCM 对称加密 —— 密钥与 IV、认证标签、篡改检测，以及为什么优于 CBC | 进阶 |
| [05_key_derivation_pbkdf2.js](35_web_crypto/05_key_derivation_pbkdf2.js) | 口令派生密钥 —— PBKDF2 原理、盐与迭代次数、deriveBits/deriveKey，为什么口令不能直接当密钥 | 进阶 |
| [06_ecdsa_keypair.js](35_web_crypto/06_ecdsa_keypair.js) | ECDSA 非对称签名 —— 密钥对生成、sign/verify、raw/pkcs8/spki/jwk 四种格式、JWT 签名思路 | 高级 |
| [07_key_storage_and_rotation.js](35_web_crypto/07_key_storage_and_rotation.js) | 密钥的生命周期 —— 存储、轮换与撤销（CryptoKey 持久化 + kid 密钥环） | 高级 |
| [08_asymmetric_encryption.js](35_web_crypto/08_asymmetric_encryption.js) | 非对称加密 —— RSA-OAEP 与 ECDH 密钥协商（公钥怎么用来"加密"） | 高级 |

---

## 36_realtime_and_streams

**实时通信与流式处理**

9 个可运行示例 · 难度 进阶 4 / 高级 5

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_websocket_basics.js](36_realtime_and_streams/01_websocket_basics.js) | WebSocket 基础 —— 从 HTTP Upgrade 握手到双向通信 | 进阶 |
| [02_websocket_broadcast.js](36_realtime_and_streams/02_websocket_broadcast.js) | WebSocket 广播、房间分组与心跳保活 | 进阶 |
| [03_server_sent_events.js](36_realtime_and_streams/03_server_sent_events.js) | Server-Sent Events —— 一条永不结束的 HTTP 响应 | 进阶 |
| [04_web_streams_readable.js](36_realtime_and_streams/04_web_streams_readable.js) | Web Streams API —— ReadableStream 与背压 | 进阶 |
| [05_web_streams_transform.js](36_realtime_and_streams/05_web_streams_transform.js) | TransformStream 与管道 —— pipeThrough、分块切分与背压传导 | 高级 |
| [06_web_streams_vs_node_streams.js](36_realtime_and_streams/06_web_streams_vs_node_streams.js) | Web Streams 与 node:stream 的对比与互转 | 高级 |
| [07_websocket_reconnect.js](36_realtime_and_streams/07_websocket_reconnect.js) | WebSocket 客户端重连 —— 指数退避、抖动、状态恢复与心跳保活 | 高级 |
| [08_stream_cancellation.js](36_realtime_and_streams/08_stream_cancellation.js) | AbortSignal 与流的取消贯通 —— 从 timeout 到 abort 的完整链路 | 高级 |
| [09_byte_streams.js](36_realtime_and_streams/09_byte_streams.js) | 字节流与 BYOB —— ByteLengthQueuingStrategy、缓冲区复用、何时该用字节流 | 高级 |

---

## 37_debugging_and_profiling

**调试与性能剖析**

8 个可运行示例 · 难度 进阶 3 / 高级 5

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_stack_traces.js](37_debugging_and_profiling/01_stack_traces.js) | 调用栈追踪 —— Error.stack 的格式、截断控制与异步栈 | 进阶 |
| [02_debugger_and_inspect.js](37_debugging_and_profiling/02_debugger_and_inspect.js) | debugger 语句与非交互式调试 —— --inspect / DevTools / node inspect | 进阶 |
| [03_source_maps.js](37_debugging_and_profiling/03_source_maps.js) | Source Map 原理 —— mappings 字段、VLQ 编码与"生成位置→原始位置"映射 | 高级 |
| [04_perf_hooks.js](37_debugging_and_profiling/04_perf_hooks.js) | node:perf_hooks —— mark/measure、PerformanceObserver 与分位数统计 | 进阶 |
| [05_memory_diagnostics.js](37_debugging_and_profiling/05_memory_diagnostics.js) | 内存诊断 —— memoryUsage、v8 堆统计、堆快照与 --max-old-space-size | 高级 |
| [06_production_error_reporting.js](37_debugging_and_profiling/06_production_error_reporting.js) | 生产环境错误上报 —— 全局兜底、上下文采集、脱敏、分级与告警 | 高级 |
| [07_cpu_profiling.js](37_debugging_and_profiling/07_cpu_profiling.js) | CPU 性能剖析 —— --cpu-prof / --prof / inspector Profiler 与火焰图 | 高级 |
| [08_diagnostics_channel.js](37_debugging_and_profiling/08_diagnostics_channel.js) | node:diagnostics_channel —— 库与使用方之间的"按需诊断通道" | 高级 |

---

## 38_algorithms_and_data_structures

**算法与数据结构**

17 个可运行示例 · 难度 入门 3 / 进阶 8 / 高级 6

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_big_o_and_complexity.js](38_algorithms_and_data_structures/01_big_o_and_complexity.js) | 算法复杂度与大 O 记号 —— 用实测计时验证增长趋势 | 入门 |
| [02_linked_list.js](38_algorithms_and_data_structures/02_linked_list.js) | 链表 —— 单向链表、双向链表，以及和数组的取舍 | 入门 |
| [03_stack_and_queue.js](38_algorithms_and_data_structures/03_stack_and_queue.js) | 栈与队列 —— LIFO / FIFO、为什么数组做队列很慢、环形缓冲与双端队列 | 入门 |
| [04_hash_table.js](38_algorithms_and_data_structures/04_hash_table.js) | 哈希表原理 —— 哈希函数、冲突解决、负载因子与扩容 | 进阶 |
| [05_binary_search_tree.js](38_algorithms_and_data_structures/05_binary_search_tree.js) | 二叉搜索树（BST）—— 性质、增删查、四种遍历与退化问题 | 进阶 |
| [06_heap_and_priority_queue.js](38_algorithms_and_data_structures/06_heap_and_priority_queue.js) | 二叉堆与优先队列 —— 数组表示、siftUp/siftDown、建堆与 Top-K | 进阶 |
| [07_graph_traversal.js](38_algorithms_and_data_structures/07_graph_traversal.js) | 图的遍历 —— 邻接表/邻接矩阵、DFS、BFS、最短路径与拓扑排序 | 进阶 |
| [08_sorting_algorithms.js](38_algorithms_and_data_structures/08_sorting_algorithms.js) | 经典排序算法 —— 冒泡/选择/插入、归并、快排与稳定性 | 进阶 |
| [09_searching_algorithms.js](38_algorithms_and_data_structures/09_searching_algorithms.js) | 查找算法 —— 线性查找、二分查找及其边界陷阱、二分答案 | 进阶 |
| [10_dynamic_programming.js](38_algorithms_and_data_structures/10_dynamic_programming.js) | 动态规划入门 —— 从递归到记忆化到递推，以及经典问题 | 高级 |
| [11_string_algorithms.js](38_algorithms_and_data_structures/11_string_algorithms.js) | 字符串算法 —— Trie 前缀树、KMP 与滚动哈希 | 高级 |
| [12_union_find.js](38_algorithms_and_data_structures/12_union_find.js) | 并查集（Union-Find / Disjoint Set Union）—— 路径压缩、按秩合并与动态连通性 | 进阶 |
| [13_backtracking_and_greedy.js](38_algorithms_and_data_structures/13_backtracking_and_greedy.js) | 回溯与贪心 —— 搜索式回溯的通用框架、剪枝，以及贪心的正确性条件与反例 | 高级 |
| [14_two_pointers_and_sliding_window.js](38_algorithms_and_data_structures/14_two_pointers_and_sliding_window.js) | 双指针与滑动窗口 —— 把 O(n²) 降成 O(n) 的两个通用模板 | 进阶 |
| [15_weighted_graphs.js](38_algorithms_and_data_structures/15_weighted_graphs.js) | 加权图 —— Dijkstra、Bellman-Ford 与最小生成树（Kruskal / Prim） | 高级 |
| [16_bit_manipulation.js](38_algorithms_and_data_structures/16_bit_manipulation.js) | JS 位运算专题 —— 32 位有符号转换、位掩码、XOR 技巧与截断陷阱 | 高级 |
| [17_advanced_dp.js](38_algorithms_and_data_structures/17_advanced_dp.js) | 进阶动态规划 —— LIS 的二分优化、区间 DP 与状态压缩 DP | 高级 |

---

## 39_tooling_and_workflow

**工程化工具链**

12 个可运行示例 · 难度 入门 3 / 进阶 6 / 高级 3

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_package_json_guide.js](39_tooling_and_workflow/01_package_json_guide.js) | package.json 字段详解 —— 一个项目的"身份证 + 说明书 + 依赖清单" | 入门 |
| [02_npm_scripts_and_lifecycle.js](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js) | npm scripts 与生命周期钩子 —— 项目的"命令行入口表" | 入门 |
| [03_semver.js](39_tooling_and_workflow/03_semver.js) | 语义化版本（semver）与版本范围 —— 依赖世界的"契约语言" | 进阶 |
| [04_eslint.js](39_tooling_and_workflow/04_eslint.js) | ESLint —— 在代码跑起来之前，先把问题找出来 | 进阶 |
| [05_prettier.js](39_tooling_and_workflow/05_prettier.js) | Prettier —— 只负责格式，不管逻辑的"代码排版机" | 入门 |
| [06_bundlers_and_transpiling.js](39_tooling_and_workflow/06_bundlers_and_transpiling.js) | 构建打包（bundling）与转译（transpiling） | 高级 |
| [07_lockfile_and_ci.js](39_tooling_and_workflow/07_lockfile_and_ci.js) | 锁文件（lockfile）与持续集成（CI）—— 让"装出来的东西"可复现 | 进阶 |
| [08_code_quality_workflow.js](39_tooling_and_workflow/08_code_quality_workflow.js) | 质量工作流收口 —— 把工具串成一条流水线 | 进阶 |
| [09_publishing_packages.js](39_tooling_and_workflow/09_publishing_packages.js) | 把一个 npm 包真正发布出去 —— 提版本、预览产物、dist-tag 与"不可逆" | 进阶 |
| [10_dual_package_and_exports.js](39_tooling_and_workflow/10_dual_package_and_exports.js) | 双包发布与 exports 条件导出 —— 库作者的第一大痛点 | 高级 |
| [11_monorepo_workspaces.js](39_tooling_and_workflow/11_monorepo_workspaces.js) | monorepo 与 workspaces —— 多包仓库的目录约定、依赖提升与发布策略 | 高级 |
| [12_npmrc_and_registry.js](39_tooling_and_workflow/12_npmrc_and_registry.js) | .npmrc 与 registry 配置 —— 四个层级的优先级、私有源与 CI 认证 | 进阶 |

---

## 40_functional_programming

**函数式编程进阶**

10 个可运行示例 · 难度 进阶 2 / 高级 8

| 文件 | 知识点 | 难度 |
| --- | --- | --- |
| [01_functor.js](40_functional_programming/01_functor.js) | 函子（Functor）—— map 的通用含义与函子定律 | 进阶 |
| [02_maybe.js](40_functional_programming/02_maybe.js) | Maybe 函子 —— 把"值可能不存在"变成容器的一种状态 | 进阶 |
| [03_either.js](40_functional_programming/03_either.js) | Either 函子 —— 把"错误"变成数据，而不是控制流 | 高级 |
| [04_monad.js](40_functional_programming/04_monad.js) | Monad（单子）—— chain/flatMap 与单子三定律 | 高级 |
| [05_point_free_and_pipeline.js](40_functional_programming/05_point_free_and_pipeline.js) | 无参风格（point-free）与数据管道 —— 以及它的缺点 | 高级 |
| [06_adt_and_pattern_matching.js](40_functional_programming/06_adt_and_pattern_matching.js) | 代数数据类型（积类型 / 和类型）与模式匹配的手工模拟 | 高级 |
| [07_transducer.js](40_functional_programming/07_transducer.js) | Transducer（转换器）—— 把 map/filter 组合成一个 reducer | 高级 |
| [08_io_and_effects.js](40_functional_programming/08_io_and_effects.js) | IO 函子与副作用的实用化 —— 把副作用变成"可以被组合的值" | 高级 |
| [09_immutability_and_structural_sharing.js](40_functional_programming/09_immutability_and_structural_sharing.js) | 不可变更新与结构共享 —— FP 在 JavaScript 里真正落地的那一环 | 高级 |
| [10_trampoline_and_recursion.js](40_functional_programming/10_trampoline_and_recursion.js) | FP 风格的递归与蹦床（trampoline）—— 在没有尾调用优化的 JS 里安全地递归 | 高级 |
