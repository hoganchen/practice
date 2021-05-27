# 查找elf, awk -F参数的意思是以:号分割行
# find ./ -type f | xargs file | grep "ELF.*executable" | awk -F: '{print $1}' | xargs echo
find ./ -type f | xargs file | grep "ELF.*executable" | awk -F: '{print $1}'

<< EOF
 find . -perm /111 -type f -exec echo rm -v {} \;

这里的奇妙之处在于，-perm标志（用于权限）可以在permission参数前面加一个/，这使得它在每个位上search一个逻辑OR。 从手册页：

  -perm /mode Any of the permission bits mode are set for the file. Symbolic modes are accepted in this form. You must specify 'u', 'g' or 'o' if you use a symbolic mode. See the EXAMPLES section for some illustrative examples. If no permission bits in mode are set, this test currently matches no files. However, it will soon be changed to match any file (the idea is to be more con- sistent with the behaviour of perm -000).

如果不明确，/指定111在用户中指定x或在其他组中指定x或x。 而那些不是异或，所以我们至less要找一个，但最多3个。

由于unix文件的权限是

 rwxrwxrwx 421421421

我们关心x位，我们得到了一个掩码

 --1--1--1

或111

应该指出的是，在上面列出的命令，有一个回声，以防止你在自己的脚射击。 一旦你正确地钉住了文件，随意采取安全措施。
EOF
# 查找有可执行权限的文件
find ./ -type f -perm /+x