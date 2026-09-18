/**
 * ============================================================================
 * 知识点：嵌套解构 —— 对象套数组、数组套对象、深层取值
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】进阶
 * 【前置知识】10_destructuring/01_object_destructuring.js、10_destructuring/02_array_destructuring.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    解构的左右两侧可以继续嵌套：对象的某个属性值本身是对象或数组时，
 *    可以在同一行里继续往里解构。
 *      const { user: { name, tags: [firstTag] } } = data;
 *
 * 2. 为什么需要
 *    接口返回的数据往往是"对象套数组套对象"的树形结构：
 *      { code: 0, data: { list: [{ id, author: { name } }] } }
 *    嵌套解构让"我只关心深层那一两个字段"这件事可以一行表达，
 *    不用写 data.data.list[0].author.name 这样的长链。
 *
 * 3. 核心语法要点
 *    (1) 关键读法：**冒号是"往里走"，冒号右边是新模式（或新变量名）**。
 *        { a: b }        —— 去 a，命名为 b（重命名，不往里走）
 *        { a: { b } }    —— 去 a，再往里取 b
 *        { a: [b] }      —— 去 a，再按位置取第一个元素
 *    (2) 嵌套层同样可以有默认值：{ a: { b } = {} } 只在 a 是 undefined 时生效。
 *    (3) 嵌套里同样可以重命名、跳过元素、用 rest。
 *    (4) 嵌套解构可以只解构到某一层就停：{ a: { b, ...restOfA } }。
 *    (5) 数组套对象：[{ id, name }] 表示"取第 0 个元素，再从中取 id 和 name"。
 *    (6) 解构的长度没有上限，但**超过两层可读性会急剧下降**，建议拆分。
 *
 * 4. 常见陷阱
 *    (1) 忘记中间层可能不存在：data.user.name 若 user 不存在会抛 TypeError；
 *        必须写成 { user: { name } = {} } 或先取一层再判断。
 *    (2) 默认值救不了 null：中间层是 null 时，{ x = {} } 不生效（见 01 号文件）。
 *    (3) 把重命名和嵌套搞混：{ a: b } 里 b 是**变量名**，不是"去取 b"。
 *        如果 b 也在源对象里，它不会被解构出来。
 *    (4) 数组层用花括号或对象层用方括号都会出错：类型要匹配源数据的结构。
 *    (5) 深层解构会让"数据来源"变得不清晰，调试时不知道 undefined 是哪一层来的。
 *    (6) 解构只做浅拷贝：解构出来的嵌套对象仍是原对象里的同一个引用。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/03_nested_destructuring.js
 *
 * 【预期输出】
 *   分 6 个小节，演示各种嵌套组合的写法与失败场景。
 * ============================================================================
 */

console.log('--- 1. 对象套对象：一层层往里解 ---');

const response = {
  code: 0,
  data: {
    user: {
      id: 101,
      name: '张三',
      profile: {
        city: '杭州',
        job: '工程师',
      },
    },
  },
};

// 逐层解构：冒号左边是键，右边是"更深一层的模式"（用花括号表示继续往里解）
const {
  data: {
    user: {
      name,
      profile: { city, job },
    },
  },
} = response;

console.log('name =', name);
console.log('city =', city, '，job =', job);

// 也可以"解到某一层就停"，把中间层整个取出来
const {
  data: { user },
} = response;
console.log('中间层 user =', JSON.stringify(user));

// 还可以同时要中间层和深层字段
const {
  data: {
    user: { id, profile },
  },
} = response;
console.log('同时拿到 id 和 profile =', id, JSON.stringify(profile));

// 对比传统写法
const oldWay = response.data.user.profile.city;
console.log('传统写法 response.data.user.profile.city =', oldWay, '（一行很长，且中间缺一层就炸）');

console.log('\n--- 2. 对象套数组 ---');

const order = {
  orderNo: 'A-2024-001',
  customer: { name: '李四', vip: true },
  items: [
    { sku: 'SKU-1', qty: 2, price: 100 },
    { sku: 'SKU-2', qty: 1, price: 50 },
  ],
};

// items 是数组，用方括号继续解构；数组里又是对象，再套花括号
const {
  orderNo,
  items: [firstItem, secondItem],
} = order;

console.log('orderNo =', orderNo);
console.log('firstItem =', JSON.stringify(firstItem));
console.log('secondItem =', JSON.stringify(secondItem));

// 一直解到最里面
const {
  items: [
    {
      sku: firstSku,
      price: firstPrice,
    },
  ],
} = order;
console.log('第一件商品的 sku 与 price =', firstSku, firstPrice);

// 数组解构的剩余元素 + 对象解构的剩余属性可以组合
const {
  items: [headItem, ...restItems],
  ...restOfOrder
} = order;
console.log('\nheadItem.sku =', headItem.sku);
console.log('restItems 个数 =', restItems.length);
console.log('restOfOrder 的键 =', JSON.stringify(Object.keys(restOfOrder)));

console.log('\n--- 3. 数组套对象、数组套数组 ---');

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
];

// 数组套数组：方括号套方括号
const [[a11, a12], [a21]] = matrix;
console.log('第一行前两个 =', a11, a12);
console.log('第二行第一个 =', a21);

// 只要第一行的第一个元素
const [[onlyFirst]] = matrix;
console.log('只要 [0][0] =', onlyFirst);

// 数组里是对象：方括号里放花括号
const users = [
  { id: 1, name: '甲', tags: ['新用户', '活跃'] },
  { id: 2, name: '乙', tags: ['老用户'] },
];

const [
  {
    name: firstName,
    tags: [firstTag, secondTag],
  },
  { name: secondName },
] = users;
console.log('\n第一个用户的 name 与第一个 tag =', firstName, firstTag, '/', secondTag);
console.log('第二个用户的 name =', secondName);

