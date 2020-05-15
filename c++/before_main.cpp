#include <iostream>

using namespace std;

class simpleClass
{
    public:
        simpleClass( )
        {
            cout << "simpleClass constructor..." << endl;
        }
};

simpleClass g_objectSimple;

int main(int argc, char *argv[])
{
    cout << "I am in main function..." << endl;
    return 0;
}
