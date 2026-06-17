// ============================================================================
// 知识点: TLS/HTTPS 客户端
//
// 说明:
// - crypto/tls 提供 TLS 加密传输
// - http.Client 默认支持 HTTPS, 自动处理 TLS 握手
// - tls.Config 可配置证书验证、SNI、加密套件等
// - InsecureSkipVerify=true 跳过证书验证 (仅测试用)
// - 生产环境应使用系统根证书验证
//
// 编译和运行:
//   go run 16_networking\06_https_client.go
//   (无需启动服务器, 直接请求外部 HTTPS)
// ============================================================================

package main

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	// 默认 HTTPS 客户端 (自动验证证书)
	fmt.Println("=== 默认 HTTPS 客户端 ===")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://httpbin.org/get")
	if err != nil {
		fmt.Println("请求失败:", err)
	} else {
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("  状态码: %d\n", resp.StatusCode)
		fmt.Printf("  TLS 版本: %s\n", tlsVersionName(resp.TLS.Version))
		fmt.Printf("  响应长度: %d 字节\n\n", len(body))
	}

	// 自定义 TLS 配置
	fmt.Println("=== 自定义 TLS 配置 ===")
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}
	customTransport := &http.Transport{TLSClientConfig: tlsConfig}
	customClient := &http.Client{
		Timeout:   10 * time.Second,
		Transport: customTransport,
	}

	resp2, err := customClient.Get("https://www.google.com")
	if err != nil {
		fmt.Println("请求失败:", err)
	} else {
		defer resp2.Body.Close()
		fmt.Printf("  状态码: %d\n", resp2.StatusCode)
		fmt.Printf("  TLS 版本: %s\n", tlsVersionName(resp2.TLS.Version))
	}
}

func tlsVersionName(version uint16) string {
	switch version {
	case tls.VersionTLS10:
		return "TLS 1.0"
	case tls.VersionTLS11:
		return "TLS 1.1"
	case tls.VersionTLS12:
		return "TLS 1.2"
	case tls.VersionTLS13:
		return "TLS 1.3"
	default:
		return fmt.Sprintf("Unknown (0x%04x)", version)
	}
}
