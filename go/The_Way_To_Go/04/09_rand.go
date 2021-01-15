/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
	"math/big"
	"math/rand"
	crand "crypto/rand"
)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// 伪随机数，随机种子为1
	fmt.Printf("rand.Int() = %v\n", rand.Int())

	// 伪随机数，随机种子为当前时间
	fmt.Printf("\n#################### 伪随机数，随机种子为当前时间 ####################\n")
	for i := 0; i < 10; i++ {
		rand.Seed(int64(time.Now().Unix()))
		fmt.Println(rand.Intn(100))
	}

	// 真随机数
	fmt.Printf("\n#################### 真随机数，crypto/rand包 ####################\n")
	for i := 0; i < 10; i++ {
		result, _ := crand.Int(crand.Reader, big.NewInt(100))
		fmt.Println(result)
	}

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
