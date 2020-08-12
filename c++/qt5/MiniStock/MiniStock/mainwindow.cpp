#include "mainwindow.h"
//#include <QGridLayout>
#include <QTimer>
#include <QDateTime>
#include <QMouseEvent>
#include <QDebug>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    this->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    label1 = new QLabel(this);
    label1->setFixedSize(300, 20);
//    label1->setText(QString::fromLocal8Bit("请输入圆的半径："));
    label1->setText(QString::fromLocal8Bit(""));

//    id1 = startTimer(1000);
    QTimer *timer = new QTimer(this);
    connect(timer, SIGNAL(timeout()), this, SLOT(timerUpdate()));
    timer->start(1000);

//    QGridLayout *mainLayout = new QGridLayout(this);
//    mainLayout->addWidget(label1, 0, 0);
    setFixedSize(300, 20);
}

MainWindow::~MainWindow()
{

}

void MainWindow::timerEvent(QTimerEvent *timerEvt)
{
    Q_UNUSED(timerEvt);
    label1->setText(QString::fromLocal8Bit("%1").arg(qrand() % 10));
}

void MainWindow::timerUpdate()
{
    QDateTime datetime = QDateTime::currentDateTime();
    QString	str	= datetime.toString("yyyy-MM-dd hh:mm:ss dddd");
    qDebug() << str;
    label1->setText(str);
}

void MainWindow::mouseDoubleClickEvent(QMouseEvent *mouseEvt)
{
    Q_UNUSED(mouseEvt);
    exit(0);
}

void MainWindow::mousePressEvent(QMouseEvent *mouseEvt)
{
    if (Qt::LeftButton == mouseEvt->button())
    {
        m_WindowPos = this->pos();
        m_MousePos = mouseEvt->globalPos();
        qDebug() << "m_WindowPos: " << m_WindowPos << ", m_MousePos: " << m_MousePos << endl;
    }
}

void MainWindow::mouseMoveEvent(QMouseEvent *mouseEvt)
{
    move(m_WindowPos + mouseEvt->globalPos() - m_MousePos);
    qDebug() << "mouseEvt->globalPos(): " << mouseEvt->globalPos();
}
