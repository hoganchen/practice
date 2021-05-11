a=11
a1=22

# 单引号不执行变量引用替换，双引号会执行变量引用替换

echo '$a'
echo '$a1'
echo '$a''1'
echo '$a1'
echo '${a}1'
echo '${a1}'

echo "$a"
echo "$a1"
echo "$a""1"
echo "$a1"
echo "${a}1"
echo "${a1}"

echo $(ifconfig)