// 对象套数组套对象，三层一起解
const dashboard = {
  sections: [
    {
      title: '概览',
      metrics: [
        { key: 'pv', value: 1000 },
        { key: 'uv', value: 200 },
      ],
    },
  ],
};

const {
  sections: [
    {
      title: sectionTitle,
      metrics: [{ value: pv }, { value: uv }],
    },
  ],
} = dashboard;
console.log('\n三层嵌套解构：title =', sectionTitle, '，pv =', pv, '，uv =', uv);

console.log('\n--- 4. 嵌套里的默认值：只在 undefined 时救场 ---');

// 中间层缺失（undefined）时，可以给"整层"一个默认值
const partial1 = { data: { user: {} } };
const {
  data: {
    user: { name: userName = '匿名', age: userAge = 0 } = {},
  },
} = partial1;
console.log('user 存在但字段缺失 =', userName, userAge);

const partial2 = { data: {} }; // user 这一层整个不存在
const {
  data: {
    user: { name: name2 = '匿名' } = {},
  },
} = partial2;
console.log('user 整层缺失，靠 = {} 救场 =', name2);

// 数组层同理：可以用 = [] 给默认值
const partial3 = { list: undefined };
const { list: [firstOfList = '空列表'] = [] } = partial3;
console.log('list 是 undefined 时 =', firstOfList);

// 陷阱：中间层是 null 时默认值不生效
const partial4 = { data: { user: null } };
try {
  const {
    data: {
      user: { name: badName } = {},
    },
  } = partial4;
  console.log(badName);
} catch (err) {
  console.log('中间层是 null 时报错：', err.name, '-', err.message.slice(0, 40), '...');
}

// 补救方案一：用 ?? 在解构前把 null 变成 undefined
const { data: { user: rawUser } } = partial4;
const { name: fixedName = '匿名（已兜底）' } = rawUser ?? {};
console.log('用 ?? 兜底后 =', fixedName);

console.log('\n--- 5. 嵌套里的重命名与跳过 ---');

const config = {
  server: {
    host: 'localhost',
    port: 8080,
  },
  db: [{ dialect: 'mysql', version: 8 }],
};

// 嵌套 + 重命名：把 host 取出来命名为 serverHost
const {
  server: { host: serverHost, port: serverPort },
  db: [{ dialect: dbDialect }],
} = config;
console.log('重命名后 serverHost =', serverHost, '，serverPort =', serverPort);
console.log('数组层重命名 dbDialect =', dbDialect);

// 嵌套 + 数组跳过
const rgbGroups = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
];
const [, [, greenValue]] = rgbGroups; // 跳过第一组，取第二组的第二个值
console.log('第二组的绿色分量 =', greenValue);

// 嵌套 + rest
const {
  server: { host: h2, ...restServer },
  ...restConfig
} = config;
console.log('restServer =', JSON.stringify(restServer));
console.log('restConfig 的键 =', JSON.stringify(Object.keys(restConfig)));

console.log('\n--- 6. 实战：把长链解构改造成可读代码 ---');

// 场景：一个典型的接口响应
const apiResponse = {
  code: 200,
  msg: 'success',
  result: {
    pagination: { page: 1, size: 10, total: 137 },
    list: [
      {
        id: 'u1',
        nickname: '小明',
        contact: { email: 'xm@example.com', phone: null },
        roles: ['admin', 'editor'],
      },
      {
        id: 'u2',
        nickname: '小红',
        contact: { email: 'xh@example.com', phone: '13800000000' },
        roles: ['viewer'],
      },
    ],
  },
};

// 写法一：一次解构出所有需要的字段
const {
  code,
  result: {
    pagination: { page, total },
    list: [
      {
        nickname: firstNickname,
        contact: { email: firstEmail, phone: firstPhone = '未填写' },
        roles: [primaryRole],
      },
      { nickname: secondNickname },
    ],
  },
} = apiResponse;

console.log('code =', code);
console.log('分页 =', `第 ${page} 页，共 ${total} 条`);
console.log('第一个用户 =', firstNickname, firstEmail, firstPhone, '主角色：', primaryRole);
console.log('第二个用户 =', secondNickname);
console.log('第一个用户的 phone =', firstPhone, '（接口给的是 null，默认值不会生效）');

// 写法二（推荐）：分步解构，每一层都清晰、可单独打日志排查
const { result } = apiResponse;
const { pagination, list } = result;
const { page: stepPage, total: stepTotal } = pagination;
const [firstUser, secondUser] = list;
const { nickname: stepNickname, contact: stepContact } = firstUser;
console.log('\n分步解构结果 =', stepNickname, stepContact.email, `(${stepPage}/${stepTotal})`);

// 写法三：解构 + 重命名，让变量名带上下文（避免 firstNickname 这种需要靠记忆的名字）
const [{ nickname: user1Nickname }, { nickname: user2Nickname }] = list;
console.log('带上下文的命名 =', user1Nickname, user2Nickname);

// 可读性建议总结
console.log('\n嵌套解构的可读性建议：');
console.log('   1) 嵌套不超过 2 层，超过就分步解构');
console.log('   2) 数组解构取"第一个元素"是常见需求，但要先确认数组非空');
console.log('   3) 每一层都可能为空的路径，都要加 = {} 或 = [] 默认值');
console.log('   4) 中间层继续参与后续逻辑时，就把这一层单独解出来命名');

// 数组可能为空的风险演示
const emptyList = { result: { list: [] } };
const {
  result: {
    list: [{ id: noId } = {}], // 给"第一个元素"一个默认值 {}，避免解构 undefined
  },
} = emptyList;
console.log('\n空数组时解构第一个元素（用 = {} 兜底） =', noId);

console.log('\n全部演示完毕。');
