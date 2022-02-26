// ==UserScript==
// @name         高亮个别用户的弹幕
// @namespace    http://tampermonkey.net/
// @version      0.7.14
// @description  高亮个别用户的弹幕, 有时候找一些特殊人物(其他直播主出现在直播房间)用
// @author       Eric Lam
// @include      /https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+\??.*/
// @include      /https?:\/\/eric2788\.github\.io\/scriptsettings\/highlight-user(\/)?/
// @include      /https?:\/\/eric2788\.neeemooo\.com\/scriptsettings\/highlight-user(\/)?/
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/gh/google/brotli@5692e422da6af1e991f9182345d58df87866bc5e/js/decode.js
// @require      https://cdn.jsdelivr.net/gh/eric2788/bliveproxy@d66adfa34cbf41db3d313f49d0814e47cb3b6c4c/bliveproxy-unsafe.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @grant        GM.xmlHttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @run-at       document-start
// @connect      api.bilibili.com
// @website      https://eric2788.github.io/scriptsettings/highlight-user
// @homepage     https://eric2788.neeemooo.com/scriptsettings/highlight-user
// ==/UserScript==

(async function() {
    'use strict';

    const defaultSettings = {
       highlightUsers: [
        396024008, // 日本兄贵
        604890122, // 日本兄贵
        623441609, // 凤玲天天 (DD)
        1618670884, // 日本兄贵
        406805563, // 乙女音
        2299184, // 古守
        198297, // 冰糖
        1576121 // paryi
       ],
       settings: {
         color: '#FFFF00',
         opacity: 1.0,
         playAudio: false,
         sound: '966q9uq4',
         playAudioDanmu: false,
         sound_danmu: 'ma2g204k',
         join_notify_duration: 5000,
         join_notify_position: "bottom-left",
         volume: {
            danmu: 1.0,
            join: 1.0
         }
       }
    }

    const storage = GM_getValue('settings', defaultSettings)
    const { highlightUsers, settings: currentSettings } = storage
    const settings = { ...defaultSettings.settings, ...currentSettings }
    console.debug(highlightUsers)
    console.debug(settings)

    if (location.origin == 'https://live.bilibili.com'){
        console.log('using highlight filter')

        function hexToNum(color){
            const hex = color.substr(1)
            return parseInt(hex, 16)
        }

        $(document.head).append(`<link href="https://cdn.jsdelivr.net/gh/CodeSeven/toastr@2.1.4/build/toastr.min.css" rel="stylesheet" />`)

        const audio = {
            join: new Audio(`https://mobcup.net/d/${settings.sound}/mp3`),
            danmu: new Audio(`https://mobcup.net/d/${settings.sound_danmu}/mp3`)
        }
        audio.join.volume = settings.volume.join
        audio.danmu.volume = settings.volume.danmu
        const highlights = new Set()
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": true,
            "progressBar": true,
            "positionClass": `toast-${settings.join_notify_position}`,
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": `${settings.join_notify_duration}`,
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }

        const elements = ['.bilibili-live-player-video-danmaku', '.danmaku-item-container']

        async function launch(){
            console.debug('launching highlight filter...')
            while(!unsafeWindow.bliveproxy){
                console.log('cannot not find bliveproxy, wait one second')
                await sleep(1000)
            }
            while(!elements.some(s => $(s).length > 0)){
                console.log('cannot not find element, wait one second')
                await sleep(1000)
            }

            function handleUserEnter(uid, uname){
               console.debug(`user enter: ${uid} (${uname})`)
                if (!highlightUsers.includes(uid)) return
                console.log(`name: ${uname} has enter this live room`)
                toastr.info(`你所关注的用户 ${uname} 已进入此直播间。`, `噔噔咚!`)
                if (settings.playAudio) audio.join.play()
            }

            console.debug('bliveproxy injected.')
            unsafeWindow.bliveproxy.addCommandHandler('DANMU_MSG', command => {
                const userId = command.info[2][0]
                console.debug(`user send danmu: ${userId}`)
                if (!highlightUsers.includes(userId)) return
                console.debug('detected highlighted user: '+userId)
                command.info[0][13] = "{}" // 把那些圖片彈幕打回原形
                if (settings.color) {
                    command.info[0][3] = hexToNum(settings.color)
                }
                command.info[1] += `(${command.info[2][1]})`
                console.debug(`converted danmaku: ${command.info[1]}`)
                highlights.add(command.info[1])
                if (settings.playAudioDanmu) audio.danmu.play()
            })
            unsafeWindow.bliveproxy.addCommandHandler('INTERACT_WORD', ({data}) => {
                const {uid, uname} = data
                handleUserEnter(uid, uname)
            })
            unsafeWindow.bliveproxy.addCommandHandler('ENTRY_EFFECT', ({data}) => {
                const {uid, copy_writing_v2, copy_writing} = data
                const title = copy_writing || copy_writing_v2
                const username = /^欢迎舰长 <%(?<name>.+)?%> 进入直播间$/g.exec(title)?.groups?.name ?? /^欢迎 <%(?<name>.+)?%> 进入直播间$/g.exec(title)?.groups?.name
                console.debug(uid, username, title)
                if (!username) {
                    console.warn(`未知舰长名字: ${uid} (parsing ${title})`)
                    return
                }
                handleUserEnter(uid, username)
            })
            if (settings.opacity){
                const config = { attributes: false, childList: true, subtree: true }
                function danmakuCheckCallback(mutationsList){
                    for(const mu of mutationsList){
                        for (const node of mu.addedNodes){
                            const danmaku = node?.innerText?.trim() ?? node?.data?.trim()
                            if (danmaku === undefined || danmaku === '') continue
                            if (!highlights.has(danmaku)) continue
                            console.debug('highlighting danmaku: '+danmaku)
                            const n = node.innerText !== undefined ? node : node.parentElement
                            const jimaku = $(n)
                            jimaku.css('opacity', `${settings.opacity}`)
                            highlights.delete(danmaku)
                        }
                    }
                }
                const danmakuObserver = new MutationObserver((mu, obs) => danmakuCheckCallback(mu))
                danmakuObserver.observe($('.bilibili-live-player-video-danmaku')[0] || $('.danmaku-item-container')[0], config)
            }
        }

        await launch()
    }else if (["https://eric2788.github.io", "https://eric2788.neeemooo.com"].includes(location.origin)){
        while(!unsafeWindow.mdui){
           console.debug('cannot find mdui, wait one second')
           await sleep(1000)
        }
        const $ = mdui.$
        async function appendUser(userId){
            if ($(`#${userId}`).length > 0){
               mdui.alert('该用户已在列表内')
               return false
            }
            try {
                const lastUpdate = GM_getValue('last.update', new Date())
                const haveData = GM_getValue(userId, null) != null
                const today = new Date()
                if (!haveData || Math.abs(today - lastUpdate) > (86400 * 1000 * 7)) {
                  console.log('cache outdated, updating user info...')
                  const { name, face } = await webRequest(`https://api.bilibili.com/x/space/acc/info?mid=${userId}&jsonp=jsonp`)
                  GM_setValue(userId, {name, face})
                  GM_setValue('last.update', new Date())
                  console.log('user info updated and saved to cache.')
                }else{
                  console.log('loading user info from cache.')
                }
                const {name, face} = GM_getValue(userId, {name: `无法索取用户资讯`, face: ''})
                $('#hightlight-users').append(`
                    <label class="mdui-list-item mdui-ripple">
                        <div class="mdui-checkbox">
                            <input type="checkbox" id="${userId}"/>
                            <i class="mdui-checkbox-icon"></i>
                        </div>
                        <div class="mdui-list-item-avatar"><img src="${face}"/></div>
                        <div class="mdui-list-item-content">${name} (${userId})</div>
                   </label>
                `)
                return true;
            }catch(err){
                console.warn(err)
                if (err.code == -412){
                  const {name, face} = GM_getValue(userId, {name: `无法索取用户资讯`, face: ''})
                  $('#hightlight-users').append(`
                    <label class="mdui-list-item mdui-ripple">
                        <div class="mdui-checkbox">
                            <input type="checkbox" id="${userId}"/>
                            <i class="mdui-checkbox-icon"></i>
                        </div>
                        <div class="mdui-list-item-avatar"><img src="${face}"/></div>
                        <div class="mdui-list-item-content">${name} (${userId})</div>
                   </label>
                  `)
                  return true;
                }else{
                  mdui.alert(`无法索取 ${userId} 的用户资讯: ${err.message}`)
                  return false;
                }
            }finally{
              $(`#${userId}`).on('change', e => {
                if (getTicked().length > 0) {
                    $('#delete-btn').show()
                } else {
                    $('#delete-btn').hide()
                }
              })
            }
       }


        function getTicked() {
            return $('#hightlight-users').find('.mdui-checkbox > input').filter((i, e) => $(e).prop('checked')).map((i, e) => $(e).attr('id'))
        }

        $('#delete-btn').on('click', e => {
            getTicked().each((i, id) => $(`#${id}`).parents('.mdui-list-item').remove())
            GM_setValue('settings', getSettings())
            mdui.snackbar('删除并保存成功')
            $('#delete-btn').hide()
        })

        $('#user-add').on('keypress', async (e) => {
            if (e.which != 13) return
            if (!$('#user-add')[0].checkValidity()) return
            if (await appendUser(e.target.value)){
               GM_setValue('settings', getSettings())
               mdui.snackbar('新增并保存成功')
               e.target.value = ''
            }
        });

        $('#save-btn').on('click', e => {
            if (!$('form')[0].checkValidity()){
               mdui.snackbar('保存失败，请检查格式或漏填')
               return
            }
            GM_setValue('settings', getSettings())
            mdui.snackbar('保存成功')
        })

        $('#try-listen').on('click', () => {
           const selected = $('input[name=sound]:checked').val()
           const audio = new Audio(`https://mobcup.net/d/${selected}/mp3`)
           audio.volume = parseVolume('#volume-join')
           audio.addEventListener('canplaythrough', () => audio.play())
        })

        $('#try-listen-danmu').on('click', () => {
           const selected = $('input[name=sound-danmu]:checked').val()
           const audio = new Audio(`https://mobcup.net/d/${selected}/mp3`)
           audio.volume = parseVolume('#volume-danmu')
           audio.addEventListener('canplaythrough', () => audio.play())
        })

        const joinNotifyPosSelect = new mdui.Select('#join-notify-position', {position: 'bottom'})


        $('#import-setting').on('click', async () => {
           try {
             const area = $('#setting-area').val()
             const {highlightUsers, settings: currentSettings } = JSON.parse(area)
             const settings = { ...defaultSettings.settings, ...currentSettings }
             $('.mdui-list-item').remove() // clear old data
             await initializeSettings({highlightUsers, settings})
             mdui.snackbar('设定档导入成功，请记得按下保存')
             $('#setting-area').val('')
           }catch(err){
             console.error(err)
             mdui.snackbar('设定档导入失败，请检查格式有没有错误')
           }
        })

        $('#export-setting').on('click', () => {
             const area = JSON.stringify(getSettings())
             $('#setting-area').val(area)
             const text = $('#setting-area')[0]
             text.select();
             text.setSelectionRange(0, 99999);
             document.execCommand("copy")
             mdui.snackbar('设定档已导出并复制成功')
             $('#setting-area').val('')
        })

        async function initializeSettings({highlightUsers, settings}){
            await Promise.all(highlightUsers.map((id) => appendUser(id)))
            $('#opacity')[0].valueAsNumber = settings.opacity
            $('#color').val(settings.color)
            $('#color-picker').val(settings.color)
            $('#color-picker-btn').css('color', settings.color)
            $('#play-audio').prop('checked', settings.playAudio)
            $('input[name=sound]').filter((i, e) => $(e).val() == settings.sound).prop('checked', true)
            $('#play-audio-danmu').prop('checked', settings.playAudioDanmu)
            $('input[name=sound-danmu]').filter((i, e) => $(e).val() == settings.sound_danmu).prop('checked', true)
            $('#join-notify-duration')[0].valueAsNumber = settings.join_notify_duration
            $('#join-notify-position').val(settings.join_notify_position)
            $('#volume-danmu').val(settings.volume.danmu * 100)
            $('#volume-join').val(settings.volume.join * 100)
            mdui.updateSliders()
            joinNotifyPosSelect.handleUpdate()
            $('#list-loading').hide()
        }

        await initializeSettings({highlightUsers, settings})

        function getSettings(){
            const users = new Set()
            $('#hightlight-users').find('.mdui-checkbox > input').map((i, e) => parseInt($(e).attr('id'))).filter((i,e) => !!e).each((i,e) => users.add(e))
            const settings = {
                opacity: $('#opacity')[0].valueAsNumber,
                color: $('#color')[0].checkValidity() ? $('#color').val() : '',
                playAudio: $('#play-audio').prop('checked'),
                sound: $('input[name=sound]:checked').val(),
                sound_danmu: $('input[name=sound-danmu]:checked').val(),
                playAudioDanmu: $('#play-audio-danmu').prop('checked'),
                join_notify_duration: $('#join-notify-duration')[0].valueAsNumber,
                join_notify_position: $('#join-notify-position').val(),
                volume: {
                   danmu: parseVolume('#volume-danmu'),
                   join: parseVolume('#volume-join')
                }
            }
            return { highlightUsers: [...users], settings }
        }

        function parseVolume(element){
            const val = $(element)[0].value
            if (val == 0) return 0.0
            return parseFloat((val / 100).toFixed(2)) || 1.0
        }

    }
})().catch(console.error);

async function webRequest(url){
    const data = await GM.xmlHttpRequest({
            method: "GET",
            headers: {
                'Content-type' : 'application/json',
                'Referer': 'https://www.bilibili.com',
                'Origin': 'https://www.bilibili.com'
            },
            url
          })
    const res = JSON.parse(data.response)
    if (res.code !== 0) throw res
    return res.data
}

async function sleep(ms){
   return new Promise((res,) => setTimeout(res,ms))
}
