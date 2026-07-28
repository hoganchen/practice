#!/usr/bin/env python3
"""
将 v2rayN 订阅转换为 Karing/Sing-box 完整配置
自动从 DNS 获取最新 ECH 配置，无需手动更新

用法:
  python sub2karing.py --url "订阅链接" > config.json
  python sub2karing.py --url "订阅链接" -o config.json
  python sub2karing.py < sub.txt > config.json
"""

import sys

# Windows 下确保 stdout/stderr 使用 UTF-8，避免中文报编码错误
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import json
import base64
import urllib.request
import urllib.parse
import ssl
import re
import os
import argparse


# ============ 从 DNS 获取最新 ECH 配置 ============
def fetch_ech_config(doh_url="https://dns.alidns.com/resolve"):
    """从 DNS HTTPS 记录获取 cloudflare-ech.com 的最新 ECH ConfigList"""
    url = f"{doh_url}?name=cloudflare-ech.com&type=HTTPS"
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for ans in data.get("Answer", []):
            d = ans.get("data", "")
            m = re.search(r'ech="([^"]+)"', d)
            if m:
                b64 = m.group(1)
                print(f"[INFO] 获取到最新 ECH 配置 ({len(b64)} 字符)", file=sys.stderr)
                return b64
        raise ValueError("DNS 响应中未找到 ECH 配置")
    except Exception as e:
        print(f"[WARN] 从 DNS 获取 ECH 配置失败: {e}", file=sys.stderr)
        print(f"[WARN] 将使用内置的 ECH 配置（可能已过期）", file=sys.stderr)
        return None


# 内置 ECH 配置（当 DNS 获取失败时的备选）
FALLBACK_ECH_BASE64 = "AEX+DQBBBwAgACB4VjWbcSdUsPDzfef/HeWYmo+8VymYAR/7icFB6GtlDwAEAAEAAQASY2xvdWRmbGFyZS1lY2guY29tAAA="


# ============ 订阅获取 ============
def fetch_subscription(url):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.0"})
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        print(f"[ERROR] 获取订阅失败: {e}", file=sys.stderr)
        sys.exit(1)


# ============ 解码订阅 ============
def decode_subscription(raw):
    trimmed = raw.strip()
    # 尝试整体 base64 解码
    try:
        decoded = base64.b64decode(trimmed).decode("utf-8")
        if any(decoded.startswith(p) for p in ("vless://", "vmess://", "ss://",
                                                "trojan://", "hysteria2://", "hy2://")):
            return [l.strip() for l in decoded.split("\n") if l.strip()]
    except Exception:
        pass
    # 逐行 base64 解码
    lines = trimmed.split("\n")
    result = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            decoded = base64.b64decode(line).decode("utf-8")
            if any(decoded.startswith(p) for p in ("vless://", "vmess://", "ss://",
                                                    "trojan://", "hysteria2://", "hy2://")):
                result.append(decoded)
                continue
        except Exception:
            pass
        if any(line.startswith(p) for p in ("vless://", "vmess://", "ss://",
                                             "trojan://", "hysteria2://", "hy2://")):
            result.append(line)
    if result:
        return result
    # 纯文本 URI
    if any(trimmed.startswith(p) for p in ("vless://", "vmess://", "ss://",
                                            "trojan://", "hysteria2://", "hy2://")):
        return [l.strip() for l in trimmed.split("\n") if l.strip()]
    raise ValueError("无法解析订阅格式")


