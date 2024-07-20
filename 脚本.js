// ==UserScript==
// @name         BiliBli评论批量举报
// @namespace    https://github.com/ayyayyayy2002/BlibiliCommentBatchReport
// @version      0.0.1
// @description  以“垃圾广告”理由举报评论区的前二十个评论
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @author       You
// @match        https://www.bilibili.com/video/*
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// @grant        GM.xmlHttpRequest
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
    updateDiagnosticInfo("getOid function called\n");
    var biliComments = document.querySelector('bili-comments'); // 获取bili-comments元素
    var dataParams = biliComments.getAttribute('data-params'); // 获取data-params属性值
    var oid = dataParams.split(',')[1]; // 将data-params属性值按逗号分隔并取第二个值存入oid中
    return oid; // 返回oid的值
}

function getAllRpids() {
    const oid = getOid();
    updateDiagnosticInfo("getAllRpids function called\n");

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
        updateDiagnosticInfo("Error occurred while getting rpids:", error+'\n');
    }
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
            updateDiagnosticInfo(response.responseText+'\n');
        }
    });
}









window.onload = function() {
    addButton();



    };

