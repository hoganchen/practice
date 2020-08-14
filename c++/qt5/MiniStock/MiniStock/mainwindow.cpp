#include "mainwindow.h"
//#include <QLabel>
#include <unistd.h>
#include <QTimer>
#include <QDateTime>
#include <QDebug>
#include <QMouseEvent>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QIODevice>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    this->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    label1 = new QLabel(this);
//    label1->setText(QString::fromLocal8Bit("请输入圆的半径："));
    label1->setText(QString::fromLocal8Bit(""));

    QTimer *timer = new QTimer(this);
    connect(timer, SIGNAL(timeout()), this, SLOT(timerUpdate()));
    timer->start(1000);

    label1->setFixedSize(300, 20);
    setFixedSize(300, 20);

    QTimer *threadTimer = new QTimer(this);
    connect(threadTimer, SIGNAL(timeout()), this, SLOT(threadRun()));
    threadTimer->start(5000);
}

MainWindow::~MainWindow()
{

}

void MainWindow::timerEvent(QTimerEvent *timerEvt)
{
    Q_UNUSED(timerEvt);
    label1->setText(QStringLiteral("%1").arg(qrand() % 10));
}

void MainWindow::timerUpdate()
{
    QDateTime datetime = QDateTime::currentDateTime();
//    QString	str	= datetime.toString("yyyy-MM-dd hh:mm:ss:zzz dddd");
    QString	str	= datetime.toString("yyyy-MM-dd hh:mm:ss dddd");
    qDebug() << str;
    label1->setText(QStringLiteral("%1").arg(str));
}

void MainWindow::threadRun()
{
    threadWork.run();
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

workThread::workThread()
{

}

void workThread::run()
{
    netReply = networkManager.get(QNetworkRequest(QUrl("https://hq.sinajs.cn/list=sh603160")));
//    netReply = networkManager.get(QNetworkRequest(QUrl("https://httpbin.org/get")));
    connect(netReply, SIGNAL(readyRead()), this, SLOT(getStockInfo()));
//    connect(netReply, &QIODevice::readyRead, this, &workThread::getStockInfo);
}

void workThread::getStockInfo()
{
    qDebug() << netReply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    QByteArray jsonData = netReply->readAll();
    qDebug() << "netReply: " << jsonData;
}