# ============ 解析 vless:// URI ============
def parse_vless_uri(uri, ech_b64):
    match = re.match(r"^vless://([^@]+)@([^:]+):(\d+)(.*)", uri)
    if not match:
        return None
    uuid = match.group(1)
    host = match.group(2)
    port = int(match.group(3))
    query_string = match.group(4)
    params = {}
    remarks = ""
    if "#" in query_string:
        qs, frag = query_string.rsplit("#", 1)
        remarks = urllib.parse.unquote(frag)
    else:
        qs = query_string
    if qs and qs.startswith("?"):
        qs = qs[1:]
        for pair in qs.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                params[k] = urllib.parse.unquote(v)
    outbound = {
        "type": "vless",
        "tag": remarks.strip() or uuid[:8],
        "server": host,
        "server_port": port,
        "uuid": uuid,
    }
    if params.get("flow"):
        outbound["flow"] = params["flow"]
    security = params.get("security", "none")
    if security != "none":
        tls = {"enabled": True}
        sni = params.get("sni") or params.get("host") or host
        tls["server_name"] = sni
        # uTLS 指纹
        fp = params.get("fp")
        if fp:
            tls["utls"] = {"enabled": True, "fingerprint": fp}
        # ECH — 每次运行时都用最新获取的配置
        if params.get("ech") and ech_b64:
            tls["ech"] = {
                "enabled": True,
                "config": [
                    "-----BEGIN ECH CONFIGS-----",
                    ech_b64,
                    "-----END ECH CONFIGS-----",
                ],
            }
        outbound["tls"] = tls
    network = params.get("type", "tcp")
    if network == "ws":
        transport = {"type": "ws", "path": params.get("path", "/")}
        ws_host = params.get("host")
        transport["headers"] = {"Host": ws_host or host}
        outbound["transport"] = transport
    elif network == "tcp" and params.get("headerType") == "http":
        outbound["transport"] = {"type": "http"}
    elif network == "grpc":
        outbound["transport"] = {
            "type": "grpc",
            "service_name": params.get("serviceName", ""),
        }
    return outbound


# ============ 解析 vmess:// URI ============
def parse_vmess_uri(uri):
    b64 = uri.replace("vmess://", "")
    try:
        data = json.loads(base64.b64decode(b64).decode("utf-8"))
    except Exception:
        return None
    outbound = {
        "type": "vmess",
        "tag": data.get("ps") or data.get("add", "vmess"),
        "server": data.get("add") or data.get("host", ""),
        "server_port": int(data.get("port", 443)),
        "uuid": data.get("id", ""),
        "security": data.get("scy", "auto"),
    }
    if data.get("tls") == "tls":
        outbound["tls"] = {
            "enabled": True,
            "server_name": data.get("sni") or data.get("host", ""),
        }
    network = data.get("net", "tcp")
    if network == "ws":
        transport = {"type": "ws", "path": data.get("path", "/")}
        if data.get("host"):
            transport["headers"] = {"Host": data["host"]}
        outbound["transport"] = transport
    return outbound


# ============ 解析 hysteria2:// URI ============
def parse_hysteria2_uri(uri):
    match = re.match(r"^h(?:ysteria)?2://([^@]+)@([^:]+):(\d+)(.*)", uri)
    if not match:
        return None
    auth = match.group(1)
    host = match.group(2)
    port = int(match.group(3))
    query_string = match.group(4)
    params = {}
    remarks = ""
    if "#" in query_string:
        qs, frag = query_string.rsplit("#", 1)
        remarks = urllib.parse.unquote(frag)
    else:
        qs = query_string
    if qs and qs.startswith("?"):
        qs = qs[1:]
        for pair in qs.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                params[k] = urllib.parse.unquote(v)
    outbound = {
        "type": "hysteria2",
        "tag": remarks.strip() or auth[:8],
        "server": host,
        "server_port": port,
        "password": auth,
        "tls": {"enabled": True},
    }
    sni = params.get("sni") or params.get("peer")
    if sni:
        outbound["tls"]["server_name"] = sni
    if params.get("insecure", "0") in ("1", "true") or params.get("allowInsecure", "0") in ("1", "true"):
        outbound["tls"]["insecure"] = True
    return outbound


# ============ 解析 trojan:// URI ============
def parse_trojan_uri(uri):
    match = re.match(r"^trojan://([^@]+)@([^:]+):(\d+)(.*)", uri)
    if not match:
        return None
    password = match.group(1)
    host = match.group(2)
    port = int(match.group(3))
    query_string = match.group(4)
    params = {}
    remarks = ""
    if "#" in query_string:
        qs, frag = query_string.rsplit("#", 1)
        remarks = urllib.parse.unquote(frag)
    else:
        qs = query_string
    if qs and qs.startswith("?"):
        qs = qs[1:]
        for pair in qs.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                params[k] = urllib.parse.unquote(v)
    outbound = {
        "type": "trojan",
        "tag": remarks.strip() or password[:8],
        "server": host,
        "server_port": port,
        "password": password,
        "tls": {"enabled": True, "server_name": params.get("sni", host)},
    }
    if params.get("allowInsecure", "0") in ("1", "true") or params.get("insecure", "0") in ("1", "true"):
        outbound["tls"]["insecure"] = True
    return outbound


