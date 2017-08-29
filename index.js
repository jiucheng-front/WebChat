// var app=require("express")();
// 1、使用
var express = require('express');
var app=express();
var http=require("http").Server(app);
// 2. 导入socket
var io=require("socket.io")(http);

// 指定服務器根目錄
app.use('/', express.static(__dirname + '/app'));
// 服务器相应
app.get("/",function(req,res){
    res.sendFile(__dirname+'/app/index.html');
});
var users=[];
// 3、1开始连接
io.on("connection",function(socket){
    // console.log("one user connected");
    // 3.2注册客户端注入的事件接收消息
    socket.on("chat",function(msg){
        // 3.3 注册事件，把消息返回给客户端
        io.emit('chat', msg);
        // console.log("客户端输入消息是："+msg);
    });
    // 4断开连接提示
    socket.on("disconnect",function(){
        console.log("user disconnected!");
    });
    // 5接收客户端注入的login事件
    socket.on("login",function(nickname){
        if (users.indexOf(nickname) > -1) {
            // 2、向客户端注入登录失败事件
            socket.emit('resetName');
        } else {
            socket.nickname = nickname;
            users.push(nickname);
            // 3、向客户端注入登录成功操作
            socket.emit('loginSuccess');
            // 4、向客户端注入系统提示
            io.sockets.emit('system', nickname, users.length, 'login');
        };
    });
});
// 监听端口
http.listen(3200,function(){
    console.log("listening on port:3200");
});