package graph

var graph = make(map[string]map[string]bool)

/*
Map的value类型也可以是一个聚合类型,比如是一个map或slice。在下面的代码中,图graph的key类型是一个字符串,
value类型map[string]bool代表一个字符串集合。从概念上将,graph将一个字符串类型的key映射到一组相关的字符串集合,
它们指向新的graph的key。

其中addEdge函数惰性初始化map是一个惯用方式,也就是说在每个值首次作为key时才初始化。
addEdge函数显示了如何让map的零值也能正常工作;即使from到to的边不存在,graph[from][to]依然可以返回一个有意义的结果。
*/
func addEdge(from, to string) {
	edges := graph[from]
	if edges == nil {
		edges = make(map[string]bool)
		graph[from] = edges
	}
	edges[to] = true
}

func hasEdge(from, to string) bool {
	return graph[from][to]
}