# ============ 解析 ss:// URI ============
def parse_ss_uri(uri):
    match = re.match(r"^ss://([^@]+)@([^:]+):(\d+)(.*)", uri)
    if not match:
        return None
    b64_part = match.group(1)
    host = match.group(2)
    port = int(match.group(3))
    rest = match.group(4)
    remarks = ""
    if "#" in rest:
        remarks = urllib.parse.unquote(rest.rsplit("#", 1)[1])
    method = "aes-256-gcm"
    password = b64_part
    try:
        decoded = base64.b64decode(b64_part).decode("utf-8")
        if ":" in decoded:
            method, password = decoded.split(":", 1)
    except Exception:
        pass
    return {
        "type": "shadowsocks",
        "tag": remarks.strip() or host,
        "server": host,
        "server_port": port,
        "method": method,
        "password": password,
    }


# ============ 解析 anytls:// URI ============
def parse_anytls_uri(uri):
    match = re.match(r"^anytls://([^@]+)@([^:]+):(\d+)(.*)", uri)
    if not match:
        return None
    password = match.group(1)
    host = match.group(2)
    port = int(match.group(3))
    query_string = match.group(4)
    params = {}
    remarks = ""
    if "#" in query_string:
        qs, frag = query_string.rsplit("#", 1)
        remarks = urllib.parse.unquote(frag)
    else:
        qs = query_string
    if qs and qs.startswith("?"):
        qs = qs[1:]
        for pair in qs.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                params[k] = urllib.parse.unquote(v)
    outbound = {
        "type": "anytls",
        "tag": remarks.strip() or password[:8],
        "server": host,
        "server_port": port,
        "password": password,
    }
    security = params.get("security")
    if security == "tls":
        tls = {"enabled": True, "server_name": params.get("sni", host)}
        fp = params.get("fp")
        if fp:
            tls["utls"] = {"enabled": True, "fingerprint": fp}
        # REALITY
        if params.get("pbk"):
            tls["reality"] = {
                "enabled": True,
                "public_key": params["pbk"],
                "short_id": params.get("sid", ""),
            }
        outbound["tls"] = tls
    return outbound


# ============ 解析 socks:// URI ============
def parse_socks_uri(uri):
    # socks://user:pass@host:port#remarks
    # 或 socks://user@host:port#remarks
    # userinfo 可能为 base64 编码
    scheme = "socks://"
    rest = uri[len(scheme):]
    userinfo = ""
    host = ""
    port = 0
    remarks = ""

    if "#" in rest:
        rest, frag = rest.rsplit("#", 1)
        remarks = urllib.parse.unquote(frag)

    if "@" in rest:
        userinfo, rest = rest.split("@", 1)

    if ":" in rest:
        host_part, port_str = rest.rsplit(":", 1)
        host = host_part
        try:
            port = int(port_str)
        except ValueError:
            port = 1080
    else:
        host = rest
        port = 1080

    username = ""
    password = ""
    if ":" in userinfo:
        username, password = userinfo.split(":", 1)
    elif userinfo:
        username = userinfo
        # 尝试 base64 解码用户名
        try:
            decoded = base64.b64decode(username).decode("utf-8")
            if ":" in decoded:
                username, password = decoded.split(":", 1)
        except Exception:
            pass

    outbound = {
        "type": "socks",
        "tag": remarks.strip() or host,
        "server": host,
        "server_port": port,
    }
    if username:
        outbound["username"] = username
    if password:
        outbound["password"] = password
    return outbound


# ============ URI 路由 ============
def parse_uri(uri, ech_b64):
    scheme = urllib.parse.urlparse(uri).scheme
    if scheme == "vless":
        return parse_vless_uri(uri, ech_b64)
    elif scheme in ("hysteria2", "hy2"):
        return parse_hysteria2_uri(uri)
    elif scheme == "trojan":
        return parse_trojan_uri(uri)
    elif scheme == "ss":
        return parse_ss_uri(uri)
    elif scheme == "vmess":
        return parse_vmess_uri(uri)
    elif scheme == "anytls":
        return parse_anytls_uri(uri)
    elif scheme == "socks":
        return parse_socks_uri(uri)
    return None


