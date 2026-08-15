// ==UserScript==
// @name        S-R in Editor ⭐
// @namespace        http://tampermonkey.net/
// @version        3.9
// @description        通常編集枠で実行できる 検索 / 置換 ツール
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/entry/srventry*
// @exclude        https://blog.ameba.jp/ucs/entry/srventrylist.do*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameba.jp
// @grant        none
// @updateURL        https://github.com/personwritep/S-R_in_Editor/raw/main/S-R_in_Editor.user.js
// @downloadURL        https://github.com/personwritep/S-R_in_Editor/raw/main/S-R_in_Editor.user.js
// ==/UserScript==


let retry=0;
let interval=setInterval(wait_target, 100);
function wait_target(){
    retry++;
    if(retry>10){ // リトライ制限 10回 1sec
        clearInterval(interval); }
    let target=document.getElementById('cke_1_contents'); // 監視 target
    if(target){
        clearInterval(interval);
        main(); }}



function main(){
    let p_flag; // Process
    let t_flag; // TEXT処理
    let t_or_h=1; // TEXT・HTML選択スイッチ用フラグ
    let arg_t_or_h; // TEXT・HTML選択が必要な場合
    let count_t;
    let count_h;
    let buffer;
    let buffer_arr=[];
    let avoid=[];
    let caution;
    let hk; // ハイライト要素のインデックス
    let native_hk; // フォーカス要素のインデックス履歴
    let editor_iframe;
    let iframe_doc;
    let iframe_html;
    let iframe_body;
    let js_cover;
    let panel=0; // s_container の表示フラグ

    let search_box;
    let search_word;
    let search_word_es;
    let replace_box;
    let replace_word;
    let result_box;
    let s_1;
    let s_2;
    let s_3;
    let s_4;
    let s_5;
    let s_6;
    let s_7;
    let s_8;
    let s_9;


    let sr_data=[]; // 連続処理モードの検索/置換データの登録

    reg_set();

    function reg_set(){
        let read_json=localStorage.getItem('sr_editor'); // ローカルストレージ 保存名
        sr_data=JSON.parse(read_json);
        if(sr_data==null){
            sr_data=['0', '1', '', '']; }} // 連続処理モード「0」連続処理OFF「1」は一括処理



    let cke_1_contents=document.getElementById('cke_1_contents'); // 監視 target
    let monitor=new MutationObserver(catch_key);
    monitor.observe(cke_1_contents, {childList: true}); // ショートカット待受け開始

    catch_key();

    function catch_key(){
        search_box=document.querySelector('#search_box');
        editor_iframe=document.querySelector('.cke_wysiwyg_frame');

        if(editor_iframe){ //「通常表示」の場合
            if(search_box){
                add_mu_style(); // muタグ用 styleを再設定
                toc_style(1); // 目次の無効化デザインを再設定
                search_box.disabled=false; }

            document.addEventListener("keydown", check_key); // documentは先に指定
            iframe_doc=editor_iframe.contentWindow.document;
            if(iframe_doc){
                iframe_doc.addEventListener("keydown", check_key); } // iframeは後に指定

            function check_key(event){
                if(event.ctrlKey==true){
                    if(event.keyCode==123){
                        if(p_flag!=3){ // 置換チェック時でなければ「Ctrl+F12」でON/OFF
                            event.stopImmediatePropagation();
                            search_replace();
                            if(!editor_iframe){
                                if_html(); }}}
                    else if(event.keyCode==13){
                        if(p_flag==3){
                            event.stopImmediatePropagation();
                            pusher(); }
                        else{
                            event.stopImmediatePropagation();
                            if(event.altKey){
                                delete_mu();
                                publish(); }}}}
                if(event.keyCode==27){
                    if(p_flag==3){ // 置換チェック時に「Esc」で置換チェックを解除=UNDO
                        event.preventDefault();
                        out_p_flag3(); }}
                if(event.keyCode==9){
                    if(p_flag==0){ // 編集時に編集枠から「Tab」で検索に戻る
                        event.preventDefault();
                        search_box.focus(); }}
                if(event.keyCode==9 || event.keyCode==16 || event.keyCode==17 ||
                   event.keyCode==18 || event.keyCode==19 || event.keyCode==32){
                    if(p_flag==3){ // 置換チェック時に「Tab/Shift/Ctrl/Alt/Pause/Space」を無効化
                        event.preventDefault(); }}}
        } //「通常表示」の場合
        else{
            if_html(); } //「HTML表示」の場合


        function out_p_flag3(){ // 置換チェックを解除する
            iframe_body.innerHTML=buffer; // 置換処理をUNDO ⏹
            get_search();
            js_cover_remove();
            s_8.style.display='none';
            reset_mu_style();
            if(t_flag>0){ //「buffer」を戻したので再度ハイライト表示
                t_flag=1;
                t_process(); // ⬛RegExp
                next(hk); } // UNDO時の巡回表示
            replace_box.focus();
            p_flag=2; } // 2=置換入力


        function if_html(){ //「HTML表示」を開いた場合のクローズ処理
            let s_container=document.querySelector('#s_container');
            if(s_container){
                search_box.disabled=true;
                result_box.textContent='　';
                s_1.style.display='none';
                replace_box.style.display='none';
                replace_box.value='';
                s_2.style.display='none';
                s_3.style.display='none';
                s_4.style.display='none';
                s_5.style.display='none';
                s_8.style.display='none';
                t_flag=0;
                p_flag=0; }}


        function pusher(){
            s_2.click(); }

    } // catch_key



    function disp_s_container(){
        monitor.disconnect(); // MutationObserverを 起動表示に反応させない
        let insert_div=
            '<div id="s_container">'+
            '<input id="search_box" placeholder=" 検索文字" autocomplete="off">'+
            '<span id="result">　</span>'+
            '<span class="s_sw s_6">▲ Caution: '+
            '<span class="c_nb">nbsp</span> <span class="c_lt">&lt</span> '+
            '<span class="c_gt">&gt</span> <span class="c_am">&amp;</span></span>'+
            '<span class="s_sw s_1">　</span>'+
            '<input id="replace_box" placeholder=" 置換文字" autocomplete="off">'+
            '<span class="s_sw s_2">OK</span>'+
            '<span class="s_sw s_3">UNDO</span>'+
            '<span class="s_sw s_4"></span>'+
            '<span class="s_sw s_5"></span>'+
            '<span class="s_sw s_7">✖ 閉じる</span>'+
            '<span class="s_sw s_8">C</span>'+
            '<span class="s_sw s_9">?</span>'+
            '</div>';

        let l_body=document.querySelector('body.l-body');
        if(!l_body.querySelector('#s_container')){
            l_body.insertAdjacentHTML('beforeend', insert_div); }

        let insert_style=
            '<style id="s_r_style">'+
            '#s_container { position: absolute; top: 12px; left: calc(50% - 490px); '+
            'min-width: 925px; padding: 6px 38px 6px 15px; background: #fff; '+
            'border: 1px solid #aaa; border-radius: 4px; white-space: nowrap; z-index: 11; }'+
            '#search_box { width: 210px; }'+
            '#s_container * { user-select: none; }'+
            '#replace_box { width: 210px; display: none; }'+
            '::placeholder { font-size: 15px; color: #bbb; }'+
            '#s_container input:disabled { color: #000; background: #eef1f3; }'+
            '#s_container input { font-size: 16px; padding: 3px 6px 1px; -moz-appearance: none; '+
            'border: 1px solid #888; border-radius: 3px; }'+
            '#result { display: inline-block; font-size: 16px; padding: 4px 6px 2px; height: 22px; '+
            'margin-left: 5px; min-width: 50px; border: 1px solid #888; border-radius: 3px; }'+
            '.s_sw { display: inline-block; font-size: 15px; padding: 5px 6px 2px; '+
            'border: 1px solid #888; border-radius: 3px; }'+
            '.s_1 { margin: 0 15px; min-width: 4em; display: none; }'+
            '.s_1 span { color: #fff; }'+
            '.s_2, .s_3, .s_4 { color:#fff; background: #1e88e5; cursor: pointer; display: none; }'+
            '.s_3, .s_5 { margin-left: 5px; }'+
            '.s_2, .s_4 {margin-left: 15px; }'+
            '.s_5 { position: fixed; top: 70px; right: calc(50% - 490px); width: 175px; '+
            'padding: 10px 10px 8px 20px; border-radius: 4px; background: #e3f2fd; '+
            'white-space: initial; display: none; }'+
            '.s_5 c { display: inline-block; height: 21px; margin: 5px 3px; padding: 0 3px; '+
            'outline: 1px solid #aaa; line-height: 24px; background: #fff; }'+
            '.s_6 { margin-left: -1px; background: #ffcc00; display: none; white-space: nowrap; }'+
            '.s_6:hover { width: auto !important; padding: 5px 8px 2px !important; }'+
            '.c_nb, .c_lt, .c_gt, .c_am { font-weight: bold; }'+
            '.s_7 { position: absolute; right: 38px; }'+
            '.s_8 { margin-left: 15px; color: #fff; background: #ddd; cursor: pointer; display: none; }'+
            '.s_9 { position: absolute; top: 11px; right: 8px; padding: 3px 5px 0; line-height: 16px; '+
            'font-weight: bold; color: #fff; border-radius: 30px; background: #aaa; cursor: pointer; }'+
            '.js_cover { position: fixed; top: 0; width: 100%; height: 100%; '+
            'background: rgba(0, 0, 0, .6); z-index: 10; display: none; }'+
            '</style>';

        if(!document.querySelector('#s_r_style')){
            document.body.insertAdjacentHTML('beforeend', insert_style); }

        add_mu_style(); // muタグを設定
        toc_avoid(1);

        monitor.observe(cke_1_contents, {childList: true});

    } // disp_s_container() 「開始処理」



    function toc_avoid(n){
        let nav=iframe_body.querySelector('nav[aria-labelledby*="toc-"]');
        if(nav){
            if(n==1){
                toc_style(1);
                nav.removeAttribute('data-toc'); }
            else{
                nav.scrollIntoView();
                iframe_html.scrollBy(0, -12);
                setTimeout(()=>{
                    toc_style(0);
                    nav=iframe_body.querySelector('nav[aria-labelledby*="toc-"]');
                    nav.setAttribute('data-toc', '1.0.0');
                }, 800); }}}



    function s_container_remove(){
        let s_container=document.querySelector('#s_container');
        monitor.disconnect(); // MutationObserverを 起動表示に反応させない
        delete_mu();
        native_hk=-1; // 初期化🅿
        s_container.remove();
        panel=0;
        title_sw_remove();
        toc_avoid(0);
        monitor.observe(cke_1_contents, {childList: true});

    } // s_container_remove() 「終了処理」



    function disp_js_cover(){
        monitor.disconnect(); // MutationObserverを 起動表示に反応させない
        let cover='<div class="js_cover"></div>';
        if(!document.querySelector('.js_cover')){
            document.querySelector('#js-container').insertAdjacentHTML('beforeend', cover); }

        js_cover=document.querySelector('.js_cover'); // js_coverを取得
        monitor.observe(cke_1_contents, {childList: true}); }


    function js_cover_remove(){
        js_cover.style.display='none';
        cke_1_contents.style.zIndex='3';
        iframe_body.contentEditable='true'; // 編集可能にする
        search_box.disabled=false;
        replace_box.disabled=false;
        s_2.style.display='none';
        s_3.style.display='none';
        s_4.style.display='none';
        s_5.style.display='none';
        s_7.style.display='inline-block'; }



    function search_replace(){
        editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        if(editor_iframe){ //「通常表示」の場合
            iframe_doc=editor_iframe.contentWindow.document;
            iframe_html=iframe_doc.querySelector('html');
            iframe_body=iframe_doc.querySelector('body.cke_editable'); }


        disp_js_cover();

        let s_container=document.querySelector('#s_container');
        if(s_container){ // #s_container がある場合は「Ctrl+F12」で終了  「muタグを削除」
            s_container_remove(); }

        else{ //#s_containerが無い場合 生成して開始
            disp_s_container();
            panel=1;

            search_box=document.querySelector('#search_box');
            result_box=document.querySelector('#result');
            replace_box=document.querySelector('#replace_box');
            s_1=document.querySelector('.s_1');
            s_2=document.querySelector('.s_2');
            s_3=document.querySelector('.s_3');
            s_4=document.querySelector('.s_4');
            s_5=document.querySelector('.s_5');
            s_6=document.querySelector('.s_6');
            s_7=document.querySelector('.s_7');
            s_8=document.querySelector('.s_8');
            s_9=document.querySelector('.s_9');

            if(sr_data[0]==1){ // 連続処理の場合
                search_word=sr_data[2];
                search_box.value=sr_data[2]; // 🟥検索文字取得

                get_search(); // ⬛RegExp
                result_box_disp();

                if(count_t==0){
                    alert("　✅ 連続検索に設定された検索文字がありません"); }

                if(count_t>0 || count_t==0){

                    setTimeout(()=>{
                        replace_process(); }, 20);

                    setTimeout(()=>{
                        replace_word=sr_data[3]; // 🟥置換文字取得
                        replace_box.style.display='inline-block';
                        replace_box.value=sr_data[3];

                        cke_1_contents.style.zIndex='11';
                        iframe_body.contentEditable='false'; // 編集不可にする
                        search_box.disabled=true;
                        replace_box.disabled=true;

                        s_2.style.display='inline-block';
                        s_3.style.display='inline-block';
                        s_4.textContent='一括　選択';
                        s_4.style.display='inline-block';
                        if(sr_data[1]==1){
                            t_flag=1;
                            s_4.style.boxShadow='inset -45px 0 0 0 #b0bec5'; }
                        else if(sr_data[1]==2){
                            t_flag=2;
                            s_4.style.boxShadow='inset 45px 0 0 0 #b0bec5'; }
                        s_5.style.display='inline-block';
                        disp_help();
                        s_7.style.display='none';
                        s_8.style.background='#333';
                        s_8.style.display='inline-block';
                        js_cover.style.display='block';

                        add2_mu_style();

                        p_flag=3;
                        if(sr_data[1]==1){ // 一括置換
                            t2_process(); } // ⬛RegExp
                        else if(sr_data[1]==2){ // 選択置換
                            iframe_body.innerHTML=buffer; // 置換処理を一旦デフォルトに戻す ⏹
                            get_search();
                            t_process(); } // ⬛RegExp
                        native_hk=-1;
                        hk=0;
                        next(hk); }, 30);


                    function disp_help(){
                        if(t_flag==1){
                            s_5.innerHTML=
                                '<c>⇧</c><c>⇩</c>：移動<br>'+
                                '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                                '検索した全箇所が置換えられる事に注意ください<br>'+
                                '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                                '<c>OK</c> / <c>Ctrl</c>+<c>Enter</c><br>'+
                                '　　 ：置換を確定する<br>'+
                                '<c>UNDO</c> / <c>Esc</c><br>'+
                                '　　 ：全て元に戻す'; }
                        else if(t_flag==2){
                            s_5.innerHTML=
                                '<c>⇧</c><c>⇩</c>：移動<br>'+
                                '<c>Space</c>：設定 / 解除<br>'+
                                '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                                '設定した箇所のみに置換を実行します<br>'+
                                '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                                '<c>OK</c> / <c>Ctrl</c>+<c>Enter</c><br>'+
                                '　　 ：置換を確定する<br>'+
                                '<c>UNDO</c> / <c>Esc</c><br>'+
                                '　　 ：全て元に戻す'; }}


                }} // 連続処理の場合


            p_flag=0; // 0=検索文字 未確定
            search_box.focus();
            search_box.onkeydown=function(event){ // 🔽検索ツール操作の開始点

                if(event.keyCode==13 && !event.ctrlKey){ //「Enter」でnot「+Ctrl」
                    if(p_flag==0){
                        event.preventDefault();
                        search_word=search_box.value; // 🟥検索文字取得
                        native_hk=-1; // 初期化🅿
                        get_search();
                        result_box_disp(); }
                    else if(p_flag==1){
                        event.preventDefault();
                        if(search_box.value==search_word){
                            if(caution==1 && t_flag>0 ){
                                s_6.style.display='inline-block';
                                arg_t_or_h=0; } // caution文字チェックに該当し「置換」は不可
                            else{
                                replace_box.style.display='inline-block';
                                replace_box.focus();
                                arg_t_or_h=0;
                                p_flag=2;
                                replace_process(); }} // 巡回ループを抜けて 置換入力へ
                        else{
                            iframe_body.innerHTML=buffer; // highlight を抜ける時はリセット ⏹
                            search_word=search_box.value; // 🟥検索文字取得 変更
                            native_hk=-1; // 初期化🅿
                            caution_reset();
                            s_1.style.display='none';
                            arg_t_or_h=0;
                            p_flag=0; // 巡回ループを抜けて 検索文字 未確定へ
                            search_box.dispatchEvent(new KeyboardEvent( "keydown", {keyCode: 13})); }
                    }} //「Enter」入力

                if(event.keyCode==13 && event.ctrlKey){ //「Enter+Ctrl」
                    if(search_box.value==''){
                        s_container_remove(); }} // ツールの終了

                if(event.keyCode==9){ //「Tab」で置換入力へ
                    if(p_flag==0){
                        event.preventDefault(); } //「Tab」で入力枠外に出るのを抑止
                    else if(p_flag==1){
                        event.preventDefault();
                        if(caution==1 && t_flag>0 ){
                            s_6.style.display='inline-block';
                            arg_t_or_h=0; } // caution文字チェックに該当し「置換」は不可
                        else{
                            replace_box.style.display='inline-block';
                            replace_box.focus();
                            arg_t_or_h=0;
                            p_flag=2;
                            replace_process(); }}} // 巡回ループを抜ける

                if(event.keyCode==27 ){ //「Esc」
                    if(p_flag==1 && t_flag==1){ //「巡回」表示をリセット
                        event.preventDefault();
                        result_box.textContent='T:'+count_t+'│-';
                        iframe_body.innerHTML=buffer; // highlight を抜ける時はリセット ⏹
                        caution_reset();
                        arg_t_or_h=0;
                        p_flag=0; }}

            } // search_box.onkeydown


            search_box.onchange=function(){ //「Enter」を押さず移動した場合は検索語を再表示
                if(search_box.value!==search_word){
                    search_box.style.outline='2px solid #2196f3';
                    search_box.style.outlineOffset='-3px';
                    setTimeout(()=>{
                        search_box.style.outline='none';
                        search_box.value=search_word; }, 500); }}


            s_7.onmouseup=function(){ //「✖ 閉じる」で終了（直下のプレビューを押さない）
                s_container_remove(); }


            function result_box_disp(){
                t_flag=0; // t_flag リセット
                arg_t_or_h=0; // リセット
                search_box.disabled=false;
                replace_box.disabled=false;
                s_1.style.display='inline-block';
                s_1.style.boxShadow='none';
                s_2.style.display='none';
                s_3.style.display='none';
                replace_box.style.display='none';
                replace_box.value='';

                if(count_t!=0 && count_h==0){
                    s_1.textContent='Text処理';
                    t_flag=1; // TEXT処理
                    p_flag=1; // 1=検索文字確定 処理開始
                    t_process(); // ⬛RegExp
                    next(hk); }

                if(count_t!=0 && count_h!=0){
                    p_flag=1; // 1=検索文字確定 処理開始
                    arg_t_or_h=1; // この場合だけフラグを立てる
                    t_h_select(); } // TEXT・HTML処理選択

                if(count_t==0 && count_h!=0){
                    result_box.textContent='H:'+count_h;
                    s_1.textContent='Html処理';
                    s_1.style.color='#000';
                    t_flag=0;
                    p_flag=1; // 1=検索文字確定 処理開始
                    replace_process(); }

                if(count_t==0 && count_h==0){
                    result_box.textContent='T:'+count_t+' H:'+count_h;
                    s_1.textContent='　- - -　';
                    s_1.style.color='#000';
                    p_flag=0; } // 0=検索文字未確定 検索前

                function t_h_select(){
                    if(t_or_h==1){
                        t_flag=1; // TEXT処理
                        result_box.textContent='T:'+count_t+'│-';
                        s_1.innerHTML='Text処理　<span>H</span>';
                        s_1.style.boxShadow='inset -25px 0 0 0 #cfd8dc';
                        t_process();
                        next(hk); }
                    else{
                        t_flag=0; // HTML処理
                        result_box.textContent='H:'+count_h;
                        s_1.innerHTML='<span>T</span>　Html処理';
                        s_1.style.boxShadow='inset 24px 0 0 0 #cfd8dc';
                        replace_process(); }

                    s_1.onmousedown=function(event){
                        if(arg_t_or_h==1){
                            event.preventDefault();
                            search_box.focus();
                            native_hk=-1; // 初期化🅿
                            iframe_body.innerHTML=buffer; // highlight を抜ける時はリセット ⏹
                            get_search();

                            if(t_or_h==1){
                                t_or_h=0; // HTML処理を選択
                                t_flag=0;
                                s_1.innerHTML='<span>T</span>　Html処理';
                                s_1.style.boxShadow='inset 24px 0 0 0 #cfd8dc';
                                result_box.textContent='H:'+count_h;
                                replace_process(); }
                            else{
                                t_or_h=1; // TEXT処理を選択
                                t_flag=1;
                                s_1.innerHTML='Text処理　<span>H</span>';
                                s_1.style.boxShadow='inset -25px 0 0 0 #cfd8dc';
                                result_box.textContent='T:'+count_t+'│-';
                                t_process();
                                next(hk); }}}}

                search_box.onblur=function(){ //「検索枠」が focusを無くしたらリセット
                    setTimeout(()=>{
                        if(replace_box.style.display=='none'){ //「置換」へ移動とT/H操作は除外
                            stop_out(); }}, 10); }

                replace_box.onblur=function(){ //「置換枠」が focusを無くしたらリセット
                    setTimeout(()=>{
                        if(p_flag!=3){ //「置換チェック画面」へ移行は除外
                            stop_out(); }}, 10); }

                function stop_out(){
                    if(arg_t_or_h==1){
                        if(search_box!=document.activeElement){
                            arg_t_or_h=0;
                            stop_out(); }}
                    else{
                        if(p_flag==1 || p_flag==2){ // 1=検索文字入力 2=置換文字入力
                            if(t_flag>0){
                                result_box.textContent='T:'+count_t+'│-'; }
                            else{
                                result_box.textContent='H:'+count_h; }
                            s_1.style.display='none';
                            replace_box.style.display='none';
                            replace_box.value='';
                            iframe_body.innerHTML=buffer; // highlight を抜ける時はリセット ⏹
                            native_hk=-1; // 初期化🅿
                            caution_reset();
                            arg_t_or_h=0;
                            t_flag=0;
                            p_flag=0; }}}

            } // result_box_disp()


            function replace_process(){ // 置換処理全般
                replace_box.focus();

                replace_box.onkeydown=function(event){ // 🔽置換操作の開始点
                    if(event.keyCode==13 && event.ctrlKey==false){
                        event.preventDefault();
                        replace_word=replace_box.value; // 🟥置換文字取得
                        if(t_flag>0){
                            t2_process(); } // ⬛RegExp
                        else{
                            h_process(); } // ⬛RegExp
                        js_cover.style.display='block';
                        cke_1_contents.style.zIndex='11';
                        iframe_body.contentEditable='false'; // 編集不可にする
                        search_box.disabled=true;
                        replace_box.disabled=true;
                        s_2.style.display='inline-block';
                        s_3.style.display='inline-block';
                        add2_mu_style();
                        if(t_flag>0 && p_flag==2){
                            s_4.textContent='一括　選択';
                            s_4.style.display='inline-block';
                            s_4.style.boxShadow='inset -45px 0 0 0 #b0bec5';
                            s_5.style.display='inline-block';
                            disp_help();
                            replace_box.blur();
                            next(hk); } //「一括置換」の「巡回表示」
                        s_7.style.display='none';
                        if(sr_data[0]==0 && t_flag>0){ // HTML処理の時は非表示
                            s_8.style.background='#ddd';
                            s_8.style.display='inline-block'; }
                        else if(sr_data[0]==1 && t_flag>0){ // HTML処理の時は非表示
                            s_8.style.background='#333';
                            s_8.style.display='inline-block'; }
                        p_flag=3; } // 3=置換処理

                    if(event.keyCode==9 || event.keyCode==27){ //「Tab」「Esc」で処理前に戻る
                        event.preventDefault();
                        result_box.textContent='　';
                        s_1.style.display='none';
                        replace_box.style.display='none';
                        replace_box.value='';
                        if(t_flag==1){
                            iframe_body.innerHTML=buffer; } // 置換処理をUNDO ⏹
                        search_box.focus();
                        p_flag=0; }} // 0=検索文字 未確定

                s_2.onclick=function(){ //「OK」ボタンで一括置換確定
                    js_cover_remove();
                    delete_mu(); // muタグを削除
                    result_box.textContent='　'; // 検索結果は変更される
                    s_1.style.display='none';
                    replace_box.style.display='none';
                    replace_box.value='';
                    s_8.style.display='none';
                    reset_mu_style();
                    if(t_flag>0){
                        t_flag=0;
                        native_hk=-1; } // 初期化🅿
                    search_box.focus();
                    p_flag=0; } // 0=検索文字 未確定

                s_3.onclick=function(){ //「UNDO」ボタン
                    js_cover_remove();
                    iframe_body.innerHTML=buffer; // 置換処理をUNDO ⏹
                    get_search();
                    s_8.style.display='none';
                    reset_mu_style();
                    if(t_flag>0){
                        t_flag=1;
                        t_process(); // ⬛RegExp
                        next(hk); } // UNDO時は「一括置換」の「巡回表示」
                    replace_box.focus();
                    p_flag=2; } // 2=検索文字確定 置換文字入力 処理選択

                s_4.onclick=function(){ //「一括・選択」ボタン
                    if(t_flag==1){
                        t_flag=2; //「選択置換」に変更
                        s_4.style.boxShadow='inset 45px 0 0 0 #b0bec5';
                        select_replace(); } //「選択置換」を実行
                    else if(t_flag==2){
                        t_flag=1; //「一括置換」に変更
                        s_4.style.boxShadow='inset -45px 0 0 0 #b0bec5';
                        all_replace(); }
                    disp_help(); }

                s_4.addEventListener('mouseover', ()=>{
                    if(t_flag==2){
                        s_5.innerHTML=
                            '｢一括｣ に切換える際に<br>'+
                            '選択した置換の設定は<br>'+
                            '全てリセットされます'; }}, false);

                s_4.addEventListener('mouseleave', ()=>{
                    disp_help(); }, false);

                s_8.addEventListener('mouseover', ()=>{
                    if(sr_data[0]==0){
                        s_5.innerHTML=
                            '<c>C</c>：連続処理モードON<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '現在の設定を登録します<br>'+
                            '› ｢検索文字｣ ｢置換文字｣ <br>'+
                            '› ｢一括 / 選択｣ の選択<br>'+
                            '連続処理は次回の起動時<br>'+
                            'から実行されます'; }
                    else if(sr_data[0]==1){
                        s_5.innerHTML=
                            '<c>C</c>：連続処理を終了<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '<c>Shift</c>+<c>C</c>：モード更新<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            ' ｢Shift+Click」の操作で<br>'+
                            '現在の処理設定<br>'+
                            '› ｢検索文字｣ ｢置換文字｣ <br>'+
                            '› ｢一括 / 選択｣ の選択<br>'+
                            'を登録します<br>'+
                            '次回からこの処理設定が<br>'+
                            '実行されます'; }}, false);

                s_8.addEventListener('mouseleave', ()=>{
                    disp_help(); }, false);

                s_9.addEventListener('mouseover', ()=>{
                    s_5.innerHTML=
                        '操作マニュアルを表示'; });

                s_9.addEventListener('mouseleave', ()=>{
                    disp_help(); }, false);


                function disp_help(){
                    if(t_flag==1){
                        s_5.innerHTML=
                            '<c>⇧</c><c>⇩</c>：移動<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '検索した全箇所が置換えられる事に注意ください<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '<c>OK</c> / <c>Ctrl</c>+<c>Enter</c><br>'+
                            '　　 ：置換を確定する<br>'+
                            '<c>UNDO</c> / <c>Esc</c><br>'+
                            '　　 ：全て元に戻す'; }
                    else if(t_flag==2){
                        s_5.innerHTML=
                            '<c>⇧</c><c>⇩</c>：移動<br>'+
                            '<c>Space</c>：設定 / 解除<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '設定した箇所のみに置換を実行します<br>'+
                            '┈┈┈┈┈┈┈┈┈┈┈<br>'+
                            '<c>OK</c> / <c>Ctrl</c>+<c>Enter</c><br>'+
                            '　　 ：置換を確定する<br>'+
                            '<c>UNDO</c> / <c>Esc</c><br>'+
                            '　　 ：全て元に戻す'; }}


                function all_replace(){ //「一括置換処理」
                    t2_process(); // ⬛RegExp
                    next(hk); }

                function select_replace(){ //「選択置換処理」
                    iframe_body.innerHTML=buffer; // 置換処理を一旦デフォルトに戻す ⏹
                    get_search();
                    t_process(); // ⬛RegExp
                    next(hk); }


                s_8.onclick=function(event){ //「C」連続処理モードボタン

                    if(sr_data[0]==0){ // 連続処理モードOFF
                        let result=window.confirm(
                            "「OK」： 連続処理モードをONにします\n"+
                            "　現在指定されている 「検索文字」「置換文字」「一括 / 選択」\n"+
                            "　の処理指定を、このツールを起動する度に再現し実行できます");
                        if(result){
                            sr_data[0]=1;
                            sr_data[1]=t_flag;
                            sr_data[2]=search_word;
                            sr_data[3]=replace_word;
                            let write_json=JSON.stringify(sr_data);
                            localStorage.setItem('sr_editor', write_json); // ローカルストレージ 保存名
                            s_8.style.background='#333'; }
                        else{
                            s_8.style.background='#ddd'; }}

                    else if(sr_data[0]==1){ // 連続処理モードON
                        if(event.shiftKey){
                            let result=window.confirm(
                                "「OK」： 連続処理モードの処理指定を更新します\n"+
                                "　現在指定されている 「検索文字」「置換文字」「一括 / 選択」\n"+
                                "　の処理指定を、このツールを起動する度に再現し実行します");
                            if(result){
                                sr_data[0]=1;
                                sr_data[1]=t_flag;
                                sr_data[2]=search_word;
                                sr_data[3]=replace_word;
                                let write_json=JSON.stringify(sr_data);
                                localStorage.setItem('sr_editor', write_json); }} // ローカルストレージ 保存名
                        else{
                            let result=window.confirm(
                                "「OK」： 連続処理モードをOFFにします\n"+
                                "　現在の「検索文字」「置換文字」と「一括 / 選択」の処理指定の\n"+
                                "　登録をリセットします。 実行するには「OK」を押します");
                            if(result){
                                sr_data[0]=0;
                                sr_data[1]=1;
                                sr_data[2]='';
                                sr_data[3]='';
                                let write_json=JSON.stringify(sr_data);
                                localStorage.setItem('sr_editor', write_json); // ローカルストレージ 保存名

                                iframe_body.innerHTML=buffer; // 置換処理をUNDO ⏹
                                reset_mu_style();

                                js_cover_remove();
                                s_8.style.background='#ddd';
                                s_8.style.display='none';
                                s_1.style.display='none';
                                result_box.textContent='　';
                                replace_box.value='';
                                replace_box.style.display='none';
                                search_box.value='';
                                search_box.focus();
                                p_flag=0; } // 0=検索文字 未確定
                            else{
                                s_8.style.background='#000'; }}}

                } //「C」連続処理モードボタン

            } // replace_process()


            s_9.onclick=function(){
                window.open("https://ameblo.jp/personwritep/entry-12758975310.html",
                            '_blank', 'width=780, height=900'); }

        } // #s_container が無い場合「Ctrl+F12」で開始

    } // search_replace()



    function next(hk){ //「巡回表示」「選択置換」コード
        let mark=iframe_body.querySelectorAll('mu');

        if(native_hk!=-1){ // 基本的に前回のインデックスを再現🅿
            hk=native_hk; }
        else if(native_hk==-1 || !native_hk){ // 初期インデックス生成🅿
            if(mark.length==1){ hk=0; } // 1個なら即決定
            else{
                let near_n; // 中央後方の要素のインデックス
                let editor_hight=editor_iframe.clientHeight; // 編集枠の高さ
                for(let k=1; k<mark.length; k++){ // スクロール位置中央を越えるmark[k]を取得
                    if(mark[k].getBoundingClientRect().top>editor_hight/2){
                        near_n=k;
                        break; }}
                if(!near_n){ // スクロール位置中央より後方にmark[k]がない場合
                    hk=mark.length-1; }
                else{ // 直前の mark[k]と比較して、近い方を採る
                    if(mark[near_n].getBoundingClientRect().top>
                       editor_hight-mark[near_n-1].getBoundingClientRect().top){
                        hk=near_n-1; }
                    else{
                        hk=near_n; }}}}

        view(hk);
        try{
            mark[hk].classList.add("h"); } // 最初のハイライト色を変更
        catch(e){ ; }

        result_box.textContent='T:'+count_t+'│'+(hk+1);

        document.addEventListener("keydown", check_arrow); // documentは先に指定
        iframe_doc=editor_iframe.contentWindow.document;
        if(iframe_doc){
            iframe_doc.addEventListener("keydown", check_arrow); }// iframeは後に指定

        function check_arrow(event){
            if(event.keyCode==38){ //「↑」
                if(p_flag>0 && t_flag>0){
                    event.preventDefault();
                    back(); }}
            if(event.keyCode==40){ //「↓」
                if(p_flag>0 && t_flag>0){
                    event.preventDefault();
                    forward() }}
            if(event.keyCode==32){ //「Space」で個別に置換の設定/解除
                if(p_flag==3 && t_flag==2){
                    event.preventDefault();
                    if(mark[hk].textContent==search_word){
                        mark[hk].textContent=replace_word; }
                    else if(mark[hk].textContent==replace_word){
                        mark[hk].textContent=search_word; }}}

            native_hk=hk;

            function back(){
                if(hk>0){ // 標準のハイライト色に戻す
                    mark[hk].classList.remove("h");
                    hk-=1; }
                else if(hk==0){
                    hk=0; }
                result_box.textContent='T:'+count_t+'│'+(hk+1);
                try{
                    mark[hk].classList.add("h"); }
                catch(e){ ; }
                view(hk); }

            function forward(){
                if(hk<mark.length-1){ // 標準のハイライト色に戻す
                    mark[hk].classList.remove("h");
                    hk+=1; }
                else if(hk==mark.length-1){
                    hk=mark.length-1; }
                result_box.textContent='T:'+count_t+'│'+(hk+1);
                try{
                    mark[hk].classList.add("h"); }
                catch(e){ ; }
                view(hk); }

        }} // next() インデックス取得🅿


    function view(hk){
        let l_body=document.querySelector('body.l-body');
        let mark=iframe_body.querySelectorAll('mu');
        try{
            mark[hk].scrollIntoView({block: "center"});
            iframe_html.scrollBy(0, -12); } // -1～-24  -12がクリープを無くす最適値
        catch(e){ ; }
        l_body.scrollIntoView(); }



    function get_search(){
        search_word_es=escapeRegExp(search_word); // ⬛RegExp
        editor_iframe=document.querySelector('.cke_wysiwyg_frame'); // ここで取得

        if(editor_iframe){ //「通常表示」が実行条件
            iframe_doc=editor_iframe.contentWindow.document;
            iframe_body=iframe_doc.querySelector('.cke_editable');
            buffer=iframe_body.innerHTML; // ハイライト表示のためソースコードを保存 🟦

            buffer_arr=[]; // 切分けたソースコードを入れる配列
            let sa=0;
            let sb=0;
            let sc=0;
            let result_t;
            let result_h;

            let n=buffer.split('<').length-1; // 開始・終結を含む全タグ数を取得
            for(let k=0; k<n; k++){
                sb=buffer.indexOf('>', sa);
                buffer_arr.push(buffer.slice(sa, sb+1)); //タグ括弧内 1個を配列に収納
                sc=buffer.indexOf('<', sb+1);
                if(sc==-1){ break; } // 文書の末尾で後がない場合に終了
                else{
                    buffer_arr.push(buffer.slice(sb+1, sc)); //タグ括弧外 1個を配列に収納
                    sa=sc; }}

            avoid=[]; //「styleタグ」のインデックスを記録
            for(let i=0; i<n; i++){
                if(buffer_arr[i*2].match(new RegExp('<style'))){
                    avoid.push(i*2); }}

            count_t=0; // テキストノードのヒット数
            for(let i=0; i<n; i++){ //配列の奇数インデックスはタグ括弧外（TEXT）
                if(!buffer_arr[i*2].match(new RegExp('<style')) && buffer_arr[i*2+1]){ // styleタグは除外
                    result_t=buffer_arr[i*2+1].match(new RegExp(search_word_es, 'g')); // ⬛RegExp
                    if(result_t){
                        count_t+=result_t.length; }}}

            count_h=0; // HTMLコードのヒット数
            for(let i=0; i<n; i++){ //配列の偶数インデックスはタグ括弧内（HTMLコード）
                result_h=buffer_arr[i*2].match(new RegExp(search_word_es, 'g')); // ⬛RegExp
                if(result_h){
                    count_h+=result_h.length; }}

            caution_ck(); //「no-break space」「文字実体参照」の可能性をチェック
        }

        title_test();

    } // get_search()



    function caution_ck(){
        caution=0;
        document.querySelector('.c_nb').style.display='none';
        document.querySelector('.c_lt').style.display='none';
        document.querySelector('.c_gt').style.display='none';
        document.querySelector('.c_am').style.display='none';

        if('&nbsp;'.match(new RegExp(search_word_es))){
            if(buffer.match(new RegExp(/&nbsp;/))){
                document.querySelector('.c_nb').style.display='inline';
                caution=1; }}
        if('&lt;'.match(new RegExp(search_word_es))){
            if(buffer.match(new RegExp(/&lt;/))){
                document.querySelector('.c_lt').style.display='inline';
                caution=1; }}
        if('&gt;'.match(new RegExp(search_word_es))){
            if(buffer.match(new RegExp(/&gt;/))){
                document.querySelector('.c_gt').style.display='inline';
                caution=1; }}
        if('&amp;'.match(new RegExp(search_word_es))){
            if(buffer.match(new RegExp(/&amp;/))){
                document.querySelector('.c_am').style.display='inline';
                caution=1; }}

    } // caution_ck()


    function caution_reset(){
        s_6.style.display='none'; }


    function t_process(){
        let rep_word='<mu>'+ search_word +'</mu>';
        t_replace(rep_word); }


    function t2_process(){
        let rep_word=replace_word;
        t_replace(rep_word); }


    function t_replace(rep_word){
        let n=buffer.split('<').length-1; // 開始・終結を含む全タグ数を取得
        for(let i=0; i<n; i++){ //配列の奇数インデックスはタグ括弧外（TEXT）
            let pass=1;
            for(let j=0; j<avoid.length; j++){
                if(avoid[j]==i*2){
                    pass=0;
                    break; }}
            if(pass!=0 && buffer_arr[i*2+1]){
                buffer_arr[i*2+1]=
                    buffer_arr[i*2+1].replace(new RegExp(search_word_es, 'g'), rep_word); }} // ⬛RegExp
        iframe_body.innerHTML=buffer_arr.join(''); }


    function h_process(){
        let rep_word=replace_word;
        let n=buffer.split('<').length-1; // 開始・終結を含む全タグ数を取得
        for(let i=0; i<n; i++){ //配列の偶数インデックスはタグ括弧内（HTMLコード）
            if(buffer_arr[i*2]){
                buffer_arr[i*2]=
                    buffer_arr[i*2].replace(new RegExp(search_word_es, 'g'), rep_word); }} // ⬛RegExp
        iframe_body.innerHTML=buffer_arr.join(''); }



    function add_mu_style(){
        editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        if(editor_iframe){ //「通常表示」の場合
            iframe_doc=editor_iframe.contentWindow.document;
            iframe_html=iframe_doc.documentElement;

            let style_mu=
                '<style class="ep">'+
                '.cke_editable mu { background: #ffcc00; } '+ // ハイライト muタグ背景色⭕
                '.cke_editable mu.h { background: #85ff00; }'+ // フォーカス muタグ背景色⭕
                '</style>';
            if(iframe_html.querySelector('.ep')){
                iframe_html.querySelector('.ep').remove(); }
            iframe_html.insertAdjacentHTML('beforeend', style_mu); }}


    function add2_mu_style(){
        if(replace_word==''){
            replace_box.setAttribute('placeholder', "　　　🟥 削除モード");
            let box_style=
                '<style class="add2_box_style">'+
                '#replace_box { outline: 1px solid red; } '+
                '#replace_box::placeholder { color: #000; } '+
                '</style>';
            if(!document.querySelector('.add2_box_style')){
                document.body.insertAdjacentHTML('beforeend', box_style); }
            if(t_flag>0){
                if(iframe_html.querySelector('.ep')){ // ハイライト・フォーカス muタグ「削除モード」⭕
                    iframe_html.querySelector('.ep').textContent=
                        '.cke_editable mu { box-shadow: 0 0 0 2px #ffcc00; background: #ffcc00; } '+
                        '.cke_editable mu.h { filter: opacity(1); '+
                        'box-shadow: 0 0 0 2px red; background: #fce4ec; }'; }}}}


    function reset_mu_style(){
        replace_box.setAttribute('placeholder', " 置換文字");
        if(document.querySelector('.add2_box_style')){
            document.querySelector('.add2_box_style').remove(); }
        if(t_flag>0){
            if(iframe_html.querySelector('.ep')){ // ハイライト・フォーカス muタグ デフォルト ⭕
                iframe_html.querySelector('.ep').textContent=
                    '.cke_editable mu { background: #ffcc00; } '+
                    '.cke_editable mu.h { background: #85ff00; }'; }}}


    function delete_mu(){
        editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        if(editor_iframe){ //「通常表示」の場合
            iframe_doc=editor_iframe.contentWindow.document;
            iframe_body=iframe_doc.querySelector('.cke_editable');
            if(iframe_body){
                let mark=iframe_body.querySelectorAll('mu');
                if(mark.length!=0){
                    iframe_body.innerHTML=
                        iframe_body.innerHTML.replace(new RegExp('<mu.*?>', 'g'), ''); }}}} // ⬛RegExp


    function toc_style(n){
        editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        if(editor_iframe){ //「通常表示」の場合
            iframe_doc=editor_iframe.contentWindow.document;
            iframe_html=iframe_doc.documentElement;

            let style_toc=
                '<style class="toc">'+ // 検索処理中の「目次」のデザイン
                'nav[aria-labelledby*="toc-"] { '+
                'font-size: 14px; padding: 2px 6px; background: #eceff1; }'+
                'nav .toc-header h2 { font-size: 1em; font-weight: normal; }'+
                'nav .h2 a { color: #333; text-decoration: none; }'+
                '</style>';
            if(n==1){
                if(!iframe_html.querySelector('.toc')){
                    iframe_html.insertAdjacentHTML('beforeend', style_toc); }}
            else{
                if(iframe_html.querySelector('.toc')){
                    iframe_html.querySelector('.toc').remove(); }}}}



    function escapeRegExp(string){
        let reRegExp=/[\\^$.*+?()[\]{}|]/g;
        let reHasRegExp=new RegExp(reRegExp.source);
        return (string && reHasRegExp.test(string))
            ? string.replace(reRegExp, '\\$&')
        : string; }



    function title_test(){
        let s_container=document.querySelector('#s_container');
        if(s_container){
            if(title_search()){
                title_sw();
                let sw=document.querySelector('#title_sw');
                if(sw){
                    sw.onclick=function(){
                        if(panel==1 && p_flag!=3){
                            panel=0;
                            s_container.style.display='none'; }
                        else{
                            panel=1;
                            s_container.style.display='block'; }}}}
            else{
                title_sw_remove(); }
        }} // title_test()


    function title_sw(){
        let sw=
            '<div id="title_sw">Title'+
            '<style>'+
            '#title_sw { position: absolute; top: 12px; left: calc(50% - 540px); z-index: 11; '+
            'font: 16px Meiryo; color: #000; padding: 11px 5px 7px; border: 1px solid #aaa; '+
            'border-radius: 4px; background: #85ff00; cursor: pointer; user-select: none; } '+
            '.p-title { z-index: 11 !important; } '+
            '</style></div>';

        let l_body=document.querySelector('body.l-body');
        if(!l_body.querySelector('#title_sw')){
            l_body.insertAdjacentHTML('beforeend', sw); }}


    function title_sw_remove(){
        if(document.querySelector('#title_sw')){
            document.querySelector('#title_sw').remove(); }}


    function title_search(){
        let title_text='';
        let tilte_input=document.querySelector('.p-title__text');
        if(tilte_input){
            title_text=tilte_input.value;
            search_word_es=escapeRegExp(search_word); // ⬛RegExp
            let result_title=title_text.match(new RegExp(search_word_es, 'g')); // ⬛RegExp
            if(result_title){
                return true; }
            else{
                return false; }}
        else{
            return false; }}



    function publish(){
        let editor_iframe=document.querySelector('.cke_wysiwyg_frame');
        if(!editor_iframe){ //「HTML表示」編集画面の場合
            alert("⛔　通常表示画面に戻って投稿してください"); }
        if(editor_iframe){ //「通常表示」編集画面の場合
            let publish0=document.querySelector('.p-submit__container button[publishflg="0"]');
            if(publish0){
                publish0.click(); }}}

} // main()
