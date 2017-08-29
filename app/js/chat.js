window.onload=function(){
    var chat=new Chat();
    chat.init();

}
function getDom(id){
    return document.getElementById(id);
}
function Chat(){
    this.socket=null;
}

Chat.prototype={
    init:function(){
        var _this=this;
        this.username=document.getElementById("typeName");
        this.loginDom=document.getElementById("loginBox");
        this.socket = io.connect();
        this.socket.on("connect",function(){
            getDom("tips").innerHTML="请随便输入用户名~";
            _this.username.focus();
        });
        this.bind("#typeName","keyup",function(e){
            if (e.keyCode == 13) {
                var nickName = _this.username.value;
                // 向服务端注册login事件
                if (nickName.trim().length != 0) {
                    _this.socket.emit('login', nickName);
                };
            };
        });
        // 接收服务端成功事件
        this.socket.on('loginSuccess', function() {
            _this.loginDom.style.display = 'none';
        });
    },
    // 通用绑定事件
    bind:function(id,type,callback){
        document.querySelector(id).addEventListener(type,callback,false);
    }
}