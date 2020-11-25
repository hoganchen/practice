package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
)

// go run 14_fetch.go https://www.qq.com/
// go run 14_fetch.go https://www.baidu.com/
// go run 14_fetch.go https://www.hao123.com/
func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s [urls]\n", os.Args[0])
		os.Exit(1)
	}
	for _, url := range os.Args[1:] {
		filename, n, err := fetch(url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "fetching %s: %v\n", url, err)
			continue
		}
		fmt.Printf("stored %s to %s (%d bytes)\n", url, filename, n)
	}
}

// Fetch downloads the URL and returns the
// name and length of the local file.
/*
对resp.Body.Close延迟调用我们已经见过了,在此不做解释。上例中,通过os.Create打开文件进行写入,在关闭文件时,
我们没有对f.close采用defer机制,因为这会产生一些微妙的错误。许多文件系统,尤其是NFS,写入文件时发生的错误会被延迟到文件关闭时反馈。
如果没有检查文件关闭时的反馈信息,可能会导致数据丢失,而我们还误以为写入操作成功。如果io.Copy和f.close都失败了,
我们倾向于将io.Copy的错误信息反馈给调用者,因为它先于f.close发生,更有可能接近问题的本质。
*/
func fetch(url string) (filename string, n int64, err error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	local := path.Base(resp.Request.URL.Path)
	if local == "/" {
		local = "index.html"
	}
	f, err := os.Create(local)
	if err != nil {
		return "", 0, err
	}
	n, err = io.Copy(f, resp.Body)
	// Close file, but prefer error from Copy, if any.
	if closeErr := f.Close(); err == nil {
		err = closeErr
	}
	return local, n, err
}
