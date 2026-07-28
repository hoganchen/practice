#!/usr/bin/env node
/**
 * 将 v2rayN 订阅转换为 Karing/Sing-box 完整配置
 * 自动从 DNS 获取最新 ECH 配置，无需手动更新
 *
 * 用法:
 *   node sub2karing.mjs --url "订阅链接" > config.json
 *   node sub2karing.mjs --url "订阅链接" -o config.json
 *   node sub2karing.mjs < sub.txt > config.json
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';

// ============ 从 DNS 获取最新 ECH 配置 ============
const FALLBACK_ECH_B64 = 'AEX+DQBBBwAgACB4VjWbcSdUsPDzfef/HeWYmo+8VymYAR/7icFB6GtlDwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA=';

function fetchECHConfig(dohUrl = 'https://dns.alidns.com/resolve') {
  return new Promise((resolve) => {
    const url = `${dohUrl}?name=cloudflare-ech.com&type=HTTPS`;
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          for (const ans of json.Answer || []) {
            const match = ans.data?.match(/ech="([^"]+)"/);
            if (match) {
              console.error(`[INFO] 获取到最新 ECH 配置 (${match[1].length} 字符)`);
              resolve(match[1]);
              return;
            }
          }
        } catch {}
        console.error('[WARN] DNS 响应中未找到 ECH 配置，使用内置备选');
        resolve(FALLBACK_ECH_B64);
      });
    });
    req.on('error', () => {
      console.error('[WARN] 获取 ECH 配置失败，使用内置备选');
      resolve(FALLBACK_ECH_B64);
    });
    req.on('timeout', () => { req.destroy(); resolve(FALLBACK_ECH_B64); });
  });
}

// ============ 订阅获取 ============
function fetchSubscription(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchSubscription(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ============ 解码订阅 ============
function decodeSubscription(raw) {
  const trimmed = raw.trim();
  const schemes = ['vless://', 'vmess://', 'ss://', 'trojan://', 'hysteria2://', 'hy2://'];
  const hasScheme = (s) => schemes.some(p => s.includes(p));

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
    if (hasScheme(decoded)) {
      return decoded.split('\n').filter(l => l.trim());
    }
  } catch {}

  if (hasScheme(trimmed)) {
    return trimmed.split('\n').filter(l => l.trim());
  }

  // Try line-by-line base64
  const lines = trimmed.split('\n').filter(l => l.trim());
  const result = [];
  for (const line of lines) {
    try {
      const decoded = Buffer.from(line, 'base64').toString('utf-8');
      if (hasScheme(decoded)) { result.push(decoded); continue; }
    } catch {}
    if (hasScheme(line)) result.push(line);
  }
  if (result.length) return result;

  throw new Error('无法解析订阅格式');
}

// ============ 解析 vless:// URI ============
function parseVlessURI(uri, echB64) {
  const u = new URL(uri);
  const uuid = u.username;
  const host = u.hostname;
  const port = parseInt(u.port) || 443;
  const params = Object.fromEntries(u.searchParams.entries());
  const remarks = decodeURIComponent(u.hash.replace('#', ''));

  const outbound = {
    type: 'vless',
    tag: remarks || uuid.substring(0, 8),
    server: host,
    server_port: port,
    uuid: uuid || params.id,
  };

  if (params.flow) outbound.flow = params.flow;

  const security = params.security || 'none';
  if (security !== 'none') {
    outbound.tls = { enabled: true, server_name: params.sni || params.host || host };
    if (params.fp) {
      outbound.tls.utls = { enabled: true, fingerprint: params.fp };
    }
    if (params.ech && echB64) {
      outbound.tls.ech = {
        enabled: true,
        config: ['-----BEGIN ECH CONFIGS-----', echB64, '-----END ECH CONFIGS-----'],
      };
    }
  }

  const network = params.type || 'tcp';
  if (network === 'ws') {
    outbound.transport = { type: 'ws', path: params.path || '/' };
    if (params.host) outbound.transport.headers = { Host: params.host };
  } else if (network === 'tcp' && params.headerType === 'http') {
    outbound.transport = { type: 'http' };
  } else if (network === 'grpc') {
    outbound.transport = { type: 'grpc', service_name: params.serviceName || '' };
  }

  return outbound;
}

// ============ 解析 hysteria2:// URI ============
function parseHysteria2URI(uri) {
  const u = new URL(uri);
  const auth = u.username;
  const host = u.hostname;
  const port = parseInt(u.port) || 443;
  const params = Object.fromEntries(u.searchParams.entries());
  const remarks = decodeURIComponent(u.hash.replace('#', ''));

  const outbound = {
    type: 'hysteria2',
    tag: remarks || auth.substring(0, 8),
    server: host,
    server_port: port,
    password: auth || params.auth,
    tls: { enabled: true },
  };

  const sni = params.sni || params.peer;
  if (sni) outbound.tls.server_name = sni;
  if (params.insecure === '1' || params.allowInsecure === '1') outbound.tls.insecure = true;

  return outbound;
}

// ============ 解析 trojan:// URI ============
function parseTrojanURI(uri) {
  const u = new URL(uri);
  const password = u.username;
  const host = u.hostname;
  const port = parseInt(u.port) || 443;
  const params = Object.fromEntries(u.searchParams.entries());
  const remarks = decodeURIComponent(u.hash.replace('#', ''));

  const outbound = {
    type: 'trojan',
    tag: remarks || password.substring(0, 8),
    server: host,
    server_port: port,
    password,
    tls: { enabled: true, server_name: params.sni || host },
  };

  if (params.allowInsecure === '1' || params.insecure === '1') outbound.tls.insecure = true;
  return outbound;
}

// ============ 解析 ss:// URI ============
function parseShadowsocksURI(uri) {
  const u = new URL(uri);
  const b64 = u.username;
  let method = 'aes-256-gcm', password = b64;
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    if (decoded.includes(':')) [method, password] = decoded.split(':');
  } catch {}
  const remarks = decodeURIComponent(u.hash.replace('#', ''));
  return {
    type: 'shadowsocks',
    tag: remarks || u.hostname,
    server: u.hostname,
    server_port: parseInt(u.port) || 443,
    method,
    password,
  };
}

// ============ 解析 vmess:// URI ============
function parseVMessURI(uri) {
  try {
    const json = JSON.parse(Buffer.from(uri.replace('vmess://', ''), 'base64').toString('utf-8'));
    const outbound = {
      type: 'vmess',
      tag: json.ps || json.add || 'vmess',
      server: json.add || json.host,
      server_port: parseInt(json.port) || 443,
      uuid: json.id,
      security: json.scy || 'auto',
    };
    if (json.tls === 'tls') {
      outbound.tls = { enabled: true, server_name: json.sni || json.host };
    }
    if (json.net === 'ws') {
      outbound.transport = { type: 'ws', path: json.path || '/' };
      if (json.host) outbound.transport.headers = { Host: json.host };
    }
    return outbound;
  } catch { return null; }
}

// ============ 解析 anytls:// URI ============
function parseAnyTLSURI(uri) {
  const u = new URL(uri);
  const password = u.username;
  const host = u.hostname;
  const port = parseInt(u.port) || 443;
  const params = Object.fromEntries(u.searchParams.entries());
  const remarks = decodeURIComponent(u.hash.replace('#', ''));

  const outbound = {
    type: 'anytls',
    tag: remarks || password.substring(0, 8),
    server: host,
    server_port: port,
    password,
  };

  if (params.security === 'tls') {
    outbound.tls = { enabled: true, server_name: params.sni || host };
    if (params.fp) outbound.tls.utls = { enabled: true, fingerprint: params.fp };
    if (params.pbk) {
      outbound.tls.reality = { enabled: true, public_key: params.pbk, short_id: params.sid || '' };
    }
  }
  return outbound;
}

// ============ 解析 socks:// URI ============
function parseSocksURI(uri) {
  const u = new URL(uri);
  const host = u.hostname;
  const port = parseInt(u.port) || 1080;
  const remarks = decodeURIComponent(u.hash.replace('#', ''));
  let username = u.username;
  let password = u.password;

  // 尝试 base64 解码用户名字段
  if (username && !password) {
    try {
      const decoded = Buffer.from(username, 'base64').toString('utf-8');
      if (decoded.includes(':')) [username, password] = decoded.split(':');
    } catch {}
  }

  const outbound = {
    type: 'socks',
    tag: remarks || host,
    server: host,
    server_port: port,
  };
  if (username) outbound.username = username;
  if (password) outbound.password = password;
  return outbound;
}

// ============ URI 路由 ============
function parseURI(uri, echB64) {
  if (uri.startsWith('vless://')) return parseVlessURI(uri, echB64);
  if (uri.startsWith('hysteria2://') || uri.startsWith('hy2://')) return parseHysteria2URI(uri);
  if (uri.startsWith('trojan://')) return parseTrojanURI(uri);
  if (uri.startsWith('ss://')) return parseShadowsocksURI(uri);
  if (uri.startsWith('vmess://')) return parseVMessURI(uri);
  if (uri.startsWith('anytls://')) return parseAnyTLSURI(uri);
  if (uri.startsWith('socks://')) return parseSocksURI(uri);
  return null;
}

// ============ 生成完整配置 ============
function buildConfig(outbounds) {
  const tags = outbounds.map(o => o.tag);
  const echCount = outbounds.filter(o => o.tls?.ech?.enabled).length;
  const h2Count = outbounds.filter(o => o.type === 'hysteria2').length;

  return {
    log: { level: 'warn' },
    dns: {
      servers: [
        { tag: 'dns-remote', address: 'https://1.1.1.1/dns-query', strategy: 'prefer_ipv4' },
        { tag: 'dns-direct', address: '223.5.5.5', strategy: 'prefer_ipv4', detour: 'direct' },
      ],
      rules: [
        { rule_set: 'geosite-cn', server: 'dns-direct' },
        { rule_set: 'geosite-geolocation-!cn', server: 'dns-remote' },
      ],
      strategy: 'prefer_ipv4',
    },
    inbounds: [{ type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: 10808 }],
    outbounds: [
      ...outbounds,
      { type: 'direct', tag: 'direct' },
      { type: 'block', tag: 'block' },
      { type: 'selector', tag: 'select', outbounds: tags, default: tags[0] || 'direct' },
      { type: 'urltest', tag: 'auto', outbounds: tags },
    ],
    route: {
      rules: [
        { rule_set: 'geosite-cn', outbound: 'direct' },
        { rule_set: 'geosite-geolocation-!cn', outbound: 'select' },
        { ip_is_private: true, outbound: 'direct' },
      ],
      rule_set: [
        { tag: 'geosite-cn', type: 'remote', format: 'binary',
          url: 'https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs',
          download_detour: 'direct' },
        { tag: 'geosite-geolocation-!cn', type: 'remote', format: 'binary',
          url: 'https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs' },
      ],
      final: 'select',
      auto_detect_interface: true,
    },
    _summary: { total_nodes: outbounds.length, ech_nodes: echCount, hysteria2_nodes: h2Count },
  };
}

// ============ 主流程 ============
async function main() {
  const args = process.argv.slice(2);
  let url, outputFile;

  let dohUrl = 'https://dns.alidns.com/resolve';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') url = args[++i];
    else if (args[i] === '-o') outputFile = args[++i];
    else if (args[i] === '--doh') dohUrl = args[++i];
  }

  // 每次运行都从 DNS 获取最新 ECH 配置
  const echB64 = await fetchECHConfig(dohUrl);

  // 获取订阅数据
  let raw;
  if (url) {
    console.error(`[INFO] 正在获取订阅: ${url}`);
    raw = await fetchSubscription(url);
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    raw = Buffer.concat(chunks).toString('utf-8');
  }

  if (!raw || !raw.trim()) {
    console.error('[ERROR] 订阅为空');
    process.exit(1);
  }

  console.error(`[INFO] 原始数据 ${raw.length} 字节`);
  const lines = decodeSubscription(raw);
  console.error(`[INFO] 解析到 ${lines.length} 条节点`);

  const outbounds = [];
  let failed = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const ob = parseURI(trimmed, echB64);
      if (ob) outbounds.push(ob);
      else { console.error(`[WARN] 跳过: ${trimmed.substring(0, 60)}...`); failed++; }
    } catch (e) {
      console.error(`[WARN] 解析失败: ${trimmed.substring(0, 60)}... ${e.message}`);
      failed++;
    }
  }

  console.error(`[INFO] 成功转换 ${outbounds.length} 个节点`);
  if (failed) console.error(`[WARN] 跳过 ${failed} 个`);

  const types = {};
  for (const ob of outbounds) types[ob.type] = (types[ob.type] || 0) + 1;
  console.error(`[INFO] 节点类型: ${JSON.stringify(types)}`);

  const config = buildConfig(outbounds);
  const jsonStr = JSON.stringify(config, null, 2);

  if (outputFile) {
    fs.writeFileSync(outputFile, jsonStr, 'utf-8');
    console.error(`[INFO] 已写入 ${outputFile}`);
  } else {
    process.stdout.write(jsonStr);
  }
}

main().catch(e => {
  console.error(`[ERROR] ${e.message}`);
  process.exit(1);
});
