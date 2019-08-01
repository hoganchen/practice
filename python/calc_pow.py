iter = 1000

sum = 0
index = 1

for i in range(iter):
    sum += index * index
    index += 1

print('sum = {}， index = {}'.format(sum, index))


sum = 0
index = 2

for i in range(iter):
    sum += index * index
    index += 2

print('sum = {}， index = {}'.format(sum, index))


sum = 0
index = 1

for i in range(iter):
    sum += index * index
    index += 2

print('sum = {}， index = {}'.format(sum, index))