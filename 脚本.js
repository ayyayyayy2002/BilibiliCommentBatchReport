// ==UserScript==
// @name         BiliBli评论批量举报
// @namespace    https://github.com/ayyayyayy2002/BlibiliCommentBatchReport
// @version      0.0.4
// @description  用“垃圾广告”理由举报评论区的所有评论
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @connect      api.bilibili.com
// @author       You
// @match        https://www.bilibili.com/video/*
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// @grant        GM.xmlHttpRequest
// @downloadURL https://update.greasyfork.org/scripts/501280/BiliBli%E8%AF%84%E8%AE%BA%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.user.js
// @updateURL https://update.greasyfork.org/scripts/501280/BiliBli%E8%AF%84%E8%AE%BA%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.meta.js
// ==/UserScript==

// 创建用于显示诊断信息的窗口
const floatingWindow = document.createElement('div');
floatingWindow.style.position = 'fixed';
floatingWindow.style.top = '90px';
floatingWindow.style.right = '20px';
floatingWindow.style.zIndex = '9999';
floatingWindow.style.background = 'white';
floatingWindow.style.border = '1px solid #ccc';
floatingWindow.style.padding = '10px';
floatingWindow.style.maxWidth = '250px';
floatingWindow.style.overflow = 'auto'; // Add overflow property for scrolling
floatingWindow.style.height = '200px'; // Set a height for the window
floatingWindow.style.scrollBehavior = 'smooth'; // Enable smooth scrolling
document.body.appendChild(floatingWindow);
// Create diagnostic info container
const diagnosticInfo = document.createElement('div');
floatingWindow.appendChild(diagnosticInfo);
// Function to scroll to the bottom of the floating window
function scrollToBottom() {
  floatingWindow.scrollTop = floatingWindow.scrollHeight;
  // Scroll the last element into view
  const lastElement = floatingWindow.lastElementChild;
  if (lastElement) {
    lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
// Updating the diagnosticInfo.innerHTML with the scroll to bottom
function updateDiagnosticInfo(content) {
  diagnosticInfo.innerHTML += content;
  scrollToBottom();
}

function addButton() {
  // Existing button creation code remains unchanged
  // Add a call to sendReportRequest before calling the existing functionality
  const button = document.createElement('button');
  button.textContent = '自动举报所有评论';
  button.style.position = 'fixed';
  button.style.top = '60px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.onclick = function() {
    reportAllComment();
  };
  document.body.appendChild(button);
}





function getOid() {
    //updateDiagnosticInfo("获取OID<br>");
    var biliComments = document.querySelector('bili-comments'); // 获取bili-comments元素
    var dataParams = biliComments.getAttribute('data-params'); // 获取data-params属性值
    var oid = dataParams.split(',')[1]; // 将data-params属性值按逗号分隔并取第二个值存入oid中
    return oid; // 返回oid的值
}

let page = 1; // 初始化 page 值为 1

async function reportAllComment() {
    const oid = getOid();

    try {
        while (true) { // 无限循环，直到手动停止
            const rpids = await getAllRpids(); // 先获取当前页的 rpid

            if (rpids.length === 0) {
                updateDiagnosticInfo('<strong style="font-size: 2em; color: blue;">全部评论举报完成</strong><br>');
                console.log("完成"); // 输出“完成”
                break; // 如果没有 rpid，停止循环
            }

            await processRpids(oid, rpids); // 处理当前页面的 rpid

            page++; // 增加 page 值，准备下一次请求
        }
    } catch (error) {
        updateDiagnosticInfo("获取 RPID 时发生错误: " + error + '\n');
    }
}

function getAllRpids() {
    const oid = getOid();
    updateDiagnosticInfo(`获取RpID，当前页码： ${page}<br>`);

    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: `https://api.bilibili.com/x/v2/reply?type=1&oid=${oid}&sort=1&ps=20&pn=${page}&nohot=0`,
            headers: {
                'Cookie': document.cookie
            },
            onload: function (response) {
                var jsonResponse = JSON.parse(response.responseText);
                //console.log(jsonResponse);  // 输出请求返回的完整值至控制台
                const replies = jsonResponse.data.replies || []; // 确保回复存在
                var rpidArray = replies.map(reply => reply.rpid);
                resolve(rpidArray); // 返回 rpid 数组
            },
            onerror: function (error) {
                reject(error); // 处理请求错误
            }
        });
    });
}

async function processRpids(oid, rpids) {
    let index = 0;
    const interval = 3000;

    // 使用一个 Promise 来确保所有请求都完成
    const promises = rpids.map((rpid, idx) => {
        return new Promise(resolve => {
            setTimeout(() => {
                reportComment(oid, rpid);
                resolve(); // 完成当前 rpid 的报告
            }, idx * interval); // 每个请求之间的间隔
        });
    });

    // 等待所有 rpid 的请求完成
    await Promise.all(promises);
}







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
    const csrf = getCsrf(); // 获取 CSRF
    const url = `https://api.bilibili.com/x/v2/reply/report?type=1&oid=${oid}&rpid=${rpid}&reason=1&content=&add_blacklist=false&ordering=heat&gaia_source=main_web&csrf=${csrf}`;

    // 创建 XMLHttpRequest 对象
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // 设置请求头
    xhr.withCredentials = true; // 允许发送 cookies

    // 处理响应
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            updateDiagnosticInfo(`成功举报 RpID: ${rpid} - 响应内容: ${xhr.responseText}<br>`);
        } else {
            updateDiagnosticInfo(`举报 RpID 失败: ${rpid} 状态码: ${xhr.status}<br>`);
        }
    };

    xhr.onerror = function() {
        console.error("请求错误，rpid:", rpid);
    };

    // 构建请求体（如果需要，可以根据 API 文档进行调整）
    const body = `oid=${oid}&rpid=${rpid}&reason=1&content=&add_blacklist=false&ordering=heat&gaia_source=main_web&csrf=${csrf}`;

    xhr.send(body); // 发送请求
}










window.onload = function() {
    addButton();



    };

