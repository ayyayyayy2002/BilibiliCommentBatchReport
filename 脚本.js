// ==UserScript==
// @name         BiliBli评论举报
// @namespace    http://tampermonkey.net/
// @version      2024-07-20
// @description  举报当前视频的前二十个评论，具体顺序看github上的api
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @author       You
// @match        https://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=curlconverter.com
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 在这里定义您的函数


    // 使用 GM_registerMenuCommand 添加菜单
    GM_registerMenuCommand('Send Request', function() {
        reportAllComment();
    });

})();
function addButtons() {
    // 创建一个按钮
    var button = document.createElement("button");
    button.innerHTML = "发送请求";
    button.style.padding = "10px";
    button.style.margin = "10px";
    button.style.position = "fixed";
    button.style.top = "10px";
    button.style.right = "10px";

    // 点击按钮时执行请求函数
    button.addEventListener("click", function() {
        reportAllComment();
    });

    // 将按钮添加到页面上
    document.body.appendChild(button);
}

// 在页面加载完成后执行addButtons函数
document.addEventListener('DOMContentLoaded', function() {
    addButtons(); // 调用addButtons函数，添加按钮到页面上
});


function getOid() {
    console.log("getOid function called");
    var biliComments = document.querySelector('bili-comments'); // 获取bili-comments元素
    var dataParams = biliComments.getAttribute('data-params'); // 获取data-params属性值
    var oid = dataParams.split(',')[1]; // 将data-params属性值按逗号分隔并取第二个值存入oid中

    return oid; // 返回oid的值
}

function getAllRpids() {
    const oid = getOid();
    console.log("getAllRpids function called");

    // 返回一个 Promise 对象
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: `https://api.bilibili.com/x/v2/reply?type=1&oid=${oid}&sort=1&ps=20&pn=1&nohot=0`,
            headers: {
                'Cookie': document.cookie
            },
            onload: function (response) {
                var jsonResponse = JSON.parse(response.responseText);
                var rpidArray = jsonResponse.data.replies.map(reply => reply.rpid);
                resolve(rpidArray); // 使用 resolve 将结果传递出去
            }
        });
    });
}

// 在 reportAllComment 函数中，使用 async/await 来处理异步操作
async function reportAllComment() {
    const oid = getOid();
    try {
        const rpids = await getAllRpids(); // 使用 await 来等待 getAllRpids 的 Promise 结果
        let index = 0;
        const interval = 2500;

        function sendReportRequest() {
            if (index < rpids.length) {
                reportComment(oid, rpids[index]);
                index++;
                setTimeout(sendReportRequest, interval);
            }
        }

        // 调用sendReportRequest函数
        sendReportRequest();
    } catch (error) {
        console.error("Error occurred while getting rpids:", error);
    }
}

// 调用 reportAllComment 函数
reportAllComment();





let csrfText = '';
function getCsrf() {
    if (csrfText === '') {
        const cook = document.cookie.match(/bili_jct=(.*?);/) ?? [];
        if (cook.length === 2) {
            csrfText = cook[1];
        }
    }
    return csrfText;
}
function reportComment(oid, rpid) {
    const csrf = getCsrf();
    const url = `https://api.bilibili.com/x/v2/reply/report?type=1&oid=${oid}&rpid=${rpid}&reason=1&content=&add_blacklist=false&ordering=heat&gaia_source=main_web&csrf=${csrf}`;

    GM.xmlHttpRequest({
        method: "POST",
        url: url,
        headers: {
            'Cookie': document.cookie // Pass the cookies from the page to the request
        },
        responseType: "text",
        onload: function(response) {
            console.log(response.responseText);
        }
    });
}



addButtons();



