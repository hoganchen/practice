#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QLabel>
#include <QPoint>
#include <QThread>
#include <QNetworkReply>

class workThread : public QThread
{
    Q_OBJECT

public:
    workThread();
    void run();
private:
    QNetworkAccessManager networkManager;
    QNetworkReply *netReply;
private slots:
    void getStockInfo();
};

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = 0);
    ~MainWindow();
protected:
    void timerEvent(QTimerEvent *);
    void mouseDoubleClickEvent(QMouseEvent *);
    void mouseMoveEvent(QMouseEvent *);
    void mousePressEvent(QMouseEvent *);
private:
    QLabel *label1;
    QPoint m_WindowPos, m_MousePos;
    workThread threadWork;
private slots:
    void timerUpdate();
    void threadRun();
};

#endif // MAINWINDOW_H
