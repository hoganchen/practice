#!/usr/bin/env bash

export PATH=/home/chenlianghong/anaconda3/bin:$PATH

python -u utility_01.py

if [ $? -eq 0 ]
then
  python -u utility_02.py
else
  exit 1
fi


# 以下语句是获取了python脚本的执行打印，而不是脚本的退出状态值(return code)，不满足需求
#ret=$(~/anaconda3/bin/python -u utility_01.py)
#echo ${ret}
