/**
 * 辅助模块：一个真正的 CommonJS 模块（.cjs 后缀强制按 CommonJS 解析）
 * ----------------------------------------------------------------------------
 * 以 _ 开头的文件被 scripts/run-all.js 视为辅助模块，不会被单独运行。
 * 它供 08_browser_modules.js 用 createRequire 加载，用来对比两种模块系统。
 *
 * 注意：本仓库的 package.json 写了 "type": "module"，
 *       所以普通的 .js 文件会被当成 ES 模块；想让文件按 CommonJS 解析，
 *       要么用 .cjs 后缀，要么在子目录里放一个 "type": "commonjs" 的 package.json。
 */

// CommonJS 的导出方式是给 module.exports 赋值（或往 exports 上加属性）。
// 与 ES 模块的 export 不同，它没有"具名导出/默认导出"的区分。
module.exports = {
  name: 'cjs-like-module',
  kind: 'CommonJS',
  describe() {
    return '我是用 module.exports 导出的 CommonJS 模块';
  },
  // CommonJS 里可以拿到当前文件的路径
  filename: __filename,
};
