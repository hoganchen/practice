/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"log"
	"time"
	"flag"
	"context"
	"net/http"

	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"

)

func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	visible_usage()

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}

func visible_usage() {
	port := flag.Int("port", 8544, "port")
	flag.Parse()

	// run server
	go testServer(fmt.Sprintf(":%d", *port))

	// create context
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// run task list
	err := chromedp.Run(ctx, visible(fmt.Sprintf("http://localhost:%d", *port)))
	if err != nil {
		log.Fatal(err)
	}
}

func visible(host string) chromedp.Tasks {
	var ua string

	return chromedp.Tasks{
		chromedp.Navigate(host),
		chromedp.ActionFunc(func(ctx context.Context) error {
			_, exp, err := runtime.Evaluate(makeVisibleScript).Do(ctx)
			if err != nil {
				return err
			}
			if exp != nil {
				return exp
			}
			return nil
		}),
		chromedp.ActionFunc(func(context.Context) error {
			log.Printf("waiting 3s for box to become visible")
			return nil
		}),
		chromedp.WaitVisible(`#content`),
		chromedp.ActionFunc(func(context.Context) error {
			log.Printf(">>>>>>>>>>>>>>>>>>>> content IS VISIBLE")
			return nil
		}),
		chromedp.WaitVisible(`#json-panel`),
		chromedp.ActionFunc(func(context.Context) error {
			log.Printf(">>>>>>>>>>>>>>>>>>>> json-panel IS VISIBLE")
			return nil
		}),
		chromedp.Text(`User-Agent`, &ua),
		chromedp.ActionFunc(func(context.Context) error {
			log.Printf("user agent: %s", ua)
			return nil
		}),
	}
}

const (
	makeVisibleScript = `setTimeout(function() {
	document.querySelector('#box1').style.display = '';
}, 3000);`
)

// testServer is a simple HTTP server that serves a static html page.
func testServer(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(res http.ResponseWriter, _ *http.Request) {
		fmt.Fprint(res, indexHTML)
	})
	return http.ListenAndServe(addr, mux)
}

const indexHTML = `<!doctype html>
<html>
<head>
  <title>example</title>
</head>
<body><div id="content"><div class="tabs "><nav class="tabs-navigation"><ul class="tabs-menu" role="tablist"><li class="tabs-menu-item json is-active" role="presentation"><span class="devtools-tab-line"></span><a id="json-tab" tabindex="0" title="JSON" aria-controls="json-panel" aria-selected="true" role="tab">JSON</a></li><li class="tabs-menu-item rawdata " role="presentation"><span class="devtools-tab-line"></span><a id="rawdata-tab" tabindex="-1" title="原始数据" aria-controls="rawdata-panel" aria-selected="false" role="tab">原始数据</a></li><li class="tabs-menu-item headers " role="presentation"><span class="devtools-tab-line"></span><a id="headers-tab" tabindex="-1" title="头" aria-controls="headers-panel" aria-selected="false" role="tab">头</a></li></ul></nav><div class="panels"><div id="json-panel" style="visibility: visible; height: 100%;" class="tab-panel-box" role="tabpanel" aria-labelledby="json-tab"><div class="tab-panel json"><div class="jsonPanelBox tab-panel-inner"><div class="toolbar"><button class="btn save">保存</button><button class="btn copy">复制</button><button class="btn collapse">全部折叠</button><button class="btn expand">全部展开</button><div class="devtools-separator"></div><input class="searchBox devtools-filterinput" placeholder="过滤 JSON"></div><div class="panelContent"><table class="treeTable" role="tree" tabindex="0" aria-label="" cellspacing="0" cellpadding="0"><thead role="presentation"><tr class="" role="presentation"><td class="" role="presentation" id="default"></td><td class="" style="width: 100%;" role="presentation" id="value"></td></tr></thead><tbody role="presentation" tabindex="-1"><tr id="/args" role="treeitem" aria-level="1" aria-selected="false" class="treeRow objectRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:0px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel objectLabel" aria-labelledby="default" data-level="0">args</span></td><td class="treeValueCell objectCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-object" title="Object"><span class="objectLeftBrace">{</span><span class="objectRightBrace">}</span></span></span></td></tr><tr id="/headers" role="treeitem" aria-level="1" aria-selected="false" aria-expanded="true" class="treeRow objectRow hasChildren opened"><td class="treeLabelCell" style="--tree-label-cell-indent:0px;" role="presentation"><span class="treeIcon theme-twisty open" role="presentation"></span><span class="treeLabel objectLabel" aria-labelledby="default" data-level="0">headers</span></td><td class="treeValueCell objectCell" role="presentation"><span aria-labelledby="value"></span></td></tr><tr id="/headers/Accept" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow hasChildren opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon theme-twisty open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Accept</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"</span></span></td></tr><tr id="/headers/Accept-Encoding" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Accept-Encoding</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"gzip, deflate, br"</span></span></td></tr><tr id="/headers/Accept-Language" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Accept-Language</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"en-US,en;q=0.5"</span></span></td></tr><tr id="/headers/Cache-Control" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Cache-Control</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"no-cache"</span></span></td></tr><tr id="/headers/Dnt" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Dnt</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"1"</span></span></td></tr><tr id="/headers/Host" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Host</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"httpbin.org"</span></span></td></tr><tr id="/headers/Pragma" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Pragma</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"no-cache"</span></span></td></tr><tr id="/headers/Upgrade-Insecure-Requests" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">Upgrade-Insecure-Requests</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"1"</span></span></td></tr><tr id="/headers/User-Agent" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow hasChildren opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon theme-twisty open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">User-Agent</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0"</span></span></td></tr><tr id="/headers/X-Amzn-Trace-Id" role="treeitem" aria-level="2" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:16px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="1">X-Amzn-Trace-Id</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"Root=1-611a0c75-7d74f900140e4e9f11b89826"</span></span></td></tr><tr id="/origin" role="treeitem" aria-level="1" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:0px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="0">origin</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"119.4.178.149"</span></span></td></tr><tr id="/url" role="treeitem" aria-level="1" aria-selected="false" class="treeRow stringRow opened"><td class="treeLabelCell" style="--tree-label-cell-indent:0px;" role="presentation"><span class="treeIcon open" role="presentation"></span><span class="treeLabel stringLabel" aria-labelledby="default" data-level="0">url</span></td><td class="treeValueCell stringCell" role="presentation"><span aria-labelledby="value"><span class="objectBox objectBox-string">"<a class="url" title="https://httpbin.org/get" draggable="false" href="https://httpbin.org/get" target="_blank" rel="noopener noreferrer" tabindex="-1">https://httpbin.org/get</a>"</span></span></td></tr></tbody></table></div></div></div></div><div id="rawdata-panel" style="visibility: hidden; height: 0px;" class="tab-panel-box hidden" role="tabpanel" aria-labelledby="rawdata-tab"></div><div id="headers-panel" style="visibility: hidden; height: 0px;" class="tab-panel-box hidden" role="tabpanel" aria-labelledby="headers-tab"></div></div></div></div><script src="resource://devtools-client-jsonview/lib/require.js" data-main="resource://devtools-client-jsonview/viewer-config.js"></script></body>
</html>`