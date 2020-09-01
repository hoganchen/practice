#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QString>
#include <QTimer>
#include <QDebug>
#include <unistd.h>     // for sleep function

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    ui->label->setText(QStringLiteral("%1").arg(qrand() % 10));

    thread = new QThread();

    QTimer *timer = new QTimer();
    connect(timer, SIGNAL(timeout()), this, SLOT(timerUpdate()));
    timer->start(1000);

    QTimer *threadTimer = new QTimer();
    threadTimer->moveToThread(thread);
    connect(thread, SIGNAL(started()), threadTimer, SLOT(start()));
    threadTimer->setInterval(1000);

    thread->start();
}

void MainWindow::timerUpdate()
{
//    sleep(5);
    ui->label->setText(QStringLiteral("%1").arg(qrand() % 10));
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::on_pushButton_clicked()
{
    qDebug() << "OK button clicked...";
}

void MainWindow::on_pushButton_2_clicked()
{
    qDebug() << "Cancel button clicked...";
}