# ============ 生成完整配置 ============
def build_config(outbounds):
    tags = [ob["tag"] for ob in outbounds]
    return {
        "log": {"level": "warn"},
        "dns": {
            "servers": [
                {"tag": "dns-remote", "address": "https://1.1.1.1/dns-query", "strategy": "prefer_ipv4"},
                {"tag": "dns-direct", "address": "223.5.5.5", "strategy": "prefer_ipv4", "detour": "direct"},
            ],
            "rules": [
                {"rule_set": "geosite-cn", "server": "dns-direct"},
                {"rule_set": "geosite-geolocation-!cn", "server": "dns-remote"},
            ],
            "strategy": "prefer_ipv4",
        },
        "inbounds": [
            {"type": "mixed", "tag": "mixed-in", "listen": "127.0.0.1", "listen_port": 10808},
        ],
        "outbounds": [
            *outbounds,
            {"type": "direct", "tag": "direct"},
            {"type": "block", "tag": "block"},
            {"type": "selector", "tag": "select", "outbounds": tags, "default": tags[0] if tags else "direct"},
            {"type": "urltest", "tag": "auto", "outbounds": tags},
        ],
        "route": {
            "rules": [
                {"rule_set": "geosite-cn", "outbound": "direct"},
                {"rule_set": "geosite-geolocation-!cn", "outbound": "select"},
                {"ip_is_private": True, "outbound": "direct"},
            ],
            "rule_set": [
                {
                    "tag": "geosite-cn",
                    "type": "remote", "format": "binary",
                    "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs",
                    "download_detour": "direct",
                },
                {
                    "tag": "geosite-geolocation-!cn",
                    "type": "remote", "format": "binary",
                    "url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs",
                },
            ],
            "final": "select",
            "auto_detect_interface": True,
        },
        "_summary": {
            "total_nodes": len(outbounds),
            "ech_nodes": len([o for o in outbounds if o.get("tls", {}).get("ech", {}).get("enabled", False)]),
            "hysteria2_nodes": len([o for o in outbounds if o["type"] == "hysteria2"]),
        },
    }


# ============ 主流程 ============
def main():
    p = argparse.ArgumentParser(description="将 v2rayN 订阅转换为 Karing/Sing-box 配置")
    p.add_argument("--url", help="订阅链接")
    p.add_argument("-o", "--output", help="输出文件路径（默认输出到 stdout）")
    p.add_argument("--doh", default="https://dns.alidns.com/resolve",
                   help="用于查询 ECH 配置的 DNS-over-HTTPS 地址")
    args = p.parse_args()

    # 每次运行都从 DNS 获取最新 ECH 配置
    ech_b64 = fetch_ech_config(args.doh)
    if not ech_b64:
        ech_b64 = FALLBACK_ECH_BASE64

    # 获取订阅数据
    if args.url:
        print(f"[INFO] 正在获取订阅: {args.url}", file=sys.stderr)
        raw = fetch_subscription(args.url)
    else:
        raw = sys.stdin.read()

    if not raw or not raw.strip():
        print("[ERROR] 订阅为空", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] 原始数据 {len(raw)} 字节", file=sys.stderr)
    lines = decode_subscription(raw)
    print(f"[INFO] 解析到 {len(lines)} 条节点", file=sys.stderr)

    outbounds = []
    failed = 0
    for line in lines:
        try:
            ob = parse_uri(line, ech_b64)
            if ob:
                outbounds.append(ob)
            else:
                print(f"[WARN] 跳过无法解析的节点: {line[:60]}...", file=sys.stderr)
                failed += 1
        except Exception as e:
            print(f"[WARN] 解析失败: {line[:60]}... {e}", file=sys.stderr)
            failed += 1

    print(f"[INFO] 成功转换 {len(outbounds)} 个节点", file=sys.stderr)
    if failed:
        print(f"[WARN] 跳过 {failed} 个无法解析的节点", file=sys.stderr)

    types = {}
    for ob in outbounds:
        t = ob["type"]
        types[t] = types.get(t, 0) + 1
    print(f"[INFO] 节点类型: {types}", file=sys.stderr)

    config = build_config(outbounds)
    json_bytes = json.dumps(config, ensure_ascii=False, indent=2).encode("utf-8")

    if args.output:
        with open(args.output, "wb") as f:
            f.write(json_bytes)
        print(f"[INFO] 已写入 {args.output}", file=sys.stderr)
    else:
        sys.stdout.buffer.write(json_bytes)
        sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()
