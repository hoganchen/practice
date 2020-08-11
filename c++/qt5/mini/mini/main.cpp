#include "dialog.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    Dialog w;
//    w.resize(100, 10);
    w.setFixedSize(250, 40);
    w.show();

    return a.exec();
}
