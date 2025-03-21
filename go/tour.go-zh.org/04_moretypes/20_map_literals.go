package main

import "fmt"

type Vertex struct {
	Lat, Long float64
}

// 类似于python的字典
var m = map[string]Vertex{
	"Bell Labs": Vertex{
		40.68433, -74.39967,
	},
	"Google": Vertex{
		37.42202, -122.08408,
	},
}

/*

映射的文法

映射的文法与结构体相似，不过必须有键名。

*/
func main() {
	fmt.Println(m)
}
