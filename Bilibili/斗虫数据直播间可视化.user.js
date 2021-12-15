// ==UserScript==
// @name         斗虫数据直播间可视化
// @namespace    http://tampermonkey.net/
// @version      0.4.8
// @description  添加数据元素到直播间
// @author       Eric Lam
// @grant        GM.xmlHttpRequest
// @compatible   Chrome(80.0)
// @compatible   Firefox(74.0)
// @compatible   Edge(80.0)
// @license      MIT
// @include      /https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+\??.*/
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js
// @source       https://github.com/eric2788/Bilibili-Vup-Stream-Details
// ==/UserScript==


const roomReg = /^\/(blanc\/)?(?<id>\d+)/
let roomId = parseInt(roomReg.exec(location.pathname)?.groups?.id)

const userIdReg = /\/\/space\.bilibili\.com\/(?<id>\d+)\//g

console.log('bilibili vup stream details is enabled on this page.')

async function validate(){
    if (isNaN(roomId)) {
        throw new Error('this is not living room')
    }
    const roomLink =  $('a.room-cover.dp-i-block.p-relative.bg-cover').attr('href') || $('.room-owner-username').attr('href')
    let uid;
    if (!roomLink){
        console.log('this is theme living room, using roomId')
        uid = ''
    }else{
        uid = userIdReg.exec(roomLink)?.groups?.id
    }
    const userId = parseInt(uid)
    let detection;
    if (isNaN(userId)){
        console.log(`cannot get the userId from the page, using roomId(${roomId}) for detection.`)
        detection = (s) => s.roomId == roomId || s.shortId == roomId
    }else{
        console.log(`successfully get the userId, using userId(${userId}) for detection.`)
        detection = (s) => s.uid == userId
    }
    console.log('fetching vup api')
    let data;
    try{

        const res = await request('https://vup.darkflame.ga/api/online')
        if (res.status !== 200) throw new Error(`${res.statusText} (${res.status})`)
        data = JSON.parse(res.response)
    }catch(err){
        console.warn(`error while fetching vup api: ${err}`)
        console.warn('restart after 5 secs')
        await sleep(5000)
        return await validate()
    }
    console.log('fetched successful')
    const roomIdVup = data.list.find(detection)?.roomId
    if (roomIdVup){
        if(roomIdVup != roomId){
            console.log(`roomId from url (${roomId}) is not match as roomId in vup.darkflame.ga (${roomIdVup}), gonna use roomId from vup.darkflame.ga`)
            roomId = roomIdVup
        }
        return true
    }
    return false
}

async function request(url, method = 'GET'){
  return GM.xmlHttpRequest({
          method: method,
          url: url
  })
}


async function sleep(ms){
    return new Promise((res,) => setTimeout(res, ms))
}


async function insertViewerDom(){
    const ele = $('.upper-row > .right-ctnr')
    if ((ele?.length ?? 0) === 0){
        console.warn('unknown element. retry after 3 secs')
        await sleep(3000)
        return await insertViewerDom()
    }
    ele.append(`
        <span class="action-text v-middle live-skin-normal-text dp-i-block">【</span>
        <div style="color: gray" title="已知互动人数" class="right-action-ctnr dp-i-block">
            <span class="action-text v-middle live-skin-normal-text dp-i-block">互动: </span>
            <span class="action-text v-middle live-skin-normal-text dp-i-block" id="stream-viewer">--</span>
        </div>
        <div style="color: gray" title="真实弹幕数" class="right-action-ctnr dp-i-block">
        <span class="action-text v-middle live-skin-normal-text dp-i-block">弹幕: </span>
            <span class="action-text v-middle live-skin-normal-text dp-i-block" id="stream-danmaku">--</span>
            <span class="action-text v-middle live-skin-normal-text dp-i-block">
                (<span id="stream-viewer-danmaku">--</span>人)
            </span>
        </div>
        <span class="action-text v-middle live-skin-normal-text dp-i-block">】</span>
    `)
    const popularEle = $('div[title=人气值]')
    popularEle.append(`
        (最高: <span id="stream-highest-popular">--</span>)
    `)
    console.log(`room id is ${roomId}`)
}

const toDisplay =  (num) => num > 10000 ? num = (num / 10000).toFixed(1).concat("万") : num

const display = {
    setEle: function(ele, num){
        $(ele)[0].innerText = toDisplay(num)
    },
    setViewer: function(num){
        this.setEle('#stream-viewer', num)
    },
    setDanmaku: function(num){
        this.setEle('#stream-danmaku', num)
    },
    setDanmakuViewer: function(num){
        this.setEle('#stream-viewer-danmaku', num)
    },
    setHighestPopular: function(num){
        this.setEle('#stream-highest-popular', num)
    }
}

async function getVupToken(){
   const res = await request(`https://vup.darkflame.ga/api/roomHub/negotiate?roomId=${roomId}&negotiateVersion=1`, 'POST')
   const data = JSON.parse(res.responseText)
   if (!data.connectionToken){
      console.warn('找不到 Token, 一分钟后尝试')
      await sleep(60000)
      return await getVupToken()
   }
   return data.connectionToken
}

// websocket
async function startVupSignalR(id){
    const wss = `wss://vup.darkflame.ga/api/roomHub?roomId=${roomId}&id=${id}`

    const connection = new signalR.HubConnectionBuilder()
    .withUrl(wss, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .build();
    try{
        await connection.start();
    }catch(err){
        console.log(`error while connecting to signalR: ${err}`)
        await sleep(2000)
        return await startVupSignalR()
    }
    console.log('signalR connected.')
    connection.on("ReceiveRoomData", (_, data) => {
        //console.debug(data)
        display.setViewer(data.participants)
        display.setDanmaku(data.realDanmaku)
        display.setDanmakuViewer(data.danmakuUser)
        display.setHighestPopular(data.maxPopularity)
    });
    connection.onclose(() => {
        console.warn(`web socket closed abnormally. reconnting after 3 secs`)
		sleep(3000).then(startVupSignalR).catch(err => console.error(err.message))
    })
    connection.onreconnected(() => console.log(`websocket reconnected.`))
    connection.onreconnecting(error => {
        if (error) console.log(`encountered error: ${error}`)
        console.log(`websocket reconnecting...`)
    })
}

async function start(){
    if (!await validate()) {
        console.log('this live room is not virtual up or not broadcasting now, skipped')
    }else{
        console.log('this live room is virtual up, using vup.darkflame.ga')
        await insertViewerDom()
        const token = await getVupToken()
        await startVupSignalR(token)
    }
}

(function() {
    'use strict';
    if (location.pathname.startsWith('/p/')) return
    start().catch(err => console.error(err.message))
})();
