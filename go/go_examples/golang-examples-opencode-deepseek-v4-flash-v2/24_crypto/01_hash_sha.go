// ============================================================================
// 知识点: 密码学哈希 (crypto/sha256)
//
// 说明:
// - crypto/sha256 提供 SHA-256 哈希计算
// - crypto/sha512 提供 SHA-512 哈希
// - crypto/md5 提供 MD5 哈希 (注意: MD5 不安全, 仅用于非安全场景)
// - hash.Hash 接口是通用的哈希接口
// - 使用 io.WriteString 或 hash.Write 写入数据
// - Sum(nil) 返回哈希结果
//
// 编译和运行:
//   go run 24_crypto\01_hash_sha.go
// ============================================================================

package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
)

func main() {
	data := "Hello, Go 密码学!"

	// SHA-256 哈希
	h := sha256.New()
	io.WriteString(h, data)
	hash1 := h.Sum(nil)
	fmt.Printf("SHA-256: %x\n", hash1)
	fmt.Printf("长度: %d 字节\n", len(hash1))

	// 直接计算
	hash2 := sha256.Sum256([]byte(data))
	fmt.Printf("SHA-256 (Sum256): %x\n", hash2)
	fmt.Printf("十六进制字符串: %s\n", hex.EncodeToString(hash2[:]))

	// 重复数据的一致性
	hash3 := sha256.Sum256([]byte(data))
	fmt.Printf("相同数据哈希相同: %t\n", hash2 == hash3)

	// HMAC-SHA256 (用于消息认证)
	key := []byte("secret-key")
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(data))
	signature := mac.Sum(nil)
	fmt.Printf("HMAC-SHA256: %x\n", signature)

	// 验证 HMAC
	expectedMAC := signature
	valid := hmac.Equal([]byte(signature), expectedMAC)
	fmt.Println("HMAC 验证:", valid)
}
