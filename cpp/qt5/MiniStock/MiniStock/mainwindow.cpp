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
#include <QTextCodec>
#include <QRegExp>
#include <cmath>
#include <QMetaObject>

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

void MainWindow::infoUpdate(QString msg)
{
    label1->setText(msg);
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
//    netReply = networkManager.get(QNetworkRequest(QUrl("https://hq.sinajs.cn/list=sh603160")));
//    netReply = networkManager.get(QNetworkRequest(QUrl("https://hq.sinajs.cn/list=sh688055")));
    netReply = networkManager.get(QNetworkRequest(QUrl("https://hq.sinajs.cn/list=sh603393")));
//    netReply = networkManager.get(QNetworkRequest(QUrl("https://httpbin.org/get")));
    connect(netReply, SIGNAL(readyRead()), this, SLOT(getStockInfo()));
//    connect(netReply, &QIODevice::readyRead, this, &workThread::getStockInfo);
}

void workThread::getStockInfo()
{
    qDebug() << netReply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    QByteArray replyData = netReply->readAll();
    QTextCodec *tc = QTextCodec::codecForName("GB2312");
    QString unicodeStr = tc->toUnicode(replyData);
    qDebug() << "netReply: " << replyData;
//    qDebug() << "netReply: " << tc->toUnicode(jsonData);
    qDebug() << "netReply: " << unicodeStr;
//    qDebug() << "netReply: " << QString::fromLocal8Bit("%1").arg(QString(jsonData));

    QRegExp rx("^var\\s+[a-z_]+(\\d+)=\"(.*)\"");
    int pos = QString(unicodeStr).indexOf(rx);

    if(pos >= 0)
    {
        qDebug() << rx.matchedLength();
        qDebug() << rx.capturedTexts();
        qDebug() << rx.cap(0);
        qDebug() << rx.cap(1);
        qDebug() << rx.cap(2);

        QStringList strList = rx.cap(2).split(",");
        qDebug() << strList;
        qDebug() << strList[3].toFloat();
        float pChange = (strList[3].toFloat() - strList[2].toFloat()) / strList[2].toFloat() * 100;

        QString strChange = QString::number(fabs(pChange), 'f', 2);
        float fmtChange = strChange.toFloat();
        qDebug() << fabs(pChange) << fmtChange;
        QString updateInfo;

        if(pChange >= 0) {
            updateInfo = QStringLiteral("%1 %2 %3 +%%4").arg(strList[0]).arg(rx.cap(1)).arg(strList[3].toFloat()).arg(fmtChange);
            qDebug() << QStringLiteral("%1 %2 %3 +%%4").arg(strList[0]).arg(rx.cap(1)).arg(strList[3].toFloat()).arg(fmtChange);
        } else {
            updateInfo = QStringLiteral("%1 %2 %3 -%%4").arg(strList[0]).arg(rx.cap(1)).arg(strList[3].toFloat()).arg(fmtChange);
            qDebug() << QStringLiteral("%1 %2 %3 -%%4").arg(strList[0]).arg(rx.cap(1)).arg(strList[3].toFloat()).arg(fmtChange);
        }

//        QMetaObject::invokeMethod(this->parent(), "infoUpdate", Q_ARG(QString, updateInfo));
    }
}
