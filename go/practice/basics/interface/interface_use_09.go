/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Describer interface {
    Describe()
}
type Person struct {
    name string
    age  int
}

func (p Person) Describe() {
    fmt.Printf("%s is %d years old\n", p.name, p.age)
}

func findType(i interface{}) {
    switch v := i.(type) {
    case Describer:
        v.Describe()
    default:
        fmt.Printf("unknown type\n")
    }
}

/*
还可以将类型与接口进行比较。如果我们有一个类型并且该类型实现了一个接口，那么可以将它与它实现的接口进行比较。
https://studygolang.com/articles/12560
*/
func main() {
	start := time.Now()
	fmt.Printf("Start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	findType("Naveen")
    p := Person{
        name: "Naveen R",
        age:  25,
    }
    findType(p)

	elapsed := time.Since(start)
	fmt.Printf("\nTotal elapsed time: %s\n", elapsed)
}
