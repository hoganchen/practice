package main

import (
	"fmt"
	"math"
)

func Sqrt_1(x float64) (float64, error) {
	if x >= 0 {
		return math.Sqrt(x), nil
	} else {
		return 0, ErrNegativeSqrt(x)
	}

	// return 0, nil
}

func Sqrt_2(x float64) (string) {
	if x >= 0 {
		return fmt.Sprintf("%v", math.Sqrt(x))
	} else {
		return fmt.Sprintf("%v", ErrNegativeSqrt(x))
	}

	// return 0, nil
}

const compare_value = 0.0001

func Sqrt_3(x float64) (float64, error) {
	z := 1.0
	// fmt.Printf("z type: %T\n", z)

	if x >= 0 {
		for {
			// fmt.Printf("z = %v\n", z)
			if math.Abs(x - z * z) < compare_value {
				break
			} else {
				z -= (z * z - x) / (2*z)
			}
		}

		return z, nil
	} else {
		return 0, ErrNegativeSqrt(x)
	}

	// return z
}

type ErrNegativeSqrt float64

/*
runtime: goroutine stack exceeds 1000000000-byte limit
fatal error: stack overflow

runtime stack:
runtime.throw(0x568560)
	/usr/lib/go/src/pkg/runtime/panic.c:464 +0x69
runtime.newstack()
	/usr/lib/go/src/pkg/runtime/stack.c:295 +0x3bc
runtime.morestack()
	/usr/lib/go/src/pkg/runtime/asm_amd64.s:225 +0x61
*/
func (e ErrNegativeSqrt) Error() string {
	return fmt.Sprintf("cannot Sqrt negative number: %v", float64(e))
	// return fmt.Sprintf("cannot Sqrt negative number: %v", e)
}

/*

练习：错误

从之前的练习(https://tour.go-zh.org/flowcontrol/8)中复制 Sqrt 函数，修改它使其返回 error 值。

Sqrt 接受到一个负数时，应当返回一个非 nil 的错误值。复数同样也不被支持。

创建一个新的类型

type ErrNegativeSqrt float64

并为其实现

func (e ErrNegativeSqrt) Error() string

方法使其拥有 error 值，通过 ErrNegativeSqrt(-2).Error() 调用该方法应返回 "cannot Sqrt negative number: -2"。

注意: 在 Error 方法内调用 fmt.Sprint(e) 会让程序陷入死循环。可以通过先转换 e 来避免这个问题：fmt.Sprint(float64(e))。这是为什么呢？

修改 Sqrt 函数，使其接受一个负数时，返回 ErrNegativeSqrt 值。

*/
func main() {
	fmt.Println(Sqrt_1(2))
	fmt.Println(Sqrt_1(-2))

	fmt.Println(Sqrt_2(2))
	fmt.Println(Sqrt_2(-2))

	if value, err := Sqrt_3(-2); err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(value)
	}

	if value, err := Sqrt_3(2); err != nil {
		fmt.Println(err)
	} else {
		fmt.Println(value)
	}
}
