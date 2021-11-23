// ==UserScript==
// @name         高能榜显示总人数
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  听说有人想要把高能榜当同接参考？
// @author       Eric Lam
// @license      MIT
// @include      /https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+\??.*/
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @grant        none
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// ==/UserScript==

(async function() {
    'use strict';
    // ====== 设定 ==========
    const seconds = 5 // 隔 X 秒侦测

    // =====================

    const uidRegex = /\/\/space\.bilibili\.com\/(?<id>\d+)\//g
    const roomLink = $('.room-owner-username').attr('href')
    const uid = uidRegex.exec(roomLink)?.groups?.id

    const roomReg = /^\/(blanc\/)?(?<id>\d+)/
    let roomId = parseInt(roomReg.exec(location.pathname)?.groups?.id)

    let rankGold = undefined

    while ($('.tab-list.dp-flex').children().length == 0){
      console.warn(`找不到Tab元素，等待3秒。`)
      await new Promise((res,) => setTimeout(res, 3000)) // wait 3 seconds
    }

    for (const element of $('.tab-list.dp-flex').children()){
        console.log(element.innerText)
        if (element.innerText.startsWith("高能榜")) {
           rankGold = element
        }
    }

    if (!rankGold) {
       console.warn(`找不到高能榜元素。`)
       return
    }

    setInterval(async () => {
        try {

          const resp = await fetch(`https://api.live.bilibili.com/xlive/general-interface/v1/rank/getOnlineGoldRank?ruid=${uid}&roomId=${roomId}&page=1&pageSize=1`)
          if (!resp.ok){
              throw new Error(resp.statusText)
          }
          const data = await resp.json()
          if (data.code != 0){
             throw new Error(data.message || data.code)
          }

          const online = data.data.onlineNum
          rankGold.innerText = `高能榜(${online})`
        }catch(err){
           console.warn(`刷新高能榜时出现错误: ${err}`)
           console.warn(err)
        }
    }, seconds * 1000)
})().catch(console.warn);
