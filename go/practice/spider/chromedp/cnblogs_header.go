package main

import (
	"context"
	"fmt"
	"log"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
)

func main() {
	ctx, cancel := chromedp.NewContext(
		context.Background(),
		chromedp.WithLogf(log.Printf),
	)
	defer cancel()
	var nodes []*cdp.Node
	err := chromedp.Run(ctx,
		chromedp.Navigate("https://www.cnblogs.com/"),
		// chromedp.WaitVisible(`#footer`, chromedp.ByID),
		// chromedp.Nodes(`.//a[@class="card"]`, &nodes),
		chromedp.WaitVisible(`#wrapper`),
		chromedp.Nodes(`/html/body/div/div[3]/div/div[2]/div/div[1]`, &nodes),
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("get nodes:", len(nodes))
	// print titles
	for _, node := range nodes {
		fmt.Println(node.Children[0].NodeValue, ":", node.AttributeValue("href"))
	}
}