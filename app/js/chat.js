window.onload=function(){
    var chat=new Chat();
    chat.init();
}
function Chat(){
    this.socket=null;
}

Chat.prototype={
    init:function(){
        var _this=this;
        // 1、初始化DOM
        // 用户名输入框 DOM
        this.username=this.getDom("typeName");
        // 提示框
        this.tips=this.getDom("tips");
        // 登录遮罩层 DOM
        this.loginDom=this.getDom("loginBox");
        // OK 按钮 DOM
        this.btn=this.getDom("submit");
        // 文本输入框
        this.textarea=this.getDom("message");
        this.defaultHeight=this.elemStyle(_this.textarea).minHeight;
        // this.defaultHeight=this.elemStyle(_this.textarea);
        this.sendBtn=this.getDom("send");
        this.app=this.getDom("app");
        // console.log(this.app);
        // 
        this.scrollTop=document.body.scrollTop;
        this.timer=null;
        // 使用 io
        this.socket = io.connect();
        // 建立连接
        this.socket.on("connect",function(){
            _this.username.focus();
        });
        // 2、事件
        // 2.1 输入框绑定键盘事件
        this.bind(this.username,"keyup",function(e){
            if (e.keyCode == 13) {
                var nickName = _this.username.value;
                // 向服务端注册login事件
                if (nickName.trim().length != 0) {
                    _this.socket.emit('login', nickName);
                };
            };
        });
        // OK 登录按钮
        this.bind(this.btn,"click",function(e){
            console.log(this);
            var nickName = _this.username.value;
            // 向服务端注册login事件
            if (nickName.trim().length != 0) {
                _this.socket.emit('login', nickName);
            }else{
                _this.username.focus();
            }
        });
        // 文本输入框事件：发送
        this.bind(this.textarea,"keyup",function(e){
            // 里面的this指代当前的 textarea
            // 内部this指代当前输入框
            var msg=this.value;
            if(e.keyCode==13 && msg.trim().length != 0){
                this.value="";
                // 向服务端注册 发送事件
                _this.socket.emit("sendMsg",msg,"#999");
                // 自己的视图
                _this.pushHtml(_this.app,"我",msg,"#B2CFEB","right");
                // 恢复开始高度
                this.style.height=_this.defaultHeight;
            }else{
                var height=this.scrollHeight;
                if( height<150 ){
                    this.style.height=height+"px";
                }else{
                    this.style.overflowY="auto";
                    return false;
                }
            }
        });
        // 5 解决移动端获取焦点键盘挡住输入框（此方法时好时坏）
        // this.bind(this.textarea,"click",function(){
        //     var target = this;
        //     setTimeout(function(){
        //         target.scrollIntoView(true);
        //     },100);
        // });
        // 5.1
        this.bind(this.textarea,"focus",function(){
            console.log(document.body.scrollHeight);
            _this.timer=setInterval(function(){
                document.body.scrollTop=document.body.scrollHeight;
            },100);
        });
        // 5.2
        this.bind(this.textarea,"blur",function(){
            clearInterval(_this.timer);
            _this.app.scrollTop = _this.app.scrollHeight;
            // document.body.scrollTop=_this.scrollTop;
            console.log(_this.scrollTop);
        });
        // 按钮发送：
        this.bind(this.sendBtn,"click",function(){
            var msg=_this.textarea.value;
            if(msg.trim().length != 0){
                _this.textarea.value="";
                // 向服务端注册 发送事件
                _this.socket.emit("sendMsg",msg,"#999");
                // 自己的视图
                _this.pushHtml(_this.app,"我",msg,"#B2CFEB","right");
                // 恢复开始高度
                _this.textarea.style.height=_this.defaultHeight;
            }
        });
        // 2.2 接收服务端成功事件
        this.socket.on('loginSuccess', function() {
            _this.loginDom.style.display = 'none';
        });
        // 2.3 接收服务端登录失败
        this.socket.on("signinFailed",function(){
            _this.tips.style.display="block";
            _this.username.value="";
        });
        // 3.监听服务器注入系统提示
        this.socket.on("system",function(username,count,type){
            var msg=username+( type=="login" ? "  加入温暖的组织" : "离开了温暖的组织！" );
            _this.pushHtml(_this.app,"系统提示",msg,"#999","center");
        });
        // 4、监听服务器注入（广播）新文本消息事件
        this.socket.on('broadcast', function(username, msg, color) {
            _this.pushHtml(_this.app,username,msg,color);
        });
    },
    // 通用绑定事件
    bind:function(elem,eventType,callback){
        if(elem.addEventListener){
            elem.addEventListener(eventType,callback,false);
        }else{
            elem.attachEvent("on"+eventType,function(){
                callback.call(elem);
            });
        }
    },
    getDom:function(id){
        return document.getElementById(id);
    },
    pushHtml:function(elem,username,msg,color,align) {
        var p=document.createElement("p");
        var date = new Date().toTimeString().substr(0, 8);
        p.style.color = color || '#B2CFEB';
        p.style.textAlign=align || "left";
        // 判断是不是自己
        if(align=="right"){
            p.innerHTML = msg+'<span class="timeTips">(' + date + ') </span> ：'+ username;
        }else{
            p.innerHTML = username + '：<span class="timeTips">(' + date + ') </span>' + msg;
        }
        elem.appendChild(p);
        // 默认向上滚动
        elem.scrollTop = elem.scrollHeight;
    },
    elemStyle:function(elem){
        return window.getComputedStyle(elem);
    }
}