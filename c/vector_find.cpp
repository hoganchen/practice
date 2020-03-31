// find example
#include <iostream>     // std::cout
#include <algorithm>    // std::find
#include <vector>       // std::vector

int main () {
  // using std::find with array and pointer:
  int myints[] = { 10, 20, 30, 40 };
  int * p;

  p = std::find (myints, myints+4, 30);
  if (p != myints+4)
    std::cout << "Element found in myints: " << *p << '\n';
  else
    std::cout << "Element not found in myints\n";

  // using std::find with vector and iterator:
  std::vector<int> myvector (myints,myints+4);
  std::vector<int>::iterator it;

  std::cout << "sizeof(myints): " << sizeof(myints) << "," << "sizeof(int): " << sizeof(int) << std::endl;
  std::cout << "sizeof(myints) / sizeof(int): " << sizeof(myints) / sizeof(int) << std::endl;

  it = find (myvector.begin(), myvector.end(), 30);
  if (it != myvector.end())
    std::cout << "Element found in myvector: " << *it << '\n';
  else
    std::cout << "Element not found in myvector\n";

  std::string strlist[] = {"hello abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "world abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "nice abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "to abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "meet abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "you abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz", "BT address", "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"};
  // std::string strlist[] = {"hello", "world", "nice", "to", "meet", "you", "BT address"};
  std::cout << strlist[0] << " " << strlist[1] << " " << strlist[2] << std::endl;
  std::cout << "sizeof(strlist): " << sizeof(strlist) << "," << "sizeof(std::string): " << sizeof(std::string) << std::endl;

  // 计算string数组元素个数，仔细阅读以下cplusplus网站的解释
  // https://stackoverflow.com/questions/5739384/how-to-find-number-of-elements-in-an-array-of-strings-in-c
  // http://www.cplusplus.com/forum/beginner/2290/
  // https://bbs.csdn.net/topics/370051926
  // https://bbs.csdn.net/topics/220059355
  std::cout << "sizeof(strlist) / sizeof(std::string): " << sizeof(strlist) / sizeof(std::string) << std::endl;

  // std::cout << "strlist.size(): " << strlist.size() << std::endl;
  // std::cout << "strlist.length(): " << strlist.length() << std::endl;

  // 构造函数的第一个参数为string数组的起始地址(即第一个元素的地址)，第二个参数为string数组的最后一个元素地址，所以sizeof(strlist) / sizeof(std::string)是string数组的元素个数
  // https://blog.csdn.net/acs713/article/details/44939815
  // https://blog.csdn.net/XTCGCH/article/details/63288173
  /* vector( input_iterator start, input_iterator end );
    说明：创建一个vector对象，并且input_iterator对象从start位置到end位置的数值付给新创建的对象。*/
  std::vector<std::string> mystrvector (strlist, strlist+(sizeof(strlist) / sizeof(std::string)));

  // in C++98 ‘mystrvector’ must be initialized by constructor, not by ‘{...}’
  // std::vector<std::string> mystrvector = {"hello", "world", "nice", "to", "meet", "you", "BT address"};
  std::vector<std::string>::iterator itstr;

  for(itstr = mystrvector.begin(); itstr != mystrvector.end(); itstr++)
  {
    std::cout << *itstr << '\n';
  }

  // 检查"BT address"是否在mystrvector中
  // http://www.techiedelight.com/check-vector-contains-given-element-cpp
  // https://www.kancloud.cn/wangshubo1989/vector/101118
  // https://thispointer.com/c-how-to-find-an-element-in-vector-and-get-its-index/
  // https://blog.csdn.net/test1280/article/details/65937779
  // https://blog.csdn.net/stone_fall/article/details/88839124
  // https://blog.csdn.net/housecarl/article/details/81074754
  itstr = find (mystrvector.begin(), mystrvector.end(), "BT address");
  if (itstr != mystrvector.end())
    std::cout << "Element found in mystrvector: " << *itstr << '\n';
  else
    std::cout << "Element not found in mystrvector\n";


  return 0;
}
