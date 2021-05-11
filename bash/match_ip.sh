newip='192.168.1.100'

:<<EOF
# https://blog.zengrong.net/post/bash-reg-fuck-old-article/
# https://blog.csdn.net/qianggezhishen/article/details/51981804
# https://sukbeta.github.io/shell-comment/

The =~ Regular Expression match operator no longer requires quoting of the pattern within [[ ... ]].
EOF

if [[ "$newip" =~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$' ]];then

    echo '找到了ip地址'

fi

if [[ "$newip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]];then

    echo '找到了ip地址'

fi