#include "dialog.h"
#include <QGridLayout>
#include <QTimer>
#include <QDateTime>
#include <QMouseEvent>

Dialog::Dialog(QWidget *parent)
    : QDialog(parent)
{
    this->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    label1 = new QLabel(this);
//    label1->setText(QString::fromLocal8Bit("请输入圆的半径："));
    label1->setText(QString::fromLocal8Bit(""));

//    id1 = startTimer(1000);
    QTimer *timer = new QTimer(this);
    connect(timer, SIGNAL(timeout()), this, SLOT(timerUpdate()));
    timer->start(1000);

    QGridLayout *mainLayout = new QGridLayout(this);
    mainLayout->addWidget(label1, 0, 0);
}

Dialog::~Dialog()
{

}

void Dialog::timerEvent(QTimerEvent *timerEvt)
{
    label1->setText(QString::fromLocal8Bit("%1").arg(qrand() % 10));
}

void Dialog::timerUpdate()
{
    QDateTime datetime = QDateTime::currentDateTime();
    QString	str	= datetime.toString("yyyy-MM-dd hh:mm:ss dddd");
    label1->setText(str);
}

void Dialog::mouseDoubleClickEvent(QMouseEvent *mouseEvt)
{
    exit(0);
}

void Dialog::mousePressEvent(QMouseEvent *mouseEvt)
{
    if (Qt::LeftButton == mouseEvt->button())
    {
        m_WindowPos = this->pos();
        m_MousePos = mouseEvt->globalPos();
    }
}

void Dialog::mouseMoveEvent(QMouseEvent *mouseEvt)
{
    move(m_WindowPos + mouseEvt->globalPos() - m_MousePos);
}
