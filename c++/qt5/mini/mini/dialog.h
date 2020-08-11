#ifndef DIALOG_H
#define DIALOG_H

#include <QDialog>
#include <QLabel>
#include <QPoint>

class Dialog : public QDialog
{
    Q_OBJECT

public:
    Dialog(QWidget *parent = 0);
    ~Dialog();
protected:
    void timerEvent(QTimerEvent *);
    void mouseDoubleClickEvent(QMouseEvent *);
    void mouseMoveEvent(QMouseEvent *);
    void mousePressEvent(QMouseEvent *);
private:
    QLabel *label1;
    int id1;
    QPoint m_WindowPos, m_MousePos;
private slots:
    void timerUpdate();
};

#endif // DIALOG_H
