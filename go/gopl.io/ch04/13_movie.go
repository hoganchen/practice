package main

import (
	"encoding/json"
	"fmt"
	"log"
)

type Movie struct {
	Title  string
	Year   int  `json:"released"`
	Color  bool `json:"color,omitempty"`
	Actors []string
}

func main() {
	var movies = []Movie{
		{Title: "Casablanca", Year: 1942, Color: false,
			Actors: []string{"Humphrey Bogart", "Ingrid Bergman"}},
		{Title: "Cool Hand Luke", Year: 1967, Color: true,
			Actors: []string{"Paul Newman"}},
		{Title: "Bullitt", Year: 1968, Color: true,
			Actors: []string{"Steve McQueen", "Jacqueline Bisset"}},
		// ...
	}

	/*
	这样的数据结构特别适合JSON格式,并且在两种之间相互转换也很容易。
	将一个Go语言中类似movies的结构体slice转为JSON的过程叫编组(marshaling)。编组通过调用json.Marshal函数完成

	Marshal函数返还一个编码后的字节slice,包含很长的字符串,并且没有空白缩进;我们将它折行以便于显示

	这种紧凑的表示形式虽然包含了全部的信息,但是很难阅读。为了生成便于阅读的格式,另一个json.MarshalIndent函数将产生整齐缩进的输出。
	该函数有两个额外的字符串参数用于表示每一行输出的前缀和每一个层级的缩进
	*/
	data, err := json.MarshalIndent(movies, "", "\t")
	if err != nil {
		log.Fatalf("JSON marshaling failed: %s", err)
	}
	fmt.Printf("%s\n", data)
}
