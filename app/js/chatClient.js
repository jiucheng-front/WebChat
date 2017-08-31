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
        this.onlineCount=this.getDom("onlineCount");
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
        // 发送按钮
        this.sendBtn=this.getDom("send");
        // 显示输入内容的 DOM
        this.app=this.getDom("app");
        this.emojiBox=this.getDom("emojiBox");
        // 选择图片按钮
        this.sendImg=this.getDom("sendImg");
        // 初始化表情
        this.pushEmoji(_this.emojiBox,45);
        this.emojiBtn=this.getDom("emoji");
        // 定时器为了解决移动端获取焦点键盘挡住输入框
        this.timer=null;
        this.scrollTop=document.body.scrollTop;
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
            // console.log(this);
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
        // 按钮发送：
        this.bind(this.sendBtn,"click",function(){
            var msg=_this.textarea.value;
            if(msg.trim().length != 0){
                _this.textarea.value="";
                _this.textarea.focus();
                // 向服务端注册 发送事件
                _this.socket.emit("sendMsg",msg,"#999");
                // 自己的视图
                _this.pushHtml(_this.app,"我",msg,"#B2CFEB","right");
                // 恢复开始高度
                _this.textarea.style.height=_this.defaultHeight;
            }
        });
        // 5 解决移动端获取焦点键盘挡住输入框（此方法时好时坏）
        // this.bind(this.textarea,"click",function(){
        //     var target = this;
        //     setTimeout(function(){
        //         target.scrollIntoView(true);
        //     },100);
        // });
        // 5.1 获取焦点动态计算 避免键盘挡住输入框
        this.bind(this.textarea,"focus",function(){
            // console.log(document.body.scrollHeight);
            _this.timer=setInterval(function(){
                document.body.scrollTop=document.body.scrollHeight;
            },100);
        });
        // 5.2 失去焦点恢复初始或者目前输入的位置(每次最新的输入都在视觉最底部)
        this.bind(this.textarea,"blur",function(){
            clearInterval(_this.timer);
            _this.app.scrollTop = _this.app.scrollHeight;
            // document.body.scrollTop=_this.scrollTop;
        });
        // 6.1 显示表情包
        this.bind(this.emojiBtn,"click",function(e){
            e.preventDefault();
            e.stopPropagation();
            _this.emojiBox.style.display="block";
        });
        // 6.2 隐藏表情包
        this.bind(document.body,"click",function(e){
            if(e.target !=_this.emojiBox){
                _this.emojiBox.style.display="none";
            }
        });
        // 6.3 选择表情包
        this.bind(this.emojiBox,"click",function(e){
            var target=e.target;
            if(target.nodeName.toLowerCase() == 'img'){
                _this.textarea.focus();
                _this.textarea.value=_this.textarea.value+'[emoji:' + target.title + ']'; 
            }
        });
        // 7.1 选择并发送图片
        this.bind(this.sendImg,"change",function(e){
            // 如果选择了图片
            if (this.files.length !=0) {
                // console.log(this.files);
                var file = this.files[0];
                var reader = new FileReader();
                if(!reader){
                    _this.pushHtml(_this.app,"友情提示：","暂不支持FileReader");
                }
                var color="#999";
                reader.onload = function(e) {
                    // e.target.result 二进制,向服务端注册选择图片事件
                    _this.socket.emit('selectImg', e.target.result,color);
                    _this.pushImg(_this.app,'我', e.target.result, "#B2CFEB","right");
                    // console.log(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
        // 2.2 监听服务端登录成功事件
        this.socket.on('loginSuccess', function() {
            _this.loginDom.style.display = 'none';
        });
        // 2.3 监听服务端登录失败
        this.socket.on("signinFailed",function(){
            _this.tips.style.display="block";
            _this.username.value="";
        });
        // 3.监听服务器注入系统提示
        this.socket.on("system",function(username,count,type){
            var msg=username+( type=="login" ? "  加入温暖的组织" : "  离开了温暖的组织！" );
            _this.pushHtml(_this.app,"系统提示",msg,"#ccc","center");
            // 显示在线人事
            _this.onlineCount.innerHTML="当前有："+count+" 在线中...";
        });
        // 4、监听服务器注入（广播）新文本消息事件
        this.socket.on("broadcast", function(username, msg, color) {
            _this.pushHtml(_this.app,username,msg,color);
        });
        // 8、监听服务端广播发送图片事件
        this.socket.on("broadcastImg",function(username,baseData,color){
            // 接收后渲染除去自己以外的用户，所以 默认(left)没 align参数
            _this.pushImg(_this.app,username,baseData,color);
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
    // 动态追加HTML
    pushHtml:function(elem,username,msg,color,align) {
        var p=document.createElement("p");
        var date = new Date().toTimeString().substr(0, 8);
        p.style.color = color || '#B2CFEB';
        // 文字超出1行后，最后一行不太合理！ 需要优化
        // p.style.float=align || "left";
        p.style.textAlign=align || "left";
        // 是否有表情：把msg 过滤并替换表情
        var emojiCount=this.emojiBox.children.length;
        var msg=this.fetchEmoji(msg,emojiCount);
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
    // 把eomji图片表情动态添加到html
    pushEmoji:function(elem,count){
        var str="";
        for(var i=0;i<count;i++){
            var index=i+1;
            index<10&&(index="0"+index);
            str+='<img title="'+index+'" src="images/emoji_'+index+'.png" alt="">';
        }
        elem.innerHTML=str;
    },
    // 正则匹配 emoji 替换为对应的 表情图片
    fetchEmoji:function(msg,count){
        var match, result = msg,
        reg = /\[emoji:\d+\]/g,
        emojiIndex;
        while (match = reg.exec(msg)) {
            // [emoji:38] 从 : 号下标7到 ] 的下标 -1，截取中间的数字
            emojiIndex = match[0].slice(7, -1);
            // console.log(match[0]);
            // console.log(emojiIndex);
            if (emojiIndex > count) {
                result = result.replace(match[0], '***');
            } else {
                result = result.replace(match[0], '<img src="images/emoji_' + emojiIndex + '.png" />');
            };
        };
        return result;
    },
    // 7.2 动态追加渲染 IMG
    pushImg:function(elem,username,baseData,color,align){
        var p = document.createElement('p');
        var date = new Date().toTimeString().substr(0, 8);
        p.style.color = color || '#999';
        p.style.textAlign=align || "left";
        if(align=="right"){
            p.innerHTML='<img src="'+baseData+'"/>'+'<span class="timeTips">(' + date + ') </span> ：'+ username;
        }else{
            p.innerHTML=username+'<span class="timeTips">(' + date + ') </span> ：'+'<img src="'+baseData+'"/>';
        }
        elem.appendChild(p);
        // 默认向上滚动
        elem.scrollTop = elem.scrollHeight;
    },
    elemStyle:function(elem){
        return window.getComputedStyle(elem);
    }
}