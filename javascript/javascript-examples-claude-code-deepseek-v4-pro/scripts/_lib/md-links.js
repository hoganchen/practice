/**
 * Markdown 链接提取（辅助模块，被 check-docs.js 与 check-counts.js 共用）
 * ----------------------------------------------------------------------------
 * 抽出来的原因很实际：check-docs.js 要**校验**链接是否有效，check-counts.js 要
 * **统计**文档里声明了多少个链接，两边必须用同一套解析规则。各写一份的话，
 * 一旦规则微调就会出现「check:docs 说 3497、check:counts 说 3501」这种自相矛盾。
 *
 * 按仓库约定，_ 开头的文件 / _lib 目录是辅助模块，批量校验脚本会跳过它们
 * （它们不是独立示例，被主文件导入使用）。
 */

/**
 * 提取文档里的所有 Markdown 链接。
 * 返回 [{ text, target, line }]，line 为 1 起始的行号（用于报错定位）。
 */
export function collectLinks(md) {
  const links = [];
  const lines = md.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // 关键：先剥掉行内代码（反引号包裹的部分）。
    // 技术文档里大量出现 JS 语法，例如 `obj[Symbol.toPrimitive](hint)`、
    // `func[0](x)`，它们长得和 Markdown 链接一模一样，会被误判成链接
    // （曾因此在术语表里误报 6 处「文件 hint 不存在」）。
    line = line.replace(/`[^`]*`/g, '');

    for (const m of line.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      links.push({ text: m[1], target: m[2], line: i + 1 });
    }
  }
  return links;
}
