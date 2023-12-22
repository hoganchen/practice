/*
@Author:        hogan.chen@ymail.com
@Create Date:   2020-11-11
*/

package main

import (
	"fmt"
	"time"
)

type Eater interface {
	Eat()
}

type Runner interface {
	Run()
}

type Speaker interface {
	Speak() string
}

// interface继承
type Animal interface {
	Eater
	Runner
	Speaker
}

type Dog struct {
	Category string
	Name     string
}

type Cat struct {
	Category string
	Name     string
}

func NewDog(name string) *Dog {
	return &Dog{Category: "Dog", Name: name}
}

func (d *Dog) Eat() {
	fmt.Printf("%[1]s is a %v, %[1]s is eating\n", d.Name, d.Category)
}

func (d *Dog) Run() {
	fmt.Printf("%[1]s is a %v, %[1]s is running\n", d.Name, d.Category)
}

func (d *Dog) Speak() string {
	return "Woof..."
}

func NewCat(name string) *Cat {
	return &Cat{Category: "Cat", Name: name}
}

func (d *Cat) Eat() {
	fmt.Printf("%[1]s is a %v, %[1]s is eating\n", d.Name, d.Category)
}

func (d *Cat) Run() {
	fmt.Printf("%[1]s is a %v, %[1]s is running\n", d.Name, d.Category)
}

func (d *Cat) Speak() string {
	return "miaow..."
}

func ShowEat(animal Animal) {
	animal.Eat()
}

func ShowRun(animal Animal) {
	animal.Run()
}

func ShowSpeak(animal Animal) string {
	return animal.Speak()
}

func ShowEat2(eater Eater) {
	eater.Eat()
}

func ShowRun2(runner Runner) {
	runner.Run()
}

func ShowSpeak2(speaker Speaker) string {
	return speaker.Speak()
}

// https://blog.kennycoder.io/2020/02/03/Golang-%E6%B7%B1%E5%85%A5%E7%90%86%E8%A7%A3interface%E5%B8%B8%E8%A6%8B%E7%94%A8%E6%B3%95/
func main() {
	start := time.Now()
	fmt.Printf("Program start execution at %s\n\n", start.Format("2006-01-02 15:04:05"))

	// dog := Dog{Name: "Kenny"}
	dog := NewDog("Kenny")
	ShowEat(dog)
	ShowRun(dog)
	fmt.Printf("%v speak: %v\n", dog.Name, ShowSpeak(dog))
	ShowEat2(dog)
	ShowRun2(dog)
	fmt.Printf("%v speak: %v\n", dog.Name, ShowSpeak2(dog))

	cat := NewCat("Tom")
	ShowEat(cat)
	ShowRun(cat)
	fmt.Printf("%v speak: %v\n", cat.Name, ShowSpeak(cat))
	ShowEat2(cat)
	ShowRun2(cat)
	fmt.Printf("%v speak: %v\n", cat.Name, ShowSpeak2(cat))

	elapsed := time.Since(start)
	fmt.Printf("\nProgram end execution at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("Total elapsed time: %s\n", elapsed)
}
