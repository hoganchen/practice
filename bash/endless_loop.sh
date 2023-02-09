#! /bin/bash

function for_loop_endless_01() {
    for ((;;))
    do
        date
        sleep 1
    done
}

function while_loop_endless_01() {
    while :
    do
        date
        sleep 1
    done
}

function while_loop_endless_02() {
    while ((1))
    do
        date
        sleep 1
    done
}

function while_loop_endless_03() {
    while [[ 1 ]]
    do
        date
        sleep 1
    done
}

function while_loop_endless_04() {
    while [ 1 ]
    do
        date
        sleep 1
    done
}

function while_loop_endless_05() {
    while true
    do
        date
        sleep 1
    done
}

function while_loop_endless_06() {
    while [[ "1" == "1" ]]
    do
        date
        sleep 1
    done
}

function while_loop_endless_07() {
    while test "1" == "1"
    do
        date
        sleep 1
    done
}

function while_loop_endless_08() {
    while [ true ]
    do
        date
        sleep 1
    done
}

# for_loop_endless_01

# while_loop_endless_01
while_loop_endless_02
# while_loop_endless_03
# while_loop_endless_04
# while_loop_endless_05
# while_loop_endless_06
# while_loop_endless_07
# while_loop_endless_08

