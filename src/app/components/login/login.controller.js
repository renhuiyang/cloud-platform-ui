/**
 * app login controller
 */

(function () {
    'use strict';

    angular
        .module('iot')
        .controller('LoginController', LoginController)
        .filter('handleState',function() {
        return function(input) {
            var arr = input.split('.');
            var str = arr[arr.length-1];
            var out = str.toUpperCase();
            return out;
        }
    });

    // 用$inject手动添加Angular组件所需的依赖,使用ng-annotate的技术,对依赖关系进行自动化创建安全压缩
    // LoginController.$inject = ['$location', '$routeParams', 'common', 'dataservice'];
    /* 登录模块 */
    // 自动依赖注入
    /** @ngInject */
    function LoginController(LoginService,StorageService,$timeout,$state,constdata,$rootScope,$cookies,$interval,$translate,i18n) {
       /* jshint validthis: true */
        var vm = this;// vm -> ViewModel

        vm.loginText = i18n.t('login.LOGIN');
        vm.isLogining;
        vm.authError = null;
        vm.user = {};
        vm.login = login;
        vm.logout = logout;
        vm.usernameChanged = usernameChanged;
        vm.getUserRole = getUserRole;
        vm.getUserInfomation = getUserInfomation;
        vm.checkToken = checkToken;
        vm.doRegister = doRegister;

        //语言
        var langChi = '中文';
        var langEng = 'English';
        var hnaName = 'hna-username';
        var hnaPwd = 'hna-password';
        var hnaInfo = 'iot.hnair.cloud.information';
        var accessToken = 'iot.hnair.cloud.access_token';
        var userLanguage = window.localStorage.userLanguage;
        var engine = null;


        checkCookie();


        function login(){
            /* 登录 */

            if(vm.user.rememberMe){//记住密码
                setCookie(vm.user.username,vm.user.password);
            }else{
                setCookie(vm.user.username,'');
            }

            startLogin();

            var action = '1';//登录动作
            LoginService.post(constdata.api.login.authPath,vm.user,action,function(response) {
                if (response.data.code == 0){
                    StorageService.put(accessToken,vm.user.username,24 * 3 * 60 * 60);//3 天过期
            //        LoginService.get(constdata.api.login.profilePath,null,vm.user.username,function (response2) {
                        
                        stopLogin();
                        vm.user = response.data.user;
                        vm.user.type = 'tenant';
                        StorageService.put(hnaInfo,vm.user,24 * 3 * 60 * 60);
                        localStorage.setItem(constdata.tenant,'hna');
                        $rootScope.$on('$locationChangeSuccess',function(){//返回前页时，刷新前页
                            parent.location.reload();
                        });
                        $state.go('app.dashboard');

                    // },function (response) {
                         stopLogin();
                    //     vm.authError = response.statusText + ' ' + response.status;
                    // });

                }else{
                    stopLogin();
                    vm.authError = i18n.t('login.LOGIN_FAILED');
                }
            },function (response) {
                stopLogin();
                console.log(response);
                if(response.status == '-1'){
                    vm.authError = i18n.t('login.LOGIN_ERROR_SERVER');
                }else if(response.status == '401'){
                    vm.authError = i18n.t('login.LOGIN_ERROR');
                }else if(response.status == '404'){
                    vm.authError = i18n.t('login.LOGIN_ERROR_NO_URER');
                }else{
                    vm.authError = i18n.t('login.LOGIN_FAILED');
                }
                // toastr.error(vm.authError);
            });

        };

        function usernameChanged() {

            if (vm.user.rememberMe){
                vm.user.password = '';
                vm.user.rememberMe = false;
            }

            var username = getCookie(hnaName);
            if (username == vm.user.username){
                checkCookie();
            }else{
                var info = StorageService.get(vm.user.username);
                if (info){
                    vm.user.password = info.p;
                    vm.user.username = info.n;
                    vm.user.rememberMe = true;
                }
            };
        }


        function startLogin() {
            vm.isLogining = true;
            vm.loginText = i18n.t('login.LOGINING');
            engine = $interval(function(){changeLoginText()},1000);
        }
        function stopLogin() {
            $interval.cancel(engine);
            vm.isLogining = false;
            vm.loginText = i18n.t('login.LOGIN');;
        }
        function changeLoginText() {
            if (vm.loginText.length === 2){
                vm.loginText = i18n.t('login.LOGINING1');
            }else if(vm.loginText.length === 4){
                vm.loginText = i18n.t('login.LOGINING2');
            }else if(vm.loginText.length === 5){
                vm.loginText = i18n.t('login.LOGINING');
            }else if(vm.loginText.length === 6){
                vm.loginText = i18n.t('login.LOGINING1');
            }
        }

        function logout() {
            var action = '2';//登出动作
            LoginService.post(constdata.api.login.logoutPath,StorageService.get(hnaInfo),action,function(response) {
                if (response.data.code == 0){
                    $timeout(function () {
                        localStorage.removeItem(constdata.tenant);
                        StorageService.clear(accessToken);
                        StorageService.clear(hnaInfo);
                    },60);
                    $state.go('access.signin');
                }
            },function (response) {
                stopLogin();
                console.log(response);
                if(response.status == '-1'){
                    vm.authError = i18n.t('login.LOGIN_ERROR_SERVER');
                }else if(response.status == '401'){
                    vm.authError = i18n.t('login.LOGIN_ERROR');
                }else if(response.status == '404'){
                    vm.authError = i18n.t('login.LOGIN_ERROR_NO_URER');
                }else{
                    vm.authError = i18n.t('login.LOGIN_FAILED');
                }
                // toastr.error(vm.authError);
            });
        };

        // 设置登录信息
        function checkCookie() {
            var username = getCookie(hnaName);
            var password = getCookie(hnaPwd);
            if(username && username.length > 0){
                vm.user.username = username;
                if(password && password.length > 0){
                    vm.user.password = password;
                    if (username.length > 0){
                        vm.user.rememberMe = true;
                    }
                }
            }
        }
        function setCookie(name,psd){
            $cookies.put(hnaName,name);
            $cookies.put(hnaPwd,psd);
            StorageService.put(name,{'n':name,'p':psd},24 * 3 * 60 * 60);
        }
        function getCookie(name){
            return $cookies.get(name);
        }
        function clearCookie(name) {
            $cookies.remove(hnaName);
            $cookies.remove(hnaPwd);
            StorageService.remove(name);
        }

        function getUserInfomation() {
            return StorageService.get(hnaInfo);
        }
        if(StorageService.get(hnaInfo)) {
            $rootScope.savedNickName = StorageService.get(hnaInfo).name;
         //   $rootScope.savedNickName = StorageService.get(hnaInfo).nickName;
        }
        function checkToken() {

        }

        function doRegister() {
            $state.go('access.register');
        }

        function getUserRole() {
            // "ADMIN"; "TENANT"; "USER";
            var info = StorageService.get(hnaInfo);

            if (info && info.type.toUpperCase() == 'USER'){
                return true;
            }
            return false;
        }
        // 
        StorageService.get(hnaInfo) && (StorageService.get(hnaInfo).type == 'user') ? $rootScope.isRoleAdmin = true : $rootScope.isRoleAdmin = false
        //切换语言
        userLanguage == 'zh-cn' ? vm.langChoosen = langChi : vm.langChoosen = langEng
        userLanguage == 'zh-cn' ? vm.langLeft = langEng : vm.langLeft = langChi
        vm.toggleLang = function(lang) {
            vm.langChoosen = (vm.langChoosen == langChi) ? langEng : langChi
            vm.langLeft = (vm.langLeft == langChi) ? langEng : langChi;
            // console.log(lang);
            lang == langEng ? $translate.use('en-us') : $translate.use('zh-cn');
            lang == langEng ? window.localStorage.userLanguage='en-us' :  window.localStorage.userLanguage='zh-cn' 
            // window.location.reload();
        }


        // $scope.$watch('vm.title', function(current, original) {
        //     $log.info('vm.title was %s', original);
        //     $log.info('vm.title is now %s', current);
        // });
        
    }
})();